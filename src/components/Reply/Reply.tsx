'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function Reply(props: {id:string, commentIdx: number, lastComment: boolean}) {

  //user session
  const {data: session, status} = useSession();

  const router = useRouter();

  const [createComment, setCreateComment] = useState<boolean>(false || props.lastComment);
  const commentRef = useRef<HTMLInputElement>(null);

  const sendComment = async () => {
    //call api
    //check if comment is nested
    if (session?.user.name) {
      const response = props.lastComment ? 
      await fetch(`${window.location.origin}/api/createComment/`, {
        method: 'POST',
        headers: {
        id: props.id!,
        name: session?.user.name!,
        message: commentRef.current?.value!,
        nested: 'x'
        }
      })
      :
      await fetch(`${window.location.origin}/api/createComment/`, {
        method: 'POST',
        headers: {
          id: props.id!,
          name: session?.user.name!,
          message: commentRef.current?.value!,
          nested: props.commentIdx+''
        }
      });
      return response.json();
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    //keep showing the last create comment
    if (!props.lastComment) setCreateComment(!createComment);

    //call api
    const res = await sendComment();

    //reset the commentRef
    //commentRef.current!.value = '';
    router.refresh();
  };

  return (
    <>
      {createComment ? 
      <>
        <div className="flex justify-center">
          <form onSubmit={handleSubmit} className="w-1/2 p-5">
            <textarea
                className='mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
                focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
                invalid:border-pink-500 invalid:text-pink-600
                focus:invalid:border-pink-500 focus:invalid:ring-pink-500
                resize-none h-full'
                ref={commentRef}
                minLength={10}
                placeholder="Enter description"
            />
            <div className="p-2 flex place-content-between">
              <button 
              className="bg-[#00AFB9] hover:bg-[#0081A7] text-white font-bold px-2 rounded focus:outline-none focus:shadow-outline flex justify-center"
              type="submit">
                {props.lastComment ? 'Create comment' : 'Create reply'}
              </button>
              <button 
              className="inline-block align-baseline font-bold text-sm text-[#00AFB9] hover:text-[#0081A7] disabled:text-transparent"
              disabled={props.lastComment}
              onClick={(e) => setCreateComment(!createComment)}>
                Close
              </button>
            </div>
          </form>
        </div>
      </>
       : 
      <button 
      className="inline-block align-baseline font-bold text-sm text-[#00AFB9] hover:text-[#0081A7]"
      onClick={(e) => setCreateComment(!createComment)}>
        Reply
      </button>}
    </>
  )
}