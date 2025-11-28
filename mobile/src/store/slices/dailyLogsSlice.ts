import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

export interface DailyLog {
    id?: number;
    clientId: string;
    goalId?: number;
    goalClientId: string;
    logDate: string;
    notes?: string;
    activities: string[];
    goodThings: string[];
    futurePlans: Array<{
        title: string;
        description?: string;
        plannedDate?: string;
    }>;
    attachments: Array<{
        id?: number;
        fileName: string;
        filePath: string;
        fileType?: string;
        fileSize?: number;
    }>;
    createdAt?: string;
    updatedAt?: string;
    _pendingSync?: boolean;
    _deleted?: boolean;
}

interface DailyLogsState {
    logs: DailyLog[];
    loading: boolean;
    error: string | null;
}

const initialState: DailyLogsState = {
    logs: [],
    loading: false,
    error: null
};

const dailyLogsSlice = createSlice({
    name: 'dailyLogs',
    initialState,
    reducers: {
        addLogOffline: (state, action: PayloadAction<Omit<DailyLog, 'clientId'>>) => {
            const newLog: DailyLog = {
                ...action.payload,
                clientId: uuidv4(),
                _pendingSync: true
            };
            state.logs.push(newLog);
        },
        updateLogOffline: (state, action: PayloadAction<DailyLog>) => {
            const index = state.logs.findIndex(l => l.clientId === action.payload.clientId);
            if (index !== -1) {
                state.logs[index] = {
                    ...action.payload,
                    _pendingSync: true
                };
            }
        },
        deleteLogOffline: (state, action: PayloadAction<string>) => {
            const index = state.logs.findIndex(l => l.clientId === action.payload);
            if (index !== -1) {
                state.logs[index]._deleted = true;
                state.logs[index]._pendingSync = true;
            }
        },
        setLogs: (state, action: PayloadAction<DailyLog[]>) => {
            state.logs = action.payload;
        },
        markLogSynced: (state, action: PayloadAction<{ clientId: string, serverId: number }>) => {
            const log = state.logs.find(l => l.clientId === action.payload.clientId);
            if (log) {
                log.id = action.payload.serverId;
                log._pendingSync = false;
            }
        },
        addAttachmentToLog: (state, action: PayloadAction<{ logClientId: string, attachment: DailyLog['attachments'][0] }>) => {
            const log = state.logs.find(l => l.clientId === action.payload.logClientId);
            if (log) {
                log.attachments.push(action.payload.attachment);
                log._pendingSync = true;
            }
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        }
    }
});

export const {
    addLogOffline,
    updateLogOffline,
    deleteLogOffline,
    setLogs,
    markLogSynced,
    addAttachmentToLog,
    setLoading,
    setError
} = dailyLogsSlice.actions;

export default dailyLogsSlice.reducer;
