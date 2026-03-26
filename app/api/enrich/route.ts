import { NextResponse } from "next/server";
import { z } from "zod";
import { enrichmentSchema } from "@/lib/schemas";
import { chatWithOllama, getTextModel } from "@/lib/ollama";
import { collectCompanyContext } from "@/lib/web-enrichment";

export const runtime = "nodejs";

const requestSchema = z.object({
  company: z.string().trim().min(1, "Company is required."),
  website: z.string().optional().default("")
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { company, website } = requestSchema.parse(body);
    const context = await collectCompanyContext(company, website);

    const sourceSummary =
      context.pages.length > 0
        ? context.pages
            .map(
              (page, index) =>
                `Source ${index + 1}\nURL: ${page.url}\nTitle: ${page.title || "Untitled"}\nContent:\n${page.text}`
            )
            .join("\n\n")
        : "No web pages could be fetched. Use only the provided company and website.";

    const enriched = await chatWithOllama({
      model: getTextModel(),
      schema: enrichmentSchema,
      messages: [
        {
          role: "system",
          content:
            "You generate short company summaries from fetched web content. Return only JSON that matches the schema. Prefer facts grounded in the provided sources. Fill address, region, country, and company_category when the sources support them. Set company_source_url to the most credible source URL you used, preferably the official company website. If unsure, keep the description high level and use an empty string for unknown values."
        },
        {
          role: "user",
          content: `Generate company_description, address, region, country, company_category, and company_source_url for this company.\nCompany: ${company}\nWebsite from card: ${website || "Unknown"}\nNormalized website: ${context.normalizedWebsite || "Unknown"}\n\nFetched sources:\n${sourceSummary}`
        }
      ]
    });

    return NextResponse.json(enriched);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid request." },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to enrich company details.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
