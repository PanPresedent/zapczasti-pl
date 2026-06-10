"use client";

import type { Product } from "@/lib/products";
import { useCart } from "@/components/CartContext";

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();

  return (
    <article className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:gap-4 sm:p-4">
      <img
        src={product.image}
        alt={product.name}
        loading="lazy"
        width={120}
        height={120}
        className="h-24 w-24 shrink-0 rounded-md object-cover sm:h-[120px] sm:w-[120px]"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <h2 className="truncate text-base font-semibold text-[#1a5c38] sm:text-lg">
          {product.name}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
          {product.brand} {product.model} · {product.year}
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-[#333]">{product.description}</p>
        <p className="mt-auto pt-2 text-xs text-slate-500 sm:text-sm">{product.city}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end justify-between gap-2">
        <span className="whitespace-nowrap text-lg font-bold text-[#1a5c38] sm:text-2xl">
          {product.price}
        </span>
        <div className="flex flex-col items-stretch gap-2">
          <a
            href={`tel:${product.phone.replace(/\s/g, "")}`}
            className="inline-flex h-9 items-center justify-center rounded-md bg-[#1a5c38] px-3 text-xs font-semibold text-white transition hover:bg-[#154b2d] sm:h-10 sm:px-5 sm:text-sm"
          >
            Zadzwoń
          </a>
          <button
            type="button"
            onClick={() => addToCart(product)}
            className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md border border-[#1a5c38] px-3 text-xs font-semibold text-[#1a5c38] transition hover:bg-[#1a5c38]/5 sm:h-10 sm:px-5 sm:text-sm"
          >
            Dodaj do koszyka
          </button>
        </div>
      </div>
    </article>
  );
}
