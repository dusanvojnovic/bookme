import {
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
} from '@tanstack/react-router';
import { AppLayout } from '../layout/AppLayout';
import { LoginPage } from '../pages/LoginPage';

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

const appRoute = createRoute({
	getParentRoute: () => rootRoute,
	id: 'app',
	component: AppLayout,
});

const indexRoute = createRoute({
	getParentRoute: () => appRoute,
	path: '/',
	component: () => (
		<div style={{ fontSize: 40, color: 'blue' }}>uindex page</div>
	),
});

const smthRoute = createRoute({
	getParentRoute: () => appRoute,
	path: '/smth',
	component: () => (
		<div style={{ fontSize: 40, color: 'red' }}>some page</div>
	),
});

const routeTree = rootRoute.addChildren([
	loginRoute,
	appRoute.addChildren([smthRoute, indexRoute]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router;
	}
}
