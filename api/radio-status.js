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

    const latestTrack = stream.playlist?.playlist?.track?.at?.(-1);
    const cleanValue = (value) => String(value || "")
      .replace(/^StreamTitle=['"]?|['"]?;$/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    const isPlaceholder = (value) => /^(unspecified|unknown|n\/a)(?:\s+(?:name|title|description))?$/i.test(value);

    let artist = cleanValue(
      stream.metadata?.artist
      || stream.metadata?.x_icy_artist
      || latestTrack?.artist
      || latestTrack?.creator
    );
    let title = cleanValue(
      stream.metadata?.title
      || stream.metadata?.x_icy_song
      || latestTrack?.title
    );
    const rawNowPlaying = cleanValue(
      stream.metadata?.x_icy_title
      || stream.metadata?.StreamTitle
      || stream["title"]
      || stream["display-title"]
    );

    if ((!artist || !title) && rawNowPlaying && !isPlaceholder(rawNowPlaying)) {
      const parts = rawNowPlaying.split(/\s+(?:-|\u2013|\u2014|\||\u2022)\s+/, 2);
      if (parts.length === 2) {
        artist ||= cleanValue(parts[0]);
        // Caster.fm playlist titles already contain "Artist - Song". Once the
        // artist is extracted, keep only the song portion to avoid duplicates.
        if (!title || title === rawNowPlaying) title = cleanValue(parts[1]);
      } else if (!title) {
        title = rawNowPlaying;
      }
    }

    if (isPlaceholder(artist)) artist = "";
    if (isPlaceholder(title)) title = "";
    const nowPlaying = [artist, title].filter(Boolean).join(" - ");

    response.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=30");
    response.status(200).json({
      artist,
      title,
      nowPlaying,
      currentDj: ""
    });
  } catch (error) {
    console.error("[radio-status] Caster metadata could not be loaded", error);
    response.status(502).json({ artist: "", title: "", nowPlaying: "", currentDj: "" });
  }
}
