import { Typography } from '@mui/material';
import {
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	redirect,
} from '@tanstack/react-router';
import { LoginPage } from '../pages/LoginPage';
import { useAuthStore } from '../store/auth.store';

const rootRoute = createRootRoute({
	component: () => <Outlet />,
	notFoundComponent: () => (
		<div style={{ fontSize: 40 }}>ROUTER LOADED BUT NOT FOUND</div>
	),
});

const loginRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/login',
	component: LoginPage,
});

const protectedRoute = createRoute({
	getParentRoute: () => rootRoute,
	id: 'protected',
	beforeLoad: () => {
		const token = useAuthStore.getState().token;
		if (!token) throw redirect({ to: '/login' });
	},
});

const dashboardRoute = createRoute({
	getParentRoute: () => protectedRoute,
	path: '/dashboard',
	component: () => <Typography>DASHBOARD</Typography>,
});

const routeTree = rootRoute.addChildren([
	loginRoute,
	protectedRoute.addChildren([dashboardRoute]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router;
	}
}
