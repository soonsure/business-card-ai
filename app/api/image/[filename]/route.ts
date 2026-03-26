import { NextResponse } from "next/server";
import { loadStoredImage } from "@/lib/server-image-store";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await context.params;
    const image = await loadStoredImage(filename);

    return new NextResponse(image.buffer, {
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "private, max-age=3600"
      }
    });
  } catch {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }
}
