const express = require('express');
const { query, transaction } = require('../database/db');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth middleware
router.use(authMiddleware);

// Sync endpoint - handles batch sync from mobile app
router.post('/sync', async (req, res) => {
    try {
        const { changes, lastSyncAt } = req.body;

        if (!changes || !Array.isArray(changes)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid sync data'
            });
        }

        const syncedData = {
            goals: [],
            dailyLogs: [],
            conflicts: []
        };

        await transaction(async (client) => {
            for (const change of changes) {
                const { entityType, operation, data, clientId } = change;

                try {
                    switch (entityType) {
                        case 'goal':
                            if (operation === 'create') {
                                // Check if already exists by client_id
                                const existing = await client.query(
                                    'SELECT id FROM goals WHERE client_id = $1',
                                    [clientId]
                                );

                                if (existing.rows.length > 0) {
                                    syncedData.goals.push({
                                        clientId,
                                        serverId: existing.rows[0].id,
                                        status: 'already_exists'
                                    });
                                } else {
                                    const result = await client.query(
                                        `INSERT INTO goals (user_id, title, description, start_date, duration_days, color, client_id)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     RETURNING id`,
                                        [req.user.id, data.title, data.description, data.startDate, data.durationDays, data.color, clientId]
                                    );
                                    syncedData.goals.push({
                                        clientId,
                                        serverId: result.rows[0].id,
                                        status: 'created'
                                    });
                                }
                            } else if (operation === 'update') {
                                const result = await client.query(
                                    `UPDATE goals 
                   SET title = $1, description = $2, start_date = $3, duration_days = $4, color = $5
                   WHERE client_id = $6 AND user_id = $7 AND deleted_at IS NULL
                   RETURNING id`,
                                    [data.title, data.description, data.startDate, data.durationDays, data.color, clientId, req.user.id]
                                );
                                syncedData.goals.push({
                                    clientId,
                                    serverId: result.rows[0]?.id,
                                    status: result.rows.length > 0 ? 'updated' : 'not_found'
                                });
                            } else if (operation === 'delete') {
                                await client.query(
                                    `UPDATE goals SET deleted_at = CURRENT_TIMESTAMP 
                   WHERE client_id = $1 AND user_id = $2`,
                                    [clientId, req.user.id]
                                );
                                syncedData.goals.push({
                                    clientId,
                                    status: 'deleted'
                                });
                            }
                            break;

                        case 'daily_log':
                            if (operation === 'create') {
                                const existing = await client.query(
                                    'SELECT id FROM daily_logs WHERE client_id = $1',
                                    [clientId]
                                );

                                if (existing.rows.length > 0) {
                                    syncedData.dailyLogs.push({
                                        clientId,
                                        serverId: existing.rows[0].id,
                                        status: 'already_exists'
                                    });
                                } else {
                                    // Get goal server ID from client ID
                                    const goalResult = await client.query(
                                        'SELECT id FROM goals WHERE client_id = $1 AND user_id = $2',
                                        [data.goalClientId, req.user.id]
                                    );

                                    if (goalResult.rows.length === 0) {
                                        syncedData.dailyLogs.push({
                                            clientId,
                                            status: 'goal_not_found'
                                        });
                                        continue;
                                    }

                                    const goalId = goalResult.rows[0].id;

                                    const logResult = await client.query(
                                        `INSERT INTO daily_logs (goal_id, user_id, log_date, notes, client_id)
                     VALUES ($1, $2, $3, $4, $5)
                     RETURNING id`,
                                        [goalId, req.user.id, data.logDate, data.notes, clientId]
                                    );

                                    const dailyLogId = logResult.rows[0].id;

                                    // Insert related data
                                    if (data.activities) {
                                        for (const activity of data.activities) {
                                            await client.query(
                                                'INSERT INTO log_activities (daily_log_id, activity) VALUES ($1, $2)',
                                                [dailyLogId, activity]
                                            );
                                        }
                                    }

                                    if (data.goodThings) {
                                        for (const goodThing of data.goodThings) {
                                            await client.query(
                                                'INSERT INTO log_good_things (daily_log_id, description) VALUES ($1, $2)',
                                                [dailyLogId, goodThing]
                                            );
                                        }
                                    }

                                    if (data.futurePlans) {
                                        for (const plan of data.futurePlans) {
                                            await client.query(
                                                'INSERT INTO log_future_plans (daily_log_id, title, description, planned_date) VALUES ($1, $2, $3, $4)',
                                                [dailyLogId, plan.title, plan.description, plan.plannedDate]
                                            );
                                        }
                                    }

                                    syncedData.dailyLogs.push({
                                        clientId,
                                        serverId: dailyLogId,
                                        status: 'created'
                                    });
                                }
                            }
                            break;
                    }
                } catch (error) {
                    console.error('Sync error for item:', error);
                    syncedData.conflicts.push({
                        clientId,
                        entityType,
                        error: error.message
                    });
                }
            }

            // Update user's last sync time
            await client.query(
                'UPDATE users SET last_sync_at = CURRENT_TIMESTAMP WHERE id = $1',
                [req.user.id]
            );
        });

        // Get server changes since last sync
        const serverChanges = {
            goals: [],
            dailyLogs: []
        };

        if (lastSyncAt) {
            // Get goals updated since last sync
            const goalsResult = await query(
                `SELECT id, title, description, start_date, duration_days, color, is_active, client_id, updated_at, deleted_at
         FROM goals
         WHERE user_id = $1 AND updated_at > $2`,
                [req.user.id, lastSyncAt]
            );

            serverChanges.goals = goalsResult.rows.map(row => ({
                id: row.id,
                title: row.title,
                description: row.description,
                startDate: row.start_date,
                durationDays: row.duration_days,
                color: row.color,
                isActive: row.is_active,
                clientId: row.client_id,
                updatedAt: row.updated_at,
                isDeleted: row.deleted_at !== null
            }));

            // Get daily logs updated since last sync
            const logsResult = await query(
                `SELECT dl.id, dl.goal_id, dl.log_date, dl.notes, dl.client_id, dl.updated_at, dl.deleted_at,
                g.client_id as goal_client_id
         FROM daily_logs dl
         JOIN goals g ON dl.goal_id = g.id
         WHERE g.user_id = $1 AND dl.updated_at > $2`,
                [req.user.id, lastSyncAt]
            );

            // Fetch related data for each log
            serverChanges.dailyLogs = await Promise.all(logsResult.rows.map(async (row) => {
                let activities = [], goodThings = [], futurePlans = [], attachments = [];

                if (row.deleted_at === null) {
                    [activities, goodThings, futurePlans, attachments] = await Promise.all([
                        query('SELECT id, activity FROM log_activities WHERE daily_log_id = $1', [row.id]),
                        query('SELECT id, description FROM log_good_things WHERE daily_log_id = $1', [row.id]),
                        query('SELECT id, title, description, planned_date, google_calendar_event_id FROM log_future_plans WHERE daily_log_id = $1', [row.id]),
                        query('SELECT id, file_name, file_path, file_type, file_size FROM attachments WHERE daily_log_id = $1', [row.id])
                    ]);
                }

                return {
                    id: row.id,
                    goalId: row.goal_id,
                    goalClientId: row.goal_client_id,
                    logDate: row.log_date,
                    notes: row.notes,
                    clientId: row.client_id,
                    updatedAt: row.updated_at,
                    isDeleted: row.deleted_at !== null,
                    activities: activities.rows ? activities.rows.map(a => ({ id: a.id, activity: a.activity })) : [],
                    goodThings: goodThings.rows ? goodThings.rows.map(g => ({ id: g.id, description: g.description })) : [],
                    futurePlans: futurePlans.rows ? futurePlans.rows.map(f => ({
                        id: f.id,
                        title: f.title,
                        description: f.description,
                        plannedDate: f.planned_date,
                        googleCalendarEventId: f.google_calendar_event_id
                    })) : [],
                    attachments: attachments.rows ? attachments.rows.map(a => ({
                        id: a.id,
                        fileName: a.file_name,
                        filePath: a.file_path,
                        fileType: a.file_type,
                        fileSize: a.file_size
                    })) : []
                };
            }));
        } else {
            // Initial sync - fetch ALL data
            const goalsResult = await query(
                `SELECT id, title, description, start_date, duration_days, color, is_active, client_id, updated_at, deleted_at
         FROM goals
         WHERE user_id = $1 AND deleted_at IS NULL`,
                [req.user.id]
            );

            serverChanges.goals = goalsResult.rows.map(row => ({
                id: row.id,
                title: row.title,
                description: row.description,
                startDate: row.start_date,
                durationDays: row.duration_days,
                color: row.color,
                isActive: row.is_active,
                clientId: row.client_id,
                updatedAt: row.updated_at,
                isDeleted: false
            }));

            const logsResult = await query(
                `SELECT dl.id, dl.goal_id, dl.log_date, dl.notes, dl.client_id, dl.updated_at, dl.deleted_at,
                g.client_id as goal_client_id
         FROM daily_logs dl
         JOIN goals g ON dl.goal_id = g.id
         WHERE g.user_id = $1 AND dl.deleted_at IS NULL`,
                [req.user.id]
            );

            serverChanges.dailyLogs = await Promise.all(logsResult.rows.map(async (row) => {
                const [activities, goodThings, futurePlans, attachments] = await Promise.all([
                    query('SELECT id, activity FROM log_activities WHERE daily_log_id = $1', [row.id]),
                    query('SELECT id, description FROM log_good_things WHERE daily_log_id = $1', [row.id]),
                    query('SELECT id, title, description, planned_date, google_calendar_event_id FROM log_future_plans WHERE daily_log_id = $1', [row.id]),
                    query('SELECT id, file_name, file_path, file_type, file_size FROM attachments WHERE daily_log_id = $1', [row.id])
                ]);

                return {
                    id: row.id,
                    goalId: row.goal_id,
                    goalClientId: row.goal_client_id,
                    logDate: row.log_date,
                    notes: row.notes,
                    clientId: row.client_id,
                    updatedAt: row.updated_at,
                    isDeleted: false,
                    activities: activities.rows.map(a => ({ id: a.id, activity: a.activity })),
                    goodThings: goodThings.rows.map(g => ({ id: g.id, description: g.description })),
                    futurePlans: futurePlans.rows.map(f => ({
                        id: f.id,
                        title: f.title,
                        description: f.description,
                        plannedDate: f.planned_date,
                        googleCalendarEventId: f.google_calendar_event_id
                    })),
                    attachments: attachments.rows.map(a => ({
                        id: a.id,
                        fileName: a.file_name,
                        filePath: a.file_path,
                        fileType: a.file_type,
                        fileSize: a.file_size
                    }))
                };
            }));
        }

        res.json({
            success: true,
            message: 'Sync completed',
            data: {
                synced: syncedData,
                serverChanges,
                syncedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({
            success: false,
            message: 'Sync failed'
        });
    }
});

// Get sync status
router.get('/status', async (req, res) => {
    try {
        const result = await query(
            'SELECT last_sync_at FROM users WHERE id = $1',
            [req.user.id]
        );

        res.json({
            success: true,
            data: {
                lastSyncAt: result.rows[0].last_sync_at,
                serverTime: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Sync status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting sync status'
        });
    }
});

module.exports = router;
