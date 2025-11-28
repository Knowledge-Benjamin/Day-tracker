import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

export interface Goal {
    id?: number;
    clientId: string;
    title: string;
    description?: string;
    startDate: string;
    durationDays: number;
    endDate?: string;
    color: string;
    isActive: boolean;
    loggedDays: number;
    progress: number;
    daysRemaining: number;
    createdAt?: string;
    updatedAt?: string;
    _pendingSync?: boolean;
    _deleted?: boolean;
}

interface GoalsState {
    goals: Goal[];
    loading: boolean;
    error: string | null;
    selectedGoalId: string | null;
}

const initialState: GoalsState = {
    goals: [],
    loading: false,
    error: null,
    selectedGoalId: null
};

const goalsSlice = createSlice({
    name: 'goals',
    initialState,
    reducers: {
        addGoalOffline: (state, action: PayloadAction<Omit<Goal, 'clientId' | 'isActive' | 'loggedDays' | 'progress' | 'daysRemaining'>>) => {
            const newGoal: Goal = {
                ...action.payload,
                clientId: uuidv4(),
                isActive: true,
                loggedDays: 0,
                progress: 0,
                daysRemaining: action.payload.durationDays,
                _pendingSync: true
            };
            state.goals.push(newGoal);
        },
        updateGoalOffline: (state, action: PayloadAction<Goal>) => {
            const index = state.goals.findIndex(g => g.clientId === action.payload.clientId);
            if (index !== -1) {
                state.goals[index] = {
                    ...action.payload,
                    _pendingSync: true
                };
            }
        },
        deleteGoalOffline: (state, action: PayloadAction<string>) => {
            const index = state.goals.findIndex(g => g.clientId === action.payload);
            if (index !== -1) {
                state.goals[index]._deleted = true;
                state.goals[index]._pendingSync = true;
            }
        },
        setGoals: (state, action: PayloadAction<Goal[]>) => {
            state.goals = action.payload;
        },
        markGoalSynced: (state, action: PayloadAction<{ clientId: string, serverId: number }>) => {
            const goal = state.goals.find(g => g.clientId === action.payload.clientId);
            if (goal) {
                goal.id = action.payload.serverId;
                goal._pendingSync = false;
            }
        },
        selectGoal: (state, action: PayloadAction<string | null>) => {
            state.selectedGoalId = action.payload;
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
    addGoalOffline,
    updateGoalOffline,
    deleteGoalOffline,
    setGoals,
    markGoalSynced,
    selectGoal,
    setLoading,
    setError
} = goalsSlice.actions;

export default goalsSlice.reducer;
