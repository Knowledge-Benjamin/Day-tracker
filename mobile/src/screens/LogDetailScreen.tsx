import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity
} from 'react-native';
import { useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { format, parseISO } from 'date-fns';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { theme } from '../theme/theme';
import { RootState } from '../store';
import { RootStackParamList } from '../navigation/AppNavigator';

type LogDetailScreenRouteProp = RouteProp<RootStackParamList, 'LogDetail'>;

const LogDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<LogDetailScreenRouteProp>();
    const { date } = route.params;

    const logs = useSelector((state: RootState) =>
        state.dailyLogs.logs.filter(l => l.logDate === date && !l._deleted)
    );
    const goals = useSelector((state: RootState) => state.goals.goals);

    if (logs.length === 0) {
        return (
            <LinearGradient
                colors={[theme.colors.gray900, theme.colors.black]}
                style={styles.container}
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyTitle}>No Logs for This Day</Text>
                        <Text style={styles.emptyText}>
                            {format(parseISO(date), 'MMMM dd, yyyy')}
                        </Text>
                        <GlassButton
                            title="Go Back"
                            onPress={() => navigation.goBack()}
                            style={styles.backButton}
                        />
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

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
                    <Text style={styles.headerText}>
                        {format(parseISO(date), 'EEEE, MMMM dd, yyyy')}
                    </Text>

                    {logs.map((log) => {
                        const goal = goals.find(g => g.clientId === log.goalClientId);

                        return (
                            <GlassCard key={log.clientId} style={styles.logCard}>
                                <View style={styles.logHeader}>
                                    <Text style={styles.goalTitle}>
                                        {goal?.title || 'Unknown Goal'}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (goal) {
                                                navigation.navigate('GoalDetail' as any, {
                                                    goalClientId: goal.clientId
                                                });
                                            }
                                        }}
                                    >
                                        <Text style={styles.viewGoalText}>View Goal →</Text>
                                    </TouchableOpacity>
                                </View>

                                {log.notes && (
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>📝 Notes</Text>
                                        <Text style={styles.sectionContent}>{log.notes}</Text>
                                    </View>
                                )}

                                {log.activities && log.activities.length > 0 && (
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>✅ Activities</Text>
                                        {log.activities.map((activity, index) => (
                                            <Text key={index} style={styles.listItem}>
                                                • {activity}
                                            </Text>
                                        ))}
                                    </View>
                                )}

                                {log.goodThings && log.goodThings.length > 0 && (
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>✨ Good Things</Text>
                                        {log.goodThings.map((thing, index) => (
                                            <Text key={index} style={styles.listItem}>
                                                • {thing}
                                            </Text>
                                        ))}
                                    </View>
                                )}

                                {log.futurePlans && log.futurePlans.length > 0 && (
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>📅 Future Plans</Text>
                                        {log.futurePlans.map((plan, index) => (
                                            <View key={index} style={styles.planItem}>
                                                <Text style={styles.planTitle}>{plan.title}</Text>
                                                {plan.description && (
                                                    <Text style={styles.planDescription}>
                                                        {plan.description}
                                                    </Text>
                                                )}
                                                {plan.plannedDate && (
                                                    <Text style={styles.planDate}>
                                                        {format(parseISO(plan.plannedDate), 'MMM dd, yyyy')}
                                                    </Text>
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {log.attachments && log.attachments.length > 0 && (
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>📎 Attachments</Text>
                                        <Text style={styles.attachmentCount}>
                                            {log.attachments.length} file(s)
                                        </Text>
                                    </View>
                                )}
                            </GlassCard>
                        );
                    })}
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
    scrollContent: {
        padding: theme.spacing.lg
    },
    headerText: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold as any,
        color: theme.colors.white,
        marginBottom: theme.spacing.lg
    },
    logCard: {
        marginBottom: theme.spacing.md
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight
    },
    goalTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold as any,
        color: theme.colors.white,
        flex: 1
    },
    viewGoalText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.white,
        opacity: 0.7
    },
    section: {
        marginBottom: theme.spacing.md
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semibold as any,
        color: theme.colors.white,
        marginBottom: theme.spacing.xs
    },
    sectionContent: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.gray300,
        lineHeight: 20
    },
    listItem: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.gray300,
        marginBottom: theme.spacing.xs
    },
    planItem: {
        marginBottom: theme.spacing.sm
    },
    planTitle: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold as any,
        color: theme.colors.white
    },
    planDescription: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.gray400,
        marginTop: theme.spacing.xs
    },
    planDate: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.gray500,
        marginTop: theme.spacing.xs
    },
    attachmentCount: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.gray400
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl
    },
    emptyTitle: {
        fontSize: theme.typography.fontSize.xxl,
        fontWeight: theme.typography.fontWeight.bold as any,
        color: theme.colors.white,
        marginBottom: theme.spacing.sm
    },
    emptyText: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.gray400,
        marginBottom: theme.spacing.xl
    },
    backButton: {
        minWidth: 150
    }
});

export default LogDetailScreen;
