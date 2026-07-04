"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/lib/supabase";

type SectionId =
  | "profile"
  | "ogloszenia"
  | "historia"
  | "ulubione"
  | "wiadomosci"
  | "ustawienia";

type Profile = {
  id: string;
  email: string | null;
  imie: string | null;
  nazwisko: string | null;
  telefon: string | null;
  miasto: string | null;
  avatar_url: string | null;
  marketing: boolean | null;
};

type Ogloszenie = {
  id: string;
  tytul: string;
  cena: number | null;
  status: string;
  marka: string | null;
  model: string | null;
  miasto: string | null;
  zdjecia: string[] | null;
  created_at: string;
};

type Ulubione = { id: string; ogloszenie: Ogloszenie | null };

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
  historia: (<><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M3 4h2l2.2 10.5a1 1 0 0 0 1 .8h9.7a1 1 0 0 0 1-.8L21 7H7.1" /></>),
  ulubione: (<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />),
  wiadomosci: (<path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 9 9 0 0 1-3.8-.8L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" />),
  ustawienia: (<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>),
  logout: (<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>),
};

const NAV: { id: SectionId; label: string }[] = [
  { id: "profile", label: "Mój profil" },
  { id: "ogloszenia", label: "Moje ogłoszenia" },
  { id: "historia", label: "Historia zakupów" },
  { id: "ulubione", label: "Ulubione" },
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

export default function KontoPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [active, setActive] = useState<SectionId>("profile");
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
      .select("typ_konta")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted) return;
        const typ = (data as { typ_konta?: string } | null)?.typ_konta;
        if (typ === "company") {
          router.replace("/konto-firmy");
          return;
        }
        setChecking(false);
      });
    return () => {
      mounted = false;
    };
  }, [loading, user, router]);

  if (loading || checking || !user) {
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
            {active === "profile" && <ProfileSection userId={user.id} fallbackName={user.name} email={user.email} />}
            {active === "ogloszenia" && <OgloszeniaSection userId={user.id} />}
            {active === "historia" && <Placeholder text="Historia zakupów będzie dostępna wkrótce" />}
            {active === "ulubione" && <UlubioneSection userId={user.id} />}
            {active === "wiadomosci" && <Placeholder text="Wiadomości będą dostępne wkrótce" />}
            {active === "ustawienia" && <UstawieniaSection email={user.email} userId={user.id} onDeleted={signOut} />}
          </section>
        </div>
      </main>

      <BottomTabs active={active} onSelect={setActive} onLogout={signOut} />
    </>
  );
}

function SidebarNav({
  active,
  onSelect,
  onLogout,
}: {
  active: SectionId;
  onSelect: (id: SectionId) => void;
  onLogout: () => void;
}) {
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

function BottomTabs({
  active,
  onSelect,
  onLogout,
}: {
  active: SectionId;
  onSelect: (id: SectionId) => void;
  onLogout: () => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t border-slate-200 bg-white md:hidden">
      {NAV.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          aria-label={item.label}
          className={`flex min-w-16 flex-1 flex-col items-center gap-1 px-2 py-2 text-[10px] ${
            active === item.id ? "text-[#1a5c38]" : "text-slate-500"
          }`}
        >
          <Icon path={ICONS[item.id]} className="h-5 w-5" />
        </button>
      ))}
      <button
        type="button"
        onClick={onLogout}
        aria-label="Wyloguj się"
        className="flex min-w-16 flex-1 flex-col items-center gap-1 px-2 py-2 text-[10px] text-red-600"
      >
        <Icon path={ICONS.logout} className="h-5 w-5" />
      </button>
    </nav>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">{children}</div>;
}

function Placeholder({ text }: { text: string }) {
  return (
    <Card>
      <p className="py-12 text-center text-slate-500">{text}</p>
    </Card>
  );
}

