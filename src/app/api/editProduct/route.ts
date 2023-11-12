import { RateLimiter } from "limiter";
import validator from "validator";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { myAWS, pool } from "../../../../credentials";
import {PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {uid} from 'uid/single';
import { ResultSetHeader } from "mysql2";

//disable automatic body parser
//export const config = {
//  api: {
//    bodyParser: false
//  }
//}

//auxiliary - check if user id exists
const checkIfIdExists = async (id: string): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    //mysql connection
    const promisePool = pool.promise();
    const query = "SELECT `db-ticket`.`user`.`id` FROM  `db-ticket`.`user` WHERE `id`= ?;";
    const [rows, fields] = await promisePool.query(query, [
      id
    ]);

    if (JSON.stringify(rows).includes(id)) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
}

//auxiliary - check if title exists
const checkIfTitleExists = async (title: string): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    //mysql connection
    const promisePool = pool.promise();
    const query = "SELECT `db-ticket`.`product`.`title` FROM  `db-ticket`.`product` WHERE `title`= ?;";
    const [rows, fields] = await promisePool.query(query, [
      title
    ]);

    if (JSON.stringify(rows).includes(title)) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
}

//auxiliary - upload to s3
const uploadToS3 = async(file: Buffer, type: string) => {
  //s3 client and bucket name
  const s3 = myAWS.s3;
  const bucketName = myAWS.bucketName;

  //name for key object
  const fileName = Date.now().toString(36)+Math.random().toString(36).substring(2, 8)+uid(33)+'.'+type;
  try {
    const params = ({
      Bucket: bucketName,
      Key: fileName,
      Body: file,
    });
  
    const command = new PutObjectCommand(params);
    await s3.send(command);
    //url stored image
    return 'https://'+myAWS.bucketName+'.s3.'+myAWS.region+'.amazonaws.com/'+fileName; 

  } catch (error) {
    console.log('err');
    return null;
  }
}

//set rate limit
const rateLimiter = new RateLimiter({
  tokensPerInterval: 20, //max tokens per interval
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
  const reqUserId = headers().get('id');
  const reqTitle = headers().get('title');
  const reqQuantity = headers().get('quantity');
  const reqPrice = headers().get('price');
  const reqDescription = headers().get('description');

  //check if headers are null
  if (!reqUserId || !reqTitle || !reqQuantity || !reqPrice || !reqDescription || !reqProductId) {
    return NextResponse.json({message: 'Invalid parameters'}, {status: 403});
  }

  if(
    !validator.isEmpty(reqUserId) && 
    !validator.isEmpty(reqTitle) && 
    !validator.isEmpty(reqQuantity) && 
    !validator.isEmpty(reqPrice) && 
    !validator.isEmpty(reqDescription) &&
    !validator.isEmpty(reqProductId) &&
    //unneccesary
    /*validator.isAlphanumeric(reqUserId) && 
    validator.isAlphanumeric(reqTitle) && 
    validator.isNumeric(reqQuantity) && 
    validator.isNumeric(reqPrice) && 
    validator.isAlphanumeric((reqDescription).replace(/[^a-zA-Z0-9]/g, '')) &&*/
    reqDescription?.length <= 2000 &&
    parseInt(reqQuantity) >= 1 &&
    parseInt(reqPrice) >= 1
    ) {
    try {
      //check if user id exists
      const checkUserId = await checkIfIdExists(reqUserId);
      if (!checkUserId) return NextResponse.json({message: 'User doesn\'t exists'}, {status: 401});
      //check if title exists
      const checkTitle = await checkIfTitleExists(reqTitle);
      if (checkTitle) return NextResponse.json({message: 'Title already exists'}, {status: 401});
      //get body formData
      const formData = await req.formData();
      //take images as Blob
      const files = await formData.getAll('images') as Blob[];
      //if files are empty
      if (files.length === 0) return NextResponse.json({message: 'Invalid parameters'}, {status: 403});
      //urls images
      const urls = [];
      //loop through files
      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        //upload buffer image to s3
        const urlImage = await uploadToS3(buffer, file.type.substring(6));
        //add url to array
        if (urlImage !== null) {
          urls.push(urlImage);
        } else {
          //push null to check if upload failed and break loop
          urls.push(null);
          break;
        }
      }
      if (urls.includes(null) ) {
        return NextResponse.json({message: 's3 upload failed'}, {status: 409});
      } else {
        //mysql connection
        const promisePool = pool.promise();
        const query = "UPDATE `db-ticket`.`product` SET `title` = ?, `userId` = ?, `quantity` = ?, `price` = ?, `image` = ?, `description`= ? WHERE `db-ticket`.`product`.`id` = ?;";
        const [rows, fields] = await promisePool.query<ResultSetHeader>(query, [
          reqTitle,
          reqUserId,
          reqQuantity,
          reqPrice,
          JSON.stringify(urls),
          reqDescription,
          reqProductId
        ]);

        if (rows.affectedRows === 1) {
          return NextResponse.json({message: 'Success'}, {status: 200});
        } else {
          return NextResponse.json({message: 'Error'}, {status: 409});
        }
      }
    } catch (error) {
      return NextResponse.json({message: 'Internal server error'}, {status: 500});
    }
  } else {
    return NextResponse.json({message: 'Invalid parameters'}, {status: 403});
  }
}