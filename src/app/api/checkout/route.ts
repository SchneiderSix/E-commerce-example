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
  const query = "SELECT `db-ticket`.`product`.`quantity`,  `db-ticket`.`product`.`id`, `db-ticket`.`product`.`title` FROM `db-ticket`.`product` WHERE `db-ticket`.`product`.`id` IN (?);";
  const [rows, fields] = await promisePool.query<RowDataPacket[]>(query, [
    productsKeys
  ]);

  let productNameOutStock: string[] = [];
  rows.map(row => {
    //find values of product by id
    let idx;
    const productValues = products?.map((product, index) => {if (Object.keys(product)[0] === row.id) {
      idx = index;
      return Object.values(product);
    }}).flat();

    if (productValues) {
      //product id found in database
      //check stock
      if (row.quantity - productValues[idx!]!.quantity < 0) productNameOutStock.push(productValues[idx!]?.name as string);
      //fill handle quantity
      handleQuantity.id.push(row.id);
      handleQuantity.quantity.push(row.quantity - productValues[idx!]!.quantity);

    } else {
      //product id not found in database
      return NextResponse.json({message: 'Can\'t find products'}, {status: 401});
    }
  });
  //if out of stock send response
  if (productNameOutStock?.length) {
    return NextResponse.json({message: 'Out of stock: '+productNameOutStock.join(', ')}, {status: 409});
  }
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
      //cancel_url: 'http://localhost:3000/cancel',
      //add handleQuantity into stripe session metadata
      //this will be needed to change products quantity in the database
      metadata: {
        handleQuantity: JSON.stringify(handleQuantity)
      }
    });
    //send stripe checkout url
    return NextResponse.json({ message: stripeSession.url }, { status: 200 })

  } catch (error) {
    console.error(error);
    return NextResponse.json({message: 'Internal server error'}, {status: 500});
  }

}
