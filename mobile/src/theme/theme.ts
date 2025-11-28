// Glassmorphic Design System - Black & White Minimalist
export const theme = {
    colors: {
        // Primary palette - Black & White
        black: '#000000',
        white: '#FFFFFF',

        // Grays for depth
        gray900: '#0A0A0A',
        gray800: '#1A1A1A',
        gray700: '#2A2A2A',
        gray600: '#3A3A3A',
        gray500: '#5A5A5A',
        gray400: '#7A7A7A',
        gray300: '#9A9A9A',
        gray200: '#BABABA',
        gray100: '#DADADA',
        gray50: '#F5F5F5',

        // Glass morphism overlays
        glassLight: 'rgba(255, 255, 255, 0.1)',
        glassMedium: 'rgba(255, 255, 255, 0.15)',
        glassHeavy: 'rgba(255, 255, 255, 0.25)',

        glassDarkLight: 'rgba(0, 0, 0, 0.1)',
        glassDarkMedium: 'rgba(0, 0, 0, 0.15)',
        glassDarkHeavy: 'rgba(0, 0, 0, 0.25)',

        // Borders
        borderLight: 'rgba(255, 255, 255, 0.2)',
        borderDark: 'rgba(0, 0, 0, 0.2)',

        // Random block colors for bin visualization
        blockColors: [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
            '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52C77F',
            '#ED6A5E', '#5DADE2', '#F39C12', '#A569BD', '#48C9B0'
        ]
    },

    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
        xxxl: 64
    },

    borderRadius: {
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        round: 9999
    },

    typography: {
        fontFamily: {
            regular: 'System',
            medium: 'System',
            bold: 'System',
        },
        fontSize: {
            xs: 12,
            sm: 14,
            md: 16,
            lg: 18,
            xl: 24,
            xxl: 32,
            xxxl: 48,
            huge: 64
        },
        fontWeight: {
            light: '300',
            regular: '400',
            medium: '500',
            semibold: '600',
            bold: '700',
            extrabold: '800'
        }
    },

    shadows: {
        sm: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2
        },
        md: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 4
        },
        lg: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
            elevation: 8
        }
    },

    glassmorphism: {
        light: {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
        },
        medium: {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.25)',
        },
        heavy: {
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.3)',
        },
        dark: {
            backgroundColor: 'rgba(0, 0, 0, 0.15)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
        }
    },

    animations: {
        fast: 200,
        medium: 300,
        slow: 500
    }
};

export type Theme = typeof theme;
