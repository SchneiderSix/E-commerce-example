'use client';
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import cart from "../../../public/shopping-cart.png";
import cart2 from "../../../public/shopping-cart2.png";
import { useRef, useState, lazy, useDeferredValue, Suspense } from "react";
import Foxy from "../Foxy/Foxy";
import ProductContainer from "../ProductContainer/ProductContainer";
import { Pulsar } from "@uiball/loaders";
import Link from "next/link";
const Cart = lazy(() => import("../Cart/Cart"));


export default function Header() {
  //user session
  const {data: session, status} = useSession();
  //searchTerm state
  const [searchTerm, setSearchTerm ] = useState<string>('');
  //deferred search term to reduce re-renders
  const deferredSearchTerm = useDeferredValue(searchTerm);
  //state for cart
  const [showCart, setShowcart] = useState<boolean>(false);
  return (
    <div className="flex flex-col w-2/3 h-screen ">
      <div className="flex justify-center space-x-20 mx-auto w-4/5 bg-white rounded-full px-7 overflow-hidden">
        <div className="mt-2">
          <Foxy />
        </div>
        <input
        className={`m-2 block w-full p-6 bg-white border border-slate-300 rounded-md text-lg shadow-sm placeholder-slate-400
        focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 ${searchTerm === deferredSearchTerm ? 'font-bold' : ''}`}
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        />
        <h1 className="m-2 inline-block align-middle text-black text-2xl font-bold">{session?.user.name}</h1>
        {session?.user.shoppingList?.length ? 
        <Image onClick={(e) => {
          setShowcart(!showCart)
        }} className="m-2 hover:bg-[#0081A7] hover:rounded-md"/*absolute inset-y-0 right-0*/ color="" alt="shopping-cart" width={70} height={20} src={cart2}/> : 
        <Image className="m-2"/*absolute inset-y-0 right-0*/  color="" alt="shopping-cart2" width={70} height={20} src={cart}/>}
        <button 
        className="bg-[#00AFB9] hover:bg-[#0081A7] text-white font-bold rounded focus:outline-none focus:shadow-outline w-1/6 my-auto shadow-lg shadow-cyan-500/50 p-2"
        type='button' title='logout' onClick={() => {
          signOut();
          }}>
          Logout
        </button>
        {session?.user.name?.includes('admin') && 
        <Link className="bg-[#00AFB9] hover:bg-[#0081A7] text-white font-bold rounded focus:outline-none focus:shadow-outline w-1/6 my-auto shadow-lg px-2 shadow-cyan-500/50"
        href={'/add'}>Add item</Link>
        }
      </div>
      {showCart && (
          <div
          className="absolute p-28"
          >
            <Cart />
          </div>
      )}
      <div className="w-1/3 mx-auto">
        <ProductContainer searchTerm={deferredSearchTerm} />
      </div>
    </div>
  )
}
