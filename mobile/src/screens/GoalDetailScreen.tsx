import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert,
    NativeModules,
    Platform
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { theme } from '../theme/theme';
import { deleteGoalOffline } from '../store/slices/goalsSlice';
import { incrementPendingChanges } from '../store/slices/syncSlice';
import { RootState } from '../store';
import { differenceInDays, format, parseISO } from 'date-fns';

const GoalDetailScreen = ({ route, navigation }: any) => {
    const { goalClientId } = route.params;
    const dispatch = useDispatch();
    const goal = useSelector((state: RootState) =>
        state.goals.goals.find(g => g.clientId === goalClientId)
    );
    const logs = useSelector((state: RootState) =>
        state.dailyLogs.logs.filter(l => l.goalClientId === goalClientId && !l._deleted)
    );

    const stats = useMemo(() => {
        if (!goal) return null;

        const today = new Date();
        const start = parseISO(goal.startDate);
        const daysFromStart = Math.max(0, differenceInDays(today, start));
        const daysRemaining = Math.max(0, goal.durationDays - daysFromStart);
        const progress = Math.min(100, (daysFromStart / goal.durationDays) * 100);
        const loggedProgress = Math.min(100, (logs.length / goal.durationDays) * 100);

        return {
            daysFromStart,
            daysRemaining,
            progress,
            loggedProgress,
            loggedDays: logs.length,
            startDate: format(start, 'MMM dd, yyyy'),
            endDate: format(new Date(start.getTime() + goal.durationDays * 24 * 60 * 60 * 1000), 'MMM dd, yyyy')
        };
    }, [goal, logs]);

    if (!goal) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Goal not found</Text>
            </View>
        );
    }

    const handleAddLog = () => {
        navigation.navigate('DailyLog', { goalClientId: goal.clientId });
    };

    const handlePinToWidget = async () => {
        if (!goal || !stats) return;

        try {
            if (Platform.OS === 'android') {
                const { GoalWidgetModule } = NativeModules;
                if (GoalWidgetModule) {
                    // Save data via native module
                    await GoalWidgetModule.saveWidgetData(
                        goal.title,
                        stats.daysRemaining,
                        Math.round(stats.loggedProgress)
                    );

                    // Update widget
                    GoalWidgetModule.updateWidget();

                    Alert.alert(
                        'Success',
                        'Goal pinned to widget! Go to your home screen, long press, and add the "Day Tracker" widget.'
                    );
                } else {
                    Alert.alert('Error', 'Widget module not available');
                }
            } else {
                Alert.alert('Info', 'Widgets are only available on Android');
            }
        } catch (error) {
            console.error('Error pinning to widget:', error);
            Alert.alert('Error', `Failed to pin goal to widget: ${JSON.stringify(error)}`);
        }
    };

    const handleEditGoal = () => {
        navigation.navigate('EditGoal', { goal });
    };

    const handleDeleteGoal = () => {
        Alert.alert(
            'Delete Goal',
            `Are you sure you want to delete "${goal.title}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        dispatch(deleteGoalOffline(goal.clientId));
                        dispatch(incrementPendingChanges());
                        Alert.alert('Deleted', 'Goal deleted successfully.', [
                            { text: 'OK', onPress: () => navigation.goBack() }
                        ]);
                    }
                }
            ]
        );
    };

    return (
        <LinearGradient
            colors={[theme.colors.gray900, theme.colors.black]}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>{goal.title}</Text>
                        {goal.description && (
                            <Text style={styles.description}>{goal.description}</Text>
                        )}
                        <View style={styles.headerButtons}>
                            <TouchableOpacity onPress={handleEditGoal} style={styles.headerButton}>
                                <Text style={styles.headerButtonText}>✏️ Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleDeleteGoal} style={styles.headerButton}>
                                <Text style={styles.headerButtonTextDanger}>🗑️ Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.statsGrid}>
                        <GlassCard style={styles.statCard}>
                            <Text style={styles.statValue}>{stats?.daysFromStart || 0}</Text>
                            <Text style={styles.statLabel}>Days Elapsed</Text>
                        </GlassCard>
                        <GlassCard style={styles.statCard}>
                            <Text style={styles.statValue}>{stats?.daysRemaining || 0}</Text>
                            <Text style={styles.statLabel}>Days Remaining</Text>
                        </GlassCard>
                    </View>

                    <View style={styles.statsGrid}>
                        <GlassCard style={styles.statCard}>
                            <Text style={styles.statValue}>{stats?.loggedDays || 0}</Text>
                            <Text style={styles.statLabel}>Days Logged</Text>
                        </GlassCard>
                        <GlassCard style={styles.statCard}>
                            <Text style={styles.statValue}>{stats?.progress.toFixed(3)}%</Text>
                            <Text style={styles.statLabel}>Time Elapsed</Text>
                        </GlassCard>
                    </View>

                    <View style={styles.statsGrid}>
                        <GlassCard style={[styles.statCard, { flex: 1 }]}>
                            <Text style={styles.statValue}>{stats?.loggedProgress.toFixed(3)}%</Text>
                            <Text style={styles.statLabel}>Progress Logged</Text>
                        </GlassCard>
                    </View>

                    <GlassCard style={styles.dateCard}>
                        <View style={styles.dateRow}>
                            <Text style={styles.dateLabel}>Start:</Text>
                            <Text style={styles.dateValue}>{stats?.startDate}</Text>
                        </View>
                        <View style={styles.dateRow}>
                            <Text style={styles.dateLabel}>Target End:</Text>
                            <Text style={styles.dateValue}>{stats?.endDate}</Text>
                        </View>
                        <View style={styles.dateRow}>
                            <Text style={styles.dateLabel}>Duration:</Text>
                            <Text style={styles.dateValue}>{goal.durationDays} days</Text>
                        </View>
                    </GlassCard>

                    {logs.length > 0 && (
                        <View style={styles.recentSection}>
                            <Text style={styles.sectionTitle}>Recent Logs ({logs.length})</Text>
                            {logs.slice(0, 5).map((log) => (
                                <GlassCard key={log.clientId} style={styles.logCard}>
                                    <Text style={styles.logDate}>
                                        {format(parseISO(log.logDate), 'MMM dd, yyyy')}
                                    </Text>
                                    {log.notes && (
                                        <Text style={styles.logNotes} numberOfLines={2}>
                                            {log.notes}
                                        </Text>
                                    )}
                                    {log.activities.length > 0 && (
                                        <Text style={styles.logMeta}>
                                            {log.activities.length} activities
                                        </Text>
                                    )}
                                </GlassCard>
                            ))}
                        </View>
                    )}

                    <View style={{ height: 100 }} />
                </ScrollView>

                <View style={styles.actionButtons}>
                    <GlassButton
                        title="📌 Pin to Widget"
                        onPress={handlePinToWidget}
                        variant="secondary"
                        size="medium"
                        style={styles.widgetButton}
                    />
                    <GlassButton
                        title="+ Add Daily Log"
                        onPress={handleAddLog}
                        variant="primary"
                        size="large"
                        style={styles.fabButton}
                    />
                </View>
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    errorText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.lg
    },
    scrollContent: {
        padding: theme.spacing.lg
    },
    header: {
        marginBottom: theme.spacing.lg
    },
    title: {
        fontSize: theme.typography.fontSize.xxl,
        fontWeight: theme.typography.fontWeight.bold as any,
        color: theme.colors.white,
        marginBottom: theme.spacing.sm
    },
    description: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.gray400,
        marginBottom: theme.spacing.sm
    },
    headerButtons: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.sm
    },
    headerButton: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        backgroundColor: theme.colors.glassDark,
        borderRadius: theme.borderRadius.sm,
        borderWidth: 1,
        borderColor: theme.colors.borderLight
    },
    headerButtonText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium as any
    },
    headerButtonTextDanger: {
        color: '#FF6B6B',
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium as any
    },
    statsGrid: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.md
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: theme.spacing.lg
    },
    statValue: {
        fontSize: theme.typography.fontSize.xxl,
        fontWeight: theme.typography.fontWeight.bold as any,
        color: theme.colors.white,
        marginBottom: theme.spacing.xs
    },
    statLabel: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.gray400,
        textAlign: 'center'
    },
    dateCard: {
        marginBottom: theme.spacing.lg
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.sm
    },
    dateLabel: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.gray400
    },
    dateValue: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium as any,
        color: theme.colors.white
    },
    recentSection: {
        marginBottom: theme.spacing.lg
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semibold as any,
        color: theme.colors.white,
        marginBottom: theme.spacing.md
    },
    logCard: {
        marginBottom: theme.spacing.sm
    },
    logDate: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold as any,
        color: theme.colors.white,
        marginBottom: theme.spacing.xs
    },
    logNotes: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.gray400,
        marginBottom: theme.spacing.xs
    },
    logMeta: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.gray500
    },
    actionButtons: {
        position: 'absolute',
        bottom: theme.spacing.xl,
        left: theme.spacing.lg,
        right: theme.spacing.lg,
        gap: theme.spacing.sm
    },
    widgetButton: {
        marginBottom: theme.spacing.sm
    },
    fabButton: {
    }
});

export default GoalDetailScreen;
