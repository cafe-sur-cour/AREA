'use server';

import { cookies } from 'next/headers';

export async function getToken() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get('auth_token');
  return cookieValue || null;
}
