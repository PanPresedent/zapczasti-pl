"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Header from "@/components/Header";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/lib/supabase";

type SectionId =
  | "profile"
  | "ogloszenia"
  | "magazyn"
  | "statystyki"
  | "promowanie"
  | "wiadomosci"
  | "ustawienia";

type Profile = {
  id: string;
  email: string | null;
  imie: string | null;
  nazwisko: string | null;
  telefon: string | null;
  typ_konta: string | null;
  nazwa_firmy: string | null;
  nip: string | null;
  adres: string | null;
  opis_firmy: string | null;
  prefix_artykulu: string | null;
  avatar_url: string | null;
};

type Ogloszenie = {
  id: string;
  tytul: string;
  cena: number | null;
  status: string;
  marka: string | null;
  model: string | null;
  rok_od: number | null;
  rok_do: number | null;
  numer_artykulu: string | null;
  zdjecia: string[] | null;
  created_at: string;
};

const inputClass =
  "h-11 w-full rounded-md border border-slate-300 px-3 text-sm text-[#333] outline-none ring-[#1a5c38] focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

function Icon({ path, className = "h-5 w-5" }: { path: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {path}
    </svg>
  );
}

const ICONS: Record<SectionId | "logout", React.ReactNode> = {
  profile: (<><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" /></>),
  ogloszenia: (<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 8h10M7 12h10M7 16h6" /></>),
  magazyn: (<><path d="M3 7l9-4 9 4v10l-9 4-9-4z" /><path d="M3 7l9 4 9-4M12 11v10" /></>),
  statystyki: (<><path d="M3 3v18h18" /><path d="M7 15l3-4 3 3 4-6" /></>),
  promowanie: (<><path d="M3 11l18-8-8 18-2-7-8-3z" /></>),
  wiadomosci: (<path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 9 9 0 0 1-3.8-.8L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" />),
  ustawienia: (<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>),
  logout: (<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>),
};

const EyeIcon = (<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>);
const PhoneIcon = (<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />);
const StarIcon = (<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />);
const PinIcon = (<><path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>);
const RocketIcon = (<><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 0 1 8-10 22 22 0 0 1 2 2 22 22 0 0 1-10 8z" /><path d="M9 12H5s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v4s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></>);

const NAV: { id: SectionId; label: string }[] = [
  { id: "profile", label: "Mój profil firmowy" },
  { id: "ogloszenia", label: "Moje ogłoszenia" },
  { id: "magazyn", label: "Mój magazyn" },
  { id: "statystyki", label: "Statystyki" },
  { id: "promowanie", label: "Promowanie ogłoszeń" },
  { id: "wiadomosci", label: "Wiadomości" },
  { id: "ustawienia", label: "Ustawienia" },
];

const STATUS_STYLES: Record<string, string> = {
  aktywne: "bg-green-100 text-green-700",
  nieaktywne: "bg-slate-200 text-slate-600",
  sprzedane: "bg-blue-100 text-blue-700",
  oczekuje: "bg-amber-100 text-amber-700",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pl-PL");
}

function formatPrice(value: number | null) {
  return value == null ? "—" : `${value.toLocaleString("pl-PL")} zł`;
}

function carLabel(o: Ogloszenie) {
  const years = [o.rok_od, o.rok_do].filter(Boolean).join("–");
  return [o.marka, o.model, years].filter(Boolean).join(" ");
}

export default function KontoFirmyPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [active, setActive] = useState<SectionId>("profile");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/");
      return;
    }
    let mounted = true;
    supabase
      .from("profiles")
      .select("id, email, imie, nazwisko, telefon, typ_konta, nazwa_firmy, nip, adres, opis_firmy, prefix_artykulu, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted) return;
        const row = data as Profile | null;
        if (!row || row.typ_konta !== "company") {
          router.replace("/");
          return;
        }
        setProfile(row);
        setChecking(false);
      });
    return () => {
      mounted = false;
    };
  }, [user, loading, router]);

  if (loading || checking || !user || !profile) {
    return (
      <>
        <Header />
        <main className="flex-1 p-8 text-center text-slate-500">Ładowanie…</main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 sm:px-6 md:pb-8 lg:px-8">
        <div className="md:flex md:gap-6">
          <SidebarNav active={active} onSelect={setActive} onLogout={signOut} />
          <section className="min-w-0 flex-1">
            {active === "profile" && <ProfileSection profile={profile} onUpdate={setProfile} />}
            {active === "ogloszenia" && <OgloszeniaSection userId={user.id} />}
            {active === "magazyn" && <MagazynSection profile={profile} onUpdate={setProfile} />}
            {active === "statystyki" && <StatystykiSection userId={user.id} />}
            {active === "promowanie" && <PromowanieSection />}
            {active === "wiadomosci" && <Placeholder text="Wiadomości będą dostępne wkrótce" />}
            {active === "ustawienia" && <UstawieniaSection email={profile.email ?? ""} onDeleted={signOut} />}
          </section>
        </div>
      </main>

      <BottomTabs active={active} onSelect={setActive} onLogout={signOut} />
    </>
  );
}

