"use client";

import { useEffect } from "react";
import { formatPrice, useCart } from "@/components/CartContext";

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M3 4h2l2.2 10.5a1 1 0 0 0 1 .8h9.7a1 1 0 0 0 1-.8L21 7H7.1" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export default function Cart() {
  const { items, removeFromCart, totalPrice, isOpen, closeCart } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeCart]);

  return (
    <>
      <div
        onClick={closeCart}
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Koszyk"
        aria-hidden={!isOpen}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 sm:w-96 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-lg font-bold text-[#1a5c38]">Koszyk</h2>
          <button
            type="button"
            aria-label="Zamknij koszyk"
            onClick={closeCart}
            className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#333]"
          >
            <CloseIcon />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <CartIcon className="h-20 w-20 text-slate-300" />
            <p className="text-sm text-slate-500">Twój koszyk jest pusty</p>
            <button
              type="button"
              onClick={closeCart}
              className="rounded-md bg-[#1a5c38] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#154b2d]"
            >
              Przeglądaj ogłoszenia
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 p-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    width={60}
                    height={60}
                    className="h-[60px] w-[60px] shrink-0 rounded-md object-cover"
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-sm font-semibold text-[#333]">{item.name}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {item.brand} {item.model} · {item.year}
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#1a5c38]">{item.price}</p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Usuń ${item.name} z koszyka`}
                    onClick={() => removeFromCart(item.id)}
                    className="h-7 w-7 shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-red-600"
                  >
                    <CloseIcon />
                  </button>
                </li>
              ))}
            </ul>

            <div className="border-t border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Razem</span>
                <span className="text-2xl font-bold text-[#1a5c38]">{formatPrice(totalPrice)}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  // TODO: przejście do zakupu
                }}
                className="mt-3 h-12 w-full rounded-md bg-[#1a5c38] text-base font-semibold text-white transition hover:bg-[#154b2d]"
              >
                Przejdź do zakupu
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
