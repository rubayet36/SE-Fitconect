import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(private supabaseService: SupabaseService) {}

  async login(body: { email: string; password: string }) {
    const { email, password } = body;
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    // Fetch user profile role
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return {
      user: data.user,
      session: data.session,
      profile,
    };
  }

  async signup(body: { email: string; password: string; full_name?: string }) {
    const { email, password, full_name } = body;
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: full_name || '',
          role: 'member',
        },
      },
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  async getProfile(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new BadRequestException('Profile not found');
    }

    return profile;
  }
}
