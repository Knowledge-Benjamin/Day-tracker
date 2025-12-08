import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { theme } from '../theme/theme';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import GoalsListScreen from '../screens/GoalsListScreen';
import CreateGoalScreen from '../screens/CreateGoalScreen';
import EditGoalScreen from '../screens/EditGoalScreen';
import GoalDetailScreen from '../screens/GoalDetailScreen';
import DailyLogScreen from '../screens/DailyLogScreen';
import CalendarScreen from '../screens/CalendarScreen';
import LogDetailScreen from '../screens/LogDetailScreen';
import CalendarSettingsScreen from '../screens/CalendarSettingsScreen';
import CalosScreen from '../screens/CalosScreen';

export type RootStackParamList = {
    Main: undefined;
    CreateGoal: undefined;
    EditGoal: { goalClientId: string };
    GoalDetail: { goalClientId: string };
    DailyLog: { goalClientId: string };
    LogDetail: { date: string };
    CalendarSettings: undefined;
    Login: undefined;
    Register: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

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
            <Tab.Screen
                name="Calos"
                component={CalosScreen}
                options={{ title: 'Calos AI' }}
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
                        <Stack.Screen
                            name="LogDetail"
                            component={LogDetailScreen}
                            options={{ title: 'Log Details' }}
                        />
                        <Stack.Screen
                            name="CalendarSettings"
                            component={CalendarSettingsScreen}
                            options={{ title: 'Calendar Settings' }}
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

export default AppNavigator;
