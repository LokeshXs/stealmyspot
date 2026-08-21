import { ImageResponse } from "next/og";
import { OgCard, ogAlt, ogContentType, ogSize } from "@/components/og-card";

export const alt = ogAlt;
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  return new ImageResponse(<OgCard />, size);
}
