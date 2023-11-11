import Link from "next/link"

//custom interface for product searched
interface ProductSearched {
  description: string,
  id: string,
  image: string[],
  price: number,
  quantity: number,
  title: string
}

export default function Product(props: {item: ProductSearched}) {
  return (
    <div className="bg-white shadow-md p-4 rounded-lg mt-6">
      <img
        src={props.item.image[0]} // Assuming you want to display the first image from the array
        alt={props.item.title}
        className="w-full h-40 object-cover rounded-md mb-4"
      />
      <Link href={window.location.origin + '/product/' + props.item.id}>
        <h2 className="text-lg text-center font-semibold mb-2">{props.item.title}</h2>
      </Link>
      {/*<p className="text-gray-600 mb-2">{props.item.description}</p>*/}
      <div className="flex items-center justify-between">
        <p className="text-gray-700 font-semibold">${props.item.price}</p>
        <p className="text-gray-700">{props.item.quantity} in stock</p>
      </div>
    </div>
  )
}