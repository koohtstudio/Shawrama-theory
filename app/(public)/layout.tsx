import { CartProvider } from "@/components/cart/CartProvider";
import { LiveStoreProvider } from "@/components/live/LiveStore";
import { Footer } from "@/components/public/Footer";
import { Nav } from "@/components/public/Nav";
import { TabBar } from "@/components/public/TabBar";
import { Ticker } from "@/components/public/Ticker";
import { CartDrawerLoader } from "@/components/cart/CartDrawerLoader";
import { Toast } from "@/components/ui/Toast";
import { getCatalog } from "@/lib/data/catalog";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const c = await getCatalog();
  return (
    <CartProvider>
      <LiveStoreProvider
        initial={{
          settings: c.settings,
          beefDays: c.beefDays,
          hours: c.hours,
          closures: c.closures,
          items: c.items.map((i) => ({ id: i.id, sold_out: i.sold_out, published: i.published })),
          modifiers: c.items.flatMap((i) => i.groups.flatMap((g) => g.modifiers.map((m) => ({ id: m.id, sold_out: m.sold_out })))),
        }}
      >
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-coal focus:px-4 focus:py-2 focus:text-cream">
          Skip to content
        </a>
        <Ticker />
        <Nav />
        <main id="main">{children}</main>
        <Footer phone={c.settings.phone} instagram={c.settings.instagram_url} />
        <TabBar />
        <CartDrawerLoader />
        <Toast />
      </LiveStoreProvider>
    </CartProvider>
  );
}
