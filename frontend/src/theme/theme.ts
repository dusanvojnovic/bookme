import { createTheme } from '@mui/material/styles';

const brand = {
	primary: {
		main: '#6366F1',
		light: '#818CF8',
		dark: '#4F46E5',
	},
	secondary: {
		main: '#22C55E',
		light: '#4ADE80',
		dark: '#16A34A',
	},
	status: {
		success: '#22C55E',
		warning: '#F59E0B',
		error: '#EF4444',
		info: '#0EA5E9',
	},
};

const neutrals = {
	light: {
		bg: '#F7F8FC',
		paper: '#FFFFFF',
		paper2: '#F9FAFB',
		divider: '#E5E7EB',
		textPrimary: '#0F172A',
		textSecondary: '#64748B',
		muted: '#94A3B8',
	},
	dark: {
		bg: '#0B0F19',
		paper: '#0F172A',
		paper2: '#111C2F',
		divider: '#243041',
		textPrimary: '#E5E7EB',
		textSecondary: '#9EB3CF',
		muted: '#7C8CA5',
	},
};

export const lightTheme = createTheme({
	palette: {
		mode: 'light',
		primary: brand.primary,
		secondary: brand.secondary,
		success: { main: brand.status.success },
		warning: { main: brand.status.warning },
		error: { main: brand.status.error },
		info: { main: brand.status.info },

		background: {
			default: neutrals.light.bg,
			paper: neutrals.light.paper,
		},
		text: {
			primary: neutrals.light.textPrimary,
			secondary: neutrals.light.textSecondary,
		},
		divider: neutrals.light.divider,
	},
	shape: { borderRadius: 12 },
	typography: {
		fontFamily: [
			'Inter',
			'system-ui',
			'-apple-system',
			'Segoe UI',
			'Roboto',
			'Arial',
			'sans-serif',
		].join(','),
		button: { textTransform: 'none', fontWeight: 600 },
	},
	components: {
		MuiPaper: {
			styleOverrides: {
				root: {
					backgroundImage: 'none',
					border: `1px solid ${neutrals.light.divider}`,
				},
			},
		},
		MuiAppBar: {
			styleOverrides: {
				root: {
					backgroundImage: 'none',
					backgroundColor: neutrals.light.paper,
					color: neutrals.light.textPrimary,
					borderBottom: `1px solid ${neutrals.light.divider}`,
				},
			},
		},
		MuiButton: {
			styleOverrides: {
				root: {
					borderRadius: 10,
				},
			},
		},
		MuiOutlinedInput: {
			styleOverrides: {
				root: {
					backgroundColor: neutrals.light.paper2,
					'& .MuiOutlinedInput-notchedOutline': {
						borderColor: neutrals.light.divider,
					},
					'&:hover .MuiOutlinedInput-notchedOutline': {
						borderColor: brand.primary.light,
					},
					'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
						borderColor: brand.primary.main,
						borderWidth: 2,
					},
				},
			},
		},
	},
});

export const darkTheme = createTheme({
	palette: {
		mode: 'dark',
		primary: {
			main: brand.primary.light,
			light: '#A5B4FC',
			dark: brand.primary.main,
		},
		secondary: brand.secondary,
		success: { main: brand.status.success },
		warning: { main: brand.status.warning },
		error: { main: brand.status.error },
		info: { main: brand.status.info },

		background: {
			default: neutrals.dark.bg,
			paper: neutrals.dark.paper,
		},
		text: {
			primary: neutrals.dark.textPrimary,
			secondary: neutrals.dark.textSecondary,
		},
		divider: neutrals.dark.divider,
	},
	shape: { borderRadius: 12 },
	typography: {
		fontFamily: [
			'Inter',
			'system-ui',
			'-apple-system',
			'Segoe UI',
			'Roboto',
			'Arial',
			'sans-serif',
		].join(','),
		button: { textTransform: 'none', fontWeight: 600 },
	},
	components: {
		MuiPaper: {
			styleOverrides: {
				root: {
					backgroundImage: 'none',
					border: `1px solid ${neutrals.dark.divider}`,
				},
			},
		},
		MuiAppBar: {
			styleOverrides: {
				root: {
					backgroundImage: 'none',
					backgroundColor: neutrals.dark.paper,
					color: neutrals.dark.textPrimary,
					borderBottom: `1px solid ${neutrals.dark.divider}`,
				},
			},
		},
		MuiButton: {
			styleOverrides: {
				root: {
					borderRadius: 10,
				},
			},
		},
		MuiOutlinedInput: {
			styleOverrides: {
				root: {
					backgroundColor: neutrals.dark.paper2,
					'& .MuiOutlinedInput-notchedOutline': {
						borderColor: neutrals.dark.divider,
					},
					'&:hover .MuiOutlinedInput-notchedOutline': {
						borderColor: brand.primary.main,
					},
					'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
						borderColor: brand.primary.light,
						borderWidth: 2,
					},
				},
			},
		},
	},
});
