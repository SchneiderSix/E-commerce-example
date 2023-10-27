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
      cancel_url: 'http://localhost:3000/cancel'
    });
    //send stripe checkout url
    //NextResponse.json({message: stripeSession.url});

    //conditional parameter allways true for development
    //stripeSession.payment_status === 'paid'
    if (true) {
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
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({message: 'Internal server error'}, {status: 500});
  }

}
