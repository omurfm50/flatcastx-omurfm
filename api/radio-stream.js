const PLAYER_URL = "https://widgets.cloud.caster.fm/player/a26000c2-03c9-4a22-abaa-99f4c6330d05/?token=79ea291b-69b6-42ba-a9e7-378a6c72cc54&frameId=12345&theme=dark&color=e81e4d";
const STREAM_URL = "https://sapircast.caster.fm:17681/BHufv";

export default async function handler(request, response) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD");
    return response.status(405).send("Method not allowed");
  }

  try {
    const upstream = await fetch(PLAYER_URL, {
      cache: "no-store",
      headers: {
        accept: "text/html",
        referer: "https://omur-fm.vercel.app/",
        "user-agent": "Mozilla/5.0"
      }
    });

    if (!upstream.ok) {
      throw new Error(`Caster player responded with ${upstream.status}`);
    }

    const playerHtml = await upstream.text();
    const token = playerHtml.match(/window\.casterfmCloud\.streamToken\s*=\s*['"]([^'"]+)['"]/)?.[1];

    if (!token) {
      throw new Error(
        `Caster stream token was not found (url=${upstream.url}, length=${playerHtml.length}, marker=${playerHtml.includes("streamToken")})`
      );
    }

    response.setHeader("Cache-Control", "no-store");
    return response.redirect(307, `${STREAM_URL}?token=${encodeURIComponent(token)}`);
  } catch (error) {
    console.error("[radio-stream] Stream address could not be prepared", error);
    response.setHeader("Cache-Control", "no-store");
    return response.status(502).send("Radio stream is temporarily unavailable");
  }
}
