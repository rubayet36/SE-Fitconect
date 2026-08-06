import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class TimetableService {
  constructor(private supabaseService: SupabaseService) {}

  async getTimetable() {
    const supabase = this.supabaseService.getClient();
    const { data: timetable, error } = await supabase
      .from('gym_timetable')
      .select('id, day_label, open_time, close_time, is_closed')
      .eq('is_closed', false)
      .order('display_order', { ascending: true });

    if (error) throw new BadRequestException(error.message);
    return timetable || [];
  }
}
