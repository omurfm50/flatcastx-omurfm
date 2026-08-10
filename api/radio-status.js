export default async function handler(request, response) {
  try {
    const upstream = await fetch("https://omurfm.vercel.app/api/radio-status", {
      headers: { accept: "application/json" }
    });

    if (!upstream.ok) {
      throw new Error(`Upstream responded with ${upstream.status}`);
    }

    const data = await upstream.json();
    response.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=30");
    response.status(200).json({
      nowPlaying: String(data.nowPlaying || "").trim(),
      currentDj: String(data.currentDj || "").trim()
    });
  } catch (error) {
    console.error("[radio-status] Caster metadata could not be loaded", error);
    response.status(502).json({ nowPlaying: "", currentDj: "" });
  }
}
