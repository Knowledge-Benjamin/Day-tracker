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
            // Conversion logic would go here
        } catch (error) {
            console.error('Error loading history:', error);
        }
    };

    const handleStartVoiceRecording = async () => {
        if (!isConnected) {
            Alert.alert('Offline', 'Calos needs internet connection');
            return;
        }

        try {
            if (!permissionsGranted.microphone) {
                const granted = await voiceService.requestMicrophonePermission();
                dispatch(setPermissions({ microphone: granted }));
                if (!granted) {
                    Alert.alert('Permission Denied', 'Microphone permission is required');
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

                        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                        silenceTimerRef.current = setTimeout(() => {
                            handleStopVoiceRecording();
                        }, 2000);
                    }
                },
                (error) => {
                    console.error('Voice error detail:', error);
                    dispatch(setRecording(false));
                    // Don't alert if it's just a cancel or no match
                    if (error.error?.code !== '7' && error.error?.code !== '5') {
                        Alert.alert('Voice Error', `Failed to listen: ${error.message || 'Unknown error'}`);
                    }
                }
            );
        } catch (e: any) {
            console.error('Start recording warning:', e);
            Alert.alert('Error', e.message);
        }
    };

    const handleStopVoiceRecording = async () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        await voiceService.stopRecording();
        dispatch(setRecording(false));

        if (transcribedText.trim()) {
            await sendMessage(transcribedText, true);
        }
    };

    const sendMessage = async (text: string, isVoice: boolean = false) => {
        if (!text.trim() || !isConnected) return;

        dispatch(setSending(true));

        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: text,
            timestamp: new Date().toISOString(),
        };
        dispatch(addMessage(userMessage));

        try {
            const response = await calosService.chat({
                message: text,
                sessionId: sessionId || undefined,
            });

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: response.response,
                timestamp: new Date().toISOString(),
                intent: response.intent,
                actionResult: response.actionResult,
            };

            if (isVoice) {
                try {
                    const ttsResponse = await calosService.textToSpeech({
                        text: response.response,
                    });
                    assistantMessage.audioUrl = ttsResponse.audioUrl;
                    playAudio(ttsResponse.audioUrl);
                } catch (e) {
                    console.warn('TTS failed but chat worked:', e);
                }
            }

            dispatch(addMessage(assistantMessage));
            setInputText('');
            setTranscribedText('');

            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);

        } catch (error: any) {
            console.error('Send message error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to connect';
            Alert.alert('Error', `Failed to send: ${errorMessage}`);
        } finally {
            dispatch(setSending(false));
        }
    };

    const playAudio = async (audioUrl: string) => {
        dispatch(setPlaying(true));
        await voiceService.playAudio(
            audioUrl,
            () => dispatch(setPlaying(false)),
            (error) => {
                console.error('Playback error:', error);
                dispatch(setPlaying(false));
            }
        );
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.type === 'user';
        return (
            <View style={[
                styles.messageContainer,
                isUser ? styles.userMessage : styles.assistantMessage,
            ]}>
                <GlassCard
                    style={StyleSheet.flatten([
                        styles.messageBubble,
                        isUser ? styles.userBubble : styles.assistantBubble,
                    ])}
                    intensity={isUser ? 'light' : 'medium'}
                >
                    <Text style={[
                        styles.messageText,
                        isUser ? styles.userMessageText : styles.assistantMessageText
                    ]}>{item.content}</Text>

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
                            <Text style={styles.actionResultText}>✅ Done</Text>
                        </View>
                    )}
                </GlassCard>
            </View>
        );
    };

    return (
        <LinearGradient
            colors={[theme.colors.gray900, theme.colors.black]}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                {!isConnected && (
                    <View style={styles.offlineBanner}>
                        <Text style={styles.offlineText}>⚠️ Offline Mode</Text>
                    </View>
                )}

                <View style={styles.header}>
                    <Text style={styles.title}>Calos AI</Text>
                </View>

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messagesList}
                    showsVerticalScrollIndicator={false}
                />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                    style={styles.keyboardAvoid}
                >
                    <View style={styles.inputWrapper}>
                        {isRecording && (
                            <View style={styles.recordingFeedback}>
                                <VoiceWaveform isActive={isRecording} />
                                <Text style={styles.transcribedText}>
                                    {transcribedText || 'Listening...'}
                                </Text>
                            </View>
                        )}

                        <GlassCard style={styles.inputCard} intensity="heavy">
                            <TextInput
                                style={styles.textInput}
                                value={inputText}
                                onChangeText={setInputText}
                                placeholder="Ask Calos..."
                                placeholderTextColor={theme.colors.gray500}
                                multiline
                                editable={!isSending && isConnected}
                            />
                            <View style={styles.controlsRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.iconButton,
                                        isRecording && styles.recordingActive,
                                        (!isConnected || isSending) && styles.disabled
                                    ]}
                                    onPress={isRecording ? handleStopVoiceRecording : handleStartVoiceRecording}
                                    disabled={!isConnected || isSending}
                                >
                                    <Text style={styles.iconText}>
                                        {isRecording ? '⏹' : '🎤'}
                                    </Text>
                                </TouchableOpacity>

                                {inputText.trim().length > 0 && (
                                    <TouchableOpacity
                                        style={[styles.sendButton, isSending && styles.disabled]}
                                        onPress={() => sendMessage(inputText, false)}
                                        disabled={isSending || !isConnected}
                                    >
                                        {isSending ? (
                                            <ActivityIndicator color={theme.colors.black} size="small" />
                                        ) : (
                                            <Text style={styles.sendButtonText}>→</Text>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>
                        </GlassCard>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: {
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.white,
    },
    offlineBanner: {
        backgroundColor: '#FF4444',
        padding: 4,
        alignItems: 'center',
    },
    offlineText: { color: 'white', fontSize: 12 },
    messagesList: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    messageContainer: {
        marginVertical: 4,
        width: '100%',
    },
    userMessage: { alignItems: 'flex-end' },
    assistantMessage: { alignItems: 'flex-start' },
    messageBubble: {
        padding: 12,
        borderRadius: 16,
        maxWidth: '85%',
    },
    userBubble: {
        backgroundColor: theme.colors.white,
        borderBottomRightRadius: 4,
    },
    assistantBubble: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderBottomLeftRadius: 4,
    },
    messageText: { fontSize: 16, lineHeight: 22 },
    userMessageText: { color: theme.colors.black },
    assistantMessageText: { color: theme.colors.white },

    keyboardAvoid: {
        width: '100%',
    },
    inputWrapper: {
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    },
    recordingFeedback: {
        alignItems: 'center',
        marginBottom: 10,
    },
    transcribedText: {
        color: theme.colors.gray300,
        marginTop: 8,
        fontStyle: 'italic',
    },
    inputCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 24,
        paddingHorizontal: 16,
    },
    textInput: {
        flex: 1,
        color: theme.colors.white,
        fontSize: 16,
        maxHeight: 100,
        paddingVertical: 8,
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordingActive: {
        backgroundColor: '#FF4444',
    },
    iconText: { fontSize: 20 },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.black,
    },
    disabled: { opacity: 0.5 },

    audioButton: {
        marginTop: 8,
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: 8,
        borderRadius: 8,
    },
    audioButtonText: { color: 'white', fontSize: 12 },
    actionResultContainer: {
        marginTop: 4,
        padding: 4,
        backgroundColor: 'rgba(0,255,0,0.1)',
        borderRadius: 4,
    },
    actionResultText: { color: '#4ADE80', fontSize: 10 },
});

export default CalosScreen;
