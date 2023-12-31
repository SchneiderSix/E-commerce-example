'use client';

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

//custom interface for product
interface Product { 
  [id: string] : {
    name: string,
    price: number,
    quantity: number
  }
}

export default function Cart(props: {currentProduct?: Product}) {
  
  //user session
  const {data: session, status, update} = useSession();

  //quantity
  const quantityRef = useRef<HTMLInputElement>(null);

  //productid
  const productId = props.currentProduct ? Object.keys(props.currentProduct)[0] : '';
  
  //render current shoplist
  const [st, setSt] = useState<boolean>(false);

  //total cost
  const [total, setTotal] = useState<number>(0);

  //change total price at the beggining and when st (state for shoplist) changes 
  useEffect(()=> {
    if (session?.user.shoppingList) {
      let total =0;
      session.user.shoppingList.forEach((i) => {
        total += Object.values(i)[0].price * Object.values(i)[0].quantity;
      });
      setTotal(total);
    }
  }, [session?.user.shoppingList, st]);



  //add item to shoplist
  const handleProduct = async () => {
    //handle empty quantity
    if (props.currentProduct && parseInt(quantityRef.current?.value as string) > 0 && parseInt(quantityRef.current?.value as string) <= props.currentProduct[productId].quantity) {

      const lastProduct: Product = {
        [productId]: {
          name: props.currentProduct[productId].name,
          price: props.currentProduct[productId].price,
          quantity: parseInt(quantityRef.current?.value as string)
        }
      }
      
      if (session?.user.shoppingList) {
        //change product quantity if it's already in shoplist
        //check if product isn't in shopping list
        const productFound = session.user.shoppingList.find((product, idx) => {
          return Object.keys(product)[0] === productId;
        })
        //push item if the items isn't in shopping list
        if (productFound === undefined) {
          session.user.shoppingList.push(lastProduct);
          //change product quantity
        } else {
          const updatedshoppingList = session!.user.shoppingList.map((product, idx) => {
            if (Object.keys(product)[0] === productId) {
              Object.values(product)[0].quantity = parseInt(quantityRef.current?.value as string);
            }
            return product;
          });
          await update({
            ...session,
            user: {
              ...session!.user,
              shoppingList: updatedshoppingList
            }
          });
        }
      } else {
        await update({
          ...session,
          user: {
            ...session!.user,
            shoppingList: [lastProduct]
          }
        });
      }
      //rerender
      setSt(!st);
    }
  }
  const sendCheckoutRequest = async() => {
    //call api
    if (session?.user.shoppingList !== undefined) {
      const response = await fetch(`${window.location.origin}/api/checkout`, {
        method: 'POST',
        headers: {
          products: JSON.stringify(session?.user.shoppingList)
        }
      });
      return response.json();
    }
  }
  //handle checkout
  const handleCheckout = async() => {
    const res = await sendCheckoutRequest();
    if (res.message !== 'Too many requests' && (res.status !== 401 || res.status !== 409 || res.status !== 500 || res.status !== 429)) {
      //handle stripe payment url
      window.open(res.message, '_blank');
    }
  }

  return (
    <>
      <>
        {session ? (
          <div className={session ? "mt-auto  text-center bg-white shadow-md rounded-lg p-5" : ""}>
            <label
            className="text-xl font-semibold text-gray-800"
            >
              Shopping cart
            </label>
            <ul className="mt-4 space-y-2">
              {session.user.shoppingList && session.user.shoppingList.map((i) =>  (
                <li
                  key={Object.keys(i)[0]}
                  className="py-2 text-gray-600"
                  >
                    {Object.values(i)[0].quantity} {Object.values(i)[0].name} : ${Object.values(i)[0].price * Object.values(i)[0].quantity}
                </li>
              ))}
            </ul>
            {props.currentProduct && (
              <>
              <input
              placeholder="Quantity"
              type="number"
              min={1}
              ref={quantityRef}
              max={props.currentProduct[productId].quantity}
              className="w-1/4 text-center my-2 p-1 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
              focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              >
              </input>
              <button 
              onClick={handleProduct}
              className="my-2 w-3/4 bg-[#00AFB9] hover:bg-[#0081A7] text-white font-bold py-2 rounded focus:outline-none focus:shadow-outline w-full shadow-lg"
              >
                Add to cart or change product quantity
              </button>
              </>
            )}
            <label
            className="text-l font-semibold text-[#00AFB9] shadow-lg shadow-cyan-500/50"
            >
              Total: ${total}
            </label>
            <button
            className=" bg-[#00AFB9] hover:bg-[#0081A7] text-white font-bold py-3 my-4 rounded focus:outline-none focus:shadow-outline w-full shadow-lg shadow-cyan-500/50"
            onClick={handleCheckout}
            >
              Checkout
            </button>
          </div>
          
        ) : (
        ''
        )}
      </>
    </>
  );
}