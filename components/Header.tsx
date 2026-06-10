"use client";

import { useState } from "react";
import AuthModal, { type AuthUser } from "@/components/AuthModal";
import Cart from "@/components/Cart";
import { useCart } from "@/components/CartContext";

type HeaderUser = AuthUser;

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 9 9 0 0 1-3.8-.8L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
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

export default function Header() {
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const { totalCount, openCart } = useCart();

  return (
    <>
    <header className="bg-[#1a5c38]">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <a href="/" className="flex shrink-0 items-center" aria-label="zderz.pl — strona główna">
          <img
            src="/logo_transparent.png"
            alt="zderz.pl"
            className="h-14 w-auto object-contain"
            loading="eager"
          />
        </a>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              // TODO: logika dodawania ogłoszenia
            }}
            className="rounded-lg bg-white px-3 py-2 text-base font-bold text-[#1a5c38] transition hover:bg-slate-100 sm:px-6 sm:py-3"
          >
            <span className="hidden sm:inline">Dodaj ogłoszenie</span>
            <span className="sm:hidden">Dodaj +</span>
          </button>

          {user === null ? (
            <button
              type="button"
              aria-label="Zaloguj się"
              onClick={() => setAuthOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-white/80 px-3 py-2 text-base text-white transition hover:bg-white/10 sm:px-5 sm:py-3"
            >
              <PersonIcon className="h-5 w-5 shrink-0" />
              <span className="hidden sm:inline">Zaloguj się</span>
            </button>
          ) : (
            <>
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-300 text-sm font-bold uppercase text-slate-700"
                aria-label={`Zalogowano jako ${user.name}`}
                title={user.name}
              >
                {user.name.charAt(0)}
              </span>
              <button
                type="button"
                aria-label="Wiadomości"
                className="rounded-md p-2 text-white transition hover:bg-white/10"
              >
                <ChatIcon className="h-6 w-6" />
              </button>
              <button
                type="button"
                aria-label="Ulubione"
                className="rounded-md p-2 text-white transition hover:bg-white/10"
              >
                <HeartIcon className="h-6 w-6" />
              </button>
            </>
          )}

          <button
            type="button"
            aria-label={`Koszyk, ${totalCount} produktów`}
            onClick={openCart}
            className="relative rounded-md p-2 text-white transition hover:bg-white/10"
          >
            <CartIcon className="h-7 w-7" />
            {totalCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white ring-2 ring-[#1a5c38]">
                {totalCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={(authenticatedUser) => {
          setUser(authenticatedUser);
          setAuthOpen(false);
        }}
      />

      <Cart />
    </>
  );
}
