import React from "react";
import Image from "next/image";
// This component is used to display a wall image on the left side of the login page

type WallProps = {
  className: string;
  content: React.ReactNode;
}

export default function Wall({ className, content }: WallProps) {
  return (
    <section className={`${className}`}>
      {content}
    </section>
  );
}
