import Link from "next/link";
import { BeefBanner } from "@/components/public/BeefBanner";
import { Hero } from "@/components/public/Hero";
import { Marquee } from "@/components/public/Marquee";
import { MenuCard } from "@/components/public/MenuCard";
import { Reviews } from "@/components/public/Reviews";
import { Strip } from "@/components/public/Strip";
import { Theory } from "@/components/public/Theory";
import { VisitSection } from "@/components/public/VisitSection";
import { getCatalog } from "@/lib/data/catalog";

export const revalidate = 3600;

export default async function HomePage() {
  const c = await getCatalog();
  const featured = c.items.filter((i) => i.featured).slice(0, 6);
  return (
    <>
      <Hero settings={c.settings} />
      <Marquee />
      <Theory />
      <section className="py-20 md:py-[120px]" aria-labelledby="featured-h">
        <div className="wrap">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Crowd favourites</p>
              <h2 id="featured-h" className="h2">Start <span className="accent">here.</span></h2>
            </div>
            <Link href="/menu" className="btn btn-line">See the full menu</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {featured.map((i, n) => <MenuCard key={i.id} item={i} index={n} />)}
          </div>
        </div>
      </section>
      <div className="wrap pb-20 md:pb-[100px]"><BeefBanner /></div>
      <Strip />
      <div className="mt-20 md:mt-[120px]"><Reviews reviews={c.reviews} settings={c.settings} /></div>
      <VisitSection settings={c.settings} />
    </>
  );
}
