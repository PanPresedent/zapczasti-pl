const baseClass =
  "flex items-center justify-center bg-slate-100 text-xs font-medium uppercase tracking-wide text-slate-400";

export function AdBannerHorizontal() {
  return (
    <div
      className={`mx-auto hidden h-[90px] w-[728px] max-w-full lg:flex ${baseClass}`}
      role="complementary"
      aria-label="Reklama"
    >
      Reklama
    </div>
  );
}

export function AdBannerSquare() {
  return (
    <div
      className={`mx-auto h-[250px] w-[300px] max-w-full ${baseClass}`}
      role="complementary"
      aria-label="Reklama"
    >
      Reklama
    </div>
  );
}

export function AdBannerVertical() {
  return (
    <div
      className={`hidden h-[600px] w-[160px] shrink-0 lg:flex ${baseClass}`}
      role="complementary"
      aria-label="Reklama"
    >
      Reklama
    </div>
  );
}
