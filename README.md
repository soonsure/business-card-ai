# Business Card AI

Business Card AI is a Next.js app for turning paper business cards into structured company and contact data.

It supports batch imports, front-and-back card scanning, browser camera capture, local model extraction with Ollama, web-based company enrichment, and CSV export in a fixed business-friendly column order.

## Highlights

- Batch import multiple business cards in one session
- Support front and back images for the same card
- Upload files or capture cards directly with the browser camera
- Extract contact fields using a local Ollama vision model
- Enrich company data by combining live website lookup with a local text model
- Review and edit multiple extracted records in a single result screen
- Export CSV in this column order:
  - Company Name
  - Address
  - Country
  - Region
  - Email
  - Phone
  - Contact Person
  - Job Title
  - Company Website
  - Company Category

## Tech Stack

- Next.js App Router
- React
- Tailwind CSS
- Ollama for local AI inference
- Lightweight server-side web fetching for company enrichment

## What It Extracts

From each card, the app can capture or infer:

- First name
- Last name
- Company name
- Job title
- Email
- Phone
- Website
- Address
- Region
- Country
- Company description
- Company category
- Source URL used for enrichment

Any field not found can remain empty.

## Local Setup

1. Clone the repository

```bash
git clone https://github.com/soonsure/business-card-ai.git
cd business-card-ai
```

2. Install dependencies

```bash
npm install
```

Business Card AI currently targets Node.js 20.9 or newer. If you use `nvm`, you can run:

```bash
nvm use
```

3. Install Ollama

Download from:
[https://ollama.com/download/mac](https://ollama.com/download/mac)

4. Pull the recommended models

```bash
ollama pull qwen3-vl:4b
ollama pull qwen3.5:9b
```

5. Create your local environment file

```bash
cp .env.example .env.local
```

6. Use this local configuration

```bash
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_VISION_MODEL=qwen3-vl:4b
OLLAMA_TEXT_MODEL=qwen3.5:9b
```

7. Start the app

```bash
npm run dev
```

Then open:
[http://localhost:3000](http://localhost:3000)

## Team Use

If coworkers are on the same local network, you can run:

```bash
npm run dev:host
```

Then share your local IP address, for example:

```bash
http://192.168.1.20:3000
```

Notes:

- Standard file upload works well over a local network
- Browser camera access may require HTTPS on some devices and browsers
- For team-wide daily use, consider deploying this app behind an internal HTTPS reverse proxy

## How It Works

1. Upload or capture one or more business cards
2. Optionally provide both front and back images per card
3. Send the card images to a local Ollama model for extraction
4. Review and edit each extracted record
5. Enrich company information using website lookup plus local model summarization
6. Export the final dataset as CSV

## CSV Output

The exported CSV uses this exact column order:

```text
Company Name, Address, Country, Region, Email, Phone, Contact Person, Job Title, Company Website, Company Category
```

## Notes

- No authentication is required
- No cloud AI API key is required
- Card extraction runs against your local Ollama instance
- Company enrichment uses live web fetching, so that step requires internet access
- Uploaded images are stored temporarily on the local machine so batch processing does not exceed browser storage quotas
- The repository includes a GitHub Actions workflow that runs `npm ci` and `npm run build` on pushes and pull requests

## Roadmap Ideas

- Batch progress indicators
- Clickable source links in the editor
- Better company verification rules
- Shared internal deployment with HTTPS
- CRM export integrations

## License

MIT
