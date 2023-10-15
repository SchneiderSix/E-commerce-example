import { useSession } from "next-auth/react";
import { originRoute } from "../../../../credentials";
import Link from "next/link";
import Foxy from "@/components/Foxy/Foxy";
import Reply from "@/components/Reply/Reply";

interface Comment {
  [user: string] : string;
}

interface Comments {
  [commentId: number]: Comment[] | Comment; // Mapping comment IDs to arrays of Comment objects
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
    //call api
    const response = await fetch(`${originRoute}/api/product/`, {
      method: 'GET',
      headers: {
        id: id
      }
    });
    return response.json();
  };
  const res = await fetchProduct();
  const data: Product = res.message[0];
  data.comments.map(comment => {
    console.log(comment[0]);
  });

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
              <div className="sm:w-1/2">
                {/*<img
                  src={data.image[0]}
                  alt={data.title}
                  className="w-full h-auto sm:h-96 object-cover"
  />*/}
              </div>
              <div className="p-4 sm:w-1/2">
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
          <div className="mt-6 bg-white shadow-md rounded-lg w-1/2 p-5">
            <h3 className="text-xl font-semibold text-gray-800">Comments</h3>
            <ul className="mt-4 space-y-2">
              {data.comments.map((comment, index) => (
                Array.isArray(comment) ? (
                  //nested comments
                  <ul key={index}>
                    {comment.map((subComment, subIndex) => (
                      subIndex === 0 ?
                      //first comment
                      <p key={subIndex} className="py-2 text-gray-600">
                        {(subComment as string).substring(6, subComment.length - 3)}
                      </p> :
                      //replies
                      <>
                        <li key={subIndex} className="text-gray-600 break-words mx-10">
                          {(subComment as string).substring(6, subComment.length - 3)}
                        </li>
                        {subIndex === comment.length - 1 ? 
                        //reply component
                        <Reply nested={true} commentIdx={subIndex} lastComment={false} />
                        : ''}
                      </>
                    ))}
                  </ul>
                ) : (
                  //normal comments
                  <>
                    <p key={(comment as string).substring(1,2)} className="py-2 text-gray-600">
                      {(comment as string).substring(6, comment.length - 3)}
                    </p>
                    <Reply nested={false} commentIdx={index} lastComment={false} />
                  </>
                )
              ))}
              <Reply nested={false} commentIdx={0} lastComment={true} />
              {/*Object.keys(data.comments).map((commentId) => (
                <li key={commentId} className="text-gray-600">
                  {commentId}
                </li>
              ))*/}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
