import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { ServiceCategory } from '@prisma/client';

@Injectable()
export class VenuesService {
  constructor(private prisma: PrismaService) {}

  create(providerId: string, dto: CreateVenueDto) {
    return this.prisma.venue.create({
      data: {
        providerId,
        category: dto.category,
        name: dto.name,
        city: dto.city,
        description: dto.description ?? null,
        address: dto.address ?? null,
      },
    });
  }

  async update(providerId: string, venueId: string, dto: UpdateVenueDto) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
    });

    if (!venue) throw new NotFoundException('Venue not found');

    if (venue.providerId !== providerId)
      throw new ForbiddenException('Not your venue');

    return this.prisma.venue.update({
      where: { id: venueId },
      data: {
        category: dto.category,
        name: dto.name,
        city: dto.city,
        description: dto.description,
        address: dto.address,
      },
    });
  }

  async remove(providerId: string, venueId: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: providerId },
    });

    if (!venue) throw new NotFoundException('Venue not found');
    if (venue.providerId !== providerId)
      throw new ForbiddenException('Not your venue');

    return this.prisma.venue.delete({ where: { id: venueId } });
  }

  listMine(providerId: string) {
    return this.prisma.venue.findMany({
      where: { providerId },
    });
  }

  listPublic(category?: string, city?: string, q?: string) {
    return this.prisma.venue.findMany({
      where: {
        ...(category ? { category: category as ServiceCategory } : {}),
        ...(city ? { city } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
    });
  }

  async getById(id: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id },
      include: {
        units: true,
        offerings: true,
        reviews: { take: 5 },
      },
    });

    if (!venue) throw new NotFoundException('Venue not found');
    return venue;
  }
}
