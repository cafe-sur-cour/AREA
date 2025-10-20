import { NextResponse, NextRequest } from 'next/server'
import api from './lib/api';
import { User } from './types/user';

async function getUserData() : Promise<{isLog : boolean, isAdmin : boolean} | null>
{
  try {
    const data = await api.get<User>({endpoint: "/user/me"});
    return {isAdmin: data.data?.is_admin ?? false, isLog : true};
  } catch {
    return null;
  }
}

const pathConf : {route : string, isAdmin ?: boolean, isLog ?: boolean}[] = [
  {route : "/admin", isAdmin : true, isLog : true},
  {route : "/dashboard", isAdmin : false, isLog : true},
  {route : "/my-areas", isAdmin : false, isLog : true},
  {route : "/services ", isAdmin : false, isLog : true},
];

export async function middleware(request: NextRequest) {
  for (const config of pathConf) {
    if (request.url.includes(config.route)) {
      const data = await getUserData();
      if (data == null || ((config.isAdmin && !data.isAdmin) || (!config.isLog && data.isLog))) {
        console.error("Access denied, please login with correct authorizations!");
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  runtime: 'nodejs',
}