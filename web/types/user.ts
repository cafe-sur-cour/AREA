import { Roles } from './role';

export interface User {
  id: number;
  username: string;
  email: string;
  role: Roles;
  userImage?: string;
}
