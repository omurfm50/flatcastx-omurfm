const PLAYER_URL = "https://widgets.cloud.caster.fm/player/a26000c2-03c9-4a22-abaa-99f4c6330d05/?token=79ea291b-69b6-42ba-a9e7-378a6c72cc54&frameId=omurfm&theme=dark&color=e81e4d";

export default async function handler(request, response) {
  try {
    const upstream = await fetch(PLAYER_URL, {
      cache: "no-store",
      headers: { accept: "text/html" }
    });

    if (!upstream.ok) {
      throw new Error(`Caster player responded with ${upstream.status}`);
    }

    const html = await upstream.text();
    const server = html.match(/\\u0022domain\\u0022:\\u0022([^"\\]+)\\u0022/i)?.[1];
    const port = html.match(/\\u0022streaming_server_port\\u0022:(\d+)/i)?.[1];
    const mountpoint = html.match(/singleChannelKey\s*=\s*['"]([^'"]+)['"]/i)?.[1];
    const token = html.match(/streamToken\s*=\s*['"]([^'"]+)['"]/i)?.[1];

    if (!server || !port || !mountpoint || !token) {
      throw new Error("Caster stream credentials could not be read");
    }

    response.setHeader("Cache-Control", "no-store");
    response.status(200).json({
      streamUrl: `https://${server}:${port}/${mountpoint}?token=${encodeURIComponent(token)}`
    });
  } catch (error) {
    console.error("[radio-stream] Caster stream URL could not be loaded", error);
    response.status(502).json({ streamUrl: "" });
  }
}
