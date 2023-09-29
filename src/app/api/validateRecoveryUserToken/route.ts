import { RateLimiter } from "limiter";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { pool } from "../../../../credentials";
import validator from "validator";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { hashSync } from "bcrypt";

//auxiliary - check if email exists
const checkIfEmailExists = async (email: string): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    //mysql connection
    const promisePool = pool.promise();
    const query = "SELECT `db-ticket`.`user`.`email` FROM  `db-ticket`.`user` WHERE `email`= ?;";
    const [rows, fields] = await promisePool.query(query, [
      email
    ]);

    if (JSON.stringify(rows).includes(email)) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
}

//auxiliary - check token date and if it exists
const checkTokenDate = async (email: string, token: string): Promise<boolean> => {
  return new Promise<boolean>(async (resolve, reject) => {
    //mysql connection
    const promisePool = pool.promise();
    const query = "SELECT `db-ticket`.`user`.`token` FROM `db-ticket`.`user` WHERE `email`= ?";
    const [rows, fields] = await promisePool.query<RowDataPacket[]>(query, [
      email
    ]);

    const tokenDate = rows[0].token.token[1];
  
    //if token exists check date, if not exists resolve true
    if (tokenDate === token) {
      const today = new Date().getTime();
      tokenDate > today ? resolve(false) : resolve(true);
    } else {
      resolve(true);
    }
  });
}

//set rate limit
const rateLimiter = new RateLimiter({
  tokensPerInterval: 10, //max tokens per interval
  interval: 'minute'  //time
})

export async function POST(
  req: Request
) {
  //check rate
  if (!rateLimiter.tryRemoveTokens(1)){
    return NextResponse.json({message: 'Too many requests'}, {status: 429});
  }
  //headers validation
  const reqEmail = headers().get('email');
  const reqPass = headers().get('pass');
  const reqToken = headers().get('token');

  //check if headers are null
  if (!reqEmail || !reqPass || !reqToken) {
    return NextResponse.json({message: 'Invalid parameters'}, {status: 401});
  }

  if (
    !validator.isEmpty(reqEmail) && 
    !validator.isEmpty(reqPass) && 
    !validator.isEmpty(reqToken) && 
    validator.isEmail(reqEmail) && 
    validator.isAlphanumeric(reqPass) && 
    validator.isAlphanumeric(reqToken)) {
    try {
      //check if email exists
      const checkEmail = await checkIfEmailExists(reqEmail);
      if (!checkEmail) {
        return NextResponse.json({message: 'Email isn\'t registered'}, {status: 401});
      }
      //check expiration date from token
      const checkTok = await checkTokenDate(reqEmail, reqToken);
      if (checkTok) {
        return NextResponse.json({message: 'Token expired or invalid'}, {status: 401});
      }
      //hash new pass
      const hashedPass = hashSync(reqPass, 10);
      //mysql connection
      const promisePool = pool.promise();
      const query = "UPDATE `db-ticket`.`user` SET `password`= ?, `status` = 'activated' WHERE `email`= ?;";
      const [rows, fields] = await promisePool.query<ResultSetHeader>(query, [
        hashedPass,
        reqEmail
      ]);

      if (rows.affectedRows === 1) {
        return NextResponse.json({message: 'Success, password updated'}, {status: 200});
      } else {
        return NextResponse.json({message: 'Error'}, {status: 409});
      }
    } catch (error) {
      console.error(error);
      return NextResponse.json({message: 'Internal server error'}, {status: 500});
    }
  } else {
    return NextResponse.json({message: 'Invalid parameters'}, {status: 403});
  }
}