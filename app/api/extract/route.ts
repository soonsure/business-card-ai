import { NextResponse } from "next/server";
import { extractionSchema } from "@/lib/schemas";
import { chatWithOllama, getVisionModel } from "@/lib/ollama";
import { persistUploadedImage } from "@/lib/server-image-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const images = formData.getAll("images").filter((entry): entry is File => entry instanceof File);

    if (images.length === 0) {
      return NextResponse.json({ error: "At least one image file is required." }, { status: 400 });
    }

    const storedImages = await Promise.all(images.map((image) => persistUploadedImage(image)));
    const base64Images = await Promise.all(
      images.map(async (image) => Buffer.from(await image.arrayBuffer()).toString("base64"))
    );

    const extracted = await chatWithOllama({
      model: getVisionModel(),
      schema: extractionSchema,
      messages: [
        {
          role: "system",
          content:
            "You extract business card data from one or more images that may represent the front and back of the same card. Combine all visible information. Return only JSON matching the schema. If a field is missing, use an empty string. Keep values concise. Split the person's name into first_name and last_name when possible."
        },
        {
          role: "user",
          content:
            "Read these business card images and extract: first_name, last_name, company, job_title, email, phone, website, address, region, country.",
          images: base64Images
        }
      ]
    });

    return NextResponse.json({
      ...extracted,
      imageUrls: storedImages.map((image) => image.url)
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to extract business card details.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
