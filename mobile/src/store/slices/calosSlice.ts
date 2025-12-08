import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Message {
    id: string;
    type: 'user' | 'assistant';
    content: string;
    audioUrl?: string;
    timestamp: string;
    intent?: string;
    actionResult?: any;
}

export interface CalosState {
    sessionId: string | null;
    messages: Message[];
    isConnected: boolean;
    isRecording: boolean;
    isPlaying: boolean;
    isTranscribing: boolean;
    isSending: boolean;
    currentAudioUrl: string | null;
    preferences: {
        voiceFirst: boolean;
        proactiveGreetings: boolean;
        morningGreetingTime: string;
    };
    permissionsGranted: {
        microphone: boolean;
        notifications: boolean;
    };
}

const initialState: CalosState = {
    sessionId: null,
    messages: [],
    isConnected: true,
    isRecording: false,
    isPlaying: false,
    isTranscribing: false,
    isSending: false,
    currentAudioUrl: null,
    preferences: {
        voiceFirst: true,
        proactiveGreetings: true,
        morningGreetingTime: '08:00',
    },
    permissionsGranted: {
        microphone: false,
        notifications: false,
    },
};

const calosSlice = createSlice({
    name: 'calos',
    initialState,
    reducers: {
        setSessionId: (state, action: PayloadAction<string>) => {
            state.sessionId = action.payload;
        },
        addMessage: (state, action: PayloadAction<Message>) => {
            state.messages.push(action.payload);
        },
        setMessages: (state, action: PayloadAction<Message[]>) => {
            state.messages = action.payload;
        },
        clearMessages: (state) => {
            state.messages = [];
            state.sessionId = null;
        },
        setConnected: (state, action: PayloadAction<boolean>) => {
            state.isConnected = action.payload;
        },
        setRecording: (state, action: PayloadAction<boolean>) => {
            state.isRecording = action.payload;
        },
        setPlaying: (state, action: PayloadAction<boolean>) => {
            state.isPlaying = action.payload;
        },
        setTranscribing: (state, action: PayloadAction<boolean>) => {
            state.isTranscribing = action.payload;
        },
        setSending: (state, action: PayloadAction<boolean>) => {
            state.isSending = action.payload;
        },
        setCurrentAudioUrl: (state, action: PayloadAction<string | null>) => {
            state.currentAudioUrl = action.payload;
        },
        updatePreferences: (state, action: PayloadAction<Partial<CalosState['preferences']>>) => {
            state.preferences = { ...state.preferences, ...action.payload };
        },
        setPermissions: (state, action: PayloadAction<Partial<CalosState['permissionsGranted']>>) => {
            state.permissionsGranted = { ...state.permissionsGranted, ...action.payload };
        },
    },
});

export const {
    setSessionId,
    addMessage,
    setMessages,
    clearMessages,
    setConnected,
    setRecording,
    setPlaying,
    setTranscribing,
    setSending,
    setCurrentAudioUrl,
    updatePreferences,
    setPermissions,
} = calosSlice.actions;

export default calosSlice.reducer;
