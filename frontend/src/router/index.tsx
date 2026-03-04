import {
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	redirect,
} from '@tanstack/react-router';
import { AppLayout } from '../layout/AppLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { VenueDetailsPage } from '../pages/VenueDetailsPage';
import { VenueCalendarPage } from '../pages/VenueCalendarPage';
import { useAuthStore } from '../store/auth.store';

const rootRoute = createRootRoute({
	component: () => <AppLayout />,
});

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/',
	beforeLoad: () => {
		const token = useAuthStore.getState().token;
		throw redirect({ to: token ? '/dashboard' : '/login' });
	},
});

const loginRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/login',
	component: LoginPage,
});

const registerRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/register',
	component: RegisterPage,
});

const protectedRoute = createRoute({
	getParentRoute: () => rootRoute,
	id: 'protected',
	beforeLoad: () => {
		const token = useAuthStore.getState().token;
		if (!token) throw redirect({ to: '/login' });
	},
	component: Outlet,
});

const dashboardRoute = createRoute({
	getParentRoute: () => protectedRoute,
	path: '/dashboard',
	component: DashboardPage,
});

const venueDetailsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/venues/$venueId',
	component: VenueDetailsPage,
});

const venueCalendarRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/venues/$venueId/calendar',
	component: VenueCalendarPage,
});

const routeTree = rootRoute.addChildren([
	indexRoute,
	loginRoute,
	registerRoute,
	venueDetailsRoute,
	venueCalendarRoute,
	protectedRoute.addChildren([dashboardRoute]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router;
	}
}
