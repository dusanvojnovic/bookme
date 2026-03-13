import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateUnitDto, UpdateUnitDto } from './dto/create-unit.dto';
import { CreateVenueDto } from './dto/create-venue.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateOfferingDto, UpdateOfferingDto } from './dto/offering.dto';
import { CreateBlockDto } from './dto/create-block.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { UpdateVenueScheduleDto } from './dto/update-venue-schedule.dto';
import { FavoritesService } from './favorites.service';
import { VenuesService } from './venues.service';

export interface AuthUser {
  id: string;
  role: string;
}

@Controller()
export class VenuesController {
  constructor(
    private venues: VenuesService,
    private favorites: FavoritesService,
  ) {}

  // PUBLIC
  @Get('venues')
  listPublic(
    @Query('category') category?: string,
    @Query('city') city?: string,
    @Query('q') q?: string,
  ) {
    return this.venues.listPublic(category, city, q);
  }

  @Get('venues/:id')
  getOne(@Param('id') id: string) {
    return this.venues.getById(id);
  }

  @Get('venues/:id/bookings')
  getBookings(
    @Param('id') id: string,
    @Query('date') date: string,
  ) {
    return this.venues.getBookingsForDate(id, date);
  }

  @Get('venues/:id/blocks')
  getBlocks(
    @Param('id') id: string,
    @Query('date') date: string,
  ) {
    return this.venues.getBlocksForDate(id, date);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CUSTOMER')
  @Post('venues/:id/bookings')
  createBooking(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
    @Body() dto: CreateBookingDto,
  ) {
    return this.venues.createBooking(req.user.id, id, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CUSTOMER')
  @Get('customer/bookings')
  listCustomerBookings(@Req() req: Request & { user: AuthUser }) {
    return this.venues.listCustomerBookings(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CUSTOMER')
  @Get('customer/favorites')
  listFavorites(@Req() req: Request & { user: AuthUser }) {
    return this.favorites.list(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CUSTOMER')
  @Post('customer/favorites/:venueId')
  addFavorite(
    @Req() req: Request & { user: AuthUser },
    @Param('venueId') venueId: string,
  ) {
    return this.favorites.add(req.user.id, venueId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CUSTOMER')
  @Delete('customer/favorites/:venueId')
  removeFavorite(
    @Req() req: Request & { user: AuthUser },
    @Param('venueId') venueId: string,
  ) {
    return this.favorites.remove(req.user.id, venueId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CUSTOMER')
  @Patch('customer/bookings/:id/cancel')
  cancelBooking(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
  ) {
    return this.venues.cancelBooking(req.user.id, id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CUSTOMER')
  @Post('customer/bookings/:id/review')
  createReview(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.venues.createReview(req.user.id, id, dto);
  }

  // PROVIDER
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('PROVIDER')
  @Get('provider/venues')
  listMine(@Req() req: Request & { user: AuthUser }) {
    return this.venues.listMine(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('PROVIDER')
  @Get('provider/bookings')
  listProviderBookings(
    @Req() req: Request & { user: AuthUser },
    @Query('status') status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED',
  ) {
    return this.venues.listProviderBookings(req.user.id, status);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('PROVIDER')
  @Patch('provider/bookings/:id/approve')
  approveBooking(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
  ) {
    return this.venues.approveBooking(req.user.id, id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('PROVIDER')
  @Patch('provider/bookings/:id/reject')
  rejectBooking(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
  ) {
    return this.venues.rejectBooking(req.user.id, id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('PROVIDER')
  @Post('provider/venue')
  create(
    @Req() req: Request & { user: AuthUser },
    @Body() dto: CreateVenueDto,
  ) {
    return this.venues.create(req.user.id, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('PROVIDER')
  @Patch('provider/venues/:id')
  update(@Req() req: any, @Body() dto: UpdateVenueDto) {
    return this.venues.update(req.user.id, req.params.id, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('PROVIDER')
  @Delete('provider/venues/:id')
  remove(@Req() req: any) {
    return this.venues.remove(req.user.id, req.params.id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('PROVIDER')
  @Post('provider/venues/:id/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dest = join(process.cwd(), 'uploads');
          if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
          cb(null, dest);
        },
        filename: (req, file, cb) => {
          const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
          const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
          cb(null, `venue-${(req as any).params.id}-${Date.now()}.${safeExt}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new BadRequestException('Only images (JPEG, PNG, WebP, GIF) allowed'), false);
      },
    }),
  )
  uploadImage(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.venues.uploadImage(req.user.id, id, file);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('PROVIDER')
  @Delete('provider/venues/:id/image')
  removeImage(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
  ) {
    return this.venues.removeImage(req.user.id, id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('PROVIDER')
  @Post('provider/venues/:id/units')
  createUnit(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
    @Body() dto: CreateUnitDto,
  ) {
    return this.venues.createUnit(req.user.id, id, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('PROVIDER')
  @Post('provider/venues/:id/blocks')
  createBlock(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
    @Body() dto: CreateBlockDto,
  ) {
    return this.venues.createBlock(req.user.id, id, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('PROVIDER')
  @Patch('provider/venues/:venueId/units/:unitId')
  updateUnit(
    @Req() req: Request & { user: AuthUser },
    @Param('venueId') venueId: string,
    @Param('unitId') unitId: string,
    @Body() dto: UpdateUnitDto,
  ) {
    return this.venues.updateUnit(req.user.id, venueId, unitId, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('PROVIDER')
  @Delete('provider/venues/:venueId/units/:unitId')
  removeUnit(
    @Req() req: Request & { user: AuthUser },
    @Param('venueId') venueId: string,
    @Param('unitId') unitId: string,
  ) {
    return this.venues.removeUnit(req.user.id, venueId, unitId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('PROVIDER')
  @Patch('provider/venues/:id/schedule')
  updateSchedule(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
    @Body() dto: UpdateVenueScheduleDto,
  ) {
    return this.venues.updateSchedule(req.user.id, id, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('PROVIDER')
  @Post('provider/venues/:id/offerings')
  createOffering(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
    @Body() dto: CreateOfferingDto,
  ) {
    return this.venues.createOffering(req.user.id, id, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('PROVIDER')
  @Patch('provider/venues/:venueId/offerings/:offeringId')
  updateOffering(
    @Req() req: Request & { user: AuthUser },
    @Param('venueId') venueId: string,
    @Param('offeringId') offeringId: string,
    @Body() dto: UpdateOfferingDto,
  ) {
    return this.venues.updateOffering(req.user.id, venueId, offeringId, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('PROVIDER')
  @Delete('provider/venues/:venueId/offerings/:offeringId')
  removeOffering(
    @Req() req: Request & { user: AuthUser },
    @Param('venueId') venueId: string,
    @Param('offeringId') offeringId: string,
  ) {
    return this.venues.removeOffering(req.user.id, venueId, offeringId);
  }
}
