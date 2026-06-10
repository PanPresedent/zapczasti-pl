"use client";

import { useEffect, useState } from "react";

export type AuthUser = {
  name: string;
};

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onAuthenticated: (user: AuthUser) => void;
};

type Tab = "login" | "register";

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
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.5 2.9h-2.3v7A10 10 0 0 0 22 12z" />
    </svg>
  );
}

function SocialButtons() {
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => {
          // TODO: logowanie przez Google
        }}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white text-sm font-medium text-[#333] transition hover:bg-slate-50"
      >
        <GoogleIcon />
        Zaloguj przez Google
      </button>
      <button
        type="button"
        onClick={() => {
          // TODO: logowanie przez Facebook
        }}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#1877F2] text-sm font-medium text-white transition hover:bg-[#1465d4]"
      >
        <FacebookIcon />
        Zaloguj przez Facebook
      </button>
    </div>
  );
}

function Divider() {
  return (
    <div className="my-4 flex items-center gap-3 text-xs uppercase text-slate-400">
      <span className="h-px flex-1 bg-slate-200" />
      lub
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

export default function AuthModal({ open, onClose, onAuthenticated }: AuthModalProps) {
  const [tab, setTab] = useState<Tab>("login");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regAccept, setRegAccept] = useState(false);
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  const [showPassword, setShowPassword] = useState(false);

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

  const submitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!loginEmail.trim()) errors.email = "Pole wymagane";
    else if (!EMAIL_RE.test(loginEmail)) errors.email = "Nieprawidłowy adres email";
    if (!loginPassword) errors.password = "Pole wymagane";
    setLoginErrors(errors);
    if (Object.keys(errors).length > 0) return;

    // TODO(Supabase): prawdziwe logowanie
    onAuthenticated({ name: loginEmail.split("@")[0] || "Użytkownik" });
  };

  const submitRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!regName.trim()) errors.name = "Pole wymagane";
    if (!regEmail.trim()) errors.email = "Pole wymagane";
    else if (!EMAIL_RE.test(regEmail)) errors.email = "Nieprawidłowy adres email";
    if (!regPassword) errors.password = "Pole wymagane";
    else if (regPassword.length < 8 || !/\d/.test(regPassword))
      errors.password = "Min. 8 znaków i jedna cyfra";
    if (!regConfirm) errors.confirm = "Pole wymagane";
    else if (regConfirm !== regPassword) errors.confirm = "Hasła nie są zgodne";
    if (!regAccept) errors.accept = "Musisz zaakceptować regulamin";
    setRegErrors(errors);
    if (Object.keys(errors).length > 0) return;

    // TODO(Supabase): prawdziwa rejestracja
    onAuthenticated({ name: regName.trim() });
  };

  const tabClass = (active: boolean) =>
    `flex-1 border-b-2 px-4 py-3 text-center text-sm font-semibold transition ${
      active
        ? "border-[#1a5c38] text-[#1a5c38]"
        : "border-transparent text-slate-500 hover:text-[#333]"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={tab === "login" ? "Zaloguj się" : "Zarejestruj się"}
        className="relative w-full max-w-md rounded-xl bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Zamknij"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-[#333]"
        >
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
        </button>

        <div className="flex border-b border-slate-200">
          <button type="button" className={tabClass(tab === "login")} onClick={() => setTab("login")}>
            Zaloguj się
          </button>
          <button
            type="button"
            className={tabClass(tab === "register")}
            onClick={() => setTab("register")}
          >
            Zarejestruj się
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto p-5 sm:p-6">
          {tab === "login" ? (
            <form onSubmit={submitLogin} noValidate>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#333]">Email</span>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className={inputClass}
                  placeholder="twoj@email.pl"
                />
                {loginErrors.email && <p className={errorClass}>{loginErrors.email}</p>}
              </label>

              <label className="mt-3 block">
                <span className="mb-1 block text-sm font-medium text-[#333]">Hasło</span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
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
                {loginErrors.password && <p className={errorClass}>{loginErrors.password}</p>}
              </label>

              <button
                type="submit"
                className="mt-4 h-11 w-full rounded-md bg-[#1a5c38] text-sm font-semibold text-white transition hover:bg-[#154b2d]"
              >
                Zaloguj się
              </button>

              <button
                type="button"
                onClick={() => {
                  // TODO: odzyskiwanie hasła
                }}
                className="mt-3 block w-full text-center text-sm text-[#1a5c38] hover:underline"
              >
                Nie pamiętasz hasła?
              </button>

              <Divider />
              <SocialButtons />
            </form>
          ) : (
            <form onSubmit={submitRegister} noValidate>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#333]">Imię</span>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className={inputClass}
                  placeholder="Jan"
                />
                {regErrors.name && <p className={errorClass}>{regErrors.name}</p>}
              </label>

              <label className="mt-3 block">
                <span className="mb-1 block text-sm font-medium text-[#333]">Email</span>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className={inputClass}
                  placeholder="twoj@email.pl"
                />
                {regErrors.email && <p className={errorClass}>{regErrors.email}</p>}
              </label>

              <label className="mt-3 block">
                <span className="mb-1 block text-sm font-medium text-[#333]">Hasło</span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className={`${inputClass} pr-11`}
                    placeholder="Min. 8 znaków, jedna cyfra"
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
                {regErrors.password ? (
                  <p className={errorClass}>{regErrors.password}</p>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">Min. 8 znaków oraz jedna cyfra</p>
                )}
              </label>

              <label className="mt-3 block">
                <span className="mb-1 block text-sm font-medium text-[#333]">Potwierdź hasło</span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  className={inputClass}
                  placeholder="Powtórz hasło"
                />
                {regErrors.confirm && <p className={errorClass}>{regErrors.confirm}</p>}
              </label>

              <label className="mt-4 flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={regAccept}
                  onChange={(e) => setRegAccept(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#1a5c38]"
                />
                <span className="text-sm text-[#333]">
                  Akceptuję regulamin i politykę prywatności
                </span>
              </label>
              {regErrors.accept && <p className={errorClass}>{regErrors.accept}</p>}

              <button
                type="submit"
                className="mt-4 h-11 w-full rounded-md bg-[#1a5c38] text-sm font-semibold text-white transition hover:bg-[#154b2d]"
              >
                Zarejestruj się
              </button>

              <Divider />
              <SocialButtons />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
