'use client'
import { usePathname } from "next/navigation";
export default function Product() {
  const router = usePathname();
  return (
    <>
      <div className="h-screen">
        <p>{router.substring(9)}</p>
      </div>
    </>
  );
}
