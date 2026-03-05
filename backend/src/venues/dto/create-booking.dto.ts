export class CreateBookingDto {
  unitId: string;
  offeringId: string;
  startAt: string;
  partySize?: number;
  notes?: string;
}
