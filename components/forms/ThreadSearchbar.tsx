"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Input } from "../ui/input";

interface Props {
  routeType: string;
}

function ThreadSearchbar({ routeType }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  // query after 0.3s of no input
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search) {
        router.push(`/${routeType}?q=` + search);
      } else {
        router.push(`/${routeType}`);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, routeType]);

  return (
    <div className='searchbar rounded-full p-0 mb-7'>
      
      <Input
        id='text'
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={`${
            routeType !== "/search" ? "Search Machinary, Spares, Manuals " : "Search creators"
        }`}
        className='no-focus bg-dark-4 text-light-1 rounded-full border-none'
      />
    </div>
  );
}

export default ThreadSearchbar;