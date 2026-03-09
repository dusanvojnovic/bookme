import React from 'react';
import { Box } from '@mui/material';
import { AuthForm } from '../components/forms/AuthForm';

export const LoginPage: React.FunctionComponent = () => {
	return (
		<Box
			sx={{
				minHeight: { xs: 'calc(100vh - 120px)', md: 'calc(100vh - 160px)' },
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				width: '100%',
			}}
		>
			<AuthForm mode="login" />
		</Box>
	);
};
