import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor, RootState } from './src/store';
import { theme } from './src/theme/theme';
import { syncService } from './src/services/syncService';
import { googleCalendarService } from './src/services/googleCalendarService';
import { GOOGLE_ANDROID_CLIENT_ID } from '@env';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import GoalsListScreen from './src/screens/GoalsListScreen';
import CreateGoalScreen from './src/screens/CreateGoalScreen';
import EditGoalScreen from './src/screens/EditGoalScreen';
import GoalDetailScreen from './src/screens/GoalDetailScreen';
import DailyLogScreen from './src/screens/DailyLogScreen';
import CalendarScreen from './src/screens/CalendarScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Initialize sync service
syncService.init();

// Initialize Google Calendar service
if (GOOGLE_ANDROID_CLIENT_ID) {
    googleCalendarService.configure(GOOGLE_ANDROID_CLIENT_ID).catch(err => {
        console.error('Failed to configure Google Calendar:', err);
    });
}

const MainTabs = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: theme.colors.black,
                },
                headerTintColor: theme.colors.white,
                headerTitleStyle: {
                    fontWeight: theme.typography.fontWeight.bold as any,
                },
                tabBarStyle: {
                    backgroundColor: theme.colors.black,
                    borderTopColor: theme.colors.borderLight,
                },
                tabBarActiveTintColor: theme.colors.white,
                tabBarInactiveTintColor: theme.colors.gray500,
            }}
        >
            <Tab.Screen
                name="Goals"
                component={GoalsListScreen}
                options={{ title: 'My Goals' }}
            />
            <Tab.Screen
                name="Calendar"
                component={CalendarScreen}
                options={{ title: 'Calendar' }}
            />
        </Tab.Navigator>
    );
};

const AppNavigator = () => {
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: {
                        backgroundColor: theme.colors.black,
                    },
                    headerTintColor: theme.colors.white,
                    headerTitleStyle: {
                        fontWeight: theme.typography.fontWeight.bold as any,
                    },
                }}
            >
                {isAuthenticated ? (
                    <>
                        <Stack.Screen
                            name="Main"
                            component={MainTabs}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="CreateGoal"
                            component={CreateGoalScreen}
                            options={{ title: 'Create Goal' }}
                        />
                        <Stack.Screen
                            name="EditGoal"
                            component={EditGoalScreen}
                            options={{ title: 'Edit Goal' }}
                        />
                        <Stack.Screen
                            name="GoalDetail"
                            component={GoalDetailScreen}
                            options={{ title: 'Goal Details' }}
                        />
                        <Stack.Screen
                            name="DailyLog"
                            component={DailyLogScreen}
                            options={{ title: 'Daily Log' }}
                        />
                    </>
                ) : (
                    <>
                        <Stack.Screen
                            name="Login"
                            component={LoginScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Register"
                            component={RegisterScreen}
                            options={{ headerShown: false }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

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
