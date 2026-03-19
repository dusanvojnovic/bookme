export class CreateRecurringBookingDto {
  unitId: string;
  offeringId: string;
  startAt: string;
  partySize?: number;
  notes?: string;
  repeat: 'weekly' | 'monthly';
  count: number; // 2-12
}
