import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function saveFile(
  buffer: Buffer,
  filename: string,
  folder: string
): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`${folder}/${filename}`, buffer, {
      access: "private",
      contentType: filename.endsWith(".png") ? "image/png" : "image/jpeg",
    });
    return blob.url;
  }

  // Local development fallback
  const dir = join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), buffer);
  return `/uploads/${folder}/${filename}`;
}
