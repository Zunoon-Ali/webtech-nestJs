import { Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all in-app notifications for the current user' })
  getAll(@CurrentUser() user: User) {
    return this.svc.getForUser(user.id);
  }

  @Patch('read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markRead(@CurrentUser() user: User) {
    this.svc.markAllRead(user.id);
    return { success: true };
  }
}
