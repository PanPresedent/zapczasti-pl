"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

type AccountType = "private" | "company";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CompanyData = { name: string; street: string; city: string };

// Rozdziela pełny adres "UL. XYZ 1, 00-000 MIASTO" na ulicę i miasto.
function parseAddress(full: string): { street: string; city: string } {
  if (!full) return { street: "", city: "" };
  const parts = full.split(",");
  const street = parts[0]?.trim() ?? "";
  const rest = parts.slice(1).join(",").trim();
  const match = rest.match(/\d{2}-\d{3}\s+(.+)/);
  const city = match ? match[1].trim() : rest;
  return { street, city };
}

// Rejestr.io (wymaga klucza API) — próbujemy, a przy braku danych/kluczu wracamy null.
async function fetchFromRejestrIo(nip: string): Promise<CompanyData | null> {
  try {
    const res = await fetch(`https://api.rejestr.io/v2/krs?nip=${nip}`);
    if (!res.ok) return null;
    const json = await res.json();
    const entity = Array.isArray(json?.results) ? json.results[0] : json;
    const name: string | undefined = entity?.nazwy?.pelna || entity?.nazwa || entity?.name;
    const addr = entity?.adres ?? {};
    const street = [addr.ulica, addr.numer].filter(Boolean).join(" ").trim();
    const cityValue: string = addr.miejscowosc || addr.miasto || "";
    if (!name) return null;
    return { name, street, city: cityValue };
  } catch {
    return null;
  }
}

// Biała lista podatników VAT (Ministerstwo Finansów) — publiczne, bez klucza.
async function fetchFromMf(nip: string): Promise<CompanyData | null> {
  const date = new Date().toISOString().slice(0, 10);
  const res = await fetch(`https://wl-api.mf.gov.pl/api/search/nip/${nip}?date=${date}`);
  if (!res.ok) return null;
  const json = await res.json();
  const subject = json?.result?.subject;
  if (!subject?.name) return null;
  const { street, city } = parseAddress(subject.workingAddress || subject.residenceAddress || "");
  return { name: subject.name as string, street, city };
}

const inputClass =
  "h-11 w-full rounded-md border border-slate-300 px-3 text-sm text-[#333] outline-none ring-[#1a5c38] focus:ring-2";
const errorClass = "mt-1 text-xs text-red-600";

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10" aria-hidden>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10" aria-hidden>
      <path d="M3 9 4.5 4h15L21 9M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9M3 9h18M9 21v-6h6v6" />
    </svg>
  );
}

const ACCOUNT_OPTIONS: {
  id: AccountType;
  title: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "private",
    title: "Osoba prywatna",
    description:
      "Kupuję części do swojego auta i czasem sprzedaję nadwyżki. Nie potrzebuję faktur VAT.",
    icon: <PersonIcon />,
  },
  {
    id: "company",
    title: "Firma / Złomowisko",
    description:
      "Prowadzę zarejestrowaną działalność, sprzedaję regularnie, płacę podatki i wystawiam faktury VAT.",
    icon: <StoreIcon />,
  },
];

