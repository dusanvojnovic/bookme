export class CreateUnitDto {
  name: string;
  unitType: string;
  capacity?: number;
  minDurationMin?: number;
  maxDurationMin?: number;
  slotStepMin?: number;
}
