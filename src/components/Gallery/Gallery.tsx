'use client';

import { useState } from "react";

export default function Gallery(props: {images: string[]}) {
  
  const [selected, setSelected] = useState<number>(0);
  const [zoom, setZoom] = useState<boolean>(false);

  return (
    <>
      <div className="flex justify-center">
        <img className={!zoom ? "rounded-md max-w-screen-sm max-h-96" : "ease-in-out duration-300"} src={props.images[selected]} alt={""+selected} 
        onClick={(e) => setZoom(!zoom)}
        />
      </div>
      <div className="flex overflow-x-auto space-x-4 p-4">
        {props.images.map((image, idx) => (
          <img
            key={idx}
            src={image}
            alt={`Image ${idx}`}
            className="w-56 h-32 object-cover rounded-md shadow-md"
            onClick={(e) => setSelected(idx)}
            />
        ))}
      </div>
    </>
  )
}