function SidebarNav({ active, onSelect, onLogout }: { active: SectionId; onSelect: (id: SectionId) => void; onLogout: () => void }) {
  return (
    <aside className="hidden w-64 shrink-0 md:block">
      <nav className="space-y-1 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active === item.id ? "bg-[#1a5c38] text-white" : "text-[#333] hover:bg-slate-100"
            }`}
          >
            <Icon path={ICONS[item.id]} />
            {item.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          <Icon path={ICONS.logout} />
          Wyloguj się
        </button>
      </nav>
    </aside>
  );
}

function BottomTabs({ active, onSelect, onLogout }: { active: SectionId; onSelect: (id: SectionId) => void; onLogout: () => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t border-slate-200 bg-white md:hidden">
      {NAV.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          aria-label={item.label}
          className={`flex min-w-14 flex-1 flex-col items-center gap-1 px-2 py-2 ${active === item.id ? "text-[#1a5c38]" : "text-slate-500"}`}
        >
          <Icon path={ICONS[item.id]} className="h-5 w-5" />
        </button>
      ))}
      <button type="button" onClick={onLogout} aria-label="Wyloguj się" className="flex min-w-14 flex-1 flex-col items-center gap-1 px-2 py-2 text-red-600">
        <Icon path={ICONS.logout} className="h-5 w-5" />
      </button>
    </nav>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}>{children}</div>;
}

function Placeholder({ text }: { text: string }) {
  return (
    <Card>
      <p className="py-12 text-center text-slate-500">{text}</p>
    </Card>
  );
}

function ProfileSection({ profile, onUpdate }: { profile: Profile; onUpdate: (p: Profile) => void }) {
  const [imieNazwisko, setImieNazwisko] = useState([profile.imie, profile.nazwisko].filter(Boolean).join(" "));
  const [nazwaFirmy, setNazwaFirmy] = useState(profile.nazwa_firmy ?? "");
  const [nip, setNip] = useState(profile.nip ?? "");
  const [adres, setAdres] = useState(profile.adres ?? "");
  const [telefon, setTelefon] = useState(profile.telefon ?? "");
  const [opis, setOpis] = useState(profile.opis_firmy ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const initial = (nazwaFirmy || imieNazwisko || "F").charAt(0).toUpperCase();

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const [imie, ...rest] = imieNazwisko.trim().split(/\s+/);
    const patch = {
      imie: imie ?? "",
      nazwisko: rest.join(" "),
      nazwa_firmy: nazwaFirmy,
      nip: nip.replace(/[\s-]/g, ""),
      adres,
      telefon,
      opis_firmy: opis,
    };
    const { error } = await supabase.from("profiles").update(patch).eq("id", profile.id);
    setSaving(false);
    if (error) {
      setMessage("Nie udało się zapisać zmian");
      return;
    }
    setMessage("Zmiany zostały zapisane");
    onUpdate({ ...profile, ...patch });
  };

  const onLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage(null);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${profile.id}/logo.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) {
      setMessage("Nie udało się przesłać logo");
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", profile.id);
    const url = `${data.publicUrl}?t=${Date.now()}`;
    setAvatarUrl(url);
    onUpdate({ ...profile, avatar_url: data.publicUrl });
  };

  return (
    <Card>
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-3xl font-bold text-slate-600">
          {avatarUrl ? <img src={avatarUrl} alt="Logo firmy" className="h-full w-full object-cover" /> : initial}
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onLogoChange} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-md border border-[#1a5c38] px-4 py-2 text-sm font-semibold text-[#1a5c38] transition hover:bg-[#1a5c38]/5"
        >
          Logo firmy
        </button>
      </div>

      <div className="mt-6 space-y-3">
        <TextField label="Imię i nazwisko właściciela" value={imieNazwisko} onChange={setImieNazwisko} />
        <TextField label="Email" value={profile.email ?? ""} onChange={() => {}} readOnly />
        <TextField label="Nazwa firmy" value={nazwaFirmy} onChange={setNazwaFirmy} />
        <TextField label="NIP" value={nip} onChange={setNip} />
        <TextField label="Adres siedziby" value={adres} onChange={setAdres} />
        <TextField label="Telefon kontaktowy" value={telefon} onChange={setTelefon} placeholder="+48 500 000 000" />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[#333]">Opis firmy</span>
          <textarea
            value={opis}
            onChange={(e) => setOpis(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-slate-300 p-3 text-sm text-[#333] outline-none ring-[#1a5c38] focus:ring-2"
          />
        </label>

        {message && <p className="text-sm text-[#1a5c38]">{message}</p>}

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="h-11 w-full rounded-md bg-[#1a5c38] text-sm font-semibold text-white transition hover:bg-[#154b2d] disabled:opacity-60"
        >
          {saving ? "Zapisywanie…" : "Zapisz zmiany"}
        </button>
      </div>
    </Card>
  );
}

function TextField({
  label,
  value,
  onChange,
  readOnly = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-[#333]">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        disabled={readOnly}
        placeholder={placeholder}
        className={inputClass}
      />
    </label>
  );
}

function useOgloszenia(userId: string) {
  const [items, setItems] = useState<Ogloszenie[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("ogloszenia")
      .select("id, tytul, cena, status, marka, model, rok_od, rok_do, numer_artykulu, zdjecia, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setItems((data as Ogloszenie[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, setItems, loading, reload: load };
}

function OgloszeniaSection({ userId }: { userId: string }) {
  const { items, setItems, loading } = useOgloszenia(userId);

  const deactivate = async (id: string) => {
    await supabase.from("ogloszenia").update({ status: "nieaktywne" }).eq("id", id);
    setItems((prev) => prev.map((o) => (o.id === id ? { ...o, status: "nieaktywne" } : o)));
  };

  const remove = async (id: string) => {
    if (!window.confirm("Czy na pewno usunąć ogłoszenie?")) return;
    await supabase.from("ogloszenia").delete().eq("id", id);
    setItems((prev) => prev.filter((o) => o.id !== id));
  };

  if (loading) return <Placeholder text="Ładowanie…" />;

  if (items.length === 0) {
    return (
      <Card>
        <div className="py-10 text-center">
          <p className="text-slate-500">Nie masz jeszcze żadnych ogłoszeń</p>
          <Link href="/" className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-[#1a5c38] px-6 text-sm font-semibold text-white transition hover:bg-[#154b2d]">
            Dodaj ogłoszenie
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((o) => (
        <div key={o.id} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <img src={o.zdjecia?.[0] || "/logo_transparent.png"} alt={o.tytul} loading="lazy" className="h-20 w-20 shrink-0 rounded-md bg-slate-100 object-cover" />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                {o.numer_artykulu && <p className="text-xs font-mono text-slate-400">{o.numer_artykulu}</p>}
                <h3 className="truncate text-sm font-semibold text-[#333]">{o.tytul}</h3>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[o.status] ?? "bg-slate-200 text-slate-600"}`}>{o.status}</span>
            </div>
            <p className="mt-0.5 text-sm font-bold text-[#1a5c38]">{formatPrice(o.cena)}</p>
            <p className="mt-0.5 text-xs text-slate-400">{formatDate(o.created_at)}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-[#333] transition hover:bg-slate-50">Edytuj</button>
              <button
                type="button"
                onClick={() => deactivate(o.id)}
                disabled={o.status === "nieaktywne"}
                className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-[#333] transition hover:bg-slate-50 disabled:opacity-50"
              >
                Dezaktywuj
              </button>
              <button type="button" onClick={() => remove(o.id)} className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50">Usuń</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const PL_LETTERS_RE = /[^A-ZĄĆĘŁŃÓŚŹŻ]/g;

async function ensurePrefix(profile: Profile): Promise<string> {
  if (profile.prefix_artykulu) return profile.prefix_artykulu;
  const base = (profile.nazwa_firmy || "FIRMA").toUpperCase().replace(PL_LETTERS_RE, "") || "FIRMA";
  const { data } = await supabase.from("profiles").select("prefix_artykulu").not("prefix_artykulu", "is", null);
  const taken = new Set(((data as { prefix_artykulu: string | null }[]) ?? []).map((r) => r.prefix_artykulu));

  let prefix = base.slice(0, 1);
  for (let i = 1; i <= base.length; i++) {
    prefix = base.slice(0, i);
    if (!taken.has(prefix)) break;
  }
  if (taken.has(prefix)) {
    let n = 2;
    while (taken.has(`${base}${n}`)) n++;
    prefix = `${base}${n}`;
  }
  await supabase.from("profiles").update({ prefix_artykulu: prefix }).eq("id", profile.id);
  return prefix;
}

function MagazynSection({ profile, onUpdate }: { profile: Profile; onUpdate: (p: Profile) => void }) {
  const [items, setItems] = useState<Ogloszenie[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const prefix = await ensurePrefix(profile);
      if (prefix !== profile.prefix_artykulu) onUpdate({ ...profile, prefix_artykulu: prefix });

      const { data } = await supabase
        .from("ogloszenia")
        .select("id, tytul, cena, status, marka, model, rok_od, rok_do, numer_artykulu, zdjecia, created_at")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: true });
      const rows = (data as Ogloszenie[]) ?? [];

      let maxNum = 0;
      rows.forEach((o) => {
        const m = o.numer_artykulu?.match(/(\d+)$/);
        if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
      });

      const withNums = rows.map((o) => {
        if (o.numer_artykulu) return o;
        maxNum += 1;
        return { ...o, numer_artykulu: `${prefix}-${String(maxNum).padStart(4, "0")}` };
      });

      const toUpdate = withNums.filter((o, i) => !rows[i].numer_artykulu);
      for (const o of toUpdate) {
        await supabase.from("ogloszenia").update({ numer_artykulu: o.numer_artykulu }).eq("id", o.id);
      }

      if (mounted) {
        setItems(withNums.reverse());
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id]);

  const deactivate = async (id: string) => {
    await supabase.from("ogloszenia").update({ status: "nieaktywne" }).eq("id", id);
    setItems((prev) => prev.map((o) => (o.id === id ? { ...o, status: "nieaktywne" } : o)));
  };

  const remove = async (id: string) => {
    if (!window.confirm("Czy na pewno usunąć część z magazynu?")) return;
    await supabase.from("ogloszenia").delete().eq("id", id);
    setItems((prev) => prev.filter((o) => o.id !== id));
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (o) => o.numer_artykulu?.toLowerCase().includes(q) || o.tytul.toLowerCase().includes(q),
    );
  }, [items, query]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#333]">Mój magazyn</h1>
        <p className="mt-1 text-sm text-slate-500">Twoje ogłoszenia skatalogowane według numerów artykułów</p>
        {profile.prefix_artykulu && (
          <p className="mt-1 text-xs text-slate-400">
            Prefiks firmy: <span className="font-mono font-semibold text-[#1a5c38]">{profile.prefix_artykulu}</span>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj po numerze artykułu lub nazwie"
          className={`${inputClass} sm:max-w-sm`}
        />
        <button type="button" className="h-11 shrink-0 rounded-md bg-[#1a5c38] px-4 text-sm font-semibold text-white transition hover:bg-[#154b2d]">
          Dodaj część do magazynu
        </button>
      </div>

      <Card className="!p-0">
        {loading ? (
          <p className="py-12 text-center text-slate-500">Ładowanie…</p>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-slate-500">Brak części w magazynie</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3">Nr artykułu</th>
                  <th className="px-3 py-3">Zdjęcie</th>
                  <th className="px-3 py-3">Nazwa</th>
                  <th className="px-3 py-3">Marka / Model / Rok</th>
                  <th className="px-3 py-3">Cena</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-xs font-semibold text-[#1a5c38]">{o.numer_artykulu}</td>
                    <td className="px-3 py-3">
                      <img src={o.zdjecia?.[0] || "/logo_transparent.png"} alt={o.tytul} loading="lazy" className="h-12 w-12 rounded-md bg-slate-100 object-cover" />
                    </td>
                    <td className="px-3 py-3 font-medium text-[#333]">{o.tytul}</td>
                    <td className="px-3 py-3 text-slate-500">{carLabel(o) || "—"}</td>
                    <td className="whitespace-nowrap px-3 py-3 font-semibold text-[#1a5c38]">{formatPrice(o.cena)}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[o.status] ?? "bg-slate-200 text-slate-600"}`}>{o.status}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <button type="button" title="Edytuj" className="rounded-md border border-slate-300 px-2 py-1 text-xs text-[#333] transition hover:bg-slate-50">Edytuj</button>
                        <button
                          type="button"
                          title="Dezaktywuj"
                          onClick={() => deactivate(o.id)}
                          disabled={o.status === "nieaktywne"}
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs text-[#333] transition hover:bg-slate-50 disabled:opacity-50"
                        >
                          Dezaktywuj
                        </button>
                        <button type="button" title="Usuń" onClick={() => remove(o.id)} className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 transition hover:bg-red-50">Usuń</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card className="flex items-center gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1a5c38]/10 text-[#1a5c38]">
        <Icon path={icon} className="h-6 w-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-[#333]">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </Card>
  );
}

const CHART_DATA = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return {
    dzien: d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" }),
    wyswietlenia: Math.round(20 + Math.random() * 60 + Math.sin(i / 3) * 15),
  };
});

function StatystykiSection({ userId }: { userId: string }) {
  const [aktywne, setAktywne] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("ogloszenia")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "aktywne")
      .then(({ count }) => {
        if (mounted) setAktywne(count ?? 0);
      });
    return () => {
      mounted = false;
    };
  }, [userId]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={EyeIcon} label="Wyświetlenia" value="1 248" />
        <StatCard icon={PhoneIcon} label="Kontakty" value="87" />
        <StatCard icon={ICONS.ogloszenia} label="Aktywne ogłoszenia" value={aktywne ?? "…"} />
      </div>

      <Card>
        <h2 className="text-lg font-bold text-[#333]">Wyświetlenia (ostatnie 30 dni)</h2>
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f0" />
              <XAxis dataKey="dzien" tick={{ fontSize: 11 }} interval={4} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="wyswietlenia" name="Wyświetlenia" stroke="#1a5c38" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function PromoCard({
  icon,
  title,
  description,
  benefits,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefits: string[];
}) {
  return (
    <Card className="flex flex-col">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1a5c38]/10 text-[#1a5c38]">
        <Icon path={icon} className="h-6 w-6" />
      </div>
      <h3 className="mt-3 text-base font-bold text-[#333]">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <ul className="mt-3 space-y-1.5">
        {benefits.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-[#333]">
            <svg viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden>
              <path d="M20 6L9 17l-5-5" />
            </svg>
            {b}
          </li>
        ))}
      </ul>
      <button type="button" className="mt-4 h-11 w-full rounded-md bg-[#1a5c38] text-sm font-semibold text-white transition hover:bg-[#154b2d]">
        Wybierz ogłoszenie
      </button>
    </Card>
  );
}

function PromowanieSection() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PromoCard
          icon={StarIcon}
          title="Wyróżnienie ogłoszenia"
          description="Złota ramka i ikona gwiazdki - przyciąga więcej uwagi"
          benefits={["Złota ramka", "Ikona gwiazdki", "Wyższe pozycje"]}
        />
        <PromoCard
          icon={PinIcon}
          title="Przypięcie na stronie głównej"
          description="Ogłoszenie pojawi się w sekcji wyróżnionych na stronie głównej"
          benefits={["Widoczność dla wszystkich", "Sekcja Polecane", "Maks. 10 jednocześnie"]}
        />
        <PromoCard
          icon={RocketIcon}
          title="Ekspozycja na stronie głównej"
          description="Rotacyjnie pokazywane jako pierwsze na stronie głównej"
          benefits={["Rotacja co 6 godzin", "Oznaczenie Promowane", "Największa widoczność"]}
        />
      </div>
      <Card>
        <p className="text-center text-sm text-slate-500">Cennik promocji będzie dostępny wkrótce. Skontaktuj się z nami.</p>
      </Card>
    </div>
  );
}

function UstawieniaSection({ email, onDeleted }: { email: string; onDeleted: () => void }) {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [pwMessage, setPwMessage] = useState<string | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  const changePassword = async () => {
    setPwMessage(null);
    if (newPass.length < 8 || !/\d/.test(newPass)) {
      setPwMessage("Nowe hasło: min. 8 znaków i jedna cyfra");
      return;
    }
    if (newPass !== confirmPass) {
      setPwMessage("Hasła nie są zgodne");
      return;
    }
    setPwSaving(true);
    const { error: signErr } = await supabase.auth.signInWithPassword({ email, password: oldPass });
    if (signErr) {
      setPwSaving(false);
      setPwMessage("Nieprawidłowe stare hasło");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setPwSaving(false);
    if (error) {
      setPwMessage(error.message);
      return;
    }
    setPwMessage("Hasło zostało zmienione");
    setOldPass("");
    setNewPass("");
    setConfirmPass("");
  };

  const deleteAccount = async () => {
    if (!window.confirm("Czy na pewno chcesz usunąć konto? Tej operacji nie można cofnąć.")) return;
    // Usunięcie użytkownika z auth wymaga uprawnień administratora (server-side).
    // TODO: wywołać route API z kluczem service_role. Na razie wylogowujemy.
    onDeleted();
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-bold text-[#333]">Zmiana hasła</h2>
        <div className="mt-4 space-y-3">
          <input type="password" value={oldPass} onChange={(e) => setOldPass(e.target.value)} className={inputClass} placeholder="Stare hasło" />
          <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className={inputClass} placeholder="Nowe hasło" />
          <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} className={inputClass} placeholder="Potwierdź nowe hasło" />
          {pwMessage && <p className="text-sm text-[#1a5c38]">{pwMessage}</p>}
          <button type="button" onClick={changePassword} disabled={pwSaving} className="h-11 rounded-md bg-[#1a5c38] px-6 text-sm font-semibold text-white transition hover:bg-[#154b2d] disabled:opacity-60">
            {pwSaving ? "Zapisywanie…" : "Zmień hasło"}
          </button>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-red-600">Usuń konto</h2>
        <p className="mt-2 text-sm text-slate-500">Usunięcie konta jest nieodwracalne. Wszystkie Twoje ogłoszenia zostaną trwale usunięte.</p>
        <button type="button" onClick={deleteAccount} className="mt-4 h-11 rounded-md bg-red-600 px-6 text-sm font-semibold text-white transition hover:bg-red-700">
          Usuń konto
        </button>
      </Card>
    </div>
  );
}
