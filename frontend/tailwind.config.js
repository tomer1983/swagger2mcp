/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
                mono: ['var(--font-mono)', 'Consolas', 'monospace'],
            },
            colors: {
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',

                // Unify all grays to Devias Deep Navy
                slate: {
                    50: 'hsl(210 40% 98%)',
                    100: 'hsl(210 40% 96%)',
                    200: 'hsl(214 32% 91%)',
                    300: 'hsl(213 27% 84%)',
                    400: 'hsl(215 20% 65%)',
                    500: 'hsl(215 16% 47%)',
                    600: 'hsl(222 47% 30%)',
                    700: 'hsl(222 47% 20%)',
                    800: 'hsl(222 47% 13%)',
                    900: 'hsl(222 47% 11%)',
                    950: 'hsl(222 47% 9%)',
                },
                gray: {
                    50: 'hsl(210 40% 98%)',
                    100: 'hsl(210 40% 96%)',
                    200: 'hsl(214 32% 91%)',
                    300: 'hsl(213 27% 84%)',
                    400: 'hsl(215 20% 65%)',
                    500: 'hsl(215 16% 47%)',
                    600: 'hsl(222 47% 30%)',
                    700: 'hsl(222 47% 20%)',
                    800: 'hsl(222 47% 13%)',
                    900: 'hsl(222 47% 11%)',
                    950: 'hsl(222 47% 9%)',
                },
                zinc: {
                    50: 'hsl(210 40% 98%)',
                    100: 'hsl(210 40% 96%)',
                    200: 'hsl(214 32% 91%)',
                    300: 'hsl(213 27% 84%)',
                    400: 'hsl(215 20% 65%)',
                    500: 'hsl(215 16% 47%)',
                    600: 'hsl(222 47% 30%)',
                    700: 'hsl(222 47% 20%)',
                    800: 'hsl(222 47% 13%)',
                    900: 'hsl(222 47% 11%)',
                    950: 'hsl(222 47% 9%)',
                },

                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                success: {
                    DEFAULT: 'hsl(var(--success))',
                    foreground: 'hsl(var(--success-foreground))',
                },
                warning: {
                    DEFAULT: 'hsl(var(--warning))',
                    foreground: 'hsl(var(--warning-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' },
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' },
                },
                shimmer: {
                    '100%': { transform: 'translateX(100%)' },
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                shimmer: 'shimmer 2s infinite',
            },
        },
    },
    plugins: [],
}
