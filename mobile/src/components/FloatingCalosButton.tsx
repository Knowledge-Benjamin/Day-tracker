import React, { useEffect, useRef } from 'react';
import {
    TouchableOpacity,
    StyleSheet,
    Animated,
    View,
    Text,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { theme } from '../theme/theme';

interface Props {
    onPress: () => void;
}

const FloatingCalosButton: React.FC<Props> = ({ onPress }) => {
    const isConnected = useSelector((state: RootState) => state.calos.isConnected);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [pulseAnim]);

    return (
        <TouchableOpacity
            style={[
                styles.container,
                !isConnected && styles.disabled,
            ]}
            onPress={onPress}
            activeOpacity={0.7}
            disabled={!isConnected}
        >
            <Animated.View
                style={[
                    styles.button,
                    { transform: [{ scale: pulseAnim }] },
                ]}
            >
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>🤖</Text>
                </View>
            </Animated.View>
            {!isConnected && (
                <View style={styles.offlineIndicator} />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 90, // Above tab bar
        right: theme.spacing.lg,
        zIndex: 1000,
    },
    button: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: theme.colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.lg,
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        fontSize: 32,
    },
    disabled: {
        opacity: 0.5,
    },
    offlineIndicator: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#FF4444',
        borderWidth: 2,
        borderColor: theme.colors.white,
    },
});

export default FloatingCalosButton;
