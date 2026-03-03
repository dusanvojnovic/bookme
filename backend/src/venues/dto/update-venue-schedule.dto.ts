export type ScheduleEntryDto = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export class UpdateVenueScheduleDto {
  entries: ScheduleEntryDto[];
}
