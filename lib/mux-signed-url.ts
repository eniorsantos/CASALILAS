import jwt from "jsonwebtoken";

function signPlaybackToken(playbackId: string): string {
  return jwt.sign(
    {
      sub: playbackId,
      aud: "v",
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 4, // 4h
    },
    Buffer.from(process.env.MUX_SIGNING_KEY_PRIVATE!, "base64").toString("utf-8"),
    { algorithm: "RS256", keyid: process.env.MUX_SIGNING_KEY_ID! }
  );
}

export function getSignedPlaybackUrl(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}.m3u8?token=${signPlaybackToken(playbackId)}`;
}

/** MP4 estático p/ download offline (mesmo token assinado do HLS). */
export function getSignedMp4Url(playbackId: string, fileName: string): string {
  return `https://stream.mux.com/${playbackId}/${fileName}?token=${signPlaybackToken(playbackId)}`;
}
