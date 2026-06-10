export type PartCategory = {
  name: string;
  parts: readonly string[];
};

export const CATEGORIES: readonly PartCategory[] = [
  {
    name: "Silnik i osprzęt",
    parts: [
      "Silnik kompletny",
      "Głowica",
      "Turbosprężarka",
      "Alternator",
      "Rozrusznik",
      "Chłodnica",
      "Pompa wody",
      "Pompa oleju",
    ],
  },
  {
    name: "Skrzynia biegów i napęd",
    parts: [
      "Skrzynia manualna",
      "Skrzynia automatyczna",
      "Sprzęgło",
      "Wał napędowy",
      "Półoś",
    ],
  },
  {
    name: "Zawieszenie",
    parts: [
      "Amortyzatory",
      "Sprężyny",
      "Wahacze",
      "Drążki kierownicze",
      "Przekładnia kierownicza",
    ],
  },
  {
    name: "Hamulce",
    parts: ["Tarcze", "Klocki", "Zaciski", "Pompa hamulcowa", "ABS"],
  },
  {
    name: "Nadwozie",
    parts: [
      "Drzwi",
      "Maska",
      "Błotnik",
      "Zderzak przedni",
      "Zderzak tylny",
      "Pokrywa bagażnika",
      "Szyby",
      "Lusterka",
    ],
  },
  {
    name: "Elektryka",
    parts: [
      "ECU",
      "Moduł ABS",
      "Wiązka elektryczna",
      "Czujniki",
      "Stacyjka",
      "Podnośniki szyb",
    ],
  },
  {
    name: "Wnętrze",
    parts: [
      "Fotele",
      "Deska rozdzielcza",
      "Kierownica",
      "Pasy bezpieczeństwa",
      "Podsufitka",
    ],
  },
  {
    name: "Układ wydechowy",
    parts: ["Katalizator", "Tłumik", "Filtr DPF", "Rura wydechowa"],
  },
  {
    name: "Układ paliwowy",
    parts: ["Pompa paliwa", "Wtryskiwacze", "Przepustnica", "Filtr paliwa"],
  },
  {
    name: "Klimatyzacja",
    parts: ["Kompresor", "Skraplacz", "Parownik"],
  },
  {
    name: "Koła i opony",
    parts: ["Felgi stalowe", "Felgi aluminiowe", "Opony letnie", "Opony zimowe"],
  },
];

export const PARTS_BY_CATEGORY: Record<string, readonly string[]> = Object.fromEntries(
  CATEGORIES.map((category) => [category.name, category.parts]),
);
