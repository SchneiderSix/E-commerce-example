'use client';
import Foxy from "@/components/Foxy/Foxy";
import Popup from "@/components/Popup/Popup";
import { Pulsar } from "@uiball/loaders";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function VerificateToken({params}: {params: {token: string}}) {

  //user session
  const {data: session, status, update} = useSession();

  //token from url
  const token = params.token

  //handle pulsar
  const [pulsarLoading, setPulsarLoading] = useState<boolean>(true);

  //state for popup
  const [open, setOpen] = useState<boolean>(false);

  //state for form
  const [resetPass, setResetPass] = useState<boolean>(false);

  //ref for popup message
  const popMessage = useRef<string>('');
  
  //refs for inputs
  const email = useRef<HTMLInputElement>(null);
  const pass = useRef<HTMLInputElement>(null);

  const verificateToken = async() => {
    //call api
    const response = await fetch(`${window.location.origin}/api/validateUserToken`, {
      method: 'POST',
      headers: {
        email: email.current!.value,
        token: token
      }
    });
    return response.json();
  }

  const changePassword = async() => {
    //call api
    const response = await fetch(`${window.location.origin}/api/validateRecoveryUserToken`, {
      method: 'POST',
      headers: {
        email: email.current!.value,
        token: token,
        pass: pass.current!.value,
      }
    });
    return response.json();
  }

  //handle submit
  const handleSubmit = async(e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const res = resetPass ? await changePassword() : await verificateToken();
    popMessage.current = res.message;
    setOpen(!open);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setPulsarLoading(false);
    }, 2000);
    //cancels timer
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
    {status === 'loading' || pulsarLoading ? (
      <div className='flex items-center justify-center h-screen'>
        <Pulsar size={80} speed={1.75} color="black" />
      </div>
    ) : session === null ? (
      <div className="h-screen">
        <div className="flex w-auto h-1/6 justify-center">
          <Link href="/">
            <Foxy />
          </Link>
        </div>
        <form className="flex items-center justify-center" onSubmit={handleSubmit}>
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <legend className="text-2xl font-semibold mb-4">Verificate token</legend>
            <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <input
            className='mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
            focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
            disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none
            invalid:border-pink-500 invalid:text-pink-600
            focus:invalid:border-pink-500 focus:invalid:ring-pink-500'
            type="email" title="email" ref={email} placeholder="Enter your email" />
            <label className="block text-gray-700 text-sm font-bold mb-2">Token</label>
            <input
            className='mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
            focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
            disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none
            invalid:border-pink-500 invalid:text-pink-600
            focus:invalid:border-pink-500 focus:invalid:ring-pink-500'
            disabled={true}
            type="text" title="token" value={params.token} placeholder="Enter your email" />
            {resetPass && (
              <>
                <label className="block text-gray-700 text-sm font-bold mb-2">New password</label>
                <input
                className='mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
                focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
                disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none
                invalid:border-pink-500 invalid:text-pink-600
                focus:invalid:border-pink-500 focus:invalid:ring-pink-500'
                type="password" title="pass" ref={pass} placeholder="Enter new password" />
              </>
            )}
            <button
            type="submit"
            className="mt-4 inline-block bg-[#00AFB9] hover:bg-[#0081A7] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full shadow-lg shadow-cyan-500/50"
            >{resetPass ? 'Reset password' : 'Activate account'}
            </button>
            <button
            className="py-2 inline-block align-baseline font-bold text-sm text-[#00AFB9] hover:text-[#0081A7] disabled:text-white"
            onClick={()=> setResetPass(!resetPass)}
            type="button"
            >
            {resetPass ? 'Activate account?' : 'Reset password?'}
            </button>
          </div>
        </form>
        {open && <Popup text={popMessage.current} closePopup={(() => setOpen(!open))}/>}
      </div>
    ) : (
      redirect('/')
    )}
    </>
  )
}