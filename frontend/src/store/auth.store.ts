import { create } from 'zustand';
import { api } from '../api/api';
import { type AuthStore } from '../types/auth';

export const useAuthStore = create<AuthStore>((set) => ({
	token: localStorage.getItem('accessToken'),

	setToken: (token) => {
		if (token) localStorage.setItem('accessToken', token);
		else localStorage.removeItem('accessToken');
		set({ token });
	},

	logout: () => {
		localStorage.removeItem('accessToken');
		set({ token: null });
	},

	login: async (payload) => {
		const res = await api.post<{ accessToken: string }>(
			'/auth/login',
			payload,
		);
		localStorage.setItem('accessToken', res.data.accessToken);
		set({ token: res.data.accessToken });
	},

	register: async (payload) => {
		const res = await api.post<{ accessToken: string }>(
			'/auth/register',
			payload,
		);
		localStorage.setItem('accessToken', res.data.accessToken);
		set({ token: res.data.accessToken });
	},
}));
