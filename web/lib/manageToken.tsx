'use server';

import { cookies } from 'next/headers';

export async function getToken() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get('auth_token');
  return cookieValue || null;
}

export async function deleteToken() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.nduboi.fr;";
}
