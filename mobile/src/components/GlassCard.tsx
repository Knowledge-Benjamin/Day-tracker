import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { theme } from '../theme/theme';

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    intensity?: 'light' | 'medium' | 'heavy' | 'dark';
    blurType?: 'light' | 'dark';
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    style,
    intensity = 'medium',
    blurType = 'dark'
}) => {
    const glassStyle = theme.glassmorphism[intensity];

    return (
        <View style={[styles.container, glassStyle, style]}>
            <BlurView
                style={styles.blur}
                blurType={blurType}
                blurAmount={10}
                reducedTransparencyFallbackColor={theme.colors.gray800}
            />
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: theme.borderRadius.md,
        overflow: 'hidden',
        ...theme.shadows.md
    },
    blur: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
    },
    content: {
        flex: 1,
        padding: theme.spacing.md
    }
});
