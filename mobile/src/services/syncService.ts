import NetInfo from '@react-native-community/netinfo';
import { store } from '../store';
import { setSyncing, setSyncCompleted, setSyncError, decrementPendingChanges } from '../store/slices/syncSlice';
import { markGoalSynced } from '../store/slices/goalsSlice';
import { markLogSynced } from '../store/slices/dailyLogsSlice';
import { syncAPI } from './api';

class SyncService {
    private syncInterval: NodeJS.Timeout | null = null;
    private isOnline: boolean = false;

    init() {
        // Listen to network changes
        NetInfo.addEventListener(state => {
            const wasOffline = !this.isOnline;
            this.isOnline = state.isConnected || false;

            // If just came online, trigger sync
            if (wasOffline && this.isOnline) {
                this.sync();
            }
        });

        // Start periodic sync (every 5 minutes)
        this.startPeriodicSync();
    }

    startPeriodicSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        this.syncInterval = setInterval(() => {
            if (this.isOnline) {
                this.sync();
            }
        }, 5 * 60 * 1000); // 5 minutes
    }

    stopPeriodicSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    async sync() {
        const state = store.getState();

        // Check if user is authenticated
        if (!state.auth.isAuthenticated) {
            console.log('Sync skipped: User not authenticated');
            return;
        }

        // Check if already syncing
        if (state.sync.isSyncing) {
            console.log('Sync skipped: Already syncing');
            return;
        }

        try {
            store.dispatch(setSyncing(true));

            // Collect pending changes
            const changes: any[] = [];

            // Collect pending goals
            const pendingGoals = state.goals.goals.filter(g => g._pendingSync);
            for (const goal of pendingGoals) {
                if (goal._deleted) {
                    changes.push({
                        entityType: 'goal',
                        operation: 'delete',
                        clientId: goal.clientId
                    });
                } else if (goal.id) {
                    changes.push({
                        entityType: 'goal',
                        operation: 'update',
                        clientId: goal.clientId,
                        data: {
                            title: goal.title,
                            description: goal.description,
                            startDate: goal.startDate,
                            durationDays: goal.durationDays,
                            color: goal.color
                        }
                    });
                } else {
                    changes.push({
                        entityType: 'goal',
                        operation: 'create',
                        clientId: goal.clientId,
                        data: {
                            title: goal.title,
                            description: goal.description,
                            startDate: goal.startDate,
                            durationDays: goal.durationDays,
                            color: goal.color
                        }
                    });
                }
            }

            // Collect pending daily logs
            const pendingLogs = state.dailyLogs.logs.filter(l => l._pendingSync);
            for (const log of pendingLogs) {
                if (log._deleted) {
                    changes.push({
                        entityType: 'daily_log',
                        operation: 'delete',
                        clientId: log.clientId
                    });
                } else if (!log.id) {
                    changes.push({
                        entityType: 'daily_log',
                        operation: 'create',
                        clientId: log.clientId,
                        data: {
                            goalClientId: log.goalClientId,
                            logDate: log.logDate,
                            notes: log.notes,
                            activities: log.activities,
                            goodThings: log.goodThings,
                            futurePlans: log.futurePlans
                        }
                    });
                }
            }

            // If no changes, check for server updates only
            if (changes.length === 0) {
                console.log('No pending changes to sync');
            }

            // Sync with server
            const response = await syncAPI.sync(changes, state.sync.lastSyncAt);
            const { synced, serverChanges, syncedAt } = response.data.data;

            // Update local state with synced data
            if (synced.goals) {
                for (const goal of synced.goals) {
                    if (goal.status === 'created' || goal.status === 'already_exists') {
                        store.dispatch(markGoalSynced({
                            clientId: goal.clientId,
                            serverId: goal.serverId
                        }));
                        store.dispatch(decrementPendingChanges());
                    }
                }
            }

            if (synced.dailyLogs) {
                for (const log of synced.dailyLogs) {
                    if (log.status === 'created' || log.status === 'already_exists') {
                        store.dispatch(markLogSynced({
                            clientId: log.clientId,
                            serverId: log.serverId
                        }));
                        store.dispatch(decrementPendingChanges());
                    }
                }
            }

            // Import server changes (new goals/logs from server)
            if (serverChanges) {
                if (serverChanges.goals && serverChanges.goals.length > 0) {
                    const { addGoalsFromServer } = require('../store/slices/goalsSlice');
                    store.dispatch(addGoalsFromServer(serverChanges.goals));
                    console.log(`Imported ${serverChanges.goals.length} goals from server`);
                }

                if (serverChanges.dailyLogs && serverChanges.dailyLogs.length > 0) {
                    const { addLogsFromServer } = require('../store/slices/dailyLogsSlice');
                    // Transform server logs to match client format
                    const transformedLogs = serverChanges.dailyLogs.map((log: any) => ({
                        id: log.id,
                        clientId: log.clientId,
                        goalId: log.goalId,
                        goalClientId: log.goalClientId,
                        logDate: log.logDate,
                        notes: log.notes,
                        // Transform activities from objects to strings
                        activities: log.activities ? log.activities.map((a: any) =>
                            typeof a === 'string' ? a : a.activity
                        ) : [],
                        // Transform goodThings from objects to strings
                        goodThings: log.goodThings ? log.goodThings.map((g: any) =>
                            typeof g === 'string' ? g : g.description
                        ) : [],
                        // Keep futurePlans as is (already in correct format)
                        futurePlans: log.futurePlans || [],
                        attachments: log.attachments || [],
                        createdAt: log.createdAt,
                        updatedAt: log.updatedAt
                    }));
                    store.dispatch(addLogsFromServer(transformedLogs));
                    console.log(`Imported ${serverChanges.dailyLogs.length} daily logs from server`);
                }
            }

            // Handle conflicts if any
            if (synced.conflicts && synced.conflicts.length > 0) {
                console.warn('Sync conflicts detected:', synced.conflicts);
                // In a real app, you'd want to handle conflicts more gracefully
            }

            // Update sync timestamp
            store.dispatch(setSyncCompleted(syncedAt));

            // Retry Google Calendar Sync
            this.retryGoogleCalendarSync().catch(err =>
                console.error('Google Calendar retry sync error:', err)
            );

            console.log('Sync completed successfully');
        } catch (error: any) {
            console.error('Sync error:', error);
            store.dispatch(setSyncError(error.message || 'Sync failed'));
        } finally {
            store.dispatch(setSyncing(false));
        }
    }

    // Manual sync trigger
    async manualSync() {
        await this.sync();
    }

    async retryGoogleCalendarSync() {
        const state = store.getState();
        const { googleCalendarEnabled, isSignedIn, autoSync, calendarId } = state.calendar;

        if (!googleCalendarEnabled || !isSignedIn || !autoSync) return;

        // Find logs created in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const logs = state.dailyLogs.logs.filter(l =>
            !l._deleted &&
            new Date(l.logDate) >= thirtyDaysAgo
        );

        if (logs.length === 0) return;

        console.log(`Checking Google Calendar sync for ${logs.length} logs`);

        const { googleCalendarService } = require('./googleCalendarService');
        const { setGoogleCalendarEventId, setFuturePlanEventId } = require('../store/slices/dailyLogsSlice');

        for (const log of logs) {
            const goal = state.goals.goals.find(g => g.clientId === log.goalClientId);
            if (!goal) continue;

            // Sync Log if missing ID
            if (!log.googleCalendarEventId) {
                try {
                    const result = await googleCalendarService.createEvent(
                        goal.title,
                        log.logDate,
                        log.notes,
                        log.activities,
                        calendarId
                    );

                    if (result.success && result.eventId) {
                        store.dispatch(setGoogleCalendarEventId({
                            clientId: log.clientId,
                            eventId: result.eventId
                        }));
                    }
                } catch (error) {
                    console.error('Retry Google Calendar sync failed for log:', log.clientId, error);
                }
            }

            // Sync Future Plans if missing ID
            if (log.futurePlans && log.futurePlans.length > 0) {
                for (let index = 0; index < log.futurePlans.length; index++) {
                    const plan = log.futurePlans[index];
                    if (plan.plannedDate && !plan.googleCalendarEventId) {
                        try {
                            const planResult = await googleCalendarService.createEvent(
                                `Plan: ${plan.title}`,
                                plan.plannedDate,
                                plan.description,
                                [],
                                calendarId
                            );

                            if (planResult.success && planResult.eventId) {
                                store.dispatch(setFuturePlanEventId({
                                    clientId: log.clientId,
                                    planIndex: index,
                                    eventId: planResult.eventId
                                }));
                            }
                        } catch (error) {
                            console.error('Retry Future Plan sync failed:', error);
                        }
                    }
                }
            }
        }
    }
}

export const syncService = new SyncService();
