import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FavoritesService } from './favorites.service';
import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';

@Module({
  controllers: [VenuesController],
  providers: [VenuesService, FavoritesService, PrismaService],
})
export class VenuesModule {}
