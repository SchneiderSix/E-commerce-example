'use client';

import { useRef, useState } from "react";

export default function Reply(props: {nested: boolean, commentIdx: number, lastComment: boolean}) {

  const [createComment, setCreateComment] = useState<boolean>(false || props.lastComment);
  const commentRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setCreateComment(!createComment);
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
              className="bg-[#00AFB9] hover:bg-[#0081A7] text-white font-bold px-2 rounded focus:outline-none focus:shadow-outline"
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