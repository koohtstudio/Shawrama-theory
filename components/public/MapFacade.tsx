"use client";
import { useState } from "react";
import { Photo } from "@/components/ui/Photo";

/** The Google map iframe is heavy, so it loads only when someone asks for it. */
export function MapFacade({ address }: { address: string }) {
  const [on, setOn] = useState(false);
  const q = encodeURIComponent(address);
  return (
    <div className="relative h-[380px] overflow-hidden rounded-[36px] bg-sand md:h-[460px]">
      {on ? (
        <iframe title={`Map of ${address}`} src={`https://www.google.com/maps?q=${q}&output=embed`} className="size-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      ) : (
        <>
          <Photo src="/photos/storefront-day.jpg" alt="" sizes="(min-width: 768px) 60vw, 100vw" className="opacity-60" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-coal/40 p-6 text-center text-cream">
            <p className="font-display text-[28px]">{address}</p>
            <button type="button" className="btn btn-cream" onClick={() => setOn(true)}>Load the map</button>
          </div>
        </>
      )}
    </div>
  );
}
