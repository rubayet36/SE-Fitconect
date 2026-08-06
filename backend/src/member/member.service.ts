import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class MemberService {
  constructor(private supabaseService: SupabaseService) {}

  async getDashboard(userId: string) {
    const supabase = this.supabaseService.getClient();

    const [profileRes, routinesRes, dietRes, bookmarksRes, requestsRes, noticesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('routines').select('*').eq('member_id', userId),
      supabase.from('diet_plans').select('*').eq('member_id', userId),
      supabase.from('bookmarks').select('*').eq('user_id', userId),
      supabase.from('requests').select('*').eq('member_id', userId).order('created_at', { ascending: false }),
      supabase.from('gym_notices').select('*').order('created_at', { ascending: false }).limit(5),
    ]);

    return {
      profile: profileRes.data || null,
      routinesCount: routinesRes.data?.length || 0,
      dietCount: dietRes.data?.length || 0,
      bookmarksCount: bookmarksRes.data?.length || 0,
      recentRequests: requestsRes.data || [],
      notices: noticesRes.data || [],
    };
  }

  async getMyPlan(userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data: routines, error } = await supabase
      .from('routines')
      .select('*')
      .eq('member_id', userId)
      .order('order_index', { ascending: true });

    if (error) throw new BadRequestException(error.message);
    return routines || [];
  }

  async getDiet(userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data: dietPlans, error } = await supabase
      .from('diet_plans')
      .select('*')
      .eq('member_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw new BadRequestException(error.message);
    return dietPlans || [];
  }

  async getBookmarks(userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data: bookmarks, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return bookmarks || [];
  }

  async addBookmark(userId: string, body: { exercise_db_id: string; exercise_name: string; exercise_gif?: string }) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: userId,
        exercise_db_id: body.exercise_db_id,
        exercise_name: body.exercise_name,
        exercise_gif: body.exercise_gif || null,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async removeBookmark(userId: string, exerciseDbId: string) {
    const supabase = this.supabaseService.getClient();
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('exercise_db_id', exerciseDbId);

    if (error) throw new BadRequestException(error.message);
    return { success: true };
  }

  async getRequests(userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data: requests, error } = await supabase
      .from('requests')
      .select('*, trainer:trainer_id(full_name, email)')
      .eq('member_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return requests || [];
  }

  async createRequest(userId: string, body: { trainer_id: string; request_type: 'diet' | 'workout' | 'both'; notes?: string }) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('requests')
      .insert({
        member_id: userId,
        trainer_id: body.trainer_id,
        request_type: body.request_type,
        notes: body.notes || '',
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getTrainers() {
    const supabase = this.supabaseService.getClient();
    const { data: trainers, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .eq('role', 'trainer');

    if (error) throw new BadRequestException(error.message);
    return trainers || [];
  }
}
