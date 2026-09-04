import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { MemberModule } from './member/member.module';
import { TimetableModule } from './timetable/timetable.module';
import { PushModule } from './push/push.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SupabaseModule,
    AuthModule,
    MemberModule,
    TimetableModule,
    PushModule,
  ],
})
export class AppModule {}
