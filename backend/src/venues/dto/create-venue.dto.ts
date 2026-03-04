import { ServiceCategory } from "@prisma/client";

export class CreateVenueDto {
  category: ServiceCategory;
  name: string;
  city: string;
  description?: string;
  address?: string;
  slotStepMin?: number;
}
