/**
 * Client-side download of the brand studio renders (social cards + video frames).
 *
 * The studio renders a fixed-size design (1080px) inside <ScaledStage>, which
 * shrinks it to fit the preview with a CSS transform. To export the TRUE design
 * resolution we target the inner [data-export-stage] node and reset that scale,
 * so a 1080x1080 post downloads at 1080x1080, not at its shrunk preview size.
 */

function findStage(container: HTMLElement): { node: HTMLElement; w: number; h: number } | null {
  const node = container.querySelector<HTMLElement>("[data-export-stage]");
  if (!node) return null;
  const w = Number(node.getAttribute("data-export-w")) || node.offsetWidth || 1080;
  const h = Number(node.getAttribute("data-export-h")) || node.offsetHeight || 1080;
  return { node, w, h };
}

/** Turn a label into a safe file name. */
export function toFileName(name: string, ext = "png"): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "kloudbean";
  return `${base}.${ext}`;
}

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Rasterize a ScaledStage inside `container` to a full-resolution PNG and
 * download it. Throws if no exportable stage is found.
 */
export async function downloadStagePng(container: HTMLElement, name: string): Promise<void> {
  const found = findStage(container);
  if (!found) throw new Error("Nothing to export here");
  const { node, w, h } = found;
  // Lazy-load so the DOM-only library never loads during server render.
  const { toPng } = await import("html-to-image");
  const dataUrl = await toPng(node, {
    width: w,
    height: h,
    pixelRatio: 1,
    cacheBust: true,
    backgroundColor: "#000f27",
    // Undo the preview's shrink-to-fit transform so we capture the real size.
    style: { transform: "none", transformOrigin: "top left", top: "0", left: "0" },
  });
  triggerDownload(dataUrl, toFileName(name));
}
