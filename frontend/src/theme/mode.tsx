import { CssBaseline, ThemeProvider } from '@mui/material';
import React, { createContext, useContext, useMemo, useState } from 'react';
import { darkTheme, lightTheme } from './theme';

type Mode = 'light' | 'dark';

type ThemeModeContextValue = {
	mode: Mode;
	toggleMode: () => void;
	setMode: (mode: Mode) => void;
};

const STORAGE_KEY = 'theme-mode';

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
	const [mode, setMode] = useState<Mode>(() => {
		const saved = localStorage.getItem(STORAGE_KEY);
		return saved === 'light' || saved === 'dark' ? saved : 'dark';
	});

	const theme = useMemo(
		() => (mode === 'dark' ? darkTheme : lightTheme),
		[mode],
	);

	const value = useMemo<ThemeModeContextValue>(
		() => ({
			mode,
			setMode: (m) => {
				localStorage.setItem(STORAGE_KEY, m);
				setMode(m);
			},
			toggleMode: () =>
				setMode((m) => {
					const next = m === 'dark' ? 'light' : 'dark';
					localStorage.setItem(STORAGE_KEY, next);
					return next;
				}),
		}),
		[mode],
	);

	return (
		<ThemeModeContext.Provider value={value}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				{children}
			</ThemeProvider>
		</ThemeModeContext.Provider>
	);
}

// eslint-disable-next-line react-refresh/only-export-components
export function useThemeMode() {
	const ctx = useContext(ThemeModeContext);
	if (!ctx)
		throw new Error('useThemeMode must be used within ThemeModeProvider');
	return ctx;
}
