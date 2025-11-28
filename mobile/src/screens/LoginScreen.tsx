import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    Alert
} from 'react-native';
import { useDispatch } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import { GlassInput } from '../components/GlassInput';
import { GlassButton } from '../components/GlassButton';
import { theme } from '../theme/theme';
import { authAPI } from '../services/api';
import { setCredentials, setLoading, setError } from '../store/slices/authSlice';

const LoginScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoadingState] = useState(false);
    const dispatch = useDispatch();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoadingState(true);
        try {
            const response = await authAPI.login(email, password);
            const { user, accessToken, refreshToken } = response.data.data;

            dispatch(setCredentials({ user, accessToken, refreshToken }));
            navigation.replace('Main');
        } catch (error: any) {
            Alert.alert('Login Failed', error.response?.data?.message || 'Something went wrong');
        } finally {
            setLoadingState(false);
        }
    };

    return (
        <LinearGradient
            colors={[theme.colors.gray900, theme.colors.black]}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.content}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Day Tracker</Text>
                        <Text style={styles.subtitle}>Track your 3650-day journey</Text>
                    </View>

                    <View style={styles.form}>
                        <GlassInput
                            label="Email"
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <GlassInput
                            label="Password"
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <GlassButton
                            title="Login"
                            onPress={handleLogin}
                            variant="primary"
                            size="large"
                            loading={loading}
                            style={styles.loginButton}
                        />

                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.link}>Don't have an account? Register</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
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
        paddingHorizontal: theme.spacing.lg
    },
    header: {
        marginTop: theme.spacing.xxxl,
        marginBottom: theme.spacing.xxl
    },
    title: {
        fontSize: theme.typography.fontSize.xxxl,
        fontWeight: theme.typography.fontWeight.bold as any,
        color: theme.colors.white,
        marginBottom: theme.spacing.sm
    },
    subtitle: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.gray400
    },
    form: {
        flex: 1
    },
    loginButton: {
        marginTop: theme.spacing.lg
    },
    link: {
        color: theme.colors.white,
        textAlign: 'center',
        marginTop: theme.spacing.lg,
        fontSize: theme.typography.fontSize.sm
    }
});

export default LoginScreen;
