import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnitDto, UpdateUnitDto } from './dto/create-unit.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateVenueDto } from './dto/create-venue.dto';
import { CreateOfferingDto, UpdateOfferingDto } from './dto/offering.dto';
import { CreateBlockDto } from './dto/create-block.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { UpdateVenueScheduleDto } from './dto/update-venue-schedule.dto';
import { ServiceCategory } from '@prisma/client';

@Injectable()
export class VenuesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

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

  async listPublic(category?: string, city?: string, q?: string) {
    const venues = await this.prisma.venue.findMany({
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
      include: {
        _count: { select: { units: true, offerings: true } },
        offerings: { select: { price: true }, where: { isActive: true } },
        reviews: { select: { rating: true } },
      },
    });

    return venues.map((venue) => {
      const prices = venue.offerings
        .map((o) => o.price)
        .filter((price): price is number => typeof price === 'number');
      const priceFrom = prices.length ? Math.min(...prices) : null;

      const ratings = venue.reviews.map((r) => r.rating);
      const reviewsCount = ratings.length;
      const avgRating =
        reviewsCount > 0
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / reviewsCount) * 10) /
            10
          : null;

      return {
        id: venue.id,
        name: venue.name,
        category: venue.category,
        city: venue.city,
        address: venue.address,
        unitsCount: venue._count.units,
        offeringsCount: venue._count.offerings,
        priceFrom,
        avgRating,
        reviewsCount,
      };
    });
  }

  async getById(id: string) {
    const [venue, reviewStats] = await Promise.all([
      this.prisma.venue.findUnique({
        where: { id },
        include: {
          units: true,
          offerings: true,
          reviews: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
            },
          },
          schedules: true,
        },
      }),
      this.prisma.review.aggregate({
        where: { venueId: id },
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    if (!venue) throw new NotFoundException('Venue not found');

    const avgRating =
      reviewStats._count > 0 && reviewStats._avg.rating != null
        ? Math.round(reviewStats._avg.rating * 10) / 10
        : null;

    return {
      ...venue,
      avgRating,
      reviewsCount: reviewStats._count,
    };
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

  async getBlocksForDate(venueId: string, date: string) {
    const day = new Date(date);
    if (Number.isNaN(day.getTime())) return [];

    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);

    return this.prisma.block.findMany({
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
        reason: true,
      },
    });
  }

  async createBlock(
    providerId: string,
    venueId: string,
    dto: CreateBlockDto,
  ) {
    const unit = await this.prisma.unit.findUnique({
      where: { id: dto.unitId },
      include: { venue: true },
    });

    if (!unit || unit.venueId !== venueId)
      throw new NotFoundException('Unit not found');
    if (unit.venue.providerId !== providerId)
      throw new ForbiddenException('Not your venue');

    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()))
      throw new BadRequestException('Invalid block time');
    if (endAt <= startAt)
      throw new BadRequestException('Block end must be after start');
    if (startAt.toDateString() !== endAt.toDateString())
      throw new BadRequestException('Block cannot cross day boundary');

    const overlappingBooking = await this.prisma.booking.findFirst({
      where: {
        unitId: dto.unitId,
        status: { not: 'CANCELLED' },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { id: true },
    });
    if (overlappingBooking)
      throw new BadRequestException('Block overlaps an existing booking');

    const overlappingBlock = await this.prisma.block.findFirst({
      where: {
        unitId: dto.unitId,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { id: true },
    });
    if (overlappingBlock)
      throw new BadRequestException('Block overlaps an existing block');

    return this.prisma.block.create({
      data: {
        unitId: dto.unitId,
        startAt,
        endAt,
        reason: dto.reason?.trim() || null,
      },
    });
  }

  async createBooking(
    customerId: string,
    venueId: string,
    dto: CreateBookingDto,
  ) {
    const unit = await this.prisma.unit.findUnique({
      where: { id: dto.unitId },
    });
    if (!unit || unit.venueId !== venueId)
      throw new NotFoundException('Unit not found');

    const offering = await this.prisma.offering.findUnique({
      where: { id: dto.offeringId },
    });
    if (!offering || offering.venueId !== venueId)
      throw new NotFoundException('Offering not found');

    const startAt = new Date(dto.startAt);
    if (Number.isNaN(startAt.getTime()))
      throw new BadRequestException('Invalid start time');

    if (startAt <= new Date())
      throw new BadRequestException('Cannot book a slot in the past');

    const endAt = new Date(
      startAt.getTime() + offering.durationMin * 60_000,
    );

    if (startAt.toDateString() !== endAt.toDateString()) {
      throw new BadRequestException('Booking cannot cross day boundary');
    }

    const dayOfWeek = startAt.getDay();
    const schedules = await this.prisma.venueSchedule.findMany({
      where: { venueId, dayOfWeek },
    });
    if (!schedules.length)
      throw new BadRequestException('No working hours for this day');

    const startMin = startAt.getHours() * 60 + startAt.getMinutes();
    const endMin = endAt.getHours() * 60 + endAt.getMinutes();
    const fitsSchedule = schedules.some((entry) => {
      const scheduleStart = toMinutes(entry.startTime);
      const scheduleEnd = toMinutes(entry.endTime);
      return (
        !Number.isNaN(scheduleStart) &&
        !Number.isNaN(scheduleEnd) &&
        scheduleStart <= startMin &&
        scheduleEnd >= endMin
      );
    });

    if (!fitsSchedule)
      throw new BadRequestException('Slot is outside working hours');

    const overlappingBooking = await this.prisma.booking.findFirst({
      where: {
        unitId: dto.unitId,
        status: { not: 'CANCELLED' },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { id: true },
    });
    if (overlappingBooking)
      throw new BadRequestException('Slot is not available');

    const overlappingBlock = await this.prisma.block.findFirst({
      where: {
        unitId: dto.unitId,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { id: true },
    });
    if (overlappingBlock)
      throw new BadRequestException('Slot is not available');

    const booking = await this.prisma.booking.create({
      data: {
        unitId: dto.unitId,
        offeringId: dto.offeringId,
        customerId,
        startAt,
        endAt,
        status: 'CONFIRMED',
        partySize: dto.partySize ?? null,
        notes: dto.notes ?? null,
      },
      include: {
        unit: { include: { venue: { include: { provider: true } } } },
        offering: true,
        customer: true,
      },
    });

    const { unit: bookingUnit, customer } = booking;
    const venue = bookingUnit.venue;
    const provider = venue.provider;

    this.notifications.createNewBooking(
      provider.id,
      venue.id,
      venue.name,
      bookingUnit.name,
      booking.id,
      startAt,
    ).catch(() => {});

    return booking;
  }

  listCustomerBookings(customerId: string) {
    return this.prisma.booking.findMany({
      where: { customerId },
      orderBy: { startAt: 'asc' },
      include: {
        unit: {
          select: {
            id: true,
            name: true,
            venue: { select: { id: true, name: true, city: true, address: true } },
          },
        },
        offering: {
          select: {
            id: true,
            name: true,
            durationMin: true,
            price: true,
          },
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async createReview(
    customerId: string,
    bookingId: string,
    dto: CreateReviewDto,
  ) {
    if (!dto.rating || dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { unit: { include: { venue: true } }, review: true },
    });
    if (!booking || booking.customerId !== customerId)
      throw new NotFoundException('Booking not found');
    if (booking.review)
      throw new BadRequestException('Review already submitted');
    if (booking.endAt > new Date())
      throw new BadRequestException('Booking not completed yet');

    const existingReview = await this.prisma.review.findFirst({
      where: {
        venueId: booking.unit.venueId,
        authorId: customerId,
      },
      select: { id: true },
    });
    if (existingReview)
      throw new BadRequestException('You have already reviewed this venue');

    return this.prisma.review.create({
      data: {
        bookingId,
        venueId: booking.unit.venueId,
        authorId: customerId,
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
      },
    });
  }

  async cancelBooking(customerId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        unit: { include: { venue: { include: { provider: true } } } },
        customer: true,
      },
    });
    if (!booking || booking.customerId !== customerId)
      throw new NotFoundException('Booking not found');
    if (booking.status === 'CANCELLED')
      throw new BadRequestException('Booking is already cancelled');
    if (booking.startAt <= new Date())
      throw new BadRequestException('Cannot cancel a past booking');

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    });

    const venue = booking.unit.venue;
    const provider = venue.provider;

    this.notifications.createBookingCancelled(
      customerId,
      venue.id,
      venue.name,
      booking.startAt,
    ).catch(() => {});

    this.notifications.createBookingCancelled(
      provider.id,
      venue.id,
      venue.name,
      booking.startAt,
    ).catch(() => {});

    return this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
  }
}

function toMinutes(time: string) {
  const [h, m] = time.split(':').map((v) => Number(v));
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
  return h * 60 + m;
}
