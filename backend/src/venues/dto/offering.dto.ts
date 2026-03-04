export class CreateOfferingDto {
  name: string;
  durationMin: number;
  price?: number;
  bufferMin?: number;
  isActive?: boolean;
}

export class UpdateOfferingDto {
  name?: string;
  durationMin?: number;
  price?: number;
  bufferMin?: number;
  isActive?: boolean;
}
