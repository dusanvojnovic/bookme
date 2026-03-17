export interface VenueCard {
	id: string;
	name: string;
	category: string;
	city: string;
	address: string;
	unitsCount: number;
	offeringsCount: number;
	priceFrom: number | null;
	avgRating: number | null;
	reviewsCount: number;
	imageUrl?: string | null;
	availableToday?: boolean;
	nextAvailableDay?: string | null;
}

export interface Unit {
	id: string;
	name: string;
	unitType: string;
	capacity?: number | null;
	minDurationMin?: number | null;
	maxDurationMin?: number | null;
	slotStepMin?: number | null;
}

export interface Offering {
	id: string;
	unitId: string;
	name: string;
	durationMin: number;
	price?: number | null;
	bufferMin?: number | null;
	isActive: boolean;
}

export interface VenueSchedule {
	id: string;
	dayOfWeek: number;
	startTime: string;
	endTime: string;
}

export interface VenueReview {
	id: string;
	rating: number;
	comment: string | null;
	createdAt: string;
}

export interface VenueImage {
	id: string;
	path: string;
	order: number;
}

export interface VenueDetails {
	id: string;
	providerId: string;
	category: string;
	name: string;
	description?: string | null;
	city: string;
	address?: string | null;
	slotStepMin?: number | null;
	autoApprove?: boolean;
	imageUrl?: string | null;
	images?: VenueImage[];
	units: Unit[];
	offerings: Offering[];
	schedules: VenueSchedule[];
	reviews?: VenueReview[];
	avgRating?: number | null;
	reviewsCount?: number;
	availableToday?: boolean;
	nextAvailableDay?: string | null;
}

export type BlockSlot = {
	id: string;
	unitId: string;
	startAt: string;
	endAt: string;
	reason?: string | null;
};

export type ScheduleEntryPayload = {
	dayOfWeek: number;
	startTime: string;
	endTime: string;
};

export type CreateBlockPayload = {
	unitId: string;
	startAt: string;
	endAt: string;
	reason?: string;
};

export type UpdateVenuePayload = {
	category?: string;
	name?: string;
	city?: string;
	description?: string;
	address?: string;
	slotStepMin?: number;
};

export type CreateUnitPayload = {
	name: string;
	unitType: string;
	capacity?: number;
	minDurationMin?: number;
	maxDurationMin?: number;
	slotStepMin?: number;
};

export type UpdateUnitPayload = Partial<CreateUnitPayload>;

export type CreateOfferingPayload = {
	unitId: string;
	name: string;
	durationMin: number;
	price?: number;
	isActive?: boolean;
};

export type UpdateOfferingPayload = Partial<CreateOfferingPayload>;

export type ProviderVenue = {
	id: string;
	name: string;
	category: string;
	city: string;
	address?: string | null;
	description?: string | null;
};

export type CreateVenuePayload = {
	category: string;
	name: string;
	city: string;
	description?: string;
	address?: string;
	autoApprove?: boolean;
};
