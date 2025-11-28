import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import { useDispatch } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import DatePicker from 'react-native-date-picker';
import { GlassInput } from '../components/GlassInput';
import { GlassButton } from '../components/GlassButton';
import { GlassCard } from '../components/GlassCard';
import { theme } from '../theme/theme';
import { updateGoalOffline, incrementPendingChanges } from '../store/slices/goalsSlice';
import { format, parseISO } from 'date-fns';

const EditGoalScreen = ({ route, navigation }: any) => {
    const { goal } = route.params;
    const dispatch = useDispatch();

    const [title, setTitle] = useState(goal.title);
    const [description, setDescription] = useState(goal.description || '');
    const [startDate, setStartDate] = useState(parseISO(goal.startDate));
    const [durationDays, setDurationDays] = useState(String(goal.durationDays));
    const [showDatePicker, setShowDatePicker] = useState(false);

    const handleUpdateGoal = () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a goal title');
            return;
        }

        const duration = parseInt(durationDays);
        if (isNaN(duration) || duration < 1) {
            Alert.alert('Error', 'Please enter a valid duration (minimum 1 day)');
            return;
        }

        dispatch(updateGoalOffline({
            ...goal,
            title: title.trim(),
            description: description.trim() || undefined,
            startDate: format(startDate, 'yyyy-MM-dd'),
            durationDays: duration
        }));

        dispatch(incrementPendingChanges());

        Alert.alert('Success', 'Goal updated! Changes will sync when you are online.', [
            { text: 'OK', onPress: () => navigation.goBack() }
        ]);
    };

    return (
        <LinearGradient
            colors={[theme.colors.gray900, theme.colors.black]}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <Text style={styles.headerText}>Edit Goal</Text>

                        <GlassCard style={styles.formCard}>
                            <GlassInput
                                label="Goal Title *"
                                placeholder="e.g., My 10-Year Journey"
                                value={title}
                                onChangeText={setTitle}
                            />

                            <GlassInput
                                label="Description (Optional)"
                                placeholder="Describe your goal..."
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={3}
                                style={styles.textArea}
                            />

                            <Text style={styles.label}>Start Date *</Text>
                            <GlassButton
                                title={format(startDate, 'MMM dd, yyyy')}
                                onPress={() => setShowDatePicker(true)}
                                variant="secondary"
                                style={styles.dateButton}
                            />

                            <GlassInput
                                label="Duration (Days) *"
                                placeholder="e.g., 3650 for 10 years"
                                value={durationDays}
                                onChangeText={setDurationDays}
                                keyboardType="numeric"
                            />

                            <View style={styles.infoBox}>
                                <Text style={styles.infoText}>
                                    💡 Tip: 365 days = 1 year, 3650 days ≈ 10 years
                                </Text>
                            </View>
                        </GlassCard>

                        <GlassButton
                            title="Update Goal"
                            onPress={handleUpdateGoal}
                            variant="primary"
                            size="large"
                            style={styles.updateButton}
                        />
                    </ScrollView>
                </KeyboardAvoidingView>

                <DatePicker
                    modal
                    open={showDatePicker}
                    date={startDate}
                    mode="date"
                    onConfirm={(date) => {
                        setShowDatePicker(false);
                        setStartDate(date);
                    }}
                    onCancel={() => setShowDatePicker(false)}
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
    keyboardView: {
        flex: 1
    },
    scrollContent: {
        padding: theme.spacing.lg
    },
    headerText: {
        fontSize: theme.typography.fontSize.xxl,
        fontWeight: theme.typography.fontWeight.bold as any,
        color: theme.colors.white,
        marginBottom: theme.spacing.lg
    },
    formCard: {
        marginBottom: theme.spacing.lg
    },
    label: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium as any,
        color: theme.colors.white,
        marginBottom: theme.spacing.xs
    },
    dateButton: {
        marginBottom: theme.spacing.md
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top'
    },
    infoBox: {
        backgroundColor: theme.colors.glassDarkLight,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.sm,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        marginTop: theme.spacing.sm
    },
    infoText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.gray300
    },
    updateButton: {
        marginBottom: theme.spacing.xl
    }
});

export default EditGoalScreen;
