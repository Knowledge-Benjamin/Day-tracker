import React from 'react';
import {
    TextInput,
    View,
    Text,
    StyleSheet,
    TextInputProps,
    ViewStyle
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { theme } from '../theme/theme';

interface GlassInputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
}

export const GlassInput: React.FC<GlassInputProps> = ({
    label,
    error,
    containerStyle,
    style,
    ...props
}) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[styles.inputContainer, error && styles.inputError]}>
                <BlurView
                    style={styles.blur}
                    blurType="dark"
                    blurAmount={10}
                    reducedTransparencyFallbackColor={theme.colors.gray800}
                />
                <TextInput
                    style={[styles.input, style]}
                    placeholderTextColor={theme.colors.gray400}
                    {...props}
                />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.md
    },
    label: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium as any,
        color: theme.colors.white,
        marginBottom: theme.spacing.xs
    },
    inputContainer: {
        borderRadius: theme.borderRadius.md,
        overflow: 'hidden',
        ...theme.glassmorphism.medium,
        minHeight: 50
    },
    inputError: {
        borderColor: '#FF6B6B',
        borderWidth: 2
    },
    blur: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
    },
    input: {
        flex: 1,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.white,
        fontWeight: theme.typography.fontWeight.regular as any
    },
    errorText: {
        fontSize: theme.typography.fontSize.xs,
        color: '#FF6B6B',
        marginTop: theme.spacing.xs
    }
});
