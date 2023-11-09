import { NextResponse } from "next/server";
import { headers } from "next/headers";
import  {  ResultSetHeader } from 'mysql2';
import { pool, myEmail } from '../../../../credentials';
import { hashSync } from 'bcrypt';
import {RateLimiter } from 'limiter';
import {uid} from 'uid/single';
import validator from "validator";
const nodemailer = require('nodemailer');


//auxiliary - send email
const sendEmail = async(token: string, emailTo: string) => {
  const transporter = nodemailer.createTransport({
    service: 'hotmail',
    auth: {
      user: myEmail.user,
      pass: myEmail.pass
    }
  });
  //url
  const siteUrl = 'http://' + headers().get('x-forwarded-host') +`/verificate/${token}`;
  const mailOptions = {
    from: myEmail.user,
    to: emailTo,
    subject: 'Verificate account',
    text: 'This is your token: '+token+'\n Click here: '+siteUrl
  };
  transporter.sendMail(mailOptions, function(err: unknown, info: unknown){
    return err ? false : true;
  });
}

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
const rateLimiter = new RateLimiter({
  tokensPerInterval: 5, //max tokens per interval
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
  const reqName = headers().get('name');

  //check if headers are null
  if (!reqEmail || !reqPass || !reqName) {
    return NextResponse.json({message: 'Invalid parameters'}, {status: 403});
  }
  
  if(
    !validator.isEmpty(reqEmail) && 
    !validator.isEmpty(reqPass) && 
    !validator.isEmpty(reqName) && 
    validator.isEmail(reqEmail) && 
    validator.isAlphanumeric(reqPass) && 
    validator.isAlphanumeric(reqName)
    ) {
    try {
      //create random id
      const userId = Date.now().toString(36)+Math.random().toString(36).substring(2, 8)+uid(33);
      //check if email exists
      const checkEmail = await checkIfEmailExists(reqEmail);
      if (checkEmail) {
        return NextResponse.json({message: 'Email already registered'}, {status: 401});
        //return res.json({message: "Email already registered"});
      }
      //check if name exists
      const checkName = await checkIfNameExists(reqName);
      if (checkName) {
        return NextResponse.json({message: 'Name already registered'}, {status: 401});
      }
      //hash pass
      const hashedPass = hashSync(reqPass, 10);

      //create verification token
      const tok = ""+Date.now().toString(36)+Math.random().toString(36).substring(2, 8)+uid(33);
      const dat = new Date().getDate();
      //key: token, value: current date plus two days;
      const token = {token: [tok, ""+new Date().setDate(dat + 2)]};

      //mysql connection
      const promisePool = pool.promise();
      const query = "INSERT IGNORE INTO `db-ticket`.`user`(`id`, `email`, `password`, `token`, `name`) VALUES(?, ?, ?, ?, ?);";
      const [rows, fields] = await promisePool.query<ResultSetHeader>(query, [
        userId,
        reqEmail,
        hashedPass,
        JSON.stringify(token),
        reqName
      ]);
    
      if (rows.warningStatus !==0){
        return NextResponse.json({message: 'Try again or use a shorter email'}, {status: 401});
      } else if (rows.affectedRows === 1) {
        //sendEmail(tok, reqEmail);
        return NextResponse.json({message: 'Success. Check email for verification'}, {status: 200});
      } else {
        return NextResponse.json({message: 'Error'}, {status: 409});
      }
    } catch (error) {
      console.error(error);
      return NextResponse.json({message: 'Internal server error'}, {status: 500});
      //return res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    return NextResponse.json({message: 'Invalid parameters'}, {status: 403});
  }
}
