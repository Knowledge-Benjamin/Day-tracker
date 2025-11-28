import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SyncState {
    isSyncing: boolean;
    lastSyncAt: string | null;
    pendingChanges: number;
    error: string | null;
}

const initialState: SyncState = {
    isSyncing: false,
    lastSyncAt: null,
    pendingChanges: 0,
    error: null
};

const syncSlice = createSlice({
    name: 'sync',
    initialState,
    reducers: {
        setSyncing: (state, action: PayloadAction<boolean>) => {
            state.isSyncing = action.payload;
        },
        setSyncCompleted: (state, action: PayloadAction<string>) => {
            state.lastSyncAt = action.payload;
            state.pendingChanges = 0;
            state.error = null;
        },
        incrementPendingChanges: (state) => {
            state.pendingChanges += 1;
        },
        decrementPendingChanges: (state) => {
            if (state.pendingChanges > 0) {
                state.pendingChanges -= 1;
            }
        },
        setSyncError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        }
    }
});

export const {
    setSyncing,
    setSyncCompleted,
    incrementPendingChanges,
    decrementPendingChanges,
    setSyncError
} = syncSlice.actions;

export default syncSlice.reducer;
