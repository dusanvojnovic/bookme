import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import MenuIcon from '@mui/icons-material/Menu';
import {
	AppBar,
	Box,
	Button,
	Drawer,
	IconButton,
	List,
	ListItem,
	ListItemButton,
	ListItemText,
	Toolbar,
	Typography,
} from '@mui/material';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { useThemeMode } from '../../theme/mode';
import { NotificationBell } from './NotificationBell';

const navLinks = [{ to: '/my-bookings', label: 'My Bookings' }];

export const Navbar = () => {
	const { mode, toggleMode } = useThemeMode();
	const token = useAuthStore((s) => s.token);
	const logout = useAuthStore((s) => s.logout);
	const navigate = useNavigate();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const handleLogout = () => {
		logout();
		navigate({ to: '/login' });
	};

	const closeMobileMenu = () => setMobileMenuOpen(false);

	return (
		<>
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
					<Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
						<Typography variant="h5" sx={{ fontWeight: 700 }}>
							BookMe
						</Typography>
					</Link>

					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						{token && <NotificationBell />}

						{/* Desktop nav links */}
						<Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5 }}>
							{token &&
								navLinks.map(({ to, label }) => (
									<Button
										key={to}
										component={Link}
										to={to}
										color="inherit"
										sx={{ textTransform: 'none' }}
									>
										{label}
									</Button>
								))}
						</Box>

						<IconButton
							onClick={toggleMode}
							color="inherit"
							aria-label="toggle theme"
						>
							{mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
						</IconButton>

						{token && (
							<>
								{/* Desktop: Logout button */}
								<Box sx={{ display: { xs: 'none', md: 'block' } }}>
									<Button color="inherit" onClick={handleLogout}>
										Logout
									</Button>
								</Box>
								{/* Mobile: Hamburger menu */}
								<IconButton
									color="inherit"
									aria-label="open menu"
									onClick={() => setMobileMenuOpen(true)}
									sx={{ display: { xs: 'inline-flex', md: 'none' } }}
								>
									<MenuIcon />
								</IconButton>
							</>
						)}
					</Box>
				</Toolbar>
			</AppBar>

			{/* Mobile drawer */}
			<Drawer
				anchor="right"
				open={mobileMenuOpen}
				onClose={closeMobileMenu}
				PaperProps={{
					sx: { minWidth: 220 },
				}}
			>
				<Box sx={{ pt: 2, pb: 2 }}>
					<List>
						{navLinks.map(({ to, label }) => (
							<ListItem key={to} disablePadding>
								<ListItemButton
									component={Link}
									to={to}
									onClick={closeMobileMenu}
								>
									<ListItemText primary={label} />
								</ListItemButton>
							</ListItem>
						))}
						<ListItem disablePadding>
							<ListItemButton onClick={() => {
								closeMobileMenu();
								handleLogout();
							}}>
								<ListItemText primary="Logout" />
							</ListItemButton>
						</ListItem>
					</List>
				</Box>
			</Drawer>
		</>
	);
};
