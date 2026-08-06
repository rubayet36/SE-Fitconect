import { Controller, Get } from '@nestjs/common';
import { TimetableService } from './timetable.service';

@Controller('timetable')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Get()
  async getTimetable() {
    return this.timetableService.getTimetable();
  }
}
