import { type NextRequest } from "next/server";
import {
  GET as catchAllGET,
  POST as catchAllPOST,
  PUT as catchAllPUT,
} from "../[...path]/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return catchAllGET(req, { params: Promise.resolve({ path: ["courses"] }) });
}

export async function POST(req: NextRequest) {
  return catchAllPOST(req, { params: Promise.resolve({ path: ["courses"] }) });
}

export async function PUT(req: NextRequest) {
  return catchAllPUT(req, { params: Promise.resolve({ path: ["courses"] }) });
}

