import Link from "next/link"
import Fox from "../Fox/Fox"
import Popup from "../Popup/Popup";
import { useEffect, useRef, useState } from "react";
import { signIn, useSession } from "next-auth/react";

export default function Login() {
  //refs for inputs
  const email = useRef<HTMLInputElement>(null);
  const password = useRef<HTMLInputElement>(null);
  const name = useRef<HTMLInputElement>(null);
  //state for login or recover
  const [forgottenAcc, setForgottenAcc] = useState<boolean>(false);
  //state for create account
  const [createAccount, setCreateAccount] = useState<boolean>(false);
  //state for popup
  const [open, setOpen] = useState<boolean>(false);
  //ref for popup message
  const popMessage = useRef<string>('');
  //session
  const {data: session, status} = useSession();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (createAccount) {
      //create account
      const result =  async () => {
        const response = await fetch('api/createUser', {
          method: 'POST',
          headers: {
            email: email.current!.value,
            pass: password.current!.value,
            name: name.current!.value
          }
        });
        return response.json();
      }
      result().then((res) => {
        popMessage.current=JSON.stringify(res.message).substring(1, res.message.length+1);
        setOpen(true);
      });
    } else if (!forgottenAcc) {
      //login
      await signIn('credentials', {
        email: email.current?.value,
        password: password.current?.value,
        redirect: false
      });
      //open popup
      popMessage.current='Invalid credentials'; 
      setOpen(true);
    } else if (forgottenAcc){
      //recover password
      const result = async () => {
        const response = await fetch('api/recoverUser', {
          method: 'POST',
          headers: {
            email: email.current!.value
          }
        });
        return response.json();
      }
      result().then((res) => {
        popMessage.current=JSON.stringify(res.message).substring(1, res.message.length+1);
        setOpen(true);
      });
    }
  }

  const handleAccountCreation = async () => {
    alert('xxx')
    const result =  async () => {
      const response = await fetch('api/createUser', {
        method: 'POST',
        headers: {
          email: email.current!.value,
          pass: password.current!.value,
          name: name.current!.value
        }
      });
      return response.json();
    }
    result().then((res) => {
      popMessage.current=JSON.stringify(res.message).substring(1, res.message.length+1);
      setOpen(true);
    });
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="px-8 py-6 space-x-1">
        <Fox />
      </div>
      <div className="bg-white shadow-md rounded-lg px-8 py-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              className='mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
              focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
              disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none
              invalid:border-pink-500 invalid:text-pink-600
              focus:invalid:border-pink-500 focus:invalid:ring-pink-500'
              ref={email}
              id="email"
              type="email"
              placeholder="Enter your email"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              className='mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
              focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
              disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none
              invalid:border-pink-500 invalid:text-pink-600
              focus:invalid:border-pink-500 focus:invalid:ring-pink-500'
              ref={password}
              id="password"
              type="password"
              placeholder="Enter your password"
              disabled={forgottenAcc}
            />
            </div>
            {createAccount && 
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Name
            </label>
            <input
              className='mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
              focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
              disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none
              invalid:border-pink-500 invalid:text-pink-600
              focus:invalid:border-pink-500 focus:invalid:ring-pink-500'
              ref={name}
              id="name"
              type="name"
              placeholder="Enter your name"
            />
          </div>
            }
          <div className="flex items-center justify-between py-2">
          <button
              className="bg-[#00AFB9] hover:bg-[#0081A7] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full shadow-lg shadow-cyan-500/50"
              type="submit"
            >
              {createAccount ? 'New account' : !forgottenAcc ? 'Login' : 'Recover account'}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <button className={`bg-${createAccount ? '' : '[#00AFB9]'} ${createAccount ? 'hover:text-[#0081A7]' : 'hover:bg-[#0081A7]'} text-${!createAccount ? 'white' : '[#00AFB9]'} text-sm font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-transparent`} disabled={forgottenAcc} type="button"
            onClick={() => setCreateAccount(!createAccount)}>
              {!createAccount ? 'Create' : 'Login?'}
            </button>
            <button
              className="inline-block align-baseline font-bold text-sm text-[#00AFB9] hover:text-[#0081A7] disabled:text-white"
              type="submit"
              disabled={createAccount}
              onClick={(e) => {
                e.preventDefault();
                setForgottenAcc(!forgottenAcc);
              }}
            >
              {!forgottenAcc ? 'Forgotten password?' : '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\
              Login?\
              \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'}
            </button>
          </div>
        </form>
      </div>
      {open && <Popup text={popMessage.current} closePopup={(() => setOpen(false))}/>}
    </div>
  )
}
