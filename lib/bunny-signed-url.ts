import crypto from "crypto";

export function getBunnySignedUrl(videoId: string, libraryId: string): string {
  const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 4;
  const securityKey = process.env.BUNNY_TOKEN_SECURITY_KEY!;
  const path = `/${libraryId}/${videoId}`;
  const hash = crypto
    .createHash("sha256")
    .update(securityKey + path + expires)
    .digest("hex");

  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${hash}&expires=${expires}`;
}
