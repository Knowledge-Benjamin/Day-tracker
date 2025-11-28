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
import { setCredentials } from '../store/slices/authSlice';

const RegisterScreen = ({ navigation }: any) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const handleRegister = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Email and password are required');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.register(email, password, name || undefined);
            const { user, accessToken, refreshToken } = response.data.data;

            dispatch(setCredentials({ user, accessToken, refreshToken }));
            navigation.replace('Main');
        } catch (error: any) {
            Alert.alert('Registration Failed', error.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
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
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Start your journey today</Text>
                    </View>

                    <View style={styles.form}>
                        <GlassInput
                            label="Name (Optional)"
                            placeholder="Enter your name"
                            value={name}
                            onChangeText={setName}
                        />
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
                            placeholder="Enter your password (min 6 characters)"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <GlassButton
                            title="Register"
                            onPress={handleRegister}
                            variant="primary"
                            size="large"
                            loading={loading}
                            style={styles.registerButton}
                        />

                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text style={styles.link}>Already have an account? Login</Text>
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
    registerButton: {
        marginTop: theme.spacing.lg
    },
    link: {
        color: theme.colors.white,
        textAlign: 'center',
        marginTop: theme.spacing.lg,
        fontSize: theme.typography.fontSize.sm
    }
});

export default RegisterScreen;
