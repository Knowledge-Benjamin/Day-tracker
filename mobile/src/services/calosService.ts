import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CALOS_API_URL = 'https://calos-ai.onrender.com/api/ai';

export interface ChatMessage {
    message: string;
    sessionId?: string;
}

export interface ChatResponse {
    response: string;
    intent?: string;
    entities?: any;
    actionResult?: any;
    sessionId: string;
}

export interface TTSRequest {
    text: string;
}

export interface TTSResponse {
    audioUrl: string;
}

class CalosService {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: CALOS_API_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add auth token interceptor
        this.client.interceptors.request.use(async (config) => {
            const token = await AsyncStorage.getItem('access_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
    }

    /**
     * Send chat message to Calos
     */
    async chat(data: ChatMessage): Promise<ChatResponse> {
        const response = await this.client.post('/chat/message', data);
        return response.data.data;
    }

    /**
     * Get conversation history
     */
    async getHistory(sessionId?: string, limit: number = 50): Promise<any[]> {
        const response = await this.client.get('/chat/history', {
            params: { sessionId, limit },
        });
        return response.data.data;
    }

    /**
     * Create new chat session
     */
    async createSession(): Promise<string> {
        const response = await this.client.post('/chat/session');
        return response.data.data.sessionId;
    }

    /**
     * Text-to-Speech
     */
    async textToSpeech(data: TTSRequest): Promise<TTSResponse> {
        const response = await this.client.post('/voice/tts', data);
        return response.data.data;
    }

    /**
     * Check if Calos is reachable
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await axios.get('https://calos-ai.onrender.com/health', {
                timeout: 5000,
            });
            return response.data.status === 'ok';
        } catch {
            return false;
        }
    }
}

export default new CalosService();
