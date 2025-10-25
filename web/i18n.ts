import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export default getRequestConfig(async () => {
  // Get locale from cookies or headers, default to 'en'
  const cookieStore = await cookies();
  const headersList = await headers();
  const locale = cookieStore.get('locale')?.value || 
                 headersList.get('x-locale') || 'en';

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
