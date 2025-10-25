import {getRequestConfig} from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get('i18next')?.value ?? 'en';

  // List the namespaces/files you want to load
  const namespaces = ['common', 'home'];

  const messages = Object.fromEntries(
    await Promise.all(
      namespaces.map(async (ns) => {
        try {
          const mod = await import(`../messages/${locale}/${ns}.json`);
          return [ns, mod.default] as const;
        } catch {
          const fallback = await import(`../messages/en/${ns}.json`);
          return [ns, fallback.default] as const;
        }
      })
    )
  );

  return { locale, messages };
});