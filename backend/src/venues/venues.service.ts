import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnitDto, UpdateUnitDto } from './dto/create-unit.dto';
import { CreateVenueDto } from './dto/create-venue.dto';
import { CreateOfferingDto, UpdateOfferingDto } from './dto/offering.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { UpdateVenueScheduleDto } from './dto/update-venue-schedule.dto';
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
        slotStepMin: dto.slotStepMin ?? null,
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
        slotStepMin: dto.slotStepMin,
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
        schedules: true,
      },
    });

    if (!venue) throw new NotFoundException('Venue not found');
    return venue;
  }

  async createUnit(providerId: string, venueId: string, dto: CreateUnitDto) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
    });

    if (!venue) throw new NotFoundException('Venue not found');
    if (venue.providerId !== providerId)
      throw new ForbiddenException('Not your venue');

    return this.prisma.unit.create({
      data: {
        venueId,
        name: dto.name,
        unitType: dto.unitType,
        capacity: dto.capacity ?? null,
        minDurationMin: dto.minDurationMin ?? null,
        maxDurationMin: dto.maxDurationMin ?? null,
        slotStepMin: dto.slotStepMin ?? null,
      },
    });
  }

  async updateUnit(
    providerId: string,
    venueId: string,
    unitId: string,
    dto: UpdateUnitDto,
  ) {
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
      include: { venue: true },
    });

    if (!unit || unit.venueId !== venueId)
      throw new NotFoundException('Unit not found');
    if (unit.venue.providerId !== providerId)
      throw new ForbiddenException('Not your venue');

    return this.prisma.unit.update({
      where: { id: unitId },
      data: {
        name: dto.name,
        unitType: dto.unitType,
        capacity: dto.capacity ?? null,
        minDurationMin: dto.minDurationMin ?? null,
        maxDurationMin: dto.maxDurationMin ?? null,
        slotStepMin: dto.slotStepMin ?? null,
      },
    });
  }

  async removeUnit(
    providerId: string,
    venueId: string,
    unitId: string,
  ) {
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
      include: { venue: true },
    });

    if (!unit || unit.venueId !== venueId)
      throw new NotFoundException('Unit not found');
    if (unit.venue.providerId !== providerId)
      throw new ForbiddenException('Not your venue');

    return this.prisma.unit.delete({ where: { id: unitId } });
  }

  async updateSchedule(
    providerId: string,
    venueId: string,
    dto: UpdateVenueScheduleDto,
  ) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
    });

    if (!venue) throw new NotFoundException('Venue not found');
    if (venue.providerId !== providerId)
      throw new ForbiddenException('Not your venue');

    const entries = (dto.entries ?? []).map((entry) => ({
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
    }));

    return this.prisma.$transaction([
      this.prisma.venueSchedule.deleteMany({ where: { venueId } }),
      this.prisma.venueSchedule.createMany({
        data: entries.map((entry) => ({ ...entry, venueId })),
      }),
    ]);
  }

  async createOffering(
    providerId: string,
    venueId: string,
    dto: CreateOfferingDto,
  ) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
    });

    if (!venue) throw new NotFoundException('Venue not found');
    if (venue.providerId !== providerId)
      throw new ForbiddenException('Not your venue');

    return this.prisma.offering.create({
      data: {
        venueId,
        name: dto.name,
        durationMin: dto.durationMin,
        price: dto.price ?? null,
        bufferMin: dto.bufferMin ?? null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateOffering(
    providerId: string,
    venueId: string,
    offeringId: string,
    dto: UpdateOfferingDto,
  ) {
    const offering = await this.prisma.offering.findUnique({
      where: { id: offeringId },
      include: { venue: true },
    });

    if (!offering || offering.venueId !== venueId)
      throw new NotFoundException('Offering not found');
    if (offering.venue.providerId !== providerId)
      throw new ForbiddenException('Not your venue');

    return this.prisma.offering.update({
      where: { id: offeringId },
      data: {
        name: dto.name,
        durationMin: dto.durationMin,
        price: dto.price ?? null,
        bufferMin: dto.bufferMin ?? null,
        isActive: dto.isActive,
      },
    });
  }

  async removeOffering(
    providerId: string,
    venueId: string,
    offeringId: string,
  ) {
    const offering = await this.prisma.offering.findUnique({
      where: { id: offeringId },
      include: { venue: true },
    });

    if (!offering || offering.venueId !== venueId)
      throw new NotFoundException('Offering not found');
    if (offering.venue.providerId !== providerId)
      throw new ForbiddenException('Not your venue');

    return this.prisma.offering.delete({ where: { id: offeringId } });
  }

  async getBookingsForDate(venueId: string, date: string) {
    const day = new Date(date);
    if (Number.isNaN(day.getTime())) return [];

    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);

    return this.prisma.booking.findMany({
      where: {
        unit: { venueId },
        startAt: { lt: end },
        endAt: { gt: start },
      },
      select: {
        id: true,
        unitId: true,
        startAt: true,
        endAt: true,
      },
    });
  }
}
