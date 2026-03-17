import type { BlockSlot } from '../types/venue';
import type { BookingSlot } from '../types/booking';

export type { BlockSlot, BookingSlot };

export function toMinutes(time: string): number {
	const [h, m] = time.split(':').map((v) => Number(v));
	if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
	return h * 60 + m;
}

export function fromMinutes(total: number): string {
	const h = Math.floor(total / 60)
		.toString()
		.padStart(2, '0');
	const m = (total % 60).toString().padStart(2, '0');
	return `${h}:${m}`;
}

export function generateSlots(
	schedule: { startTime: string; endTime: string }[],
	stepMin: number,
	durationMin: number,
): string[] {
	if (!schedule.length || stepMin <= 0 || durationMin <= 0) return [];

	const slots = new Set<string>();

	for (const entry of schedule) {
		const start = toMinutes(entry.startTime);
		const end = toMinutes(entry.endTime);
		if (Number.isNaN(start) || Number.isNaN(end) || end <= start) continue;

		for (let t = start; t + durationMin <= end; t += stepMin) {
			const slot = fromMinutes(t);
			slots.add(slot);
		}
	}

	return Array.from(slots).sort((a, b) => a.localeCompare(b));
}

export function isSlotBooked(
	bookings: BookingSlot[],
	date: string,
	slot: string,
	durationMin: number,
): boolean {
	const slotStart = new Date(`${date}T${slot}:00`);
	const slotEnd = new Date(slotStart.getTime() + durationMin * 60000);

	return bookings.some((booking) => {
		const start = new Date(booking.startAt);
		const end = new Date(booking.endAt);
		return start < slotEnd && end > slotStart;
	});
}

export function isSlotBlocked(
	blocks: BlockSlot[],
	date: string,
	slot: string,
	durationMin: number,
): BlockSlot | undefined {
	const slotStart = new Date(`${date}T${slot}:00`);
	const slotEnd = new Date(slotStart.getTime() + durationMin * 60000);

	return blocks.find((block) => {
		const start = new Date(block.startAt);
		const end = new Date(block.endAt);
		return start < slotEnd && end > slotStart;
	});
}
