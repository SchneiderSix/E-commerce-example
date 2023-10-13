import { RateLimiter } from "limiter";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import validator from "validator";
import { pool } from "../../../../credentials";
import { ResultSetHeader, RowDataPacket } from "mysql2";

//set rate limit
const rateLimiter = new RateLimiter({
  tokensPerInterval: 5, //max tokens per interval
  interval: 'second' //time
});

export async function GET(
  req: Request
) {
  //check rate
  if (!rateLimiter.tryRemoveTokens(1)) {
    return NextResponse.json({message: 'Too many requests'}, {status: 429});
  }
  //headers validation
  const reqId = headers().get('id');

  if (!reqId) return NextResponse.json({message: 'Invalid parameters'}, {status: 403});

  if(
    !validator.isEmpty(reqId) &&
    validator.isAlphanumeric(reqId)
  ) {
    try {
      //mysql connection
      const promisePool = pool.promise();
      const query = "SELECT * FROM `db-ticket`.product WHERE `db-ticket`.`product`.`id` = ?;";
      const [rows, fields] = await promisePool.query<RowDataPacket[]>(query, [
        reqId
      ]);

      if (rows.length === 1) {
        return NextResponse.json({message: rows}, {status: 200});
      } else {
        return NextResponse.json({message: 'Error'}, {status: 409});
      }
    } catch (error) {
      return NextResponse.json({message: 'Internal server error'}, {status: 500});
    }
  } else {
    return NextResponse.json({message: 'Invalid parameters'}, {status: 403});
  }
}