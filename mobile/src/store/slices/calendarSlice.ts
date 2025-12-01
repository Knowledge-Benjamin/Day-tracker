import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CalendarState {
    googleCalendarEnabled: boolean;
    isSignedIn: boolean;
    calendarId: string;
    autoSync: boolean;
    selectedDate: string | null;
    selectedGoalFilter: string | null; // goalClientId or null for all
    lastSyncTime: string | null;
}

const initialState: CalendarState = {
    googleCalendarEnabled: false,
    isSignedIn: false,
    calendarId: 'primary',
    autoSync: true,
    selectedDate: null,
    selectedGoalFilter: null,
    lastSyncTime: null
};

const calendarSlice = createSlice({
    name: 'calendar',
    initialState,
    reducers: {
        setGoogleCalendarEnabled: (state, action: PayloadAction<boolean>) => {
            state.googleCalendarEnabled = action.payload;
        },
        setSignedIn: (state, action: PayloadAction<boolean>) => {
            state.isSignedIn = action.payload;
        },
        setCalendarId: (state, action: PayloadAction<string>) => {
            state.calendarId = action.payload;
        },
        setAutoSync: (state, action: PayloadAction<boolean>) => {
            state.autoSync = action.payload;
        },
        setSelectedDate: (state, action: PayloadAction<string | null>) => {
            state.selectedDate = action.payload;
        },
        setSelectedGoalFilter: (state, action: PayloadAction<string | null>) => {
            state.selectedGoalFilter = action.payload;
        },
        setLastSyncTime: (state, action: PayloadAction<string>) => {
            state.lastSyncTime = action.payload;
        },
        clearCalendarState: (state) => {
            state.googleCalendarEnabled = false;
            state.isSignedIn = false;
            state.selectedDate = null;
            state.lastSyncTime = null;
        }
    }
});

export const {
    setGoogleCalendarEnabled,
    setSignedIn,
    setCalendarId,
    setAutoSync,
    setSelectedDate,
    setSelectedGoalFilter,
    setLastSyncTime,
    clearCalendarState
} = calendarSlice.actions;

export default calendarSlice.reducer;
