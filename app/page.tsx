import { UploadCardForm } from "@/components/upload-card-form";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-10 md:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-8 shadow-[0_20px_70px_rgba(23,32,51,0.08)] backdrop-blur md:grid-cols-[1.1fr_0.9fr] md:p-12">
        <section className="flex flex-col justify-between gap-8">
          <div className="space-y-6">
            <span className="inline-flex w-fit rounded-full border border-[var(--border)] bg-white/80 px-4 py-1 text-sm tracking-[0.18em] text-[var(--muted)] uppercase">
              Business Card AI
            </span>
            <div className="space-y-4">
              <h1 className="max-w-xl text-5xl leading-tight font-semibold md:text-6xl">
                Turn paper contacts into clean, editable data.
              </h1>
              <p className="max-w-lg text-lg leading-8 text-[var(--muted)]">
                Upload a business card or open your camera, let a local model extract the contact
                details, enrich the company profile, and export everything as CSV.
              </p>
            </div>
          </div>

          <div className="grid gap-4 text-sm text-[var(--muted)] md:grid-cols-3">
            <div className="rounded-3xl border border-[var(--border)] bg-white/70 p-5">
              <p className="mb-2 text-base font-semibold text-[var(--foreground)]">Upload or capture</p>
              <p>Works with desktop uploads and live browser camera capture.</p>
            </div>
            <div className="rounded-3xl border border-[var(--border)] bg-white/70 p-5">
              <p className="mb-2 text-base font-semibold text-[var(--foreground)]">Review the fields</p>
              <p>Edit any extracted contact details before you save or export.</p>
            </div>
            <div className="rounded-3xl border border-[var(--border)] bg-white/70 p-5">
              <p className="mb-2 text-base font-semibold text-[var(--foreground)]">Local model flow</p>
              <p>Generate a simple company profile with Ollama and download the full record as CSV.</p>
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <UploadCardForm />
        </section>
      </div>
    </main>
  );
}
