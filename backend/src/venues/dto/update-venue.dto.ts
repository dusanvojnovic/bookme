import { ServiceCategory } from "@prisma/client";

export class UpdateVenueDto {
  category?: ServiceCategory;
  name?: string;
  city?: string;
  description?: string;
  address?: string;
  slotStepMin?: number;
  autoApprove?: boolean;
  imageUrl?: string | null;
}
