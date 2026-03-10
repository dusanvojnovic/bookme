import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaService } from '../prisma/prisma.service';
import { FavoritesService } from './favorites.service';
import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';

@Module({
  imports: [NotificationsModule],
  controllers: [VenuesController],
  providers: [VenuesService, FavoritesService, PrismaService],
})
export class VenuesModule {}
