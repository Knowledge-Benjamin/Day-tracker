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
    Alert,
    Image
} from 'react-native';
import { launchImageLibrary, launchCamera, Asset } from 'react-native-image-picker';
import { v4 as uuidv4 } from 'uuid';
import { useDispatch, useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import DatePicker from 'react-native-date-picker';
import { format, startOfDay, parseISO, isAfter, isBefore } from 'date-fns';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootState } from '../store';
import { addLogOffline, setGoogleCalendarEventId, setFuturePlanEventId } from '../store/slices/dailyLogsSlice';
import { incrementPendingChanges } from '../store/slices/syncSlice';
import { googleCalendarService } from '../services/googleCalendarService';
import { GlassInput } from '../components/GlassInput';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { theme } from '../theme/theme';
import { RootStackParamList } from '../navigation/AppNavigator';

type DailyLogScreenRouteProp = RouteProp<RootStackParamList, 'DailyLog'>;

const DailyLogScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<DailyLogScreenRouteProp>();
    const { goalClientId } = route.params;
    const dispatch = useDispatch();

    const goal = useSelector((state: RootState) =>
        state.goals.goals.find(g => g.clientId === goalClientId)
    );
    const existingLogs = useSelector((state: RootState) =>
        state.dailyLogs.logs.filter(l => l.goalClientId === goalClientId && !l._deleted)
    );
    const { googleCalendarEnabled, isSignedIn, autoSync, calendarId } = useSelector(
        (state: RootState) => state.calendar
    );

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
    const [attachments, setAttachments] = useState<Array<{ fileName: string; filePath: string; fileType?: string; fileSize?: number }>>([]);

    const validateDate = (date: Date): boolean => {
        if (!goal) return false;

        const selectedDay = startOfDay(date);
        const today = startOfDay(new Date());
        const yesterday = startOfDay(new Date(today.getTime() - 24 * 60 * 60 * 1000));
        const goalStart = startOfDay(parseISO(goal.startDate));
        const goalEnd = startOfDay(new Date(goalStart.getTime() + goal.durationDays * 24 * 60 * 60 * 1000));

        if (isAfter(selectedDay, today)) {
            Alert.alert('Invalid Date', 'You cannot log future dates.');
            return false;
        }

        if (isBefore(selectedDay, goalStart) || isAfter(selectedDay, goalEnd)) {
            Alert.alert('Invalid Date', 'This date is outside your goal timeframe.');
            return false;
        }

        const existingLog = existingLogs.find(l => l.logDate === format(selectedDay, 'yyyy-MM-dd'));

        if (selectedDay.getTime() === today.getTime()) {
            return true;
        }

        if (selectedDay.getTime() === yesterday.getTime()) {
            if (!existingLog) {
                Alert.alert('Cannot Create', 'You can only edit yesterday\'s log if it was created yesterday.');
                return false;
            }
            return true;
        }

        Alert.alert('Invalid Date', 'You can only log for today, or edit yesterday\'s log if it exists.');
        return false;
    };

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

    const handleAddPhoto = () => {
        Alert.alert(
            'Add Photo',
            'Choose an option',
            [
                {
                    text: 'Camera',
                    onPress: () => {
                        launchCamera(
                            {
                                mediaType: 'photo',
                                quality: 0.8,
                                saveToPhotos: true
                            },
                            (response) => {
                                if (response.didCancel) return;
                                if (response.errorCode) {
                                    Alert.alert('Error', response.errorMessage || 'Failed to capture photo');
                                    return;
                                }
                                if (response.assets && response.assets.length > 0) {
                                    const asset = response.assets[0];
                                    setAttachments([...attachments, {
                                        fileName: asset.fileName || `photo_${Date.now()}.jpg`,
                                        filePath: asset.uri || '',
                                        fileType: asset.type,
                                        fileSize: asset.fileSize
                                    }]);
                                }
                            }
                        );
                    }
                },
                {
                    text: 'Gallery',
                    onPress: () => {
                        launchImageLibrary(
                            {
                                mediaType: 'photo',
                                quality: 0.8,
                                selectionLimit: 5
                            },
                            (response) => {
                                if (response.didCancel) return;
                                if (response.errorCode) {
                                    Alert.alert('Error', response.errorMessage || 'Failed to select photo');
                                    return;
                                }
                                if (response.assets && response.assets.length > 0) {
                                    const newAttachments = response.assets.map(asset => ({
                                        fileName: asset.fileName || `photo_${Date.now()}.jpg`,
                                        filePath: asset.uri || '',
                                        fileType: asset.type,
                                        fileSize: asset.fileSize
                                    }));
                                    setAttachments([...attachments, ...newAttachments]);
                                }
                            }
                        );
                    }
                },
                {
                    text: 'Cancel',
                    style: 'cancel'
                }
            ]
        );
    };

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleSaveLog = async () => {
        if (!validateDate(logDate)) {
            return;
        }

        if (!notes && activities.length === 0 && goodThings.length === 0) {
            Alert.alert('Empty Log', 'Please add at least some notes or an activity');
            return;
        }

        const clientId = uuidv4();
        const formattedDate = format(logDate, 'yyyy-MM-dd');

        dispatch(addLogOffline({
            clientId,
            goalClientId,
            logDate: formattedDate,
            notes: notes.trim() || undefined,
            activities,
            goodThings,
            futurePlans,
            attachments
        }));

        dispatch(incrementPendingChanges());

        // Google Calendar Sync
        if (googleCalendarEnabled && isSignedIn && autoSync && goal) {
            try {
                // Sync Daily Log
                const result = await googleCalendarService.createEvent(
                    goal.title,
                    formattedDate,
                    notes.trim() || undefined,
                    activities,
                    calendarId
                );

                if (result.success && result.eventId) {
                    dispatch(setGoogleCalendarEventId({
                        clientId,
                        eventId: result.eventId
                    }));
                } else if (result.error) {
                    console.error('Google Calendar Sync Failed:', result.error);
                }

                // Sync Future Plans
                if (futurePlans.length > 0) {
                    for (let index = 0; index < futurePlans.length; index++) {
                        const plan = futurePlans[index];
                        if (plan.plannedDate) {
                            try {
                                const planResult = await googleCalendarService.createEvent(
                                    `Plan: ${plan.title}`,
                                    plan.plannedDate,
                                    plan.description,
                                    [],
                                    calendarId
                                );

                                if (planResult.success && planResult.eventId) {
                                    dispatch(setFuturePlanEventId({
                                        clientId,
                                        planIndex: index,
                                        eventId: planResult.eventId
                                    }));
                                }
                            } catch (error) {
                                console.error('Future Plan Sync Error:', error);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Google Calendar Sync Error:', error);
            }
        }

        Alert.alert('Success', 'Daily log saved!', [
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

                        <GlassCard style={styles.section}>
                            <Text style={styles.sectionTitle}>Log Date</Text>
                            <GlassButton
                                title={format(logDate, 'EEEE, MMM dd, yyyy')}
                                onPress={() => setShowDatePicker(true)}
                                variant="secondary"
                            />
                        </GlassCard>

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

                        <GlassCard style={styles.section}>
                            <Text style={styles.sectionTitle}>Photos</Text>
                            <GlassButton
                                title="📷 Add Photo"
                                onPress={handleAddPhoto}
                                variant="secondary"
                                size="small"
                            />
                            {attachments.length > 0 && (
                                <View style={styles.photosContainer}>
                                    {attachments.map((attachment, index) => (
                                        <View key={index} style={styles.photoItem}>
                                            <Image
                                                source={{ uri: attachment.filePath }}
                                                style={styles.photoThumbnail}
                                                resizeMode="cover"
                                            />
                                            <TouchableOpacity
                                                style={styles.removePhotoButton}
                                                onPress={() => removeAttachment(index)}
                                            >
                                                <Text style={styles.removePhotoText}>✕</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}
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
    },
    photosContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: theme.spacing.sm,
        gap: theme.spacing.sm
    },
    photoItem: {
        position: 'relative',
        width: 100,
        height: 100,
        borderRadius: theme.borderRadius.sm,
        overflow: 'hidden'
    },
    photoThumbnail: {
        width: '100%',
        height: '100%'
    },
    removePhotoButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    removePhotoText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: theme.typography.fontWeight.bold as any
    }
});

export default DailyLogScreen;
