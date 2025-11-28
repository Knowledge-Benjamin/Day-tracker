import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ViewStyle,
    TextStyle,
    ActivityIndicator
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { theme } from '../theme/theme';

interface GlassButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    style,
    textStyle
}) => {
    const buttonStyles = [
        styles.button,
        styles[`button_${size}`],
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'outline' && styles.buttonOutline,
        (disabled || loading) && styles.buttonDisabled,
        style
    ];

    const textStyles = [
        styles.text,
        styles[`text_${size}`],
        variant === 'primary' && styles.textPrimary,
        variant === 'secondary' && styles.textSecondary,
        variant === 'outline' && styles.textOutline,
        textStyle
    ];

    return (
        <TouchableOpacity
            style={buttonStyles}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {variant !== 'outline' && (
                <BlurView
                    style={styles.blur}
                    blurType="dark"
                    blurAmount={10}
                    reducedTransparencyFallbackColor={theme.colors.gray800}
                />
            )}
            {loading ? (
                <ActivityIndicator color={theme.colors.white} />
            ) : (
                <Text style={textStyles}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.sm
    },
    button_small: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md
    },
    button_medium: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg
    },
    button_large: {
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.xl
    },
    buttonPrimary: {
        backgroundColor: theme.colors.white,
    },
    buttonSecondary: {
        ...theme.glassmorphism.medium,
    },
    buttonOutline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.colors.white
    },
    buttonDisabled: {
        opacity: 0.5
    },
    blur: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
    },
    text: {
        fontWeight: theme.typography.fontWeight.semibold as any
    },
    text_small: {
        fontSize: theme.typography.fontSize.sm
    },
    text_medium: {
        fontSize: theme.typography.fontSize.md
    },
    text_large: {
        fontSize: theme.typography.fontSize.lg
    },
    textPrimary: {
        color: theme.colors.black
    },
    textSecondary: {
        color: theme.colors.white
    },
    textOutline: {
        color: theme.colors.white
    }
});
