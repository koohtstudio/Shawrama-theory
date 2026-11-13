import type { Metadata } from "next";
import { MenuBrowser } from "@/components/public/MenuBrowser";
import { getCatalog } from "@/lib/data/catalog";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Menu",
  description: "Saj wraps, bowls, platters, falafel and fresh sides. Order pickup from Shawarma Theory in Barrie.",
};

export default async function MenuPage() {
  const c = await getCatalog();
  return (
    <section className="py-10 md:py-[72px]">
      <div className="wrap">
        <MenuBrowser categories={c.categories} items={c.items} />
      </div>
    </section>
  );
}
