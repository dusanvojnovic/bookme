export class CreateUnitDto {
  name: string;
  unitType: string;
  capacity?: number;
  minDurationMin?: number;
  maxDurationMin?: number;
  slotStepMin?: number;
}

export class UpdateUnitDto {
  name?: string;
  unitType?: string;
  capacity?: number;
  minDurationMin?: number;
  maxDurationMin?: number;
  slotStepMin?: number;
}
