import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import NetInfo from '@react-native-community/netinfo';
import { RootState } from '../store';
import {
    addMessage,
    setConnected,
    setRecording,
    setSending,
    setPlaying,
    setSessionId,
    setPermissions,
    Message,
} from '../store/slices/calosSlice';
import calosService from '../services/calosService';
import voiceService from '../services/voiceService';
import { GlassCard } from '../components/GlassCard';
import { theme } from '../theme/theme';
import VoiceWaveform from '../components/VoiceWaveform';

const CalosScreen = () => {
    const dispatch = useDispatch();
    const {
        sessionId,
        messages,
        isConnected,
        isRecording,
        isSending,
        isPlaying,
        permissionsGranted,
    } = useSelector((state: RootState) => state.calos);

    const [inputText, setInputText] = useState('');
    const [transcribedText, setTranscribedText] = useState('');
    const flatListRef = useRef<FlatList>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        initializeSession();
        checkNetworkStatus();
        loadConversationHistory();

        return () => {
            voiceService.destroy();
        };
    }, []);

    const checkNetworkStatus = () => {
        const unsubscribe = NetInfo.addEventListener(state => {
            dispatch(setConnected(state.isConnected ?? false));
        });
        return unsubscribe;
    };

    const initializeSession = async () => {
        if (!sessionId) {
            try {
                const newSessionId = await calosService.createSession();
                dispatch(setSessionId(newSessionId));
            } catch (error) {
                console.error('Error creating session:', error);
            }
        }
    };

    const loadConversationHistory = async () => {
        if (!sessionId) return;
        try {
            const history = await calosService.getHistory(sessionId);
            // Convert to Message format and dispatch if needed
        } catch (error) {
            console.error('Error loading history:', error);
        }
    };

    const handleStartVoiceRecording = async () => {
        if (!isConnected) {
            Alert.alert('Offline', 'Calos needs internet connection');
            return;
        }

        if (!permissionsGranted.microphone) {
            const granted = await voiceService.requestMicrophonePermission();
            dispatch(setPermissions({ microphone: granted }));
            if (!granted) {
                Alert.alert('Permission Denied', 'Microphone permission is required for voice interaction');
                return;
            }
        }

        dispatch(setRecording(true));
        setTranscribedText('');

        await voiceService.startRecording(
            (results) => {
                if (results && results.length > 0) {
                    const text = results[0];
                    setTranscribedText(text);

                    // Auto-stop after 2 seconds of silence
                    if (silenceTimerRef.current) {
                        clearTimeout(silenceTimerRef.current);
                    }
                    silenceTimerRef.current = setTimeout(() => {
                        handleStopVoiceRecording();
                    }, 2000);
                }
            },
            (error) => {
                console.error('Voice error:', error);
                dispatch(setRecording(false));
                Alert.alert('Voice Error', 'Failed to transcribe audio');
            }
        );
    };

    const handleStopVoiceRecording = async () => {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
        }

        await voiceService.stopRecording();
        dispatch(setRecording(false));

        if (transcribedText.trim()) {
            // Send transcribed text to Calos
            await sendMessage(transcribedText, true);
        }
    };

    const sendMessage = async (text: string, isVoice: boolean = false) => {
        if (!text.trim() || !isConnected) return;

        dispatch(setSending(true));

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: text,
            timestamp: new Date().toISOString(),
        };
        dispatch(addMessage(userMessage));

        try {
            // Send to Calos
            const response = await calosService.chat({
                message: text,
                sessionId: sessionId || undefined,
            });

            // Add assistant message
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: response.response,
                timestamp: new Date().toISOString(),
                intent: response.intent,
                actionResult: response.actionResult,
            };

            // If voice input, get TTS response
            if (isVoice) {
                const ttsResponse = await calosService.textToSpeech({
                    text: response.response,
                });
                assistantMessage.audioUrl = ttsResponse.audioUrl;

                // Play audio
                playAudio(ttsResponse.audioUrl);
            }

            dispatch(addMessage(assistantMessage));
            setInputText('');
            setTranscribedText('');

            // Scroll to bottom
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (error) {
            console.error('Error sending message:', error);
            Alert.alert('Error', 'Failed to send message');
        } finally {
            dispatch(setSending(false));
        }
    };

    const playAudio = async (audioUrl: string) => {
        dispatch(setPlaying(true));

        await voiceService.playAudio(
            audioUrl,
            () => {
                dispatch(setPlaying(false));
            },
            (error) => {
                console.error('Audio playback error:', error);
                dispatch(setPlaying(false));
            }
        );
    };

    const renderMessage = ({ item }: { item: Message }) => (
        <View
            style={[
                styles.messageContainer,
                item.type === 'user' ? styles.userMessage : styles.assistantMessage,
            ]}
        >
            <GlassCard
                style={StyleSheet.flatten([
                    styles.messageBubble,
                    item.type === 'user' ? styles.userBubble : undefined,
                ])}
            >
                <Text style={styles.messageText}>{item.content}</Text>
                {item.audioUrl && (
                    <TouchableOpacity
                        style={styles.audioButton}
                        onPress={() => playAudio(item.audioUrl!)}
                        disabled={isPlaying}
                    >
                        <Text style={styles.audioButtonText}>
                            {isPlaying ? '⏸ Playing...' : '🔊 Listen'}
                        </Text>
                    </TouchableOpacity>
                )}
                {item.actionResult && (
                    <View style={styles.actionResultContainer}>
                        <Text style={styles.actionResultText}>
                            ✅ Action completed
                        </Text>
                    </View>
                )}
            </GlassCard>
        </View>
    );

    return (
        <LinearGradient
            colors={[theme.colors.gray900, theme.colors.black]}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                {!isConnected && (
                    <GlassCard style={styles.offlineBanner}>
                        <Text style={styles.offlineText}>
                            ⚠️ Calos needs internet connection
                        </Text>
                    </GlassCard>
                )}

                <View style={styles.header}>
                    <Text style={styles.title}>Calos AI</Text>
                    <Text style={styles.subtitle}>Your Day Tracker Assistant</Text>
                </View>

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messagesList}
                    showsVerticalScrollIndicator={false}
                />

                {isRecording && (
                    <View style={styles.recordingContainer}>
                        <VoiceWaveform isActive={isRecording} />
                        <Text style={styles.transcribedText}>
                            {transcribedText || 'Listening...'}
                        </Text>
                    </View>
                )}

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.inputContainer}
                >
                    <GlassCard style={styles.inputCard}>
                        <TextInput
                            style={styles.textInput}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Type a message..."
                            placeholderTextColor={theme.colors.gray500}
                            multiline
                            editable={!isSending && isConnected}
                        />
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[
                                    styles.voiceButton,
                                    isRecording && styles.voiceButtonActive,
                                    !isConnected && styles.buttonDisabled,
                                ]}
                                onPress={isRecording ? handleStopVoiceRecording : handleStartVoiceRecording}
                                disabled={!isConnected || isSending}
                            >
                                <Text style={styles.voiceButtonText}>
                                    {isRecording ? '⏹' : '🎤'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.sendButton,
                                    !inputText.trim() && styles.buttonDisabled,
                                ]}
                                onPress={() => sendMessage(inputText, false)}
                                disabled={!inputText.trim() || isSending || !isConnected}
                            >
                                {isSending ? (
                                    <ActivityIndicator color={theme.colors.white} size="small" />
                                ) : (
                                    <Text style={styles.sendButtonText}>Send</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </GlassCard>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    offlineBanner: {
        margin: theme.spacing.md,
        padding: theme.spacing.sm,
        backgroundColor: 'rgba(255, 0, 0, 0.2)',
    },
    offlineText: {
        color: theme.colors.white,
        textAlign: 'center',
        fontSize: theme.typography.fontSize.sm,
    },
    header: {
        padding: theme.spacing.lg,
        alignItems: 'center',
    },
    title: {
        fontSize: theme.typography.fontSize.xxl,
        fontWeight: theme.typography.fontWeight.bold as any,
        color: theme.colors.white,
    },
    subtitle: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.gray400,
    },
    messagesList: {
        padding: theme.spacing.md,
    },
    messageContainer: {
        marginBottom: theme.spacing.md,
    },
    userMessage: {
        alignItems: 'flex-end',
    },
    assistantMessage: {
        alignItems: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%',
        padding: theme.spacing.md,
    },
    userBubble: {
        backgroundColor: theme.colors.white,
    },
    messageText: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.white,
    },
    audioButton: {
        marginTop: theme.spacing.sm,
        padding: theme.spacing.xs,
        backgroundColor: theme.colors.glassLight,
        borderRadius: theme.borderRadius.sm,
    },
    audioButtonText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.white,
    },
    actionResultContainer: {
        marginTop: theme.spacing.xs,
        padding: theme.spacing.xs,
        backgroundColor: theme.colors.glassLight,
        borderRadius: theme.borderRadius.sm,
    },
    actionResultText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.gray300,
    },
    recordingContainer: {
        padding: theme.spacing.lg,
        alignItems: 'center',
    },
    transcribedText: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.white,
        marginTop: theme.spacing.sm,
        textAlign: 'center',
    },
    inputContainer: {
        padding: theme.spacing.md,
    },
    inputCard: {
        padding: theme.spacing.md,
    },
    textInput: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.white,
        maxHeight: 100,
        marginBottom: theme.spacing.sm,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    voiceButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    voiceButtonActive: {
        backgroundColor: '#FF4444',
    },
    voiceButtonText: {
        fontSize: 24,
    },
    sendButton: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    sendButtonText: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semibold as any,
        color: theme.colors.black,
    },
});

export default CalosScreen;
