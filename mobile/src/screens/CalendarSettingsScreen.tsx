import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../store';
import {
    setGoogleCalendarEnabled,
    setSignedIn,
    setAutoSync,
    setLastSyncTime,
    clearCalendarState
} from '../store/slices/calendarSlice';
import { googleCalendarService } from '../services/googleCalendarService';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { theme } from '../theme/theme';
import { format } from 'date-fns';

const CalendarSettingsScreen = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { googleCalendarEnabled, isSignedIn, autoSync, lastSyncTime } = useSelector(
        (state: RootState) => state.calendar
    );

    const [isLoading, setIsLoading] = useState(false);
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

    useEffect(() => {
        // Check if already signed in on mount
        checkSignInStatus();
    }, []);

    const checkSignInStatus = async () => {
        const signedIn = await googleCalendarService.isSignedIn();
        if (signedIn) {
            dispatch(setSignedIn(true));
            // Could also fetch and set user email here
        }
    };

    const handleSignIn = async () => {
        setIsLoading(true);
        try {
            const success = await googleCalendarService.signIn();
            if (success) {
                dispatch(setSignedIn(true));
                dispatch(setGoogleCalendarEnabled(true));
                Alert.alert('Success', 'Signed in to Google Calendar successfully!');
            } else {
                Alert.alert('Error', 'Failed to sign in to Google Calendar');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to sign in');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOut = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out of Google Calendar?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            await googleCalendarService.signOut();
                            dispatch(clearCalendarState());
                            Alert.alert('Success', 'Signed out successfully');
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to sign out');
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleToggleAutoSync = () => {
        dispatch(setAutoSync(!autoSync));
    };

    const handleToggleGoogleCalendar = () => {
        if (googleCalendarEnabled && isSignedIn) {
            // If turning off, sign out
            handleSignOut();
        } else {
            dispatch(setGoogleCalendarEnabled(!googleCalendarEnabled));
        }
    };

    return (
        <LinearGradient
            colors={[theme.colors.gray900, theme.colors.black]}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.title}>Google Calendar Settings</Text>
                    <Text style={styles.subtitle}>
                        Sync your daily logs to Google Calendar
                    </Text>

                    {/* Status Card */}
                    <GlassCard style={styles.card}>
                        <Text style={styles.cardTitle}>Status</Text>
                        <View style={styles.statusRow}>
                            <Text style={styles.statusLabel}>Google Calendar:</Text>
                            <Text style={[
                                styles.statusValue,
                                isSignedIn && { color: theme.colors.white }
                            ]}>
                                {isSignedIn ? '✅ Connected' : '❌ Not Connected'}
                            </Text>
                        </View>
                        {lastSyncTime && (
                            <View style={styles.statusRow}>
                                <Text style={styles.statusLabel}>Last Sync:</Text>
                                <Text style={styles.statusValue}>
                                    {format(new Date(lastSyncTime), 'MMM dd, yyyy HH:mm')}
                                </Text>
                            </View>
                        )}
                    </GlassCard>

                    {/* Authentication */}
                    <GlassCard style={styles.card}>
                        <Text style={styles.cardTitle}>Authentication</Text>
                        {isSignedIn ? (
                            <>
                                <Text style={styles.info}>
                                    You are currently signed in to Google Calendar.
                                </Text>
                                <GlassButton
                                    title="Sign Out"
                                    onPress={handleSignOut}
                                    style={styles.button}
                                    disabled={isLoading}
                                />
                            </>
                        ) : (
                            <>
                                <Text style={styles.info}>
                                    Sign in to sync your daily logs to Google Calendar automatically.
                                </Text>
                                <GlassButton
                                    title={isLoading ? "Signing In..." : "Sign In with Google"}
                                    onPress={handleSignIn}
                                    style={styles.button}
                                    disabled={isLoading}
                                />
                            </>
                        )}
                    </GlassCard>

                    {/* Sync Settings */}
                    {isSignedIn && (
                        <GlassCard style={styles.card}>
                            <Text style={styles.cardTitle}>Sync Settings</Text>

                            <TouchableOpacity
                                style={styles.toggleRow}
                                onPress={handleToggleAutoSync}
                            >
                                <View style={styles.toggleInfo}>
                                    <Text style={styles.toggleTitle}>Auto-Sync</Text>
                                    <Text style={styles.toggleSubtitle}>
                                        Automatically sync new logs to Google Calendar
                                    </Text>
                                </View>
                                <View style={[
                                    styles.toggle,
                                    autoSync && styles.toggleActive
                                ]}>
                                    <View style={[
                                        styles.toggleButton,
                                        autoSync && styles.toggleButtonActive
                                    ]} />
                                </View>
                            </TouchableOpacity>
                        </GlassCard>
                    )}

                    {/* Information */}
                    <GlassCard style={styles.card}>
                        <Text style={styles.cardTitle}>How It Works</Text>
                        <Text style={styles.infoText}>
                            • When you create a daily log, it will be added to your Google Calendar
                        </Text>
                        <Text style={styles.infoText}>
                            • Events are titled "Day Tracker: [Goal Name]"
                        </Text>
                        <Text style={styles.infoText}>
                            • Event descriptions include your notes and activities
                        </Text>
                        <Text style={styles.infoText}>
                            • Updates to logs will update the calendar event
                        </Text>
                    </GlassCard>

                    {isLoading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color={theme.colors.white} />
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    safeArea: {
        flex: 1
    },
    content: {
        padding: theme.spacing.lg
    },
    title: {
        fontSize: theme.typography.fontSize.xxl,
        fontWeight: theme.typography.fontWeight.bold as any,
        color: theme.colors.white,
        marginBottom: theme.spacing.xs
    },
    subtitle: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.gray400,
        marginBottom: theme.spacing.lg
    },
    card: {
        marginBottom: theme.spacing.md,
        padding: theme.spacing.md
    },
    cardTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semibold as any,
        color: theme.colors.white,
        marginBottom: theme.spacing.md
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm
    },
    statusLabel: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.gray400
    },
    statusValue: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.gray300,
        fontWeight: theme.typography.fontWeight.semibold as any
    },
    info: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.gray300,
        marginBottom: theme.spacing.md,
        lineHeight: 20
    },
    button: {
        marginTop: theme.spacing.sm
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm
    },
    toggleInfo: {
        flex: 1,
        marginRight: theme.spacing.md
    },
    toggleTitle: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.white,
        fontWeight: theme.typography.fontWeight.semibold as any,
        marginBottom: theme.spacing.xs
    },
    toggleSubtitle: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.gray400
    },
    toggle: {
        width: 50,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.colors.gray600,
        padding: 2
    },
    toggleActive: {
        backgroundColor: theme.colors.white
    },
    toggleButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.white
    },
    toggleButtonActive: {
        backgroundColor: theme.colors.black,
        alignSelf: 'flex-end'
    },
    infoText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.gray300,
        marginBottom: theme.spacing.sm,
        lineHeight: 20
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export default CalendarSettingsScreen;
