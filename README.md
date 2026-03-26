# Business Card AI

A simple Next.js app that lets users upload or take a photo of a business card, extract contact fields with a local model, enrich company info with live web lookup, and export the result as CSV.

## Features

- Batch process multiple business cards in one session
- Support front and back images for the same card
- Upload or capture a business card image
- Live browser camera preview with capture and retake
- Extract `first_name`, `last_name`, `company`, `job_title`, `email`, `phone`, and `website`
- Review multiple results on a separate page with an editable form
- Enrich the record with `company_description`, `address`, `country`, `region`, `company_category`, and a source URL
- Export CSV in this order: company name, address, country, region, email, phone, contact person, job title, company website, company category
- Tailwind-based clean UI

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template and add your key:

```bash
cp .env.example .env.local
```

3. Install and start Ollama, then pull a local model:

```bash
ollama pull gemma3
```

4. Set your local Ollama config in `.env.local`:

```bash
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_VISION_MODEL=gemma3
OLLAMA_TEXT_MODEL=gemma3
```

5. Start the app:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Team Use

If your coworkers need to use it on the same network, run:

```bash
npm run dev:host
```

Then share your Mac's local IP address, for example:

```bash
http://192.168.1.20:3000
```

Notes:

- File upload will work for coworkers over the local network.
- Browser camera access may require HTTPS in some browsers when not using `localhost`.
- For regular shared team use, consider running the app on an internal HTTPS server or reverse proxy.

## Notes

- The app uses `sessionStorage` to carry extracted data from the upload page to the result page, so no database or authentication is required.
- The extraction route sends the business card image to your local Ollama server.
- The enrichment route fetches the company website or search results from the web, then asks Ollama to summarize the company details.
- Recommended first model: `gemma3`, because it can handle both image understanding and text generation in one local setup.
