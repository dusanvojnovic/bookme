import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import { type Me } from '../types/auth';
import { api } from './api';

export function useMeQuery() {
	const token = useAuthStore((s) => s.token);

	return useQuery({
		queryKey: ['me'],
		enabled: !!token,
		queryFn: async () => {
			const res = await api.get<Me>('/auth/me', {
				headers: { Authorization: `Bearer ${token}` },
			});

			return res.data;
		},
		retry: false,
	});
}
