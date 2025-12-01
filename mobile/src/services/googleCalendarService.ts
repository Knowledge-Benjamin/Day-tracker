import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { API_BASE_URL } from '@env';
import { store } from '../store';
import { setSignedIn, setLastSyncTime } from '../store/slices/calendarSlice';

interface CalendarEvent {
    summary: string;
    description?: string;
    start: { date: string } | { dateTime: string };
    end: { date: string } | { dateTime: string };
    colorId?: string;
}

class GoogleCalendarService {
    private accessToken: string | null = null;
    private isConfigured: boolean = false;

    /**
     * Initialize Google Sign-In
     * USER MUST: Provide webClientId from Google Cloud Console
     */
    async configure(webClientId: string) {
        try {
            GoogleSignin.configure({
                webClientId: webClientId,
                offlineAccess: true,
                scopes: [
                    'https://www.googleapis.com/auth/calendar',
                    'https://www.googleapis.com/auth/calendar.events'
                ]
            });
            this.isConfigured = true;
            console.log('Google Calendar configured successfully');
        } catch (error) {
            console.error('Error configuring Google Sign-In:', error);
            throw error;
        }
    }

    /**
     * Sign in and get access token
     */
    async signIn(): Promise<boolean> {
        try {
            if (!this.isConfigured) {
                throw new Error('Google Calendar not configured. Call configure() first.');
            }

            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            const tokens = await GoogleSignin.getTokens();

            this.accessToken = tokens.accessToken;
            await AsyncStorage.setItem('google_calendar_token', tokens.accessToken);
            await AsyncStorage.setItem('google_calendar_refresh_token', tokens.idToken || '');

            store.dispatch(setSignedIn(true));
            console.log('Google Calendar signed in successfully');
            return true;
        } catch (error) {
            console.error('Error signing in to Google Calendar:', error);
            return false;
        }
    }

    /**
     * Sign out
     */
    async signOut() {
        try {
            await GoogleSignin.signOut();
            this.accessToken = null;
            await AsyncStorage.removeItem('google_calendar_token');
            await AsyncStorage.removeItem('google_calendar_refresh_token');
            store.dispatch(setSignedIn(false));
            console.log('Google Calendar signed out');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    }

    /**
     * Check if user is signed in
     */
    async isSignedIn(): Promise<boolean> {
        try {
            const userInfo = await GoogleSignin.getCurrentUser();
            if (userInfo) {
                const tokens = await GoogleSignin.getTokens();
                this.accessToken = tokens.accessToken;
                store.dispatch(setSignedIn(true));
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get stored access token
     */
    private async getAccessToken(): Promise<string | null> {
        try {
            // Try to get fresh tokens from GoogleSignin
            // This handles expiration automatically
            const tokens = await GoogleSignin.getTokens();
            this.accessToken = tokens.accessToken;
            await AsyncStorage.setItem('google_calendar_token', tokens.accessToken);
            return tokens.accessToken;
        } catch (error) {
            // Fallback to stored token if GoogleSignin fails (e.g. network error)
            if (this.accessToken) return this.accessToken;

            const stored = await AsyncStorage.getItem('google_calendar_token');
            if (stored) {
                this.accessToken = stored;
                return stored;
            }
        }

        return null;
    }

    /**
     * Create a calendar event
     */
    async createEvent(
        goalTitle: string,
        logDate: string,
        notes?: string,
        activities?: string[],
        calendarId: string = 'primary'
    ): Promise<{ success: boolean; eventId?: string; error?: string }> {
        try {
            const token = await this.getAccessToken();
            if (!token) {
                return { success: false, error: 'Not authenticated' };
            }

            const description = this.buildEventDescription(notes, activities);

            const event: CalendarEvent = {
                summary: `Day Tracker: ${goalTitle}`,
                description,
                start: { date: logDate },
                end: { date: logDate },
                colorId: '2' // Sage green
            };

            const response = await axios.post(
                `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
                event,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            store.dispatch(setLastSyncTime(new Date().toISOString()));
            console.log('Calendar event created:', response.data.id);
            return { success: true, eventId: response.data.id };
        } catch (error: any) {
            console.error('Error creating calendar event:', error);
            return {
                success: false,
                error: error.response?.data?.error?.message || 'Failed to create event'
            };
        }
    }

    /**
     * Update an existing calendar event
     */
    async updateEvent(
        eventId: string,
        goalTitle: string,
        logDate: string,
        notes?: string,
        activities?: string[],
        calendarId: string = 'primary'
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const token = await this.getAccessToken();
            if (!token) {
                return { success: false, error: 'Not authenticated' };
            }

            const description = this.buildEventDescription(notes, activities);

            const event: CalendarEvent = {
                summary: `Day Tracker: ${goalTitle}`,
                description,
                start: { date: logDate },
                end: { date: logDate },
                colorId: '2'
            };

            await axios.put(
                `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
                event,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            store.dispatch(setLastSyncTime(new Date().toISOString()));
            console.log('Calendar event updated:', eventId);
            return { success: true };
        } catch (error: any) {
            console.error('Error updating calendar event:', error);
            return {
                success: false,
                error: error.response?.data?.error?.message || 'Failed to update event'
            };
        }
    }

    /**
     * Delete a calendar event
     */
    async deleteEvent(
        eventId: string,
        calendarId: string = 'primary'
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const token = await this.getAccessToken();
            if (!token) {
                return { success: false, error: 'Not authenticated' };
            }

            await axios.delete(
                `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            store.dispatch(setLastSyncTime(new Date().toISOString()));
            console.log('Calendar event deleted:', eventId);
            return { success: true };
        } catch (error: any) {
            console.error('Error deleting calendar event:', error);
            return {
                success: false,
                error: error.response?.data?.error?.message || 'Failed to delete event'
            };
        }
    }

    /**
     * Build event description from notes and activities
     */
    private buildEventDescription(notes?: string, activities?: string[]): string {
        let description = '';

        if (notes) {
            description += `📝 Notes:\n${notes}\n\n`;
        }

        if (activities && activities.length > 0) {
            description += `✅ Activities:\n`;
            activities.forEach(activity => {
                description += `• ${activity}\n`;
            });
        }

        if (!description) {
            description = 'Daily log entry from Day Tracker app';
        }

        return description.trim();
    }

    /**
     * List upcoming events
     */
    async listEvents(
        maxResults: number = 10,
        calendarId: string = 'primary'
    ): Promise<{ success: boolean; events?: any[]; error?: string }> {
        try {
            const token = await this.getAccessToken();
            if (!token) {
                return { success: false, error: 'Not authenticated' };
            }

            const response = await axios.get(
                `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    params: {
                        maxResults,
                        orderBy: 'startTime',
                        singleEvents: true,
                        timeMin: new Date().toISOString()
                    }
                }
            );

            return { success: true, events: response.data.items || [] };
        } catch (error: any) {
            console.error('Error listing calendar events:', error);
            return {
                success: false,
                error: error.response?.data?.error?.message || 'Failed to list events'
            };
        }
    }
}

export const googleCalendarService = new GoogleCalendarService();
