import { NextResponse } from "next/server";
import { getBoardPage } from "@/lib/board";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const page = Number.parseInt(new URL(request.url).searchParams.get("page") ?? "1", 10);
  const board = await getBoardPage(Number.isFinite(page) ? page : 1);
  return NextResponse.json(board, {
    headers: { "cache-control": "no-store" },
  });
}
