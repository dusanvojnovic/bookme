import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import {
	AppBar,
	Box,
	Button,
	IconButton,
	Toolbar,
	Typography,
} from '@mui/material';
import { Link } from '@tanstack/react-router';
import { useThemeMode } from '../../theme/mode';

export const Navbar = () => {
	const { mode, toggleMode } = useThemeMode();

	return (
		<AppBar
			position="fixed"
			elevation={0}
			sx={{
				width: '100%',
				left: 0,
				top: 0,
				borderBottom: 1,
				borderColor: 'divider',
			}}
		>
			<Toolbar sx={{ gap: 2 }}>
				<Typography variant="h5" sx={{ fontWeight: 700 }}>
					Workly
				</Typography>

				<Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
					<Button
						component={Link}
						to="/smth"
						sx={{
							textTrasform: 'none',
							color: 'text.primary',
							'&:hover': {
								color: 'text.secondary',
								backgroundColor: 'transparent',
							},
						}}
					>
						Smth
					</Button>
				</Box>

				<IconButton
					onClick={toggleMode}
					color="inherit"
					aria-label="toggle theme"
				>
					{mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
				</IconButton>
			</Toolbar>
		</AppBar>
	);
};
