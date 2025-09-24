import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    auth?: {
      id: number;
      email: string;
      is_admin: boolean;
    };
  }
}
