import { api } from './api';
import {
	type CreateVenuePayload,
	type ProviderVenue,
	type VenueCard,
} from '../types/venue';
import {
	type BookingItem,
	type CreateBookingPayload,
	type ProviderBooking,
} from '../types/booking';
import type { AppNotification } from '../types/notification';

export async function fetchVenues(params: {
	q: string;
	city: string;
	category: string;
	date?: string;
}) {
	const res = await api.get<VenueCard[]>('/venues', {
		params: {
			q: params.q || undefined,
			city: params.city === 'all' ? undefined : params.city,
			category: params.category === 'all' ? undefined : params.category,
			date: params.date || undefined,
		},
	});
	return res.data;
}

export async function fetchFavorites(token: string) {
	const res = await api.get<string[]>('/customer/favorites', {
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.data;
}

export async function addFavorite(token: string, venueId: string) {
	await api.post(`/customer/favorites/${venueId}`, {}, {
		headers: { Authorization: `Bearer ${token}` },
	});
}

export async function removeFavorite(token: string, venueId: string) {
	await api.delete(`/customer/favorites/${venueId}`, {
		headers: { Authorization: `Bearer ${token}` },
	});
}

export async function createRecurringBooking(
	token: string,
	venueId: string,
	payload: CreateBookingPayload & {
		repeat: 'weekly' | 'monthly';
		count: number;
	},
) {
	const res = await api.post(`/venues/${venueId}/bookings/recurring`, payload, {
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.data;
}

export async function createBooking(
	token: string,
	venueId: string,
	payload: CreateBookingPayload,
) {
	const res = await api.post(`/venues/${venueId}/bookings`, payload, {
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.data;
}

export async function fetchMyBookings(token: string) {
	const res = await api.get<BookingItem[]>('/customer/bookings', {
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.data;
}

export async function createReview(
	token: string,
	bookingId: string,
	payload: { rating: number; comment?: string },
) {
	await api.post(`/customer/bookings/${bookingId}/review`, payload, {
		headers: { Authorization: `Bearer ${token}` },
	});
}

export async function cancelBooking(token: string, bookingId: string) {
	await api.patch(`/customer/bookings/${bookingId}/cancel`, {}, {
		headers: { Authorization: `Bearer ${token}` },
	});
}

export async function fetchProviderVenues(token: string) {
	const res = await api.get<ProviderVenue[]>('/provider/venues', {
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.data;
}

export async function createVenue(
	token: string,
	payload: CreateVenuePayload,
) {
	const res = await api.post<ProviderVenue>('/provider/venue', payload, {
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.data;
}

export async function fetchPendingBookings(token: string) {
	const res = await api.get<ProviderBooking[]>('/provider/bookings', {
		params: { status: 'PENDING' },
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.data;
}

export async function fetchProviderBookings(
	token: string,
	status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED',
) {
	const res = await api.get<ProviderBooking[]>('/provider/bookings', {
		params: status ? { status } : undefined,
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.data;
}

export async function approveBooking(token: string, bookingId: string) {
	await api.patch(`/provider/bookings/${bookingId}/approve`, null, {
		headers: { Authorization: `Bearer ${token}` },
	});
}

export async function rejectBooking(token: string, bookingId: string) {
	await api.patch(`/provider/bookings/${bookingId}/reject`, null, {
		headers: { Authorization: `Bearer ${token}` },
	});
}

export async function fetchUnreadCount(token: string) {
	const res = await api.get<{ count: number }>('/notifications/unread-count', {
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.data.count;
}

export async function fetchNotifications(token: string) {
	const res = await api.get<AppNotification[]>('/notifications', {
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.data;
}

export async function markAllNotificationsRead(token: string) {
	await api.patch('/notifications/read-all', null, {
		headers: { Authorization: `Bearer ${token}` },
	});
}

export async function markNotificationAsRead(token: string, id: string) {
	await api.patch(`/notifications/${id}/read`, null, {
		headers: { Authorization: `Bearer ${token}` },
	});
}
