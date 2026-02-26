export type UserRole = 'CUSTOMER' | 'PROVIDER' | 'ADMIN';

export type Me = {
	id: string;
	role: UserRole;
	email?: string;
};

export type AuthState = {
	accessToken: string | null;
	me: Me | null;
	isLoading: boolean;
};

export type LoginPayload = { email: string; password: string };

export type RegisterPayload = {
	email: string;
	password: string;
	role: 'customer' | 'provider';
	companyName?: string;
	serviceCategory?: ServiceCategory;
};

export type Role = 'CUSTOMER' | 'PROVIDER';

export type AuthUser = {
	id: string;
	role: Role;
};

export type ServiceCategory =
	| 'SPORT'
	| 'BUSINESS'
	| 'EVENTS'
	| 'FOOD'
	| 'WELLNESS';

export type AuthStore = {
	token: string | null;
	user: AuthUser | null;
	initAuth: () => void;
	logout: () => void;
	login: (payload: LoginPayload) => Promise<void>;
	register: (payload: RegisterPayload) => Promise<void>;
};
