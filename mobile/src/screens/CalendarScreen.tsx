import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import { Calendar } from 'react-native-calendars';
import { GlassCard } from '../components/GlassCard';
import { theme } from '../theme/theme';
import { RootState } from '../store';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { setSelectedGoalFilter } from '../store/slices/calendarSlice';

const CalendarScreen = ({ navigation }: any) => {
    const dispatch = useDispatch();
    const logs = useSelector((state: RootState) => state.dailyLogs.logs);
    const goals = useSelector((state: RootState) => state.goals.goals);
    const { selectedGoalFilter, isSignedIn, googleCalendarEnabled } = useSelector(
        (state: RootState) => state.calendar
    );

    const activeGoals = goals.filter(g => !g._deleted);

    // Filter logs based on selected goal
    const filteredLogs = useMemo(() => {
        if (selectedGoalFilter) {
            return logs.filter(l => l.goalClientId === selectedGoalFilter && !l._deleted);
        }
        return logs.filter(l => !l._deleted);
    }, [logs, selectedGoalFilter]);

    // Create marked dates with goal colors
    const markedDates = useMemo(() => {
        const marked: any = {};
        const goalColors: { [key: string]: string } = {};

        // Assign colors to goals
        activeGoals.forEach((goal, index) => {
            goalColors[goal.clientId] = theme.colors.blockColors[
                index % theme.colors.blockColors.length
            ];
        });

        filteredLogs.forEach(log => {
            const dateKey = format(parseISO(log.logDate), 'yyyy-MM-dd');
            const goal = goals.find(g => g.clientId === log.goalClientId);
            const color = goal ? goalColors[goal.clientId] : theme.colors.white;

            marked[dateKey] = {
                marked: true,
                dotColor: color,
                selected: false
            };
        });

        return marked;
    }, [filteredLogs, goals, activeGoals]);

    // Calculate streak
    const streak = useMemo(() => {
        if (filteredLogs.length === 0) return 0;

        const sortedDates = filteredLogs
            .map(l => parseISO(l.logDate))
            .sort((a, b) => b.getTime() - a.getTime());

        const today = new Date();
        const mostRecentLog = sortedDates[0];
        const daysSinceLast = differenceInCalendarDays(today, mostRecentLog);

        // If last log was more than 1 day ago, streak is broken
        if (daysSinceLast > 1) return 0;

        let currentStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
            const diff = differenceInCalendarDays(sortedDates[i - 1], sortedDates[i]);
            if (diff === 1) {
                currentStreak++;
            } else {
                break;
            }
        }

        return currentStreak;
    }, [filteredLogs]);

    const loggedCount = Object.keys(markedDates).length;

    const handleDayPress = (day: any) => {
        // Check if there's a log for this date
        const logForDate = filteredLogs.find(l => l.logDate === day.dateString);
        if (logForDate) {
            navigation.navigate('LogDetail', { date: day.dateString });
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
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Calendar View</Text>
                            <Text style={styles.subtitle}>
                                {loggedCount} {loggedCount === 1 ? 'day' : 'days'} logged
                                {streak > 0 && ` • ${streak} day streak 🔥`}
                            </Text>
                        </View>
                    </View>

                    {/* Google Calendar Status */}
                    {googleCalendarEnabled && (
                        <GlassCard style={styles.statusCard}>
                            <Text style={styles.statusText}>
                                {isSignedIn ? '✅ Synced with Google Calendar' : '⚠️ Google Calendar: Not signed in'}
                            </Text>
                        </GlassCard>
                    )}

                    {/* Goal Filter */}
                    {activeGoals.length > 1 && (
                        <GlassCard style={styles.filterCard}>
                            <Text style={styles.filterTitle}>Filter by Goal</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.filterScroll}
                            >
                                <TouchableOpacity
                                    style={[
                                        styles.filterChip,
                                        !selectedGoalFilter && styles.filterChipActive
                                    ]}
                                    onPress={() => dispatch(setSelectedGoalFilter(null))}
                                >
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            !selectedGoalFilter && styles.filterChipTextActive
                                        ]}
                                    >
                                        All Goals
                                    </Text>
                                </TouchableOpacity>
                                {activeGoals.map(goal => (
                                    <TouchableOpacity
                                        key={goal.clientId}
                                        style={[
                                            styles.filterChip,
                                            selectedGoalFilter === goal.clientId && styles.filterChipActive
                                        ]}
                                        onPress={() => dispatch(setSelectedGoalFilter(goal.clientId))}
                                    >
                                        <Text
                                            style={[
                                                styles.filterChipText,
                                                selectedGoalFilter === goal.clientId && styles.filterChipTextActive
                                            ]}
                                        >
                                            {goal.title}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </GlassCard>
                    )}

                    {/* Calendar */}
                    <GlassCard style={styles.calendarCard}>
                        <Calendar
                            markedDates={markedDates}
                            markingType="dot"
                            theme={{
                                backgroundColor: 'transparent',
                                calendarBackground: 'transparent',
                                textSectionTitleColor: theme.colors.white,
                                selectedDayBackgroundColor: theme.colors.white,
                                selectedDayTextColor: theme.colors.black,
                                todayTextColor: theme.colors.white,
                                dayTextColor: theme.colors.white,
                                textDisabledColor: theme.colors.gray600,
                                dotColor: theme.colors.white,
                                selectedDotColor: theme.colors.black,
                                arrowColor: theme.colors.white,
                                monthTextColor: theme.colors.white,
                                indicatorColor: theme.colors.white,
                                textDayFontWeight: '400',
                                textMonthFontWeight: 'bold',
                                textDayHeaderFontWeight: '600',
                                textDayFontSize: 16,
                                textMonthFontSize: 20,
                                textDayHeaderFontSize: 13
                            }}
                            onDayPress={handleDayPress}
                            enableSwipeMonths={true}
                        />
                    </GlassCard>

                    {/* Legend */}
                    <GlassCard style={styles.legendCard}>
                        <Text style={styles.legendTitle}>Legend</Text>
                        <View style={styles.legendItem}>
                            <View style={styles.legendDot} />
                            <Text style={styles.legendText}>Day with log entry (tap to view)</Text>
                        </View>
                        {activeGoals.length > 1 && selectedGoalFilter === null && (
                            <Text style={styles.legendSubtext}>
                                • Different colors represent different goals
                            </Text>
                        )}
                    </GlassCard>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md
    },
    title: {
        fontSize: theme.typography.fontSize.xxl,
        fontWeight: theme.typography.fontWeight.bold as any,
        color: theme.colors.white,
        marginBottom: theme.spacing.xs
    },
    subtitle: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.gray400
    },
    statusCard: {
        marginBottom: theme.spacing.md,
        padding: theme.spacing.md
    },
    statusText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.white,
        textAlign: 'center'
    },
    filterCard: {
        marginBottom: theme.spacing.md,
        padding: theme.spacing.md
    },
    filterTitle: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold as any,
        color: theme.colors.white,
        marginBottom: theme.spacing.sm
    },
    filterScroll: {
        flexDirection: 'row'
    },
    filterChip: {
        backgroundColor: theme.colors.glassDarkLight,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        marginRight: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.borderLight
    },
    filterChipActive: {
        backgroundColor: theme.colors.white,
        borderColor: theme.colors.white
    },
    filterChipText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.white
    },
    filterChipTextActive: {
        color: theme.colors.black,
        fontWeight: theme.typography.fontWeight.semibold as any
    },
    calendarCard: {
        marginBottom: theme.spacing.md,
        padding: theme.spacing.md
    },
    legendCard: {
        padding: theme.spacing.md
    },
    legendTitle: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semibold as any,
        color: theme.colors.white,
        marginBottom: theme.spacing.sm
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xs
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.white,
        marginRight: theme.spacing.sm
    },
    legendText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.gray300
    },
    legendSubtext: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.gray400,
        marginTop: theme.spacing.xs
    }
});

export default CalendarScreen;
