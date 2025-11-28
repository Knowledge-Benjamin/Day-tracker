import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import { theme } from './theme/theme';
import { syncService } from './services/syncService';

// Screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import GoalsListScreen from './screens/GoalsListScreen';
import CreateGoalScreen from './screens/CreateGoalScreen';
import GoalDetailScreen from './screens/GoalDetailScreen';
import DailyLogScreen from './screens/DailyLogScreen';
import CalendarScreen from './screens/CalendarScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Initialize sync service
syncService.init();

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

const App = () => {
    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
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
                        {/* Auth screens */}
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

                        {/* Main app */}
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
                            name="GoalDetail"
                            component={GoalDetailScreen}
                            options={{ title: 'Goal Details' }}
                        />
                        <Stack.Screen
                            name="DailyLog"
                            component={DailyLogScreen}
                            options={{ title: 'Daily Log' }}
                        />
                    </Stack.Navigator>
                </NavigationContainer>
            </PersistGate>
        </Provider>
    );
};

export default App;
