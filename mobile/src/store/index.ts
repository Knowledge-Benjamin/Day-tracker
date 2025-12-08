import { configureStore, combineReducers } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import goalsReducer from './slices/goalsSlice';
import dailyLogsReducer from './slices/dailyLogsSlice';
import authReducer from './slices/authSlice';
import syncReducer from './slices/syncSlice';
import calendarReducer from './slices/calendarSlice';
import calosReducer from './slices/calosSlice';

// Create individual persist configs
const authPersistConfig: any = {
    key: 'auth',
    storage: AsyncStorage,
};

const goalsPersistConfig: any = {
    key: 'goals',
    storage: AsyncStorage,
};

const dailyLogsPersistConfig: any = {
    key: 'dailyLogs',
    storage: AsyncStorage,
};

const calendarPersistConfig: any = {
    key: 'calendar',
    storage: AsyncStorage,
};

const calosPersistConfig: any = {
    key: 'calos',
    storage: AsyncStorage,
    whitelist: ['messages', 'sessionId', 'preferences'], // Only persist these fields
};

// Create persisted reducers
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedGoalsReducer = persistReducer(goalsPersistConfig, goalsReducer);
const persistedDailyLogsReducer = persistReducer(dailyLogsPersistConfig, dailyLogsReducer);
const persistedCalendarReducer = persistReducer(calendarPersistConfig, calendarReducer);
const persistedCalosReducer = persistReducer(calosPersistConfig, calosReducer);

// Combine all reducers
const rootReducer = combineReducers({
    auth: persistedAuthReducer,
    goals: persistedGoalsReducer,
    dailyLogs: persistedDailyLogsReducer,
    calendar: persistedCalendarReducer,
    calos: persistedCalosReducer,
    sync: syncReducer,
});

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
