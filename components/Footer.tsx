const LINKS = [
  { label: "Regulamin", href: "/regulamin" },
  { label: "Polityka prywatności", href: "/polityka-prywatnosci" },
  { label: "Kontakt", href: "/kontakt" },
  { label: "O nas", href: "/o-nas" },
];

export default function Footer() {
  return (
    <footer className="bg-[#1a5c38] py-6 text-white">
      <div className="mx-auto w-full max-w-6xl px-4 text-center sm:px-6 lg:px-8">
        <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm">
          {LINKS.map((link, index) => (
            <span key={link.href} className="flex items-center gap-x-3">
              <a href={link.href} className="transition hover:underline">
                {link.label}
              </a>
              {index < LINKS.length - 1 && (
                <span aria-hidden className="text-white/50">
                  |
                </span>
              )}
            </span>
          ))}
        </nav>

        <p className="mx-auto mt-4 max-w-3xl text-xs leading-relaxed text-emerald-100">
          zderz.pl nie jest stroną sprzedającą. Serwis pośredniczy w kontakcie między kupującym a
          sprzedającym. Administratorem danych osobowych jest [nazwa firmy], ul. [adres], Polska.
          Dane przetwarzane zgodnie z RODO.
        </p>

        <p className="mt-4 text-xs text-emerald-100">
          © 2025–2026 zderz.pl – Wszelkie prawa zastrzeżone. Kopiowanie treści bez zgody zabronione.
        </p>
      </div>
    </footer>
  );
}
