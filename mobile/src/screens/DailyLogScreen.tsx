import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    Alert
} from 'react-native';
import { useDispatch } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import DatePicker from 'react-native-date-picker';
import { launchImageLibrary } from 'react-native-image-picker';
import { GlassInput } from '../components/GlassInput';
import { GlassButton } from '../components/GlassButton';
import { GlassCard } from '../components/GlassCard';
import { theme } from '../theme/theme';
import { addLogOffline, incrementPendingChanges } from '../store/slices/dailyLogsSlice';
import { format } from 'date-fns';

const DailyLogScreen = ({ route, navigation }: any) => {
    const { goalClientId } = route.params;
    const dispatch = useDispatch();

    const [logDate, setLogDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [notes, setNotes] = useState('');
    const [activityInput, setActivityInput] = useState('');
    const [activities, setActivities] = useState<string[]>([]);
    const [goodThingInput, setGoodThingInput] = useState('');
    const [goodThings, setGoodThings] = useState<string[]>([]);
    const [futurePlanTitle, setFuturePlanTitle] = useState('');
    const [futurePlanDescription, setFuturePlanDescription] = useState('');
    const [futurePlanDate, setFuturePlanDate] = useState<Date | null>(null);
    const [futurePlans, setFuturePlans] = useState<any[]>([]);
    const [showFutureDatePicker, setShowFutureDatePicker] = useState(false);

    const addActivity = () => {
        if (activityInput.trim()) {
            setActivities([...activities, activityInput.trim()]);
            setActivityInput('');
        }
    };

    const removeActivity = (index: number) => {
        setActivities(activities.filter((_, i) => i !== index));
    };

    const addGoodThing = () => {
        if (goodThingInput.trim()) {
            setGoodThings([...goodThings, goodThingInput.trim()]);
            setGoodThingInput('');
        }
    };

    const removeGoodThing = (index: number) => {
        setGoodThings(goodThings.filter((_, i) => i !== index));
    };

    const addFuturePlan = () => {
        if (futurePlanTitle.trim()) {
            setFuturePlans([
                ...futurePlans,
                {
                    title: futurePlanTitle.trim(),
                    description: futurePlanDescription.trim() || undefined,
                    plannedDate: futurePlanDate ? format(futurePlanDate, 'yyyy-MM-dd') : undefined
                }
            ]);
            setFuturePlanTitle('');
            setFuturePlanDescription('');
            setFuturePlanDate(null);
        }
    };

    const removeFuturePlan = (index: number) => {
        setFuturePlans(futurePlans.filter((_, i) => i !== index));
    };

    const handleSaveLog = () => {
        if (!notes && activities.length === 0 && goodThings.length === 0) {
            Alert.alert('Empty Log', 'Please add at least some notes or an activity');
            return;
        }

        dispatch(addLogOffline({
            goalClientId,
            logDate: format(logDate, 'yyyy-MM-dd'),
            notes: notes.trim() || undefined,
            activities,
            goodThings,
            futurePlans,
            attachments: []
        }));

        dispatch(incrementPendingChanges());

        Alert.alert('Success', 'Daily log saved! It will sync when online.', [
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
                        <Text style={styles.headerText}>Daily Log Entry</Text>

                        {/* Date Selection */}
                        <GlassCard style={styles.section}>
                            <Text style={styles.sectionTitle}>Log Date</Text>
                            <GlassButton
                                title={format(logDate, 'EEEE, MMM dd, yyyy')}
                                onPress={() => setShowDatePicker(true)}
                                variant="secondary"
                            />
                        </GlassCard>

                        {/* Notes */}
                        <GlassCard style={styles.section}>
                            <Text style={styles.sectionTitle}>Notes</Text>
                            <GlassInput
                                placeholder="What happened today? How are you feeling?"
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                numberOfLines={5}
                                style={styles.textArea}
                            />
                        </GlassCard>

                        {/* Activities */}
                        <GlassCard style={styles.section}>
                            <Text style={styles.sectionTitle}>Activities</Text>
                            <View style={styles.inputRow}>
                                <GlassInput
                                    placeholder="Add an activity..."
                                    value={activityInput}
                                    onChangeText={setActivityInput}
                                    containerStyle={styles.flexInput}
                                />
                                <GlassButton title="Add" onPress={addActivity} size="small" />
                            </View>
                            {activities.map((activity, index) => (
                                <View key={index} style={styles.listItem}>
                                    <Text style={styles.listItemText}>• {activity}</Text>
                                    <TouchableOpacity onPress={() => removeActivity(index)}>
                                        <Text style={styles.removeButton}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </GlassCard>

                        {/* Good Things */}
                        <GlassCard style={styles.section}>
                            <Text style={styles.sectionTitle}>Good Things That Happened</Text>
                            <View style={styles.inputRow}>
                                <GlassInput
                                    placeholder="Something positive..."
                                    value={goodThingInput}
                                    onChangeText={setGoodThingInput}
                                    containerStyle={styles.flexInput}
                                />
                                <GlassButton title="Add" onPress={addGoodThing} size="small" />
                            </View>
                            {goodThings.map((thing, index) => (
                                <View key={index} style={styles.listItem}>
                                    <Text style={styles.listItemText}>✨ {thing}</Text>
                                    <TouchableOpacity onPress={() => removeGoodThing(index)}>
                                        <Text style={styles.removeButton}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </GlassCard>

                        {/* Future Plans */}
                        <GlassCard style={styles.section}>
                            <Text style={styles.sectionTitle}>Future Plans / Important Dates</Text>
                            <GlassInput
                                label="Title"
                                placeholder="Plan or event title..."
                                value={futurePlanTitle}
                                onChangeText={setFuturePlanTitle}
                            />
                            <GlassInput
                                label="Description (Optional)"
                                placeholder="Additional details..."
                                value={futurePlanDescription}
                                onChangeText={setFuturePlanDescription}
                            />
                            <Text style={styles.label}>When? (Optional)</Text>
                            <GlassButton
                                title={futurePlanDate ? format(futurePlanDate, 'MMM dd, yyyy') : 'Select Date'}
                                onPress={() => setShowFutureDatePicker(true)}
                                variant="secondary"
                                size="small"
                                style={styles.smallButton}
                            />
                            <GlassButton
                                title="Add Plan"
                                onPress={addFuturePlan}
                                size="small"
                                style={styles.smallButton}
                            />
                            {futurePlans.map((plan, index) => (
                                <View key={index} style={styles.planItem}>
                                    <View style={styles.planContent}>
                                        <Text style={styles.planTitle}>{plan.title}</Text>
                                        {plan.description && (
                                            <Text style={styles.planDescription}>{plan.description}</Text>
                                        )}
                                        {plan.plannedDate && (
                                            <Text style={styles.planDate}>
                                                📅 {format(new Date(plan.plannedDate), 'MMM dd, yyyy')}
                                            </Text>
                                        )}
                                    </View>
                                    <TouchableOpacity onPress={() => removeFuturePlan(index)}>
                                        <Text style={styles.removeButton}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </GlassCard>

                        <GlassButton
                            title="Save Daily Log"
                            onPress={handleSaveLog}
                            variant="primary"
                            size="large"
                            style={styles.saveButton}
                        />

                        <View style={{ height: 50 }} />
                    </ScrollView>
                </KeyboardAvoidingView>

                <DatePicker
                    modal
                    open={showDatePicker}
                    date={logDate}
                    mode="date"
                    onConfirm={(date) => {
                        setShowDatePicker(false);
                        setLogDate(date);
                    }}
                    onCancel={() => setShowDatePicker(false)}
                />

                <DatePicker
                    modal
                    open={showFutureDatePicker}
                    date={futurePlanDate || new Date()}
                    mode="date"
                    onConfirm={(date) => {
                        setShowFutureDatePicker(false);
                        setFuturePlanDate(date);
                    }}
                    onCancel={() => setShowFutureDatePicker(false)}
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
    section: {
        marginBottom: theme.spacing.md
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semibold as any,
        color: theme.colors.white,
        marginBottom: theme.spacing.sm
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top'
    },
    inputRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.sm
    },
    flexInput: {
        flex: 1,
        marginBottom: 0
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderDark
    },
    listItemText: {
        flex: 1,
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.white
    },
    removeButton: {
        fontSize: theme.typography.fontSize.lg,
        color: theme.colors.gray500,
        paddingHorizontal: theme.spacing.sm
    },
    label: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium as any,
        color: theme.colors.white,
        marginBottom: theme.spacing.xs,
        marginTop: theme.spacing.sm
    },
    smallButton: {
        marginTop: theme.spacing.sm
    },
    planItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.glassDarkLight,
        borderRadius: theme.borderRadius.sm,
        marginTop: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.borderLight
    },
    planContent: {
        flex: 1
    },
    planTitle: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold as any,
        color: theme.colors.white,
        marginBottom: theme.spacing.xs
    },
    planDescription: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.gray400,
        marginBottom: theme.spacing.xs
    },
    planDate: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.gray300
    },
    saveButton: {
        marginTop: theme.spacing.lg
    }
});

export default DailyLogScreen;
