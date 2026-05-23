import { GoogleGenerativeAI } from "@google/generative-ai";
import type { OCRExtractedData } from "@/types";

const PROMPT = `Extract the following information from this PMS/vehicle service receipt and return ONLY valid JSON, no explanation:

{
  "shopName": "name of the auto shop",
  "serviceDate": "YYYY-MM-DD format, or null if not found",
  "mileage": number or null (odometer reading in km — look for fields labeled Odometer, KM, Mileage; if blank return null),
  "totalAmount": number (the final TOTAL AMOUNT printed on the receipt, required),
  "items": [
    { "name": "service or item name", "price": number }
  ]
}

Rules:
- Include ALL items in the items array, both paid and free
- FREE items, items marked "-", or items with no price should have price: 0
- For package deals that bundle sub-items (e.g. "LIGHT PMS PACKAGE"), list the package as ONE item with its total price, then list each included sub-item with price: 0
- Include individual add-on items with their actual price
- mileage: if the Odometer field is blank or missing, return null
- totalAmount: use the TOTAL AMOUNT value printed on the receipt
- Return only the JSON object, nothing else`;

export async function extractReceiptData(
  imageBuffer: Buffer,
  mimeType: string
): Promise<OCRExtractedData> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set in environment");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

  const imagePart = {
    inlineData: {
      data: imageBuffer.toString("base64"),
      mimeType: (mimeType.startsWith("image/") ? mimeType : "image/jpeg") as
        | "image/jpeg"
        | "image/png"
        | "image/gif"
        | "image/webp"
        | "image/heic"
        | "image/heif",
    },
  };

  const result = await model.generateContent([PROMPT, imagePart]);
  const text = result.response.text();

  // Strip markdown code fences if Gemini wrapped the JSON
  const jsonText = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  let parsed: Partial<OCRExtractedData & { totalAmount: number }>;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${text.slice(0, 200)}`);
  }

  return {
    shopName: parsed.shopName ?? undefined,
    serviceDate: parsed.serviceDate ?? undefined,
    mileage: parsed.mileage ?? undefined,
    totalAmount: parsed.totalAmount ?? 0,
    items: Array.isArray(parsed.items) ? parsed.items : [],
    rawText: text,
  };
}
