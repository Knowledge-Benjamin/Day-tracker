import React, { useRef, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { Mesh, BoxGeometry, MeshPhysicalMaterial, Group } from 'three';
import { theme } from '../theme/theme';

interface BinVisualizationProps {
    totalDays: number;
    loggedDays: number;
    style?: any;
}

// 3D Bin Component
const Bin = () => {
    const meshRef = useRef<Mesh>(null);

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.001; // Slow rotation
        }
    });

    return (
        <mesh ref={meshRef} position={[0, 0, 0]}>
            {/* Bin geometry - tapered cylinder shape */}
            <cylinderGeometry args={[1.5, 1, 3, 32, 1, true]} />
            <meshPhysicalMaterial
                color="#FFFFFF"
                transparent
                opacity={0.15}
                roughness={0.1}
                metalness={0.1}
                transmission={0.9}
                thickness={0.5}
                clearcoat={1}
                clearcoatRoughness={0.1}
            />
        </mesh>
    );
};

// Day Block Component
const DayBlock = ({ position, color, scale }: { position: [number, number, number], color: string, scale: number }) => {
    const meshRef = useRef<Mesh>(null);

    useFrame(() => {
        if (meshRef.current) {
            // Gentle floating animation
            meshRef.current.position.y = position[1] + Math.sin(Date.now() * 0.001) * 0.02;
        }
    });

    return (
        <mesh ref={meshRef} position={position} scale={scale}>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshPhysicalMaterial
                color={color}
                roughness={0.3}
                metalness={0.5}
                transparent
                opacity={0.9}
            />
        </mesh>
    );
};

// Blocks Grid
const BlocksGrid = ({ count }: { count: number }) => {
    const groupRef = useRef<Group>(null);

    // Calculate block size based on count - shrinks as more blocks are added
    const blockScale = useMemo(() => {
        if (count < 50) return 1;
        if (count < 100) return 0.8;
        if (count < 500) return 0.6;
        if (count < 1000) return 0.4;
        return 0.3;
    }, [count]);

    // Generate block positions in a circular pattern within the bin
    const blocks = useMemo(() => {
        const blockArray = [];
        const layers = Math.ceil(count / 20);
        const binRadius = 1.3;

        for (let i = 0; i < count; i++) {
            const layer = Math.floor(i / 20);
            const angleStep = (Math.PI * 2) / Math.min(20, count - layer * 20);
            const angle = (i % 20) * angleStep;

            const radius = binRadius * (0.3 + Math.random() * 0.6);
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = -1.2 + (layer * 0.15 * blockScale); // Stack upwards

            // Random color from theme
            const color = theme.colors.blockColors[Math.floor(Math.random() * theme.colors.blockColors.length)];

            blockArray.push({
                position: [x, y, z] as [number, number, number],
                color
            });
        }

        return blockArray;
    }, [count, blockScale]);

    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.002; // Slow group rotation
        }
    });

    return (
        <group ref={groupRef}>
            {blocks.map((block, index) => (
                <DayBlock
                    key={index}
                    position={block.position}
                    color={block.color}
                    scale={blockScale}
                />
            ))}
        </group>
    );
};

// Main Visualization Scene
const Scene = ({ loggedDays }: { loggedDays: number }) => {
    return (
        <>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <pointLight position={[-10, -10, -5]} intensity={0.5} />

            <Bin />
            <BlocksGrid count={loggedDays} />
        </>
    );
};

export const BinVisualization: React.FC<BinVisualizationProps> = ({
    totalDays,
    loggedDays,
    style
}) => {
    return (
        <View style={[styles.container, style]}>
            <Canvas
                camera={{ position: [0, 2, 5], fov: 50 }}
                style={styles.canvas}
            >
                <Scene loggedDays={loggedDays} />
            </Canvas>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 400,
        backgroundColor: 'transparent'
    },
    canvas: {
        flex: 1
    }
});
