import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async list(customerId: string): Promise<string[]> {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId: customerId },
      select: { venueId: true },
    });
    return favorites.map((f) => f.venueId);
  }

  async add(customerId: string, venueId: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
    });
    if (!venue) throw new NotFoundException('Venue not found');

    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_venueId: { userId: customerId, venueId },
      },
    });
    if (existing) throw new BadRequestException('Already in favorites');

    return this.prisma.favorite.create({
      data: { userId: customerId, venueId },
    });
  }

  async remove(customerId: string, venueId: string) {
    const deleted = await this.prisma.favorite.deleteMany({
      where: { userId: customerId, venueId },
    });
    if (deleted.count === 0) throw new NotFoundException('Favorite not found');
    return { deleted: true };
  }
}
