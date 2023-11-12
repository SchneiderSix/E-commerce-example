import { RateLimiter } from "limiter";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import validator from "validator";
import { pool } from "../../../../credentials";
import { ResultSetHeader, RowDataPacket } from "mysql2";

//set rate limit
const rateLimiter = new RateLimiter({
  tokensPerInterval: 10, //max tokens per interval
  interval: 'minute' //time
});

export async function POST(
  req: Request
) {
  //check rate
  if (!rateLimiter.tryRemoveTokens(1)) {
    return NextResponse.json({message: 'Too many requests'}, {status: 429});
  }
  //headers validation
  const reqProductId = headers().get('productId');

  if (!reqProductId) return NextResponse.json({message: 'Invalid parameters'}, {status: 403});

  if(
    !validator.isEmpty(reqProductId) &&
    validator.isAlphanumeric(reqProductId)
  ) {
    try {
      //mysql connection
      const promisePool = pool.promise();
      const query = "DELETE FROM `db-ticket`.`product` WHERE `db-ticket`.`product`.`id` = ?;";
      const [rows, fields] = await promisePool.query<ResultSetHeader>(query, [
        reqProductId
      ]);

      if (rows.affectedRows === 1) {
        return NextResponse.json({message: 'Success'}, {status: 200});
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