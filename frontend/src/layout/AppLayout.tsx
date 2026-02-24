import { Box, Typography } from '@mui/material';
import { Outlet } from '@tanstack/react-router';
import { Navbar } from '../components/shared/Navbar';

export function AppLayout() {
	return (
		<Box>
			<Navbar />
			<Box sx={{ p: 2 }}>
				<Typography variant="h6">Workly</Typography>
				<Outlet />
			</Box>
		</Box>
	);
}
