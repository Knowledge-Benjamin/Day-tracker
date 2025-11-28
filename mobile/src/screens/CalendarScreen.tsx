import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView
} from 'react-native';
import { useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import { Calendar } from 'react-native-calendars';
import { GlassCard } from '../components/GlassCard';
import { theme } from '../theme/theme';
import { RootState } from '../store';
import { format, parseISO } from 'date-fns';

const CalendarScreen = ({ navigation }: any) => {
    const logs = useSelector((state: RootState) => state.dailyLogs.logs);

    // Create marked dates object for calendar
    const markedDates = useMemo(() => {
        const marked: any = {};

        logs.filter(l => !l._deleted).forEach(log => {
            const dateKey = format(parseISO(log.logDate), 'yyyy-MM-dd');
            marked[dateKey] = {
                marked: true,
                dotColor: theme.colors.white,
                selected: false
            };
        });

        return marked;
    }, [logs]);

    const loggedCount = Object.keys(markedDates).length;

    return (
        <LinearGradient
            colors={[theme.colors.gray900, theme.colors.black]}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Calendar View</Text>
                        <Text style={styles.subtitle}>
                            {loggedCount} {loggedCount === 1 ? 'day' : 'days'} logged
                        </Text>
                    </View>

                    <GlassCard style={styles.calendarCard}>
                        <Calendar
                            markedDates={markedDates}
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
                                textDayFontSize: 14,
                                textMonthFontSize: 18,
                                textDayHeaderFontSize: 12
                            }}
                            onDayPress={(day) => {
                                // Could navigate to day detail or filter
                                console.log('Selected day:', day);
                            }}
                        />
                    </GlassCard>

                    <GlassCard style={styles.legendCard}>
                        <Text style={styles.legendTitle}>Legend</Text>
                        <View style={styles.legendItem}>
                            <View style={styles.legendDot} />
                            <Text style={styles.legendText}>Day with log entry</Text>
                        </View>
                    </GlassCard>
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
    content: {
        flex: 1,
        padding: theme.spacing.lg
    },
    header: {
        marginBottom: theme.spacing.lg
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
        alignItems: 'center'
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
    }
});

export default CalendarScreen;
