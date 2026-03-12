import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createNewBooking(providerId: string, venueId: string, venueName: string, unitName: string, bookingId: string, startAt: Date) {
    const dateStr = startAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    return this.prisma.notification.create({
      data: {
        userId: providerId,
        type: 'NEW_BOOKING',
        title: `New booking: ${venueName}`,
        body: `${unitName} – ${dateStr}`,
        bookingId,
        venueId,
      },
    });
  }

  async createBookingConfirmed(
    customerId: string,
    bookingId: string,
    venueId: string,
    venueName: string,
    unitName: string,
    startAt: Date,
  ) {
    const dateStr = startAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    return this.prisma.notification.create({
      data: {
        userId: customerId,
        type: 'BOOKING_CONFIRMED',
        title: `Booking confirmed: ${venueName}`,
        body: `${unitName} – ${dateStr}`,
        bookingId,
        venueId,
      },
    });
  }

  async createBookingCancelled(
    userId: string,
    venueId: string | null,
    venueName: string,
    startAt: Date,
  ) {
    const dateStr = startAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    return this.prisma.notification.create({
      data: {
        userId,
        type: 'BOOKING_CANCELLED',
        title: `Booking cancelled: ${venueName}`,
        body: dateStr,
        venueId,
      },
    });
  }

  list(userId: string, limit = 50) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, readAt: null },
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const n = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!n) return null;
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
