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
};

export type AuthStore = {
	token: string | null;
	setToken: (token: string | null) => void;
	login: (payload: LoginPayload) => Promise<void>;
	logout: () => void;
	register: (payload: RegisterPayload) => Promise<void>;
};
