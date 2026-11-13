import type { Metadata } from "next";
import { MapFacade } from "@/components/public/MapFacade";
import { VisitSection } from "@/components/public/VisitSection";
import { getCatalog } from "@/lib/data/catalog";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Visit",
  description: "Hours, directions and phone for Shawarma Theory at 510 Bayfield St, Barrie.",
};

export default async function VisitPage() {
  const c = await getCatalog();
  return (
    <>
      <div className="wrap pt-10 md:pt-[72px]">
        <p className="eyebrow">Come hungry</p>
        <h1 className="h2">Find <span className="accent">us.</span></h1>
        <div className="mt-10"><MapFacade address={c.settings.address ?? "510 Bayfield St, Barrie, ON"} /></div>
      </div>
      <VisitSection settings={c.settings} heading={false} />
    </>
  );
}
