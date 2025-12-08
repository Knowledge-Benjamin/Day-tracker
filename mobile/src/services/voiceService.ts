import Voice, {
    SpeechResultsEvent,
    SpeechErrorEvent,
} from '@react-native-voice/voice';
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';
import { PermissionsAndroid, Platform } from 'react-native';

class VoiceService {
    private sound: Sound | null = null;
    private audioCache: Map<string, string> = new Map();

    constructor() {
        Voice.onSpeechResults = this.onSpeechResults.bind(this);
        Voice.onSpeechError = this.onSpeechError.bind(this);
    }

    private onSpeechResults(e: SpeechResultsEvent) {
        // Handled by component callbacks
    }

    private onSpeechError(e: SpeechErrorEvent) {
        // Handled by component callbacks
    }

    /**
     * Request microphone permission
     */
    async requestMicrophonePermission(): Promise<boolean> {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true; // iOS handles via Info.plist
    }

    /**
     * Start voice recognition
     */
    async startRecording(
        onResults: (results: string[]) => void,
        onError: (error: any) => void
    ): Promise<void> {
        try {
            Voice.onSpeechResults = (e: SpeechResultsEvent) => {
                if (e.value) {
                    onResults(e.value);
                }
            };
            Voice.onSpeechError = (e: SpeechErrorEvent) => {
                onError(e.error);
            };

            await Voice.start('en-US');
        } catch (error) {
            onError(error);
        }
    }

    /**
     * Stop voice recognition
     */
    async stopRecording(): Promise<void> {
        try {
            await Voice.stop();
        } catch (error) {
            console.error('Error stopping voice:', error);
        }
    }

    /**
     * Cancel voice recognition
     */
    async cancelRecording(): Promise<void> {
        try {
            await Voice.cancel();
        } catch (error) {
            console.error('Error canceling voice:', error);
        }
    }

    /**
     * Play audio from URL (WAV from Calos)
     */
    async playAudio(
        audioUrl: string,
        onComplete: () => void,
        onError: (error: any) => void
    ): Promise<void> {
        try {
            // Check cache first
            let localPath = this.audioCache.get(audioUrl);

            if (!localPath) {
                // Download and cache
                const filename = audioUrl.split('/').pop() || `audio_${Date.now()}.wav`;
                localPath = `${RNFS.CachesDirectoryPath}/${filename}`;

                await RNFS.downloadFile({
                    fromUrl: audioUrl,
                    toFile: localPath,
                }).promise;

                this.audioCache.set(audioUrl, localPath);
            }

            // Play audio
            this.sound = new Sound(localPath, '', (error) => {
                if (error) {
                    onError(error);
                    return;
                }

                this.sound?.play((success) => {
                    if (success) {
                        onComplete();
                    } else {
                        onError(new Error('Playback failed'));
                    }
                    this.sound?.release();
                    this.sound = null;
                });
            });
        } catch (error) {
            onError(error);
        }
    }

    /**
     * Stop audio playback
     */
    stopAudio(): void {
        if (this.sound) {
            this.sound.stop(() => {
                this.sound?.release();
                this.sound = null;
            });
        }
    }

    /**
     * Clear audio cache
     */
    async clearCache(): Promise<void> {
        try {
            const files = await RNFS.readDir(RNFS.CachesDirectoryPath);
            const audioFiles = files.filter(file => file.name.endsWith('.wav'));

            await Promise.all(
                audioFiles.map(file => RNFS.unlink(file.path))
            );

            this.audioCache.clear();
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }

    /**
     * Cleanup
     */
    async destroy(): Promise<void> {
        await Voice.destroy();
        this.stopAudio();
    }
}

export default new VoiceService();
