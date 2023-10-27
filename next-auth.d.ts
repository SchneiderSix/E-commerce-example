import NextAuth, { DefaultSession, DefaultUser, Session } from 'next-auth';

//modify default interfaces
interface Product { 
  [id: string] : {
    name: string,
    price: number,
    quantity: number
  }
}

interface CustomUser extends DefaultUser {
  shopList: Product[];
}

declare module 'next-auth' {
  interface User extends CustomUser {}
  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends CustomUser {}
}