function Field({
  label,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-[#333]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
        placeholder={placeholder}
      />
      {error && <p className={errorClass}>{error}</p>}
    </label>
  );
}

export default function RejestracjaPage() {
  const [type, setType] = useState<AccountType | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [company, setCompany] = useState("");
  const [nip, setNip] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [accept, setAccept] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [nipLoading, setNipLoading] = useState(false);
  const [nipMessage, setNipMessage] = useState<string | null>(null);

  const selectType = (next: AccountType) => {
    setType(next);
    setErrors({});
  };

  const lookupNip = async () => {
    const cleaned = nip.replace(/[\s-]/g, "");
    setNipMessage(null);
    if (!/^\d{10}$/.test(cleaned)) {
      setErrors((prev) => ({ ...prev, nip: "NIP musi mieć 10 cyfr" }));
      return;
    }

    setNipLoading(true);
    try {
      const found = (await fetchFromRejestrIo(cleaned)) ?? (await fetchFromMf(cleaned));
      if (!found) {
        setNipMessage("Nie znaleziono firmy o podanym NIP");
        return;
      }
      setErrors((prev) => ({ ...prev, nip: "" }));
      if (found.name) setCompany(found.name);
      if (found.street) setAddress(found.street);
      if (found.city) setCity(found.city);
    } catch {
      setNipMessage("Nie znaleziono firmy o podanym NIP");
    } finally {
      setNipLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};

    if (!name.trim()) next.name = "Pole wymagane";
    if (!email.trim()) next.email = "Pole wymagane";
    else if (!EMAIL_RE.test(email)) next.email = "Nieprawidłowy adres email";
    if (!password) next.password = "Pole wymagane";
    else if (password.length < 8 || !/\d/.test(password))
      next.password = "Min. 8 znaków i jedna cyfra";
    if (!confirm) next.confirm = "Pole wymagane";
    else if (confirm !== password) next.confirm = "Hasła nie są zgodne";

    if (type === "company") {
      if (!company.trim()) next.company = "Pole wymagane";
      if (!nip.trim()) next.nip = "Pole wymagane";
      else if (!/^\d{10}$/.test(nip.replace(/[\s-]/g, ""))) next.nip = "NIP musi mieć 10 cyfr";
      if (!address.trim()) next.address = "Pole wymagane";
      if (!city.trim()) next.city = "Pole wymagane";
      if (!phone.trim()) next.phone = "Pole wymagane";
    }

    if (!accept) next.accept = "Musisz zaakceptować regulamin";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const typ_konta = type === "company" ? "company" : "private";
    const [imie, ...rest] = name.trim().split(/\s+/);
    const nazwisko = rest.join(" ");

    const profileData = {
      imie,
      nazwisko,
      typ_konta,
      telefon: type === "company" ? phone.trim() : null,
      nazwa_firmy: type === "company" ? company.trim() : null,
      nip: type === "company" ? nip.replace(/[\s-]/g, "") : null,
      adres: type === "company" ? [address.trim(), city.trim()].filter(Boolean).join(", ") : null,
    };

    const DUPLICATE_MSG = "Konto z tym adresem email już istnieje. Zaloguj się.";

    setLoading(true);
    setErrors({});
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: profileData },
      });

      if (error) {
        const message = typeof error.message === "string" ? error.message : "";
        const alreadyRegistered =
          error.code === "user_already_exists" ||
          error.status === 422 ||
          /already\s*registered|already\s*been\s*registered|already\s*exists/i.test(message);
        setErrors({
          form: alreadyRegistered ? DUPLICATE_MSG : message || "Nie udało się utworzyć konta. Spróbuj ponownie.",
        });
        return;
      }

      // Supabase (przy włączonym potwierdzaniu email) nie zwraca błędu dla istniejącego
      // konta, tylko usera z pustą tablicą identities — traktujemy to jako duplikat.
      if (data.user && (data.user.identities?.length ?? 0) === 0) {
        setErrors({ form: DUPLICATE_MSG });
        return;
      }

      // Profil tworzy automatycznie trigger handle_new_user.
      // Gdy potwierdzanie email jest wyłączone, mamy od razu sesję — zapisujemy też z klienta.
      if (data.user && data.session) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email,
          ...profileData,
        });
      }

      setSubmitted(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Wystąpił błąd. Spróbuj ponownie.";
      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />

      <main className="flex-1 bg-white px-4 py-10">
        <div className="mx-auto w-full max-w-2xl">
          {submitted ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-lg font-semibold text-[#1a5c38]">Konto zostało utworzone</p>
              <p className="mt-2 text-sm text-slate-500">
                Sprawdź swoją skrzynkę email, aby potwierdzić konto i dokończyć rejestrację.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#1a5c38] px-6 text-sm font-semibold text-white transition hover:bg-[#154b2d]"
              >
                Wróć na stronę główną
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-center text-2xl font-bold text-[#333]">
                Utwórz konto na zderz.pl
              </h1>
              <p className="mt-1 text-center text-sm text-slate-500">Wybierz rodzaj konta</p>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {ACCOUNT_OPTIONS.map((option) => {
                  const active = type === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => selectType(option.id)}
                      className={`flex flex-col items-center gap-3 rounded-xl border bg-white p-6 text-center shadow-sm transition hover:shadow-md ${
                        active
                          ? "border-[#1a5c38] ring-2 ring-[#1a5c38]"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-[#1a5c38]">{option.icon}</span>
                      <span className="text-base font-bold text-[#333]">{option.title}</span>
                      <span className="text-sm text-slate-500">{option.description}</span>
                    </button>
                  );
                })}
              </div>

              {type !== null && (
                <form
                  onSubmit={handleSubmit}
                  noValidate
                  className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
                >
                  <Field
                    label={type === "company" ? "Imię i nazwisko (właściciela)" : "Imię i nazwisko"}
                    value={name}
                    onChange={setName}
                    error={errors.name}
                    placeholder="Jan Kowalski"
                  />
                  <Field
                    label={type === "company" ? "Email firmowy" : "Email"}
                    type="email"
                    value={email}
                    onChange={setEmail}
                    error={errors.email}
                    placeholder="twoj@email.pl"
                  />
                  <Field
                    label="Hasło"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    error={errors.password}
                    placeholder="Min. 8 znaków, jedna cyfra"
                  />
                  <Field
                    label="Potwierdź hasło"
                    type="password"
                    value={confirm}
                    onChange={setConfirm}
                    error={errors.confirm}
                    placeholder="Powtórz hasło"
                  />

                  {type === "company" && (
                    <>
                      <div className="block">
                        <span className="mb-1 block text-sm font-medium text-[#333]">NIP</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={nip}
                            onChange={(e) => setNip(e.target.value)}
                            className={inputClass}
                            placeholder="1234567890"
                          />
                          <button
                            type="button"
                            onClick={lookupNip}
                            disabled={nipLoading}
                            className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-[#1a5c38] px-4 text-sm font-semibold text-white transition hover:bg-[#154b2d] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {nipLoading && (
                              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                              </svg>
                            )}
                            {nipLoading ? "Sprawdzam…" : "Sprawdź"}
                          </button>
                        </div>
                        {errors.nip && <p className={errorClass}>{errors.nip}</p>}
                        {nipMessage && <p className="mt-1 text-xs text-red-600">{nipMessage}</p>}
                      </div>

                      <Field label="Nazwa firmy" value={company} onChange={setCompany} error={errors.company} />
                      <Field label="Adres siedziby" value={address} onChange={setAddress} error={errors.address} />
                      <Field label="Miasto" value={city} onChange={setCity} error={errors.city} />
                      <Field label="Telefon kontaktowy" type="tel" value={phone} onChange={setPhone} error={errors.phone} placeholder="+48 500 000 000" />
                    </>
                  )}

                  <label className="flex items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      checked={accept}
                      onChange={(e) => setAccept(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[#1a5c38]"
                    />
                    <span className="text-sm text-[#333]">
                      Akceptuję regulamin i politykę prywatności
                    </span>
                  </label>
                  {errors.accept && <p className={errorClass}>{errors.accept}</p>}
                  {errors.form && (
                    <p className="text-sm text-red-600">
                      {typeof errors.form === "string" ? errors.form : JSON.stringify(errors.form)}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 h-11 w-full rounded-md bg-[#1a5c38] text-sm font-semibold text-white transition hover:bg-[#154b2d] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Rejestracja…" : "Zarejestruj się"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
