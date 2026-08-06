import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { PushService } from './push.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @UseGuards(AuthGuard)
  @Post('subscribe')
  async subscribe(@CurrentUser() user: any, @Body() body: { subscription: any }) {
    return this.pushService.saveSubscription(user.id, body.subscription);
  }

  @Post('notify')
  async notify(@Body() body: { user_id: string; title: string; body: string; email?: string }) {
    return this.pushService.sendNotification(body);
  }
}
