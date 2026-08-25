import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const PLAYER_URL = "https://widgets.cloud.caster.fm/player/a26000c2-03c9-4a22-abaa-99f4c6330d05/?token=79ea291b-69b6-42ba-a9e7-378a6c72cc54&frameId=12345&theme=dark&color=e81e4d";
const STREAM_URL = "https://sapircast.caster.fm:17681/BHufv";

export const maxDuration = 300;

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

    const stream = await fetch(`${STREAM_URL}?token=${encodeURIComponent(token)}`, {
      cache: "no-store",
      headers: {
        accept: "audio/mpeg, audio/aac, */*",
        "icy-metadata": "0",
        "user-agent": "Mozilla/5.0"
      }
    });

    if (!stream.ok || !stream.body) {
      throw new Error(`Caster stream responded with ${stream.status}`);
    }

    response.status(stream.status);
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Content-Type", stream.headers.get("content-type") || "audio/mpeg");
    response.setHeader("X-Accel-Buffering", "no");

    for (const header of ["icy-br", "icy-genre", "icy-name", "icy-url"]) {
      const value = stream.headers.get(header);
      if (value) response.setHeader(header, value);
    }

    if (request.method === "HEAD") {
      await stream.body.cancel();
      return response.end();
    }

    await pipeline(Readable.fromWeb(stream.body), response);
    return undefined;
  } catch (error) {
    console.error("[radio-stream] Stream address could not be prepared", error);
    if (response.headersSent) {
      return response.end();
    }
    response.setHeader("Cache-Control", "no-store");
    return response.status(502).send("Radio stream is temporarily unavailable");
  }
}
