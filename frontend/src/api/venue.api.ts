import { api } from './api';
import type { BookingSlot } from '../types/booking';
import {
	type BlockSlot,
	type CreateBlockPayload,
	type CreateOfferingPayload,
	type CreateUnitPayload,
	type ScheduleEntryPayload,
	type Unit,
	type UpdateOfferingPayload,
	type UpdateUnitPayload,
	type UpdateVenuePayload,
	type VenueDetails,
} from '../types/venue';

export async function fetchVenue(venueId: string) {
	const res = await api.get<VenueDetails>(`/venues/${venueId}`);
	return res.data;
}

export async function fetchBookings(venueId: string, date: string) {
	const res = await api.get<BookingSlot[]>(`/venues/${venueId}/bookings`, {
		params: { date },
	});
	return res.data;
}

export async function fetchBlocks(venueId: string, date: string) {
	const res = await api.get<BlockSlot[]>(`/venues/${venueId}/blocks`, {
		params: { date },
	});
	return res.data;
}

export async function createBlock(
	token: string,
	venueId: string,
	payload: CreateBlockPayload,
) {
	await api.post(`/provider/venues/${venueId}/blocks`, payload, {
		headers: { Authorization: `Bearer ${token}` },
	});
}

export async function updateVenue(
	token: string,
	venueId: string,
	payload: UpdateVenuePayload,
) {
	const res = await api.patch<VenueDetails>(
		`/provider/venues/${venueId}`,
		payload,
		{
			headers: { Authorization: `Bearer ${token}` },
		},
	);
	return res.data;
}

export async function updateSchedule(
	token: string,
	venueId: string,
	entries: ScheduleEntryPayload[],
) {
	await api.patch(
		`/provider/venues/${venueId}/schedule`,
		{ entries },
		{
			headers: { Authorization: `Bearer ${token}` },
		},
	);
}

export async function uploadVenueImage(
	token: string,
	venueId: string,
	file: File,
) {
	const formData = new FormData();
	formData.append('file', file);
	await api.post(`/provider/venues/${venueId}/image`, formData, {
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'multipart/form-data',
		},
	});
}

export async function removeVenueImage(
	token: string,
	venueId: string,
	imageId: string,
) {
	await api.delete(`/provider/venues/${venueId}/images/${imageId}`, {
		headers: { Authorization: `Bearer ${token}` },
	});
}

export async function createUnit(
	token: string,
	venueId: string,
	payload: CreateUnitPayload,
) {
	const res = await api.post<Unit>(`/provider/venues/${venueId}/units`, payload, {
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.data;
}

export async function updateUnit(
	token: string,
	venueId: string,
	unitId: string,
	payload: UpdateUnitPayload,
) {
	const res = await api.patch<Unit>(
		`/provider/venues/${venueId}/units/${unitId}`,
		payload,
		{
			headers: { Authorization: `Bearer ${token}` },
		},
	);
	return res.data;
}

export async function deleteUnit(
	token: string,
	venueId: string,
	unitId: string,
) {
	await api.delete(`/provider/venues/${venueId}/units/${unitId}`, {
		headers: { Authorization: `Bearer ${token}` },
	});
}

export async function createOffering(
	token: string,
	venueId: string,
	payload: CreateOfferingPayload,
) {
	await api.post(`/provider/venues/${venueId}/offerings`, payload, {
		headers: { Authorization: `Bearer ${token}` },
	});
}

export async function updateOffering(
	token: string,
	venueId: string,
	offeringId: string,
	payload: UpdateOfferingPayload,
) {
	await api.patch(
		`/provider/venues/${venueId}/offerings/${offeringId}`,
		payload,
		{
			headers: { Authorization: `Bearer ${token}` },
		},
	);
}

export async function deleteOffering(
	token: string,
	venueId: string,
	offeringId: string,
) {
	await api.delete(
		`/provider/venues/${venueId}/offerings/${offeringId}`,
		{
			headers: { Authorization: `Bearer ${token}` },
		},
	);
}
