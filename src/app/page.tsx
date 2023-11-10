'use client';
import { Metadata } from 'next'
import { lazy, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react';
import { Pulsar } from '@uiball/loaders';
const Login = lazy(() => import('../components/Login/Login'));
const Main = lazy(() => import('../components/Main/Main'));

 
export const metadata: Metadata = {
  title: 'My Page Title',
}
 
export default function Home() {
  //user session
  const {data: session, status} = useSession();
  //handle pulsar
  const [pulsarLoading, setPulsarLoading] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPulsarLoading(false);
    }, 2000);
    //cancels timer
    return () => clearTimeout(timer);
  }, [])

  return (
  <>
    {status === 'loading' || pulsarLoading ? (
      <div className='flex items-center justify-center h-screen'>
        <Pulsar size={80} speed={1.75} color="black" />
      </div>
    ) : session ? (
      <Main />
    ) : (
      <Login />
    )}
  </>
  )
}
