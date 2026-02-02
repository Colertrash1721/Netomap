"use client";
import Link from 'next/link';
import React from 'react';
import { usePathname } from 'next/navigation';

type IconsProps = {
  name: string;
  bg?: boolean;
  link?: string;
  onClick?: (event: React.MouseEvent) => void;
};

export default function Icons({ name, bg, link, onClick }: IconsProps) {
  const pathname = usePathname();

  let href = '/';
  if (link) {
    if (link === '/') {
      href = '/';
    } else if (pathname.includes('tracking_view')) {
      href = `/tracking_view/${link}`;
    } else {
      href = `/tracking_view/${link}`;
    }
  }

  href = href.replace('tracking_view/tracking_view', 'tracking_view');

  return (
    <div className="flex items-center justify-center p-4 w-12 h-12 rounded-xl transition-all duration-300 ease-in-out mb-2 mt-2">
      <Link href={href}>
        <i
          className={`bx ${name} text-white p-2 rounded-lg text-2xl cursor-pointer hover:bg-[#2264FF] dark:hover:bg-gray-800 hover:rounded-lg ${bg && 'bg-red-500'} hover:text-white transition-all duration-300 ease-in-out`}
          onClick={onClick}
        ></i>
      </Link>
    </div>
  );
}
