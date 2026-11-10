import { NextResponse, type NextRequest } from "next/server";
import {
  getGraphClient,
  buildUserBulkWriteOps,
  type GraphUser,
} from "../../../lib/microsoftGraph.ts";
import { database, userBy } from "../../../lib/store.ts";
import { readSession } from "../../../lib/security.ts";
import { isAdminRole, type User } from "../../../lib/types.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function syncUsersFromGraph() {
  const client = getGraphClient();

  const users: GraphUser[] = [];
  let response = await client
    .api("/users")
    .select("id,displayName,mail,userPrincipalName,jobTitle,department")
    .get();

  if (Array.isArray(response?.value)) {
    users.push(...response.value);
  }

  while (response?.["@odata.nextLink"]) {
    response = await client.api(response["@odata.nextLink"]).get();
    if (Array.isArray(response?.value)) {
      users.push(...response.value);
    }
  }

  const now = new Date();
  const bulkOps = buildUserBulkWriteOps(users, now);

  if (bulkOps.length === 0) {
    return {
      ok: true,
      message: "ไม่พบข้อมูลผู้ใช้จาก Microsoft Graph API",
      totalFetched: 0,
      inserted: 0,
      updated: 0,
      matched: 0,
      upsertedCount: 0,
      modifiedCount: 0,
      matchedCount: 0,
    };
  }

  const db = await database();
  const usersCollection = db.collection<User>("users");

  await usersCollection.createIndex({ azureId: 1 }, { unique: true, sparse: true });

  const result = await usersCollection.bulkWrite(bulkOps, { ordered: false });

  // อัปเดตผู้ใช้เดิมที่เป็น role: "student" หรือ "learner" ให้เป็น "employee"
  await usersCollection.updateMany(
    { role: { $in: ["student", "learner"] } },
    { $set: { role: "employee" } },
  );

  return {
    ok: true,
    message: "ซิงค์ข้อมูลผู้ใช้จาก Azure Entra ID สำเร็จ",
    totalFetched: bulkOps.length,
    inserted: result.upsertedCount,
    updated: result.modifiedCount,
    matched: result.matchedCount,
    upsertedCount: result.upsertedCount,
    modifiedCount: result.modifiedCount,
    matchedCount: result.matchedCount,
  };
}

async function handleSyncRequest(req: NextRequest) {
  try {
    const uid = readSession(req.cookies.get("aag_session")?.value || "");
    if (uid) {
      const currentUser = await userBy("id", uid);
      if (!currentUser || !isAdminRole(currentUser.role)) {
        return NextResponse.json(
          { ok: false, error: "เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถซิงค์ข้อมูลผู้ใช้ได้" },
          { status: 403, headers: { "Cache-Control": "no-store" } },
        );
      }
    }
    const summary = await syncUsersFromGraph();
    return NextResponse.json(summary, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error(
      "Microsoft Graph Sync Error:",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดในการซิงค์ข้อมูลผู้ใช้จาก Microsoft Graph API",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export { handleSyncRequest as GET, handleSyncRequest as POST };
