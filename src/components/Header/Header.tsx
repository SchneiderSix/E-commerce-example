import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import cart from "../../../public/shopping-cart.png";
import cart2 from "../../../public/shopping-cart2.png";
import { useRef, useState, lazy } from "react";
import Foxy from "../Foxy/Foxy";
const Cart = lazy(() => import("../Cart/Cart"));


export default function Header() {
  //user session
  const {data: session, status} = useSession();
  //searchTerm ref
  const searchTerm = useRef<HTMLInputElement>(null);
  //state for cart
  const [showCart, setShowcart] = useState<boolean>(false);
  return (
    <>
      <div className="flex justify-center space-x-20 absolute mx-auto w-4/5 inset-x-0 left-/2 top-10 bg-white rounded-full px-7 overflow-hidden">
        <div className="">
          <Foxy />
        </div>
        <input
        className="m-2 block w-full p-6 bg-white border border-slate-300 rounded-md text-lg shadow-sm placeholder-slate-400
        focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        type="text"
        placeholder="Search..."
        ref={searchTerm}
        />
        <h1 className="m-2 inline-block align-middle text-black text-2xl font-bold">{session?.user.name}</h1>
        {session?.user.shoppingList?.length ? 
        <Image onClick={(e) => {
          setShowcart(!showCart)
        }} className="m-2 hover:bg-[#0081A7] hover:rounded-md"/*absolute inset-y-0 right-0*/ color="" alt="shopping-cart" width={70} height={20} src={cart2}/> : 
        <Image className="m-2"/*absolute inset-y-0 right-0*/  color="" alt="shopping-cart2" width={70} height={20} src={cart}/>}
        <button 
        className="bg-[#00AFB9] hover:bg-[#0081A7] text-white font-bold rounded focus:outline-none focus:shadow-outline w-1/6 my-auto shadow-lg shadow-cyan-500/50"
        type='button' title='logout' onClick={() => {
          signOut();
          }}>
          Logout
        </button>
      </div>
      {showCart && (
          <div
          className="dropdown absolute transform translate-y-0 transition-transform ease-in-out duration-300"
          >
            <Cart />
          </div>
        )}
    </>
  )
}
