import "@tanstack/react-start/server-only";
import { generateText } from "ai";
import { createAiProvider } from "./ai-provider";

/**
 * IMAGE GENERATION for blog hero images.
 *
 * Strategy: use AI to generate an image prompt, then:
 *   - If OPENAI_API_KEY is set and supports DALL-E: generate via OpenAI Images API
 *   - Fallback: use Unsplash/Pexels search for a relevant free stock photo
 *   - Last resort: return a branded placeholder URL
 *
 * The plugin handles downloading and uploading to WP media library.
 */

export type ImageResult = {
  url: string;
  alt: string;
  source: "ai" | "stock" | "placeholder";
  prompt?: string;
};

/** Generate a concise, visual image prompt from article title + keyword. */
async function generateImagePrompt(title: string, keyword: string): Promise<string> {
  try {
    const model = createAiProvider();
    const resp = await generateText({
      model,
      system: "You generate short, visual image prompts for blog hero images. Output ONLY the prompt (one sentence, no quotes). Style: modern, clean, professional tech illustration with purple (#4F1AF3) accent. Never include text/words in the image.",
      prompt: `Blog title: "${title}"\nKeyword: "${keyword}"\nGenerate a visual prompt for the hero image.`,
      maxOutputTokens: 80,
      temperature: 0.9,
    });
    return resp.text.trim().replace(/^["']|["']$/g, "");
  } catch {
    return `Modern clean tech illustration of ${keyword}, purple accent, minimalist`;
  }
}

/** Try DALL-E image generation (OpenAI compatible). */
async function generateWithDalle(prompt: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");

  // Only works with real OpenAI (not OpenRouter) for images
  if (!apiKey || !baseUrl.includes("openai.com")) return null;

  try {
    const res = await fetch(`${baseUrl}/images/generations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt.slice(0, 1000),
        n: 1,
        size: "1792x1024",
        quality: "standard",
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { url?: string }[] };
    return json.data?.[0]?.url ?? null;
  } catch {
    return null;
  }
}

/** Search Unsplash for a relevant free stock photo. */
async function searchUnsplash(query: string): Promise<string | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY?.trim();
  if (!key) return null;

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` }, signal: AbortSignal.timeout(15_000) },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { results?: { urls?: { regular?: string } }[] };
    return json.results?.[0]?.urls?.regular ?? null;
  } catch {
    return null;
  }
}

/** Search Pexels for a relevant free stock photo. */
async function searchPexels(query: string): Promise<string | null> {
  const key = process.env.PEXELS_API_KEY?.trim();
  if (!key) return null;

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: key }, signal: AbortSignal.timeout(15_000) },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { photos?: { src?: { large?: string } }[] };
    return json.photos?.[0]?.src?.large ?? null;
  } catch {
    return null;
  }
}

const PLACEHOLDER_URL = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=630&fit=crop";

/**
 * Generate or find a hero image for an article.
 * Tries AI generation first, then stock photos, then placeholder.
 */
export async function generateHeroImage(title: string, keyword: string): Promise<ImageResult> {
  const prompt = await generateImagePrompt(title, keyword);
  const alt = `${title} — Kloudbean`;

  // 1. Try DALL-E
  const aiUrl = await generateWithDalle(prompt);
  if (aiUrl) return { url: aiUrl, alt, source: "ai", prompt };

  // 2. Try Unsplash
  const searchQuery = keyword || title.split(" ").slice(0, 4).join(" ");
  const unsplashUrl = await searchUnsplash(searchQuery + " technology");
  if (unsplashUrl) return { url: unsplashUrl, alt, source: "stock" };

  // 3. Try Pexels
  const pexelsUrl = await searchPexels(searchQuery + " server cloud");
  if (pexelsUrl) return { url: pexelsUrl, alt, source: "stock" };

  // 4. Placeholder
  return { url: PLACEHOLDER_URL, alt, source: "placeholder" };
}
