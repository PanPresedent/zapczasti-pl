import { Fragment } from "react";
import type { Product } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import { AdBannerSquare, AdBannerVertical } from "@/components/AdBanner";

export default function ProductList({ products }: { products: readonly Product[] }) {
  return (
    <div className="flex gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {products.map((product, index) => (
          <Fragment key={product.id}>
            <ProductCard product={product} />
            {(index + 1) % 5 === 0 && index !== products.length - 1 && (
              <div className="py-2">
                <AdBannerSquare />
              </div>
            )}
          </Fragment>
        ))}
      </div>

      <aside className="hidden lg:block">
        <AdBannerVertical />
      </aside>
    </div>
  );
}
