import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateUnitDto } from './dto/create-unit.dto';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { UpdateVenueScheduleDto } from './dto/update-venue-schedule.dto';
import { VenuesService } from './venues.service';

export interface AuthUser {
  id: string;
  role: string;
}

@Controller()
export class VenuesController {
  constructor(private venues: VenuesService) {}

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

  // PROVIDER
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('PROVIDER')
  @Get('provider/venues')
  listMine(@Req() req: Request & { user: AuthUser }) {
    return this.venues.listMine(req.user.id);
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
  @Patch('provider/venues/:id/schedule')
  updateSchedule(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
    @Body() dto: UpdateVenueScheduleDto,
  ) {
    return this.venues.updateSchedule(req.user.id, id, dto);
  }
}
