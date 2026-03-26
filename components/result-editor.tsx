"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { multipleCardFieldsToCsv } from "@/lib/csv";
import {
  emptyCardFields,
  type CardFields,
  type StoredCardRecord,
  type StoredCardResult
} from "@/lib/types";

const STORAGE_KEY = "business-card-result";

const FIELD_LABELS: Array<{ key: keyof CardFields; label: string; multiline?: boolean }> = [
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "company", label: "Company Name" },
  { key: "job_title", label: "Job Title" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "website", label: "Company Website" },
  { key: "address", label: "Address", multiline: true },
  { key: "country", label: "Country" },
  { key: "region", label: "Region" },
  { key: "company_category", label: "Company Category" },
  { key: "company_description", label: "Company Description", multiline: true },
  { key: "company_source_url", label: "Source URL" }
];

function getContactName(fields: CardFields) {
  return `${fields.first_name} ${fields.last_name}`.trim();
}

export function ResultEditor() {
  const [cards, setCards] = useState<StoredCardRecord[]>([]);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");
  const [isEnriching, setIsEnriching] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);

    if (!raw) {
      setIsReady(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as StoredCardResult;
      const nextCards = parsed.cards ?? [];
      setCards(nextCards);
      setSelectedCardId(nextCards[0]?.id ?? "");
    } catch {
      setError("Saved result could not be loaded.");
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady || cards.length === 0) {
      return;
    }

    const nextValue: StoredCardResult = { cards };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextValue));
  }, [cards, isReady]);

  const selectedIndex = useMemo(
    () => cards.findIndex((card) => card.id === selectedCardId),
    [cards, selectedCardId]
  );
  const selectedCard = selectedIndex >= 0 ? cards[selectedIndex] : null;

  const updateField = (key: keyof CardFields, value: string) => {
    if (selectedIndex < 0) {
      return;
    }

    setCards((current) =>
      current.map((card, index) =>
        index === selectedIndex
          ? {
              ...card,
              fields: {
                ...card.fields,
                [key]: value
              }
            }
          : card
      )
    );
  };

  const handleEnrich = async () => {
    if (!selectedCard || !selectedCard.fields.company.trim()) {
      setError("Add a company name before enriching company info.");
      return;
    }

    setIsEnriching(true);
    setError("");

    try {
      const response = await fetch("/api/enrich", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          company: selectedCard.fields.company,
          website: selectedCard.fields.website
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Enrichment failed.");
      }

      setCards((current) =>
        current.map((card) =>
          card.id === selectedCard.id
            ? {
                ...card,
                fields: {
                  ...card.fields,
                  ...payload
                }
              }
            : card
        )
      );
    } catch (enrichError) {
      setError(enrichError instanceof Error ? enrichError.message : "Something went wrong.");
    } finally {
      setIsEnriching(false);
    }
  };

  const handleExportCsv = () => {
    const csv = multipleCardFieldsToCsv(cards.map((card) => card.fields));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "business-cards.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (!isReady) {
    return <div className="py-20 text-center text-lg text-[var(--muted)]">Loading result...</div>;
  }

  if (!selectedCard) {
    return (
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-[0_18px_50px_rgba(23,32,51,0.08)]">
        <h1 className="text-3xl font-semibold">No business card loaded</h1>
        <p className="mt-3 text-[var(--muted)]">
          Upload a batch of cards from the homepage first, then come back here to review the
          extracted fields.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--accent-strong)]"
        >
          Back to Upload
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm tracking-[0.2em] text-[var(--muted)] uppercase">Result</p>
          <h1 className="mt-2 text-4xl font-semibold">Batch review and export</h1>
          <p className="mt-2 text-[var(--muted)]">
            {cards.length} card{cards.length > 1 ? "s" : ""} ready. CSV columns follow your
            requested order.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/" className="text-sm font-semibold text-[var(--accent)]">
            Upload more cards
          </Link>
          <button
            type="button"
            onClick={handleExportCsv}
            className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Export CSV
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="flex gap-3 overflow-x-auto pb-2">
        {cards.map((card, index) => (
          <button
            key={card.id}
            type="button"
            onClick={() => setSelectedCardId(card.id)}
            className={`min-w-44 rounded-2xl border px-4 py-3 text-left transition ${
              card.id === selectedCardId
                ? "border-[var(--accent)] bg-white shadow-sm"
                : "border-[var(--border)] bg-[var(--card)]"
            }`}
          >
            <p className="text-xs tracking-[0.18em] text-[var(--muted)] uppercase">Card {index + 1}</p>
            <p className="mt-2 font-semibold">{card.fields.company || getContactName(card.fields) || "Untitled"}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{card.fields.email || "No email yet"}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_18px_50px_rgba(23,32,51,0.08)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Uploaded Images</h2>
            <span className="rounded-full bg-white px-3 py-1 text-xs tracking-[0.18em] text-[var(--muted)] uppercase">
              {selectedCard.imageUrls.length > 1 ? "Front + Back" : "Single Side"}
            </span>
          </div>
          <div className={`grid gap-4 ${selectedCard.imageUrls.length > 1 ? "md:grid-cols-2" : ""}`}>
            {selectedCard.imageUrls.map((imageUrl, index) => (
              <div
                key={`${selectedCard.id}-${index}`}
                className="overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-white"
              >
                <img
                  src={imageUrl}
                  alt={`Uploaded business card side ${index + 1}`}
                  className="h-full w-full object-contain"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_18px_50px_rgba(23,32,51,0.08)]">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Editable Fields</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Review this record, then enrich company info from the web when needed.
              </p>
            </div>
            <button
              type="button"
              onClick={handleEnrich}
              disabled={isEnriching}
              className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isEnriching ? "Enriching..." : "Enrich Company Info"}
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {FIELD_LABELS.map(({ key, label, multiline }) => (
              <label key={key} className={multiline ? "md:col-span-2" : ""}>
                <span className="mb-2 block text-sm font-semibold text-[var(--foreground)]">{label}</span>
                {multiline ? (
                  <textarea
                    value={selectedCard.fields[key] || ""}
                    onChange={(event) => updateField(key, event.target.value)}
                    rows={4}
                    className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                  />
                ) : (
                  <input
                    value={selectedCard.fields[key] || ""}
                    onChange={(event) => updateField(key, event.target.value)}
                    className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                  />
                )}
              </label>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
