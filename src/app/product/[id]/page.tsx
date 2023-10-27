import { useSession } from "next-auth/react";
import Link from "next/link";
import Foxy from "@/components/Foxy/Foxy";
import Reply from "@/components/Reply/Reply";
import Gallery from "@/components/Gallery/Gallery";
import Cart from "@/components/Cart/Cart";
import { headers } from "next/headers";

interface Comment {
  [user: string] : string;
}

interface Comments {
  [commentDate: number]: Comment[] | Comment; // Mapping comment IDs to arrays of Comment objects
}

interface Product {
  comments: Comments[];
  description: string;
  id: string;
  image: string[];
  price: number;
  quantity: number;
  title: string;
  userId: string;
}

export default async function Product({ params }: { params: { id: string } }) {

  const fetchProduct = async () => {
    //id from route
    const id = params.id;
    //origin path
    const originPathname = 'http://'+headers().get("x-forwarded-host") || "";

    //call api
    const response = await fetch(`${originPathname}/api/product/`, {
      method: 'GET',
      headers: {
        id: id
      },
      cache: 'no-store'
    });
    return response.json();
  };
  const res = await fetchProduct();
  const data: Product = res.message[0];
  const currentProduct = {
    [data.id]: {
      name: data.title,
      price: data.price,
      quantity: data.quantity,
    }
  };

  //for development
  const imageUrls = ['https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Leafy_Seadragon_on_Kangaroo_Island.jpg/1200px-Leafy_Seadragon_on_Kangaroo_Island.jpg', 'https://www.treehugger.com/thmb/hR_9sTzj9L_WTdrdKH_rZRCmSs4=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/blue-dragon--glaucus-atlanticus--blue-sea-slug-986491702-f0cb140dd639453e8a2d8c56637dce73.jpg', 'https://www.montereybayaquarium.org/globalassets/mba/images/animals/fishes/leafy-sea-dragon-rw09-089.jpg','https://i.natgeofe.com/n/6b009cf8-31cb-4905-8c81-d53c17f2dd72/6213290_2x3.jpg','https://i.natgeofe.com/n/976cca7c-8f1d-46a4-93a9-1f196cb727b9/6203201_square.jpg'];
  //first image would be the thumbnail so we need the rest
  //const imageUrls = data.image.slice(1);

  return (
    <>
      <div className="h-screen">
        <div className="flex w-auto h-1/6 justify-center">
          <Link href="/">
            <Foxy />
          </Link>
        </div>
        <div className="container mx-auto p-4">
          <div className="bg-white shadow-md rounded-lg">
            <div className="p-4 sm:flex">
              <div className="sm:w-2/3">
                <Gallery images={imageUrls} />
                {/*<img
                  src={data.image[0]}
                  alt={data.title}
                  className="w-full h-auto sm:h-96 object-cover"
  />*/}
              </div>
              <div className="p-4 sm:w-1/3">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2 break-words">
                  {data.title}
                </h2>
                <p className="text-gray-600 break-words">${data.price}</p>
                <p className="text-gray-600 break-words">In Stock: {data.quantity}</p>
                {/*<p className="text-gray-600">Product ID: {data.id}</p>*/}
                {/*<p className="text-gray-600">Seller ID: {data.userId}</p>*/}
                <p className="text-gray-600 mt-4 break-words">{data.description}</p>
              </div>
            </div>
          </div>
          <div className="flex space-x-4 justify-center">
            <div className="mt-6 bg-white shadow-md rounded-lg w-1/3 p-5">
              <h3 className="text-xl font-semibold text-gray-800">Comments</h3>
              <ul className="mt-4 space-y-2">
                {data.comments && data.comments.map((comment, index) => (
                  Array.isArray(comment) ? (
                    //nested comments
                    <ul key={index}>
                      {comment.map((subComment, subIndex) => (
                        subIndex === 0 ?
                        //first comment
                        <p key={subIndex} className="py-2 text-gray-600">
                          {subComment.substring(18, subComment.length - 3)}
                          <br></br>
                          {new Date(parseInt(subComment.substring(1, 14))).toLocaleString()}
                        </p> :
                        //replies
                        <>
                          <li key={subIndex} className="text-gray-600 break-words mx-10">
                            {subComment.substring(18, subComment.length - 3)}
                            <br></br>
                            {new Date(parseInt(subComment.substring(1, 14))).toLocaleString()}
                          </li>
                          {subIndex === comment.length - 1 ? 
                          //reply component
                          <Reply id={data.id} commentIdx={index} lastComment={false} />
                          : ''}
                        </>
                      ))}
                    </ul>
                  ) : (
                    //normal comments
                    <>
                      <p key={(comment as string).substring(1,2)} className="py-2 text-gray-600">
                        {comment.substring(18, comment.length - 3)}
                        <br></br>
                        {new Date(parseInt(comment.substring(1, 14))).toLocaleString()}
                      </p>
                      <Reply id={data.id} commentIdx={index} lastComment={false} />
                    </>
                  )
                ))}
                <Reply id={data.id} commentIdx={0} lastComment={true} />
                <br></br>
              </ul>
            </div>
            <div className="flex w-1/3 mt-6 place-self-center">
              <Cart currentProduct={currentProduct} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
