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

export interface VenueDetails {
	id: string;
	providerId: string;
	category: string;
	name: string;
	description?: string | null;
	city: string;
	address?: string | null;
	slotStepMin?: number | null;
	units: Unit[];
	offerings: Offering[];
	schedules: VenueSchedule[];
}
