export class CreateOfferingDto {
  unitId: string;
  name: string;
  durationMin: number;
  price?: number;
  bufferMin?: number;
  isActive?: boolean;
}

export class UpdateOfferingDto {
  unitId?: string;
  name?: string;
  durationMin?: number;
  price?: number;
  bufferMin?: number;
  isActive?: boolean;
}
