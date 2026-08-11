export default async function handler(request, response) {
  try {
    const upstream = await fetch("https://sapircast.caster.fm:17681/admin/publicstats.json", {
      cache: "no-store",
      headers: { accept: "application/json" }
    });

    if (!upstream.ok) {
      throw new Error(`Upstream responded with ${upstream.status}`);
    }

    const data = await upstream.json();
    const stats = Array.isArray(data) ? data.find((item) => item?.source) : null;
    const stream = stats?.source?.["/BHufv"];

    if (!stream) {
      throw new Error("Ömür FM stream is not active");
    }

    const nowPlaying = stream.metadata?.x_icy_title
      || stream.playlist?.playlist?.track?.at?.(-1)?.title
      || stream["display-title"]
      || "";

    response.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=30");
    response.status(200).json({
      nowPlaying: String(nowPlaying).trim(),
      currentDj: ""
    });
  } catch (error) {
    console.error("[radio-status] Caster metadata could not be loaded", error);
    response.status(502).json({ nowPlaying: "", currentDj: "" });
  }
}