function ProfileSection({
  userId,
  fallbackName,
  email,
}: {
  userId: string;
  fallbackName: string;
  email: string;
}) {
  const [imieNazwisko, setImieNazwisko] = useState("");
  const [telefon, setTelefon] = useState("");
  const [miasto, setMiasto] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("profiles")
      .select("imie, nazwisko, telefon, miasto, avatar_url")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted) return;
        const row = data as Partial<Profile> | null;
        const parts = [row?.imie, row?.nazwisko].filter(Boolean).join(" ");
        setImieNazwisko(parts);
        setTelefon(row?.telefon ?? "");
        setMiasto(row?.miasto ?? "");
        setAvatarUrl(row?.avatar_url ?? null);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [userId]);

  const initial = (imieNazwisko || fallbackName).charAt(0).toUpperCase();

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const [imie, ...rest] = imieNazwisko.trim().split(/\s+/);
    const { error } = await supabase
      .from("profiles")
      .update({ imie: imie ?? "", nazwisko: rest.join(" "), telefon, miasto })
      .eq("id", userId);
    setSaving(false);
    setMessage(error ? "Nie udało się zapisać zmian" : "Zmiany zostały zapisane");
  };

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage(null);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) {
      setMessage("Nie udało się przesłać zdjęcia");
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", userId);
    setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`);
  };

  return (
    <Card>
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-3xl font-bold text-slate-600">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onAvatarChange} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-md border border-[#1a5c38] px-4 py-2 text-sm font-semibold text-[#1a5c38] transition hover:bg-[#1a5c38]/5"
        >
          Zmień zdjęcie
        </button>
      </div>

      <div className="mt-6 space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[#333]">Imię i nazwisko</span>
          <input value={imieNazwisko} onChange={(e) => setImieNazwisko(e.target.value)} className={inputClass} disabled={loading} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[#333]">Email</span>
          <input value={email} readOnly disabled className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[#333]">Telefon</span>
          <input value={telefon} onChange={(e) => setTelefon(e.target.value)} className={inputClass} disabled={loading} placeholder="+48 500 000 000" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[#333]">Miasto</span>
          <input value={miasto} onChange={(e) => setMiasto(e.target.value)} className={inputClass} disabled={loading} />
        </label>

        {message && <p className="text-sm text-[#1a5c38]">{message}</p>}

        <button
          type="button"
          onClick={save}
          disabled={saving || loading}
          className="h-11 w-full rounded-md bg-[#1a5c38] text-sm font-semibold text-white transition hover:bg-[#154b2d] disabled:opacity-60"
        >
          {saving ? "Zapisywanie…" : "Zapisz zmiany"}
        </button>
      </div>
    </Card>
  );
}

function OgloszeniaSection({ userId }: { userId: string }) {
  const [items, setItems] = useState<Ogloszenie[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("ogloszenia")
      .select("id, tytul, cena, status, marka, model, miasto, zdjecia, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setItems((data as Ogloszenie[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

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
          <Link
            href="/"
            className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-[#1a5c38] px-6 text-sm font-semibold text-white transition hover:bg-[#154b2d]"
          >
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
          <img
            src={o.zdjecia?.[0] || "/logo_transparent.png"}
            alt={o.tytul}
            loading="lazy"
            className="h-20 w-20 shrink-0 rounded-md bg-slate-100 object-cover"
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate text-sm font-semibold text-[#333]">{o.tytul}</h3>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[o.status] ?? "bg-slate-200 text-slate-600"}`}>
                {o.status}
              </span>
            </div>
            <p className="mt-0.5 text-sm font-bold text-[#1a5c38]">{formatPrice(o.cena)}</p>
            <p className="mt-0.5 text-xs text-slate-400">{formatDate(o.created_at)}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-[#333] transition hover:bg-slate-50">
                Edytuj
              </button>
              <button
                type="button"
                onClick={() => deactivate(o.id)}
                disabled={o.status === "nieaktywne"}
                className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-[#333] transition hover:bg-slate-50 disabled:opacity-50"
              >
                Dezaktywuj
              </button>
              <button
                type="button"
                onClick={() => remove(o.id)}
                className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
              >
                Usuń
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function UlubioneSection({ userId }: { userId: string }) {
  const [items, setItems] = useState<Ulubione[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("ulubione")
      .select("id, ogloszenie:ogloszenie_id (id, tytul, cena, status, marka, model, miasto, zdjecia, created_at)")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (!mounted) return;
        const rows = (data as unknown as { id: string; ogloszenie: Ogloszenie | Ogloszenie[] | null }[]) ?? [];
        setItems(
          rows.map((r) => ({
            id: r.id,
            ogloszenie: Array.isArray(r.ogloszenie) ? r.ogloszenie[0] ?? null : r.ogloszenie,
          })),
        );
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [userId]);

  const removeFav = async (favId: string) => {
    await supabase.from("ulubione").delete().eq("id", favId);
    setItems((prev) => prev.filter((f) => f.id !== favId));
  };

  if (loading) return <Placeholder text="Ładowanie…" />;
  if (items.length === 0) return <Placeholder text="Nie masz jeszcze ulubionych ogłoszeń" />;

  return (
    <div className="space-y-3">
      {items.map((fav) => {
        const o = fav.ogloszenie;
        if (!o) return null;
        return (
          <div key={fav.id} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <img
              src={o.zdjecia?.[0] || "/logo_transparent.png"}
              alt={o.tytul}
              loading="lazy"
              className="h-20 w-20 shrink-0 rounded-md bg-slate-100 object-cover"
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <h3 className="truncate text-sm font-semibold text-[#1a5c38]">{o.tytul}</h3>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {[o.marka, o.model].filter(Boolean).join(" ")}
                {o.miasto ? ` · ${o.miasto}` : ""}
              </p>
              <p className="mt-1 text-sm font-bold text-[#1a5c38]">{formatPrice(o.cena)}</p>
            </div>
            <button
              type="button"
              onClick={() => removeFav(fav.id)}
              aria-label="Usuń z ulubionych"
              className="h-8 shrink-0 self-start rounded-md border border-red-300 px-3 text-xs font-medium text-red-600 transition hover:bg-red-50"
            >
              Usuń
            </button>
          </div>
        );
      })}
    </div>
  );
}

function UstawieniaSection({
  email,
  userId,
  onDeleted,
}: {
  email: string;
  userId: string;
  onDeleted: () => void;
}) {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [pwMessage, setPwMessage] = useState<string | null>(null);
  const [pwSaving, setPwSaving] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("profiles")
      .select("marketing")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (mounted) setMarketing(Boolean((data as { marketing?: boolean } | null)?.marketing));
      });
    return () => {
      mounted = false;
    };
  }, [userId]);

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

  const toggleMarketing = async (value: boolean) => {
    setMarketing(value);
    await supabase.from("profiles").update({ marketing: value }).eq("id", userId);
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
          <button
            type="button"
            onClick={changePassword}
            disabled={pwSaving}
            className="h-11 rounded-md bg-[#1a5c38] px-6 text-sm font-semibold text-white transition hover:bg-[#154b2d] disabled:opacity-60"
          >
            {pwSaving ? "Zapisywanie…" : "Zmień hasło"}
          </button>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-[#333]">Zgody marketingowe</h2>
        <label className="mt-4 flex items-start gap-2">
          <input
            type="checkbox"
            checked={marketing}
            onChange={(e) => toggleMarketing(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#1a5c38]"
          />
          <span className="text-sm text-[#333]">
            Zgadzam się na otrzymywanie informacji marketingowych i ofert od zderz.pl
          </span>
        </label>
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-red-600">Usuń konto</h2>
        <p className="mt-2 text-sm text-slate-500">
          Usunięcie konta jest nieodwracalne. Wszystkie Twoje ogłoszenia zostaną trwale usunięte.
        </p>
        <button
          type="button"
          onClick={deleteAccount}
          className="mt-4 h-11 rounded-md bg-red-600 px-6 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          Usuń konto
        </button>
      </Card>
    </div>
  );
}
