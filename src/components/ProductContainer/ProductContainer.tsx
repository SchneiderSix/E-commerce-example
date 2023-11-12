'use client';

//custom interface for product searched
interface ProductSearched {
  description: string,
  id: string,
  image: string[],
  price: number,
  quantity: number,
  title: string
}

import { useEffect, useRef, useState } from "react";
import Product from "../Product/Product";
import { Pulsar } from "@uiball/loaders";

export default function ProductContainer(props: {searchTerm?: string}) {

  //state for products fetched
  const [data, setData] = useState<ProductSearched[] | null>(null)
  //handle page
  const [page, setPage] = useState<number>(0);
  //handle next page
  const [flag, setFlag] = useState<boolean>(false);

  //get searched products
  const getData = async() => {
    const res = await fetch('api/findProduct', {
      method: 'GET',
      headers: {
        title: props.searchTerm || '',
        minPage: page + '',
        maxPage: page + 10 + ''
      }
    });
    console.log(res.json);
    return res.json();
  }

  useEffect(() => {
    getData().then((res) => {
      if (
      res.message !== 'Invalid parameters' && res.message !== 'Error' 
      && res.message !== 'Internal server error' && res.message !== 'Too many requests'
      ) {
        setData(res.message);
      } else if (res.message === 'Error') setFlag(true);
    });
  }, [props.searchTerm, page]);

  return (
    <>
      <div className="flex justify-between text-lg font-semibold text-white">
        <button
        title="Previous page"
        type="button"
        disabled={page === 0}
        onClick={() => setPage(page - 10)}
        >
          Previous
        </button>
        <p className="hover:bg-[#0081A7] shadow-lg shadow-cyan-500/50">{page}</p>
        <button
        title="Next page"
        type="button"
        disabled={(flag === false && data?.length! < 10) || flag === true}
        onClick={() => setPage(page + 10)}
        >
          Next
        </button>
      </div>
      {data === null ? 
      <div className="flex items-center justify-center h-screen">
        <Pulsar size={80} speed={1.75} color="black" />
      </div>
      : ''}
      {data && data.map((i) => <Product key={i.id} item={i} />)}
    </>
  )
}