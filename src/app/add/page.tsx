'use client';
import React, { useEffect, useRef, useState } from "react";
import { signIn, signOut, useSession} from 'next-auth/react'
import { Pulsar } from "@uiball/loaders";
import { redirect } from "next/navigation";


const NewProduct = () => {
  //auxiliary - check if file is image
  const checkFiles = async (files: FileList): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      //return false if file is image and size <= 5mb
      if (files === null || files.length === 0 || files.length > 10) resolve(true);

      const fileTypesAllowed = ['image/jpg', 'image/jpeg', 'image/png', 'image/gif'];
      const maxSize = 1024 * 1024 * 5; //5mb
      const filesArray = Array.from(files);


      //loop through files
      for (const file of filesArray) {
        if (fileTypesAllowed.includes(file.type) && file.size <= maxSize) {
          //create custom FileReader
          const reader = new FileReader();
          reader.onload = () => {
            const image = new Image();
            //check resolution
            image.onload = () => {
              const width = image.width;
              const height = image.height;

              //resolve true if image hasn't resolution
              width && height > 0 ? '' : resolve(true);
            }
            image.src = reader.result as string;
          }
          reader.readAsDataURL(file);
        } else {
          resolve(true);
        }
      }
      resolve(false);
    });
  }

  const createProduct = async(formData : FormData) => {
    const response = await fetch('api/createProduct', {
      method: 'POST',
      body: formData,
      headers: {
        id: session?.user.id as string,
        title: productTitle.current?.value as string,
        quantity: productQuantity.current?.value as string,
        price: productPrice.current?.value as string,
        description: productDescription.current?.value as string
      }
    });
    return response.json();
  }

  const editProduct = async(formData : FormData) => {
    const response = await fetch('api/editProduct', {
      method: 'POST',
      body: formData,
      headers: {
        productId: productId.current?.value as string,
        id: session?.user.id as string,
        title: productTitle.current?.value as string,
        quantity: productQuantity.current?.value as string,
        price: productPrice.current?.value as string,
        description: productDescription.current?.value as string
      }
    });
    return response.json();
  }

  const eliminateProduct = async() => {
    const response = await fetch('api/eliminateProduct', {
      method: 'POST',
      headers: {
        productId: eliminateProductId.current?.value as string
      }
    });
    return response.json();
  }

  //refs for form
  const productTitle = useRef<HTMLInputElement>(null);
  const productQuantity = useRef<HTMLInputElement>(null);
  const productPrice = useRef<HTMLInputElement>(null);
  const productImages = useRef<HTMLInputElement>(null);
  const productDescription = useRef<HTMLTextAreaElement>(null);
  const productId = useRef<HTMLInputElement>(null);
  const eliminateProductId = useRef<HTMLInputElement>(null);
  //user session
  const {data: session, status, update} = useSession();

  //handle pulsar
  const [pulsarLoading, setPulsarLoading] = useState<boolean>(true);
  //state for edit
  const [edit, setEdit] = useState<boolean>(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setPulsarLoading(false);
    }, 2000);
    //cancels timer
    return () => clearTimeout(timer);
  }, []);


  const handleSubmitProduct = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if(productTitle.current?.value === null || productTitle.current?.value == '' || 
    productQuantity.current?.value as string <= '0' || productPrice.current?.value as string <= '0' || 
    productDescription.current?.value === '' || productDescription.current?.value === null) {
      alert('Please fill the form');
      return;
    }

    const checkImage = await checkFiles(productImages.current?.files as FileList);
    if (checkImage) {
      alert('Attach images format jpg, png, gif up to 5mb. Up to 10 images');
      return;
    } else {
      //put files inside formdata and save them as blob
      const formData = new FormData();
      const imagesArray = Array.from(productImages.current?.files || []);
      imagesArray.forEach((image) => {
        formData.append('images',image as Blob);
      });
      //call api
      //check if edit is true
      if (edit && productId.current?.value !== null && productId.current?.value !== '') {
        //edit product
        const res = await editProduct(formData);
        alert(res.message);
      } else {
        //create product
        const res = await createProduct(formData);
        alert(res.message);
      }
    }
    return;
  }

  const handleEliminateProduct = async(e: React.SyntheticEvent) => {
    e.preventDefault();
    //call api
    const res = await eliminateProduct();
    alert(res.message);
  }

  return (
        <>
        {status === 'loading' || pulsarLoading ? (
          <div className='flex items-center justify-center h-screen'>
            <Pulsar size={80} speed={1.75} color="black" />
          </div>
        ) : session && session.user.name?.includes('admin') ? (
        <div className="flex justify-center items-center h-screen">
          <div className="bg-white shadow-md rounded px-8 py-6">
            <form onSubmit={handleSubmitProduct}>
              {edit &&
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                    Product Id
                  </label>
                  <input
                    className='mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
                    focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
                    invalid:border-pink-500 invalid:text-pink-600
                    focus:invalid:border-pink-500 focus:invalid:ring-pink-500'
                    ref={productId}
                    type="text"
                    placeholder="Enter product id"
                  />
                </div>
              }
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                  Title
                </label>
                <input
                  className='mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
                  focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
                  invalid:border-pink-500 invalid:text-pink-600
                  focus:invalid:border-pink-500 focus:invalid:ring-pink-500'
                  ref={productTitle}
                  type="text"
                  placeholder="Enter title"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                  Stock
                </label>
                <input
                  className='mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
                  focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
                  invalid:border-pink-500 invalid:text-pink-600
                  focus:invalid:border-pink-500 focus:invalid:ring-pink-500'
                  ref={productQuantity}
                  type="number"
                  min={1}
                  placeholder="Enter quantity"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                  Price
                </label>
                <input
                  className='mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
                  focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
                  invalid:border-pink-500 invalid:text-pink-600
                  focus:invalid:border-pink-500 focus:invalid:ring-pink-500'
                  ref={productPrice}
                  type="number"
                  min={1}
                  placeholder="Enter price in Dollars"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                  Description
                </label>
                <textarea
                  className='mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
                  focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
                  invalid:border-pink-500 invalid:text-pink-600
                  focus:invalid:border-pink-500 focus:invalid:ring-pink-500'
                  ref={productDescription}
                  minLength={20}
                  placeholder="Enter description"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                  Images
                </label>
                <input
                  className='mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
                  focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
                  invalid:border-pink-500 invalid:text-pink-600
                  focus:invalid:border-pink-500 focus:invalid:ring-pink-500'
                  ref={productImages}
                  type="file"
                  multiple={true}
                  placeholder="Select images in format jpg, jpeg, gif, png"
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  className="bg-[#00AFB9] hover:bg-[#0081A7] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                  type="submit"
                >
                  {edit ? 'Edit Product Entry' : 'Create Product Entry'}
                </button>
                <button
                  className="inline-block align-baseline font-bold text-sm text-[#00AFB9] hover:text-[#0081A7]"
                  type="button"
                  onClick={() => setEdit(!edit)}
                >
                  {edit ? 'Create Product entry?' : 'Edit Product Entry?'}
                </button>
              </div>
            </form>
          </div>
          <div className="m-4 bg-white shadow-md rounded px-8 py-6">
            <form onSubmit={handleEliminateProduct}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                  Product Id
                </label>
                <input
                  className='mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
                  focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
                  invalid:border-pink-500 invalid:text-pink-600
                  focus:invalid:border-pink-500 focus:invalid:ring-pink-500'
                  ref={eliminateProductId}
                  type="text"
                  placeholder="Enter product id"
                />
                <div className="flex items-center justify-between p-2">
                  <button
                    className="bg-red-500 hover:bg-[#FF5733] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                    type="submit"
                  >
                    Eliminate Product
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
        ) : (
          redirect('/')
        )}
        </>
  )
}

export default NewProduct;