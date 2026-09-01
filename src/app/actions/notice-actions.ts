'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function postNotice(title: string, body: string, type: 'info' | 'warning' | 'success') {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase.from('gym_notices').insert({
    title: title.trim(),
    body: body.trim(),
    type,
    created_by: user.id,
  })

  if (error) {
    return { error: error.message }
  }

  // Revalidate both paths to ensure UI updates across both portals
  revalidatePath('/owner/billboard')
  revalidatePath('/trainer/billboard')

  return { success: true }
}

export async function deleteNotice(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase.from('gym_notices').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  // Revalidate both paths
  revalidatePath('/owner/billboard')
  revalidatePath('/trainer/billboard')

  return { success: true }
}
