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
  const reqTitle = headers().get('title');
  const reqMinPage = headers().get('minPage');
  const reqMaxPage = headers().get('maxPage');

  if (!reqTitle || !reqMinPage || !reqMaxPage) return NextResponse.json({message: 'Invalid parameters'}, {status: 403});

  if(
    !validator.isEmpty(reqTitle) &&
    !validator.isEmpty(reqMinPage) &&
    !validator.isEmpty(reqMaxPage) &&
    validator.isAlphanumeric(reqTitle) &&
    validator.isNumeric(reqMinPage) &&
    validator.isNumeric(reqMaxPage)
  ) {
    try {
      //mysql connection
      const promisePool = pool.promise();
      const query = "SELECT `db-ticket`.`product`.`id`,  `db-ticket`.`product`.`title`, `db-ticket`.`product`.`quantity`, `db-ticket`.`product`.`price`, `db-ticket`.`product`.`image`, `db-ticket`.`product`.`description` FROM `db-ticket`.`product` WHERE `db-ticket`.`product`.`title` LIKE CONCAT('%', ?,  '%') ORDER BY `db-ticket`.`product`.`id` DESC LIMIT ?, ?;";
      const [rows, fields] = await promisePool.query<RowDataPacket[]>(query, [
        reqTitle,
        parseInt(reqMinPage),
        parseInt(reqMaxPage)
      ]);

      if (rows.length >= 1) {
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