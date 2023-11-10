import { pool, secret } from "../credentials";
import { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials'
import validator from 'validator';
import { compare } from 'bcrypt';
import { getSession } from 'next-auth/react';
import mysql, { RowDataPacket } from 'mysql2';

//auxiliary - check user's status
const getStatus = async (email: string): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    //mysql connection
    const promisePool = pool.promise();
    const query = "SELECT `db-ticket`.`user`.`status` FROM  `db-ticket`.`user` WHERE `email`=?;";
    const [rows, fields] = await promisePool.query<RowDataPacket[]>(query, [
      email
    ]);
  
    const status = rows[0].status;
  
    status === 'activated' ? resolve(true) : resolve(false);
  });
}

//auxiliary - get user's pass from database
const getUser = async (email: string): Promise<{email: string, password: string, id: string, name: string}>=>{
  return new Promise(async (resolve, reject) => {
    //mysql connection
    const promisePool = pool.promise();
    const query = "SELECT `db-ticket`.`user`.`password`, `db-ticket`.`user`.`id`, `db-ticket`.`user`.`name` FROM  `db-ticket`.`user` WHERE `email`=?;";
    const [rows, fields] = await promisePool.query<RowDataPacket[]>(query, [
      email
    ]);

    const pass = rows[0]?.password;
    const id = rows[0]?.id;
    const name = rows[0]?.name;
  
    rows.length > 0 ? resolve({email, password: pass, id, name}) : resolve({email: '', password: '', id: '', name: ''});
  });
}

export const authOptions: NextAuthOptions = {
  // Log the environment variables
  debug: true,
  logger: {
    error(code, ...message) {
      console.error(code, ...message)
    },
    warn(code, ...message) {
      console.warn(code, ...message)
    },
    debug(code, ...message) {
      if (code === 'configuration') {
        console.log('NEXTAUTH_URL', process.env.NEXTAUTH_URL as string)
        console.log('NEXTAUTH_SECRET', process.env.NEXTAUTH_SECRET as string)
        // Log other environment variables here...
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET as string,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {label: "Email", type: "text"},
        password: {label: "Password", type: "password"}
      },
      async authorize(credentials, req){
        //validate credentials
        if (credentials?.email === null || credentials?.password === null || validator.isEmpty(credentials!.email) || validator.isEmpty(credentials!.password) || !validator.isEmail(credentials!.email) || !validator.isAlphanumeric(credentials!.password)){
          return null;
        }
        //check if user exists in db
        const user = await getUser(credentials!.email)
       if (user.email !== '' && credentials) {
        //check hashed password
        const passMatched = await compare(credentials.password, user.password);

        //check user's status
        const status = await getStatus(credentials.email);
        //check if user has already a session return null
        const existingSession = await getSession({req});
        if (existingSession?.user?.email === credentials.email) {
          return null;
        }

        //if user's status is deactivated
        if (status === false) {
          return null;
        }
        //if password comparation is true
        //save the user id into email property from User interface
        return passMatched ? {id: user.id, name: user.name, email: user.email, } as User: null;
       } else {
        return null;
       }
      }
    })
  ],
  session: {
    // Configure session options here
    maxAge: 60 * 60 * 24 * 2, // Maximum session age in seconds
    updateAge: 60 * 60, // Session update age in seconds
  },
  callbacks: {
    async jwt({token, user, trigger, session}) {
      if (trigger === 'update') {
        token.shoppingList = session.user.shoppingList;
        return token;
      }
      if (user) {
        return {
          ...token,
          name: user.name,
          email: user.email,
          shoppingList: user.shoppingList
        }
      }
      return token;
    },
    session({session, token, user}) {
      return {
        ...session,
        user: {
          ...session.user,
          shoppingList: token.shoppingList
        }
      }

      return session;
    },
  }
  //hide token from browser
  /*
  cookies: {
    sessionToken: {
      name: 'sessionToken',
      options: {
        httpOnly: true
      }
    },
    callbackUrl: {
      name: 'callbackUrl',
      options: {
        httpOnly: true
      }
    }
  }
  */
}