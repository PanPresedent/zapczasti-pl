"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export type AuthUser = {
  name: string;
};

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onAuthenticated: (user: AuthUser) => void;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
  "h-11 w-full rounded-md border border-slate-300 px-3 text-sm text-[#333] outline-none ring-[#1a5c38] focus:ring-2";
const errorClass = "mt-1 text-xs text-red-600";

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      {open ? (
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.3 4.1" />
          <path d="M6.1 6.1A17.6 17.6 0 0 0 2 11s3.5 7 10 7a10.9 10.9 0 0 0 4-.7" />
          <path d="M9.5 9.5a3 3 0 0 0 4.2 4.2" />
          <path d="m2 2 20 20" />
        </>
      )}
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 0-24c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 1 0 24 44a20 20 0 0 0 19.6-23.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.5 5A20 20 0 0 0 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C42.9 35.6 44 30.2 44 24c0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#1877F2" aria-hidden>
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.5 2.9h-2.3v7A10 10 0 0 0 22 12z" />
    </svg>
  );
}

function BenefitIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1a5c38]/10 text-[#1a5c38]">
      {children}
    </span>
  );
}

const BENEFITS = [
  {
    text: "Dodaj ogłoszenie i sprzedawaj części",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    text: "Zapisuj ogłoszenia do ulubionych",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
    ),
  },
  {
    text: "Kontaktuj się ze sprzedawcami",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
        <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 9 9 0 0 1-3.8-.8L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" />
      </svg>
    ),
  },
];

export default function AuthModal({ open, onClose, onAuthenticated }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!email.trim()) nextErrors.email = "Pole wymagane";
    else if (!EMAIL_RE.test(email)) nextErrors.email = "Nieprawidłowy adres email";
    if (!password) nextErrors.password = "Pole wymagane";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setErrors({ form: "Nieprawidłowy email lub hasło" });
      return;
    }

    const metadata = data.user?.user_metadata as { imie?: string } | undefined;
    const displayName = metadata?.imie || email.split("@")[0] || "Użytkownik";
    onAuthenticated({ name: displayName });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Logowanie"
        className="relative w-full max-w-3xl rounded-xl bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Zamknij"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-[#333]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="grid max-h-[85vh] grid-cols-1 overflow-y-auto md:grid-cols-2">
          <div className="p-6 sm:p-8">
            <h2 className="text-xl font-bold text-[#333]">Nie masz konta?</h2>
            <Link
              href="/rejestracja"
              onClick={onClose}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-md bg-[#333] px-4 text-sm font-semibold text-white transition hover:bg-black"
            >
              Zarejestruj konto
            </Link>

            <h3 className="mt-12 text-sm font-bold uppercase tracking-wide text-slate-500">
              Korzyści z posiadania konta
            </h3>
            <ul className="mt-4 space-y-4">
              {BENEFITS.map((benefit) => (
                <li key={benefit.text} className="flex items-center gap-3">
                  <BenefitIcon>{benefit.icon}</BenefitIcon>
                  <span className="text-sm text-[#333]">{benefit.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-slate-200 p-6 sm:p-8 md:border-l md:border-t-0">
            <h2 className="text-xl font-bold text-[#333]">Logowanie</h2>

            <form onSubmit={submitLogin} noValidate className="mt-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#333]">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="twoj@email.pl"
                />
                {errors.email && <p className={errorClass}>{errors.email}</p>}
              </label>

              <label className="mt-3 block">
                <span className="mb-1 block text-sm font-medium text-[#333]">Hasło</span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pr-11`}
                    placeholder="Hasło"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-[#333]"
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                {errors.password && <p className={errorClass}>{errors.password}</p>}
              </label>

              {errors.form && <p className="mt-3 text-sm text-red-600">{errors.form}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-4 h-11 w-full rounded-md bg-[#1a5c38] text-sm font-semibold text-white transition hover:bg-[#154b2d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Logowanie…" : "Zaloguj się"}
              </button>

              <button
                type="button"
                onClick={() => {
                  // TODO: odzyskiwanie hasła
                }}
                className="mt-3 block w-full text-center text-sm text-[#1a5c38] hover:underline"
              >
                Nie pamiętam hasła
              </button>

              <div className="my-4 flex items-center gap-3 text-xs uppercase text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                lub
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    // TODO: logowanie przez Google
                  }}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white text-sm font-medium text-[#333] transition hover:bg-slate-50"
                >
                  <GoogleIcon />
                  Zaloguj się przez Google
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // TODO: logowanie przez Facebook
                  }}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white text-sm font-medium text-[#333] transition hover:bg-slate-50"
                >
                  <FacebookIcon />
                  Zaloguj się przez Facebook
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
