import { configureStore } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistStore, persistReducer } from 'redux-persist';
import goalsReducer from './slices/goalsSlice';
import dailyLogsReducer from './slices/dailyLogsSlice';
import authReducer from './slices/authSlice';
import syncReducer from './slices/syncSlice';
import calendarReducer from './slices/calendarSlice';

const persistConfig = {
    key: 'root',
    storage: AsyncStorage,
    whitelist: ['auth', 'goals', 'dailyLogs', 'calendar'] // Persist these reducers
};

export const store = configureStore({
    reducer: {
        auth: persistReducer({ ...persistConfig, key: 'auth' }, authReducer),
        goals: persistReducer({ ...persistConfig, key: 'goals' }, goalsReducer),
        dailyLogs: persistReducer({ ...persistConfig, key: 'dailyLogs' }, dailyLogsReducer),
        calendar: persistReducer({ ...persistConfig, key: 'calendar' }, calendarReducer),
        sync: syncReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
