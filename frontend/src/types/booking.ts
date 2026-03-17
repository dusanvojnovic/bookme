export type BookingItem = {
	id: string;
	startAt: string;
	endAt: string;
	status: string;
	review?: {
		id: string;
		rating: number;
		comment: string | null;
		createdAt: string;
	} | null;
	unit: {
		id: string;
		name: string;
		venue: { id: string; name: string; city: string; address: string | null };
	};
	offering: {
		id: string;
		name: string;
		durationMin: number;
		price: number | null;
	};
};

export type BookingSlot = {
	id: string;
	unitId: string;
	startAt: string;
	endAt: string;
};

export type CreateBookingPayload = {
	unitId: string;
	offeringId: string;
	startAt: string;
};

export type ProviderBooking = {
	id: string;
	status: string;
	startAt: string;
	endAt: string;
	unit: {
		id: string;
		name: string;
		venue: { id: string; name: string; city: string; address?: string | null };
	};
	offering: { id: string; name: string; durationMin: number; price?: number | null };
	customer: { id: string; email: string };
};
