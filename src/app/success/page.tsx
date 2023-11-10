'use client'
import { redirect, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Pulsar } from "@uiball/loaders";
import Link from "next/link";


export default function Success() {

  //user session
  const {data: session, status, update} = useSession();

  //handle pulsar
  const [pulsarLoading, setPulsarLoading] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPulsarLoading(false);
    }, 2000);
    //cancels timer
    return () => clearTimeout(timer);
  }, []);

  const handlCart = async() => {
    await update({
      ...session,
      user: {
        ...session!.user,
        shoppingList: undefined
      }
    });
  }

  return (
    <>
    {status === 'loading' || pulsarLoading ? (
      <div className='flex items-center justify-center h-screen'>
        <Pulsar size={80} speed={1.75} color="black" />
      </div>
    ) : session && session.user.shoppingList ? (
      <div>
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <h1 className="text-2xl font-semibold mb-4">Congratulations on Your Purchase {session.user.name}!</h1>
            <p className="text-gray-600">Thank you for choosing our products. We appreciate your business and hope you enjoy your purchase</p>
            <Link
            onClick={() => handlCart()}
            href={"/"}
            className="mt-4 inline-block bg-[#00AFB9] hover:bg-[#0081A7] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-1/4 shadow-lg shadow-cyan-500/50"
            >Shop More
            </Link>
          </div>
        </div>
      </div>
    ) : (
      redirect('/')
    )}
    </>
  )
}