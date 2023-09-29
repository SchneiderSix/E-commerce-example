import { NextResponse } from 'next/server';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { RateLimiter } from 'limiter';
import validator from 'validator';
import { headers } from 'next/headers';
import { pool, myEmail } from '../../../../credentials';
import { uid } from 'uid/single';
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
  const siteUrl = `http://localhost:3000/recover/${token}`;
  const mailOptions = {
    from: myEmail.user,
    to: emailTo,
    subject: 'Verificate account',
    text: 'This is your token: '+token+'\nUse it here: '+siteUrl
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
  const reqEmail = headers().get('email');

  //check if headers are null
  if (!reqEmail) return NextResponse.json({message: 'Invalid parameters, only letters and numbers'}, {status: 403});

  if (!validator.isEmpty(reqEmail) && validator.isEmail(reqEmail)) {
    try {
      //check if email doesn't exists
      const checkEmail = await checkIfEmailExists(reqEmail);
      if (!checkEmail) {
        return NextResponse.json({message: 'Email isn\'t registered'}, {status: 401});
      }
      //re-create verification token
      const tok = ""+Date.now().toString(36)+Math.random().toString(36).substring(2, 8)+uid(33);
      const dat = new Date().getDate();
      //key: token, value: current date plus two days;
      const token = {token: [tok, ""+new Date().setDate(dat + 2)]};
      //mysql connection
      const promisePool = pool.promise();
      const query = "UPDATE `db-ticket`.`user` SET `token`= ?, `status` = 'deactivated' WHERE `email`= ?;";
      const [rows, fields] = await promisePool.query<ResultSetHeader>(query, [
        JSON.stringify(token),
        reqEmail
      ]);

      if (rows.affectedRows === 1) {
        //sendEmail(tok, reqEmail);
        return NextResponse.json({message: 'Success. Check email for verification'}, {status: 200});
      } else {
        return NextResponse.json({message: 'Error'}, {status: 409});
      }
    } catch (error) {
      console.error(error);
      return NextResponse.json({message: 'Internal server error'}, {status: 500});
    }
  } else {
    return NextResponse.json({message: 'Invalid parameters, only letters and numbers'}, {status: 403});
  }
}
