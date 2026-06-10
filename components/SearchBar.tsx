"use client";

import { useMemo, useState } from "react";
import { CAR_BRAND_NAMES, CARS_BY_BRAND } from "@/lib/cars";
import { CATEGORIES, PARTS_BY_CATEGORY } from "@/lib/categories";

const YEARS = Array.from({ length: 2026 - 1960 + 1 }, (_, i) => 2026 - i);

const fieldClass =
  "h-11 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm text-[#333] outline-none ring-[#1a5c38] focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

export default function SearchBar() {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [category, setCategory] = useState("");
  const [part, setPart] = useState("");

  const models = useMemo(() => {
    if (!brand) return [];
    return [...(CARS_BY_BRAND[brand] ?? [])].sort((a, b) => a.localeCompare(b, "pl"));
  }, [brand]);

  const parts = useMemo(() => PARTS_BY_CATEGORY[category] ?? [], [category]);

  return (
    <form
      className="rounded-lg bg-white p-3 shadow-md sm:p-4"
      onSubmit={(e) => {
        e.preventDefault();
        // TODO: logika wyszukiwania
      }}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <select
          aria-label="Marka"
          value={brand}
          className={fieldClass}
          onChange={(e) => {
            setBrand(e.target.value);
            setModel("");
          }}
        >
          <option value="">Marka</option>
          {CAR_BRAND_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <select
          aria-label="Model"
          value={model}
          disabled={!brand}
          className={fieldClass}
          onChange={(e) => setModel(e.target.value)}
        >
          <option value="">Model</option>
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          aria-label="Rok od"
          defaultValue=""
          className={fieldClass}
        >
          <option value="">Rok od</option>
          {YEARS.map((year) => (
            <option key={`od-${year}`} value={year}>
              {year}
            </option>
          ))}
        </select>

        <select
          aria-label="Rok do"
          defaultValue=""
          className={fieldClass}
        >
          <option value="">Rok do</option>
          {YEARS.map((year) => (
            <option key={`do-${year}`} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select
          aria-label="Kategoria"
          value={category}
          className={fieldClass}
          onChange={(e) => {
            setCategory(e.target.value);
            setPart("");
          }}
        >
          <option value="">Kategoria</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.name} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Nazwa części"
          value={part}
          disabled={!category}
          className={fieldClass}
          onChange={(e) => setPart(e.target.value)}
        >
          <option value="">Nazwa części</option>
          {parts.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3">
        <input
          type="text"
          name="query"
          placeholder="Wpisz nazwę części lub nr artykułu OEM"
          className="h-11 w-full rounded-md border border-slate-300 bg-slate-50 px-3 text-sm text-[#333] outline-none ring-[#1a5c38] placeholder:text-slate-500 focus:ring-2"
        />
      </div>

      <button
        type="submit"
        className="mt-3 h-12 w-full rounded-md bg-[#1a5c38] text-base font-semibold text-white transition hover:bg-[#154b2d]"
      >
        SZUKAJ
      </button>
    </form>
  );
}
