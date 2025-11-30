import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import { syncService } from './src/services/syncService';
import { googleCalendarService } from './src/services/googleCalendarService';
import { GOOGLE_ANDROID_CLIENT_ID } from '@env';
import AppNavigator from './src/navigation/AppNavigator';

// Initialize sync service
syncService.init();

// Initialize Google Calendar service
if (GOOGLE_ANDROID_CLIENT_ID) {
    googleCalendarService.configure(GOOGLE_ANDROID_CLIENT_ID).catch(err => {
        console.error('Failed to configure Google Calendar:', err);
    });
}

const App = () => {
    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <AppNavigator />
            </PersistGate>
        </Provider>
    );
};

export default App;
