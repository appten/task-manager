import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username?: string;
      role?: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
    username?: string;
    role?: string;
  }

  interface Profile {
    sub?: string;
    name?: string;
    username?: string;
    preferred_username?: string;
    email?: string;
    email_verified?: boolean;
    role?: string;
    picture?: string;
    avatar?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    username?: string;
    role?: string;
  }
}
