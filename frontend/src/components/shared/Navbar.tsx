import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { AppBar, Button, IconButton, Toolbar, Typography } from '@mui/material';
import { Link, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../../store/auth.store';
import { useThemeMode } from '../../theme/mode';
import { NotificationBell } from './NotificationBell';

export const Navbar = () => {
	const { mode, toggleMode } = useThemeMode();
	const token = useAuthStore((s) => s.token);
	const logout = useAuthStore((s) => s.logout);
	const navigate = useNavigate();

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
			<Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Link to="/dashboard">
				<Typography variant="h5" sx={{ fontWeight: 700 }}>
					BookMe
				</Typography>
                </Link>

				<Toolbar sx={{ gap: 1, minHeight: 'unset', p: 0 }}>
					{token && <NotificationBell />}

					<IconButton
						onClick={toggleMode}
						color="inherit"
						aria-label="toggle theme"
					>
						{mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
					</IconButton>

					{token && (
						<Button
							color="inherit"
							onClick={() => {
								logout();
								navigate({ to: '/login' });
							}}
						>
							Logout
						</Button>
					)}
				</Toolbar>
			</Toolbar>
		</AppBar>
	);
};
