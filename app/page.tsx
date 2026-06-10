import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import { AdBannerHorizontal } from "@/components/AdBanner";
import ProductList from "@/components/ProductList";
import Footer from "@/components/Footer";
import type { Product } from "@/lib/products";

const PRODUCTS: readonly Product[] = [
  {
    id: 1,
    name: "Reflektor lewy",
    brand: "BMW",
    model: "3 Series",
    year: 2008,
    description: "Reflektor lewy przedni do BMW serii 3 E90, lekko przyciemniony, bez pęknięć.",
    city: "Warszawa",
    price: "650 zł",
    phone: "+48 500 111 222",
    image:
      "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=400&q=70",
  },
  {
    id: 2,
    name: "Skrzynia biegów manualna",
    brand: "Audi",
    model: "A4",
    year: 2012,
    description: "6-biegowa skrzynia manualna do Audi A4 B8 2.0 TDI, sprawdzona, gwarancja.",
    city: "Kraków",
    price: "1800 zł",
    phone: "+48 500 333 444",
    image:
      "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=400&q=70",
  },
  {
    id: 3,
    name: "Zderzak przedni",
    brand: "Opel",
    model: "Astra",
    year: 2014,
    description: "Zderzak przedni Opel Astra J po liftingu, kolor srebrny, kompletny.",
    city: "Poznań",
    price: "420 zł",
    phone: "+48 500 555 666",
    image:
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=70",
  },
  {
    id: 4,
    name: "Alternator",
    brand: "Volkswagen",
    model: "Golf",
    year: 2015,
    description: "Alternator do VW Golf VII 1.6 TDI, w pełni sprawny, niski przebieg.",
    city: "Wrocław",
    price: "390 zł",
    phone: "+48 500 777 888",
    image:
      "https://images.unsplash.com/photo-1599256872237-5dcc0fbe9668?auto=format&fit=crop&w=400&q=70",
  },
  {
    id: 5,
    name: "Drzwi tylne prawe",
    brand: "Ford",
    model: "Focus",
    year: 2013,
    description: "Drzwi tylne prawe Ford Focus MK3, kolor czarny, bez wgnieceń.",
    city: "Gdańsk",
    price: "780 zł",
    phone: "+48 500 999 000",
    image:
      "https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=400&q=70",
  },
  {
    id: 6,
    name: "Silnik kompletny 1.6 TDI",
    brand: "Skoda",
    model: "Octavia",
    year: 2016,
    description: "Silnik kompletny 1.6 TDI do Skoda Octavia III, przebieg 140 tys. km.",
    city: "Łódź",
    price: "3200 zł",
    phone: "+48 501 222 333",
    image:
      "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=400&q=70",
  },
];

export default function Home() {
  return (
    <>
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-6 lg:px-8">
        <SearchBar />

        <div className="mt-4 flex justify-center">
          <AdBannerHorizontal />
        </div>

        <p className="mt-6 text-xs text-slate-500">Ostatnio dodane</p>

        <div className="mt-3">
          <ProductList products={PRODUCTS} />
        </div>
      </main>

      <Footer />
    </>
  );
}
