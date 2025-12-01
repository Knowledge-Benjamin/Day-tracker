const express = require('express');
const Joi = require('joi');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { query, transaction } = require('../database/db');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth middleware
router.use(authMiddleware);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB default
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Invalid file type'));
    }
});

// Validation schemas
const dailyLogSchema = Joi.object({
    goalId: Joi.number().integer().required(),
    logDate: Joi.date().required(),
    notes: Joi.string().allow('', null),
    activities: Joi.array().items(Joi.string()),
    goodThings: Joi.array().items(Joi.string()),
    futurePlans: Joi.array().items(Joi.object({
        title: Joi.string().required(),
        description: Joi.string().allow('', null),
        plannedDate: Joi.date().allow(null),
        googleCalendarEventId: Joi.string().allow(null)
    })),
    clientId: Joi.string().uuid(),
    googleCalendarEventId: Joi.string().allow(null)
});

// Get all daily logs for a goal
router.get('/goal/:goalId', async (req, res) => {
    try {
        const { goalId } = req.params;

        // Verify goal belongs to user
        const goalCheck = await query(
            'SELECT id FROM goals WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
            [goalId, req.user.id]
        );

        if (goalCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Goal not found'
            });
        }

        // Get daily logs
        const logsResult = await query(
            `SELECT dl.id, dl.goal_id, dl.log_date, dl.notes, dl.created_at, dl.updated_at, dl.client_id, dl.google_calendar_event_id
       FROM daily_logs dl
       JOIN goals g ON dl.goal_id = g.id
       WHERE dl.goal_id = $1 AND g.user_id = $2 AND dl.deleted_at IS NULL`,
            [req.params.goalId, req.user.id]
        );

        // Get all related data
        const logs = await Promise.all(logsResult.rows.map(async (log) => {
            const [activities, goodThings, futurePlans, attachments] = await Promise.all([
                query('SELECT id, activity FROM log_activities WHERE daily_log_id = $1', [log.id]),
                query('SELECT id, description FROM log_good_things WHERE daily_log_id = $1', [log.id]),
                query('SELECT id, title, description, planned_date, google_calendar_event_id FROM log_future_plans WHERE daily_log_id = $1', [log.id]),
                query('SELECT id, file_name, file_path, file_type, file_size FROM attachments WHERE daily_log_id = $1', [log.id])
            ]);

            return {
                id: log.id,
                goalId: log.goal_id,
                logDate: log.log_date,
                notes: log.notes,
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
                })),
                createdAt: log.created_at,
                updatedAt: log.updated_at,
                clientId: log.client_id
            };
        }));

        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        console.error('Get daily logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching daily logs'
        });
    }
});

// Get single daily log
router.get('/:id', async (req, res) => {
    try {
        const logResult = await query(
            `SELECT dl.id, dl.goal_id, dl.log_date, dl.notes, dl.created_at, dl.updated_at, dl.client_id, dl.google_calendar_event_id
       FROM daily_logs dl
       JOIN goals g ON dl.goal_id = g.id
       WHERE dl.id = $1 AND g.user_id = $2 AND dl.deleted_at IS NULL`,
            [req.params.id, req.user.id]
        );

        if (logResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Daily log not found'
            });
        }

        const log = logResult.rows[0];

        const [activities, goodThings, futurePlans, attachments] = await Promise.all([
            query('SELECT id, activity FROM log_activities WHERE daily_log_id = $1', [log.id]),
            query('SELECT id, description FROM log_good_things WHERE daily_log_id = $1', [log.id]),
            query('SELECT id, title, description, planned_date, google_calendar_event_id FROM log_future_plans WHERE daily_log_id = $1', [log.id]),
            query('SELECT id, file_name, file_path, file_type, file_size FROM attachments WHERE daily_log_id = $1', [log.id])
        ]);

        res.json({
            success: true,
            data: {
                id: log.id,
                goalId: log.goal_id,
                logDate: log.log_date,
                notes: log.notes,
                googleCalendarEventId: log.google_calendar_event_id,
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
                })),
                createdAt: log.created_at,
                updatedAt: log.updated_at,
                clientId: log.client_id
            }
        });
    } catch (error) {
        console.error('Get daily log error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching daily log'
        });
    }
});

