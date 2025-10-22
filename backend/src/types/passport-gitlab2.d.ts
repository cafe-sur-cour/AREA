declare module 'passport-gitlab2' {
  import { Strategy as PassportStrategy } from 'passport-strategy';

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    passReqToCallback?: boolean;
  }

  export class Strategy extends PassportStrategy {
    constructor(options: StrategyOptions, verify: Function);
  }

  export { Strategy as default };
}
