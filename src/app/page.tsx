'use client'
import { Metadata } from 'next'
import { Pulsar } from '@uiball/loaders'
import { Suspense, lazy, useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
  let router = useRouter();

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
    ) : !session ? (
      <Suspense fallback={
        <div className='flex items-center justify-center h-screen'>
          <Pulsar size={80} speed={1.75} color="black" />
        </div>
      }>
        <Login />
      </Suspense>
    ) : (
      <Main />
    )}
  </>
  )
}