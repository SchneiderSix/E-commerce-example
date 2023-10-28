import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { myStripeKey, pool } from "../../../../../credentials";
import { headers } from "next/headers";
import { ResultSetHeader } from "mysql2";

//custom interface for quantity
interface OrganizeQuantity {
  id: string[],
  quantity: number[]
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
        return NextResponse.json({message: 'Caching!'}, {status: 200});
      } else {
        return NextResponse.json({message: 'Error'}, {status: 409});
      }

      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  return NextResponse.json({message: 'Response executed'}, {status: 200});
}
