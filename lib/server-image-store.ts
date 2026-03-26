import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

const IMAGE_DIR = join(tmpdir(), "business-card-ai-images");

function normalizeExtension(filename: string, mimeType: string) {
  const fileExtension = extname(filename).toLowerCase();

  if (fileExtension && /^[.][a-z0-9]+$/.test(fileExtension)) {
    return fileExtension;
  }

  if (mimeType === "image/png") {
    return ".png";
  }

  if (mimeType === "image/webp") {
    return ".webp";
  }

  if (mimeType === "image/heic") {
    return ".heic";
  }

  return ".jpg";
}

export async function persistUploadedImage(file: File) {
  await mkdir(IMAGE_DIR, { recursive: true });

  const extension = normalizeExtension(file.name, file.type);
  const id = randomUUID();
  const filename = `${id}${extension}`;
  const filepath = join(IMAGE_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(filepath, buffer);

  return {
    id,
    filename,
    filepath,
    url: `/api/image/${filename}`
  };
}

export async function loadStoredImage(filename: string) {
  if (!/^[a-f0-9-]+\.[a-z0-9]+$/i.test(filename)) {
    throw new Error("Invalid image filename.");
  }

  const filepath = join(IMAGE_DIR, filename);
  const buffer = await readFile(filepath);
  const extension = extname(filename).toLowerCase();
  const contentType =
    extension === ".png"
      ? "image/png"
      : extension === ".webp"
        ? "image/webp"
        : extension === ".heic"
          ? "image/heic"
          : "image/jpeg";

  return {
    buffer,
    contentType
  };
}
