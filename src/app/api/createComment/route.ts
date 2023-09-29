//first add normal comment, second add nested comments
//UPDATE `db-ticket`.`product` SET `comments` = CASE WHEN `comments` IS NULL THEN JSON_ARRAY('{1: [{marcelo: primer comentario}]}') ELSE JSON_ARRAY_APPEND(`comments`, '$', '{2: [{mario: segundo comentario}]}') END WHERE `db-ticket`.`product`.`id` = 'lkbpluq8pq2vz03k0q7vz7jhufo0xj0hk61wr2oiz1iz5ay';

//UPDATE `db-ticket`.`product` SET `comments` = JSON_ARRAY_APPEND(`db-ticket`.`product`.`comments`, '$[0]', '{sergio: comentario del primer comentario}') WHERE `db-ticket`.`product`.`id` = 'lkbpluq8pq2vz03k0q7vz7jhufo0xj0hk61wr2oiz1iz5ay';
import { RateLimiter } from "limiter";
import validator from "validator";
import {headers} from "next/headers";
import { NextResponse } from "next/server";
import { pool } from "../../../../credentials";
import { ResultSetHeader } from "mysql2";

//auxiliary - check if product exists
const checkkIfProductExists = async(id: string) : Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    //mysql connection
    const promisePool = pool.promise();
    const query = "SELECT `db-ticket`.`product`.`id` FROM  `db-ticket`.`user` WHERE `id`= ?;";
    const [rows, fields] = await promisePool.query(query, [
      id
    ]);

    //true if exists
    if (JSON.stringify(rows).includes(id)) resolve(true);
      else resolve(false);
  });
}

//auxiliary - check if name exists
const checkIfNameExists = async (name: string): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    //mysql connection
    const promisePool = pool.promise();
    const query = "SELECT `db-ticket`.`user`.`name` FROM  `db-ticket`.`user` WHERE `name`= ?;";
    const [rows, fields] = await promisePool.query(query, [
      name
    ]);

    if (JSON.stringify(rows).includes(name)) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
}

//set rate limit
const rateimiter = new RateLimiter({
  tokensPerInterval: 3, //max tokens per interval
  interval: 'minute' //time
});

export async function POST(
  req: Request
) {

  //check rate
  if(!rateimiter.tryRemoveTokens(1)) {
    return NextResponse.json({message: 'Too many requests'}, {status: 429});
  }

  //headers validation
  const reqProductId = headers().get('id');
  const reqUserName = headers().get('name');
  const reqMessage = headers().get('message');
  const reqNestedMessageIdx = headers().get('nested');

  //check if headers are null
  if (!reqProductId || !reqUserName || !reqMessage || !reqNestedMessageIdx) {
    return NextResponse.json({message: 'Invalid parameters'}, {status: 403});
  }

  if(
    !validator.isEmpty(reqProductId) &&
    !validator.isEmpty(reqUserName) &&
    !validator.isEmpty(reqMessage) &&
    !validator.isEmpty(reqNestedMessageIdx) &&
    validator.isAlphanumeric(reqProductId) &&
    validator.isAlphanumeric(reqUserName) &&
    validator.isAlphanumeric(reqMessage.replace(/[^a-zA-Z0-9]/g, '')) &&
    validator.isAlphanumeric(reqNestedMessageIdx)
  ) {
    try {

      //check if product exists
      const checkProduct = checkkIfProductExists(reqProductId);
      if (!checkProduct) return NextResponse.json({message: 'Product doesn\'t exists'}, {status: 401});

      //check if name exists
      const checkName = checkIfNameExists(reqUserName);
      if (!checkName) return NextResponse.json({message: 'Name doesn\'t exists'}, {status: 401});

      //if reqNestedMessageIdx === 'x' then create message, if reqNestedMessageIdx is number then append nested message
      if (reqNestedMessageIdx === 'x') {

        //create date for comment
        const currentDate = new Date().getTime();
        
        //mysql connection
        const promisePool = pool.promise();
        const query = "UPDATE `db-ticket`.`product` SET `comments` = CASE WHEN `comments` IS NULL THEN JSON_ARRAY(?) ELSE JSON_ARRAY_APPEND(`comments`, '$', ?) END WHERE `db-ticket`.`product`.`id` = ?;";
        const [rows] = await promisePool.query<ResultSetHeader>(query, [
          JSON.stringify({ [currentDate]: [{ [reqUserName]: reqMessage }] }),
          JSON.stringify({ [currentDate]: [{ [reqUserName]: reqMessage }] }),
          reqProductId
        ]);

        if (rows.affectedRows === 1) return NextResponse.json({message: 'Success'}, {status: 200});
          else return NextResponse.json({message: 'Error'}, {status: 409});

      } else {
        
        //create date for comment
        const currentDate = new Date().getTime();
        
        //mysql connection
        const promisePool = pool.promise();
        const query = "UPDATE `db-ticket`.`product` SET `comments` = JSON_ARRAY_APPEND(`db-ticket`.`product`.`comments`, '$["+reqNestedMessageIdx+"]', ?) WHERE `db-ticket`.`product`.`id` = ?;";
        const [rows, fields] = await promisePool.query<ResultSetHeader>(query, [
          //reqNestedMessageIdx,
          JSON.stringify({ [currentDate]: [{ [reqUserName]: reqMessage }] }),
          reqProductId
        ]);

        if (rows.affectedRows === 1) return NextResponse.json({message: 'Success'}, {status: 200});
          else return NextResponse.json({message: 'Error'}, {status: 409});
      }
    } catch (error) {
      return NextResponse.json({message: 'Internal server error'}, {status: 500});
    }
  } else {
    return NextResponse.json({message: 'Invalid parameters'}, {status: 403});
  }
}
