'use server'

import { createClient } from '@/lib/supabase/server'

type NoticeType = 'info' | 'warning' | 'success'

export async function postNotice(
  title: string,
  body: string,
  type: NoticeType
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('gym_notices')
    .insert({ title, body, type } as any)

  if (error) return { error: error.message }
  return {}
}

export async function deleteNotice(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('gym_notices')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  return {}
}
