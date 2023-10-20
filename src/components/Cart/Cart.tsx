'use client';

import { useSession } from "next-auth/react";


export default function Cart() {
  
  //user session
  const {data: session, status} = useSession();

  return (
    <>
      {session?.user.name ? session.user.name : 'Nope'}
    </>
  );
}