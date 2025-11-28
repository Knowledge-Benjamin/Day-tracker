import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert
} from 'react-native';
import { useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { BinVisualization } from '../components/BinVisualization';
import { theme } from '../theme/theme';
import { RootState } from '../store';
import { differenceInDays, format, parseISO } from 'date-fns';

const GoalDetailScreen = ({ route, navigation }: any) => {
    const { goalClientId } = route.params;
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

        return {
            daysFromStart,
            daysRemaining,
            progress,
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
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>{goal.title}</Text>
                        {goal.description && (
                            <Text style={styles.description}>{goal.description}</Text>
                        )}
                    </View>

                    {/* 3D Bin Visualization */}
                    <GlassCard style={styles.visualCard}>
                        <Text style={styles.sectionTitle}>Progress Visualization</Text>
                        <BinVisualization
                            totalDays={goal.durationDays}
                            loggedDays={stats?.loggedDays || 0}
                            style={styles.binViz}
                        />
                    </GlassCard>

                    {/* Stats Cards */}
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
                            <Text style={styles.statValue}>{stats?.progress.toFixed(0)}%</Text>
                            <Text style={styles.statLabel}>Progress</Text>
                        </GlassCard>
                    </View>

                    {/* Date Range */}
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

                    {/* Recent Logs */}
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

                {/* Floating Action Button */}
                <GlassButton
                    title="+ Add Daily Log"
                    onPress={handleAddLog}
                    variant="primary"
                    size="large"
                    style={styles.fabButton}
                />
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
        color: theme.colors.gray400
    },
    visualCard: {
        marginBottom: theme.spacing.lg,
        paddingVertical: theme.spacing.lg
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semibold as any,
        color: theme.colors.white,
        marginBottom: theme.spacing.md
    },
    binViz: {
        marginTop: theme.spacing.md
    },
    statsGrid: {
        flexDirection: 'row',
        gap: theme.spacing.md,
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
    fabButton: {
        position: 'absolute',
        bottom: theme.spacing.xl,
        left: theme.spacing.lg,
        right: theme.spacing.lg
    }
});

export default GoalDetailScreen;
