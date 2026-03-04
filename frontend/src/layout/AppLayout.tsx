import { Box, Container } from '@mui/material';
import { Outlet } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Navbar } from '../components/shared/Navbar';
import { useAuthStore } from '../store/auth.store';

export function AppLayout() {
	const initAuth = useAuthStore((s) => s.initAuth);

	useEffect(() => {
		initAuth();
	}, [initAuth]);

	return (
		<Box
			sx={{
				minHeight: '100vh',
				width: '100vw',
				display: 'flex',
				flexDirection: 'column',
				background: (theme) =>
					theme.palette.mode === 'dark'
						? 'linear-gradient(180deg, #0b0f19 0%, #0e1525 100%)'
						: '#f8fafc',
			}}
		>
			<Navbar />

			<Box
				sx={{
					flex: 1,
					width: '100%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					px: 2,
					pt: 10,
				}}
			>
				<Container sx={{ width: '100%' }}>
					<Box sx={{ display: 'flex', justifyContent: 'center' }}>
						<Outlet />
					</Box>
				</Container>
			</Box>
		</Box>
	);
}
