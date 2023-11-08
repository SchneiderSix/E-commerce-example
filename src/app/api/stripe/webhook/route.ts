import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { myEmail, myStripeKey, pool } from "../../../../../credentials";
import {authOptions} from "../../../../auth";
import { headers } from "next/headers";
import { ResultSetHeader } from "mysql2";
import { getServerSession } from "next-auth/next";
const nodemailer = require('nodemailer');

//custom interface for quantity
interface OrganizeQuantity {
  id: string[],
  quantity: number[]
}

//auxiliary - send email
const sendEmail = async(mes: string, sub: string, emailTo: string) => {
  const transporter = nodemailer.createTransport({
    service: myEmail.service,
    auth: {
      user: myEmail.user,
      pass: myEmail.pass
    }
  });
  const mailOptions = {
    from: myEmail.user,
    to: emailTo,
    subject: sub,
    text: mes
  };
  transporter.sendMail(mailOptions, function(err: unknown, info: unknown){
    return err ? false : true;
  });
}

export async function POST(
  req: Request
) {
  //create stripe session
  const stripe = new Stripe(myStripeKey, {
    apiVersion: '2022-11-15',
  });
  const body = await req.text();
  const endpointSecret = process.env.STRIPE_SECRET_WEBHOOK_KEY!;
  const sig = headers().get('stripe-signature') as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch(error) {
    return NextResponse.json({message: `Webhook error ${error}`}, {status: 400})
  }
  switch (event.type) {
    case "checkout.session.async_payment_failed":
      const checkoutSessionAsyncPaymentFailed = event.data.object;
      break;
    case "checkout.session.async_payment_succeeded":
      const checkoutSessionAsyncPaymentSucceeded = event.data.object;

      break;
    case "checkout.session.completed":
      const checkoutSessionCompleted: any = event.data.object;
      //handleQuantity sent in metadata
      const handleQuantity: OrganizeQuantity = JSON.parse(checkoutSessionCompleted?.metadata.handleQuantity);
      //handleQuantity consists of two arrays: quantity and id
      //each product corresponds to the same index in both arrays
      //this approach updates each product's quantity for a specific id
      let casesToUpdate: string = '';

      let casesWhere: string = handleQuantity!.id.map(i => `'${i}'`).join(',');

      for (let i = 0; i < handleQuantity!.id.length; i++) {
        //handle last case to inject casesWhere for last clause
        if(i === handleQuantity!.id.length - 1) {
          casesToUpdate += "WHEN `db-ticket`.`product`.`id` = '"+handleQuantity!.id[i]+"' THEN '"+handleQuantity!.quantity[i]+"' END) WHERE `id` IN ("+casesWhere+");";
        } else {
          casesToUpdate += "WHEN `db-ticket`.`product`.`id` = '"+handleQuantity!.id[i]+"' THEN '"+handleQuantity!.quantity[i]+"' ";
        }
      }
      //mysql connection
      const promisePool = pool.promise();
      const query = "UPDATE `db-ticket`.`product` SET `quantity` = (CASE "+casesToUpdate+"";
      const [rows, fields] = await promisePool.query<ResultSetHeader>(query);

      if (rows.affectedRows > 0) {
        //return NextResponse.json({message: 'Caching!'}, {status: 200});
        //send email to user
        const session = await getServerSession(authOptions);
        const subject = 'Ticket Purchase';
        if (session) {
          let message = '';
          let total = 0;
          //add every item
          session.user.shopList.map((i) => {
            message+`${Object.values(i)[0].quantity} ${Object.values(i)[0].name}: ${Object.values(i)[0].price * Object.values(i)[0].quantity}\n`;
            total += Object.values(i)[0].price * Object.values(i)[0].quantity;
          });
          message += `Total: ${total}\n`+new Date;
          sendEmail(message, subject, session.user.email as string);
        }
      };/*}else {
        return NextResponse.json({message: 'Error'}, {status: 409});
      }*/
      

      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  return NextResponse.json({message: 'Response executed'}, {status: 200});
}
