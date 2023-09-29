import NextAuth, { DefaultSession, DefaultUser, Session } from 'next-auth';

//modify default interfaces
declare module 'next-auth' {
  interface User extends DefaultUser {
    userId: string;
  }

  interface Session {
    user: {
      shopList: {
        [key: string]: any
      }
    } & DefaultSession['user'];
  }
}
