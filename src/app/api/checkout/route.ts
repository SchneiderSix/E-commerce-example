import { NextResponse } from "next/server";
import { myStripeKey, pool } from "../../../../credentials";
import Stripe from "stripe";
import { ResultSetHeader, RowDataPacket } from "mysql2";

//custom interface for product
interface Product { 
  [id: string] : {
    name: string,
    price: number,
    quantity: number
  }
}

//custom interface for quantity
interface OrganizeQuantity {
  id: string[],
  quantity: number[]
}


export async function POST(
  req: Request
) {

  //products
  let products: Product[] | null = null;

  //register quantity
  let handleQuantity: OrganizeQuantity= {id: [], quantity:[]};

  //headers validation
  const reqProducts = req.headers.get('products');

  if (!reqProducts) return NextResponse.json({message: 'Invalid parameters'}, {status: 403});
  try {
    products = JSON.parse(reqProducts) as Product[];
  } catch (error) {
    return NextResponse.json({message: 'Invalid parameters'}, {status: 403});
  }
  //check quantity of each product
  //products ids
  const productsKeys = products.map((i) => {
    return Object.keys(i);
  }).flat();

  //mysql connection
  const promisePool = pool.promise();
  const query = "SELECT `db-ticket`.`product`.`quantity`,  `db-ticket`.`product`.`id` FROM `db-ticket`.`product` WHERE `db-ticket`.`product`.`id` IN (?);";
  const [rows, fields] = await promisePool.query<RowDataPacket[]>(query, [
    productsKeys
  ]);
  //xxx
  rows.map(row => {
    //find values of product by id
    const productValues = products?.map(product => {if (Object.keys(product)[0] === row.id) return Object.values(product)}).flat();
    if (productValues) {
      //product id found in database
      //check stock
      if (row.quantity - productValues[0]!.quantity < 0) return NextResponse.json({message: 'Out of stock: '+products![row.id].name}, {status: 409});
      //fill handle quantity
      handleQuantity.id.push(row.id);
      handleQuantity.quantity.push(row.quantity - productValues[0]!.quantity);
      console.log('x: ',handleQuantity!);
    } else {
      //product id not found in database
      return NextResponse.json({message: 'Can\'t find products'}, {status: 401});
    }
  });
  //create stripe session
  const stripe = new Stripe(myStripeKey, {
    apiVersion: '2022-11-15',
  });
  try {
    //organize products
    const items = products.map((i) => {
      //find key for product
      const key = Object.keys(i)[0];
      return {price_data: {
        currency: 'usd',
        unit_amount: i[key].price * 100,
        product_data: {
          name: i[key].name,
        },
      },
      quantity: i[key].quantity,
    }});

    const stripeSession = await stripe.checkout.sessions.create({
      line_items: items,
      mode: 'payment',
      success_url: 'http://localhost:3000/success',
      cancel_url: 'http://localhost:3000/cancel'
    });
    //stripeSession.payment_status === 'paid'
    if (true) {
      //modify product quantity in db and create ticket
      //handleQuantity has two arrays: quantity and id
      //the product share the same index, the idea of this approach
      //is to force an update for quantity for especific id
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
      //UPDATE `db-ticket`.`product` SET `quantity` = (CASE WHEN `db-ticket`.`product`.`id` = '1' THEN '66' WHEN `db-ticket`.`product`.`id` = 'lkbott6on8jqgrfn3gpt8kvdngd1gb1u0pclveahitobnqp' THEN '1' END) WHERE `id` IN ('1', 'lkbott6on8jqgrfn3gpt8kvdngd1gb1u0pclveahitobnqp');
      const query = "UPDATE `db-ticket`.`product` SET `quantity` = (CASE "+casesToUpdate+"";
      const [rows, fields] = await promisePool.query<ResultSetHeader>(query);

      if (rows.affectedRows > 0) {
        return NextResponse.json({message: 'Caching!'}, {status: 200});
      } else {
        return NextResponse.json({message: 'Error'}, {status: 409});
      }
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({message: 'Internal server error'}, {status: 500});
  }

}
