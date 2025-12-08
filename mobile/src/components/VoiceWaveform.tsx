import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

interface Props {
    isActive: boolean;
}

const VoiceWaveform: React.FC<Props> = ({ isActive }) => {
    const animations = useRef(
        Array.from({ length: 5 }, () => new Animated.Value(0.3))
    ).current;

    useEffect(() => {
        if (isActive) {
            const animationSequence = animations.map((anim, index) =>
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(anim, {
                            toValue: 1,
                            duration: 300 + index * 100,
                            useNativeDriver: true,
                        }),
                        Animated.timing(anim, {
                            toValue: 0.3,
                            duration: 300 + index * 100,
                            useNativeDriver: true,
                        }),
                    ])
                )
            );

            Animated.stagger(100, animationSequence).start();
        } else {
            animations.forEach(anim => anim.setValue(0.3));
        }
    }, [isActive, animations]);

    return (
        <View style={styles.container}>
            {animations.map((anim, index) => (
                <Animated.View
                    key={index}
                    style={[
                        styles.bar,
                        {
                            scaleY: anim,
                        },
                    ]}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
        gap: 4,
    },
    bar: {
        width: 4,
        height: 40,
        backgroundColor: theme.colors.white,
        borderRadius: 2,
    },
});

export default VoiceWaveform;
