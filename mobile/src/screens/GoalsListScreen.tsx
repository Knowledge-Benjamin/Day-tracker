import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    FlatList,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { theme } from '../theme/theme';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';

const GoalsListScreen = ({ navigation }: any) => {
    const dispatch = useDispatch();
    const { goals, loading } = useSelector((state: RootState) => state.goals);
    const { user } = useSelector((state: RootState) => state.auth);
    const { isSyncing, lastSyncAt } = useSelector((state: RootState) => state.sync);

    const activeGoals = goals.filter(g => !g._deleted);

    const handleLogout = () => {
        dispatch(logout());
        navigation.replace('Login');
    };

    const renderGoalCard = ({ item }: { item: any }) => {
        const daysElapsed = Math.max(0, item.loggedDays || 0);
        const progressPercent = Math.min(100, (daysElapsed / item.durationDays) * 100);

        return (
            <TouchableOpacity
                onPress={() => navigation.navigate('GoalDetail', { goalClientId: item.clientId })}
            >
                <GlassCard style={styles.goalCard}>
                    <View style={styles.goalHeader}>
                        <Text style={styles.goalTitle}>{item.title}</Text>
                        {item._pendingSync && (
                            <View style={styles.pendingBadge}>
                                <Text style={styles.pendingText}>●</Text>
                            </View>
                        )}
                    </View>

                    {item.description && (
                        <Text style={styles.goalDescription} numberOfLines={2}>
                            {item.description}
                        </Text>
                    )}

                    <View style={styles.statsContainer}>
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{daysElapsed}</Text>
                            <Text style={styles.statLabel}>Days Logged</Text>
                        </View>
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{item.daysRemaining || item.durationDays}</Text>
                            <Text style={styles.statLabel}>Days Remaining</Text>
                        </View>
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{progressPercent.toFixed(0)}%</Text>
                            <Text style={styles.statLabel}>Progress</Text>
                        </View>
                    </View>

                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                    </View>
                </GlassCard>
            </TouchableOpacity>
        );
    };

    return (
        <LinearGradient
            colors={[theme.colors.gray900, theme.colors.black]}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.welcomeText}>Welcome, {user?.name || user?.email}</Text>
                        {isSyncing && (
                            <View style={styles.syncIndicator}>
                                <ActivityIndicator size="small" color={theme.colors.white} />
                                <Text style={styles.syncText}>Syncing...</Text>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity onPress={handleLogout}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.white} />
                    </View>
                ) : activeGoals.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No goals yet</Text>
                        <Text style={styles.emptySubtext}>Create your first goal to start tracking</Text>
                    </View>
                ) : (
                    <FlatList
                        data={activeGoals}
                        renderItem={renderGoalCard}
                        keyExtractor={(item) => item.clientId}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                <GlassButton
                    title="+ Create New Goal"
                    onPress={() => navigation.navigate('CreateGoal')}
                    variant="primary"
                    size="large"
                    style={styles.createButton}
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md
    },
    welcomeText: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semibold as any,
        color: theme.colors.white
    },
    syncIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: theme.spacing.xs
    },
    syncText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.gray400,
        marginLeft: theme.spacing.xs
    },
    logoutText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.gray400
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl
    },
    emptyText: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold as any,
        color: theme.colors.white,
        marginBottom: theme.spacing.sm
    },
    emptySubtext: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.gray400,
        textAlign: 'center'
    },
    listContent: {
        padding: theme.spacing.lg,
        paddingBottom: 100
    },
    goalCard: {
        marginBottom: theme.spacing.md
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm
    },
    goalTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold as any,
        color: theme.colors.white,
        flex: 1
    },
    pendingBadge: {
        marginLeft: theme.spacing.sm
    },
    pendingText: {
        color: '#FFA07A',
        fontSize: theme.typography.fontSize.lg
    },
    goalDescription: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.gray400,
        marginBottom: theme.spacing.md
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md
    },
    stat: {
        alignItems: 'center'
    },
    statValue: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold as any,
        color: theme.colors.white
    },
    statLabel: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.gray400,
        marginTop: theme.spacing.xs
    },
    progressBar: {
        height: 6,
        backgroundColor: theme.colors.gray700,
        borderRadius: theme.borderRadius.sm,
        overflow: 'hidden'
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.sm
    },
    createButton: {
        position: 'absolute',
        bottom: theme.spacing.xl,
        left: theme.spacing.lg,
        right: theme.spacing.lg
    }
});

export default GoalsListScreen;
