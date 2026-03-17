export type AppNotification = {
	id: string;
	type: string;
	title: string;
	body: string | null;
	readAt: string | null;
	venueId: string | null;
	bookingId: string | null;
	createdAt: string;
};
