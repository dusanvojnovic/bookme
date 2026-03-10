import { Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { NotificationsService } from './notifications.service';

export interface AuthUser {
  id: string;
  role: string;
}

@Controller('notifications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('CUSTOMER', 'PROVIDER')
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  list(
    @Req() req: Request & { user: AuthUser },
    @Query('limit') limit?: string,
  ) {
    return this.notifications.list(req.user.id, limit ? parseInt(limit, 10) : 50);
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: Request & { user: AuthUser }) {
    const count = await this.notifications.getUnreadCount(req.user.id);
    return { count };
  }

  @Patch('read-all')
  markAllAsRead(@Req() req: Request & { user: AuthUser }) {
    return this.notifications.markAllAsRead(req.user.id);
  }

  @Patch(':id/read')
  markAsRead(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
  ) {
    return this.notifications.markAsRead(req.user.id, id);
  }
}
