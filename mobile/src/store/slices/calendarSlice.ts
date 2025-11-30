import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CalendarState {
    googleCalendarEnabled: boolean;
    isSignedIn: boolean;
    calendarId: string;
    autoSync: boolean;
}

const initialState: CalendarState = {
    googleCalendarEnabled: false,
    isSignedIn: false,
    calendarId: 'primary',
    autoSync: true
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
        }
    }
});

export const {
    setGoogleCalendarEnabled,
    setSignedIn,
    setCalendarId,
    setAutoSync
} = calendarSlice.actions;

export default calendarSlice.reducer;
