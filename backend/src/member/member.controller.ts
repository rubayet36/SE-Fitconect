import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { MemberService } from './member.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@UseGuards(AuthGuard)
@Controller('member')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Get('dashboard')
  async getDashboard(@CurrentUser() user: any) {
    return this.memberService.getDashboard(user.id);
  }

  @Get('my-plan')
  async getMyPlan(@CurrentUser() user: any) {
    return this.memberService.getMyPlan(user.id);
  }

  @Get('diet')
  async getDiet(@CurrentUser() user: any) {
    return this.memberService.getDiet(user.id);
  }

  @Get('bookmarks')
  async getBookmarks(@CurrentUser() user: any) {
    return this.memberService.getBookmarks(user.id);
  }

  @Post('bookmarks')
  async addBookmark(
    @CurrentUser() user: any,
    @Body() body: { exercise_db_id: string; exercise_name: string; exercise_gif?: string },
  ) {
    return this.memberService.addBookmark(user.id, body);
  }

  @Delete('bookmarks/:exerciseDbId')
  async removeBookmark(
    @CurrentUser() user: any,
    @Param('exerciseDbId') exerciseDbId: string,
  ) {
    return this.memberService.removeBookmark(user.id, exerciseDbId);
  }

  @Get('requests')
  async getRequests(@CurrentUser() user: any) {
    return this.memberService.getRequests(user.id);
  }

  @Post('requests')
  async createRequest(
    @CurrentUser() user: any,
    @Body() body: { trainer_id: string; request_type: 'diet' | 'workout' | 'both'; notes?: string },
  ) {
    return this.memberService.createRequest(user.id, body);
  }

  @Get('trainers')
  async getTrainers() {
    return this.memberService.getTrainers();
  }
}