// Create daily log
router.post('/', async (req, res) => {
    try {
        const { error, value } = dailyLogSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const { goalId, logDate, notes, activities, goodThings, futurePlans, clientId, googleCalendarEventId } = value;

        // Verify goal belongs to user
        const goalCheck = await query(
            'SELECT id FROM goals WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
            [goalId, req.user.id]
        );

        if (goalCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Goal not found'
            });
        }

        const result = await transaction(async (client) => {
            // Create daily log
            const logResult = await client.query(
                `INSERT INTO daily_logs(goal_id, user_id, log_date, notes, client_id, google_calendar_event_id)
         VALUES($1, $2, $3, $4, $5, $6)
         ON CONFLICT(goal_id, log_date) 
         DO UPDATE SET notes = $4, google_calendar_event_id = $6, updated_at = CURRENT_TIMESTAMP
         RETURNING id, goal_id, log_date, notes, created_at, updated_at, client_id, google_calendar_event_id`,
                [goalId, req.user.id, logDate, notes || null, clientId || null, googleCalendarEventId || null]
            );

            const dailyLog = logResult.rows[0];

            // Insert activities
            if (activities && activities.length > 0) {
                for (const activity of activities) {
                    await client.query(
                        'INSERT INTO log_activities (daily_log_id, activity) VALUES ($1, $2)',
                        [dailyLog.id, activity]
                    );
                }
            }

            // Insert good things
            if (goodThings && goodThings.length > 0) {
                for (const goodThing of goodThings) {
                    await client.query(
                        'INSERT INTO log_good_things (daily_log_id, description) VALUES ($1, $2)',
                        [dailyLog.id, goodThing]
                    );
                }
            }

            // Insert future plans
            if (futurePlans && futurePlans.length > 0) {
                for (const plan of futurePlans) {
                    await client.query(
                        'INSERT INTO log_future_plans (daily_log_id, title, description, planned_date, google_calendar_event_id) VALUES ($1, $2, $3, $4, $5)',
                        [dailyLog.id, plan.title, plan.description || null, plan.plannedDate || null, plan.googleCalendarEventId || null]
                    );
                }
            }

            return dailyLog;
        });

        res.status(201).json({
            success: true,
            message: 'Daily log created successfully',
            data: {
                id: result.id,
                goalId: result.goal_id,
                logDate: result.log_date,
                notes: result.notes,
                googleCalendarEventId: result.google_calendar_event_id,
                createdAt: result.created_at,
                updatedAt: result.updated_at,
                clientId: result.client_id,
                activities: activities || [],
                goodThings: goodThings || [],
                futurePlans: futurePlans || [],
                attachments: [] // Attachments are uploaded separately
            }
        });
    } catch (error) {
        console.error('Create daily log error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating daily log'
        });
    }
});

// Upload attachment to daily log
router.post('/:id/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Verify log belongs to user
        const logCheck = await query(
            `SELECT dl.id FROM daily_logs dl
       JOIN goals g ON dl.goal_id = g.id
       WHERE dl.id = $1 AND g.user_id = $2 AND dl.deleted_at IS NULL`,
            [req.params.id, req.user.id]
        );

        if (logCheck.rows.length === 0) {
            // Delete uploaded file
            await fs.unlink(req.file.path);
            return res.status(404).json({
                success: false,
                message: 'Daily log not found'
            });
        }

        // Save attachment metadata
        const result = await query(
            `INSERT INTO attachments(daily_log_id, file_name, file_path, file_type, file_size)
       VALUES($1, $2, $3, $4, $5)
       RETURNING id, file_name, file_path, file_type, file_size, created_at`,
            [req.params.id, req.file.originalname, req.file.path, req.file.mimetype, req.file.size]
        );

        const attachment = result.rows[0];

        res.status(201).json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                id: attachment.id,
                fileName: attachment.file_name,
                filePath: attachment.file_path,
                fileType: attachment.file_type,
                fileSize: attachment.file_size,
                createdAt: attachment.created_at
            }
        });
    } catch (error) {
        // Delete uploaded file on error
        if (req.file) {
            await fs.unlink(req.file.path).catch(err => console.error('Error deleting file:', err));
        }
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading file'
        });
    }
});

// Delete daily log (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const result = await query(
            `UPDATE daily_logs 
       SET deleted_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       AND goal_id IN(SELECT id FROM goals WHERE user_id = $2)
       AND deleted_at IS NULL
       RETURNING id`,
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Daily log not found'
            });
        }

        res.json({
            success: true,
            message: 'Daily log deleted successfully'
        });
    } catch (error) {
        console.error('Delete daily log error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting daily log'
        });
    }
});

module.exports = router;
