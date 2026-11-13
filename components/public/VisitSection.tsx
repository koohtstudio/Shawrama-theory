import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import type { StoreSettings } from "@/lib/data/catalog";
import { HoursList } from "./HoursList";
import { StatusPill } from "./LiveStatus";

export function VisitSection({ settings, heading = true }: { settings: StoreSettings; heading?: boolean }) {
  return (
    <section id="visit" className="py-20 md:py-[120px]">
      <div className="wrap">
        {heading ? (
          <>
            <p className="eyebrow">Come hungry</p>
            <h2 className="h2">510 Bayfield St, <span className="accent">Barrie.</span></h2>
          </>
        ) : null}
        <div className="mt-[50px] grid gap-6 md:grid-cols-[1.1fr_1fr]">
          <div className="relative min-h-[380px] overflow-hidden rounded-[36px] md:min-h-[520px]">
            <Photo src="/photos/storefront-dusk.jpg" alt="Shawarma Theory storefront lit up at dusk" sizes="(min-width: 768px) 50vw, 100vw" />
            <div className="absolute inset-x-6 bottom-6 rounded-[22px] bg-coal/80 p-[22px] text-cream backdrop-blur-sm">
              <b className="font-display text-2xl font-normal">Dine in, take out or delivery</b>
              <br />
              <span className="text-[15px] text-ash">Saj bread baked fresh every day, right in the shop.</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 rounded-[36px] bg-white p-[26px] md:p-[38px]">
            <div className="mb-3"><StatusPill /></div>
            <HoursList />
            {settings.phone ? (
              <a href={`tel:${settings.phone.replace(/\D/g, "")}`} className="mt-[18px] font-display text-[26px] text-coal no-underline">{settings.phone}</a>
            ) : null}
            <div className="mt-[18px] flex flex-wrap gap-2.5">
              <Link href="/menu" className="btn btn-fire">Order pickup</Link>
              {settings.doordash_url ? <a className="btn btn-line" href={settings.doordash_url} rel="noopener noreferrer" target="_blank">DoorDash</a> : null}
              {settings.ubereats_url ? <a className="btn btn-line" href={settings.ubereats_url} rel="noopener noreferrer" target="_blank">Uber Eats</a> : null}
              {settings.maps_url ? <a className="btn btn-line" href={settings.maps_url} rel="noopener noreferrer" target="_blank">Directions</a> : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
