import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gndfjrxlwhdezpabreej.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduZGZqcnhsd2hkZXpwYWJyZWVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NjY0NjAsImV4cCI6MjA5OTM0MjQ2MH0.JXxOoKHXjOcSnjyN0V4Z2AZlDTCVOGwRWYfmfkVef2o',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method is called from a Server Component.
          }
        },
      },
    }
  )
}
