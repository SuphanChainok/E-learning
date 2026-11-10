import test from "node:test";
import assert from "node:assert/strict";
import {
  getGraphClient,
  buildUserBulkWriteOps,
  getMicrosoftAuthorizeUrl,
} from "../lib/microsoftGraph.ts";
import { signOAuthState, readOAuthState } from "../lib/security.ts";
import { syncMicrosoftLoginUser } from "../lib/store.ts";

test("getGraphClient initializes Graph Client when Azure credentials are set", () => {
  const prevTenant = process.env.AZURE_TENANT_ID;
  const prevClient = process.env.AZURE_CLIENT_ID;
  const prevSecret = process.env.AZURE_CLIENT_SECRET;

  process.env.AZURE_TENANT_ID = "00000000-0000-0000-0000-000000000001";
  process.env.AZURE_CLIENT_ID = "00000000-0000-0000-0000-000000000002";
  process.env.AZURE_CLIENT_SECRET = "test-secret";

  try {
    const client = getGraphClient();
    assert.ok(client);
    assert.equal(typeof client.api, "function");
  } finally {
    process.env.AZURE_TENANT_ID = prevTenant;
    process.env.AZURE_CLIENT_ID = prevClient;
    process.env.AZURE_CLIENT_SECRET = prevSecret;
  }
});

test("buildUserBulkWriteOps constructs MongoDB bulkWrite upsert operations with $or email/azureId and filters missing/duplicate emails", () => {
  const now = new Date("2026-11-10T00:00:00.000Z");
  const ops = buildUserBulkWriteOps(
    [
      {
        id: "azure-user-1",
        displayName: "Somchai Jaidee",
        mail: "  Somchai@Company.com ",
        userPrincipalName: "somchai@company.onmicrosoft.com",
        jobTitle: "Software Engineer",
        department: "Engineering",
      },
      {
        id: "azure-user-2",
        displayName: "Suda Dee",
        mail: null,
        userPrincipalName: "Suda@Company.onmicrosoft.com",
        jobTitle: null,
        department: null,
      },
      {
        id: "azure-user-no-email",
        displayName: "No Email User",
        mail: "   ",
        userPrincipalName: null,
      },
      {
        id: "azure-user-dup-email",
        displayName: "Duplicate Email User",
        mail: "somchai@company.com",
        userPrincipalName: "dup@company.onmicrosoft.com",
      },
    ],
    now,
  );

  assert.equal(ops.length, 2);

  assert.deepEqual(ops[0], {
    updateOne: {
      filter: {
        $or: [{ email: "somchai@company.com" }, { azureId: "azure-user-1" }],
      },
      update: {
        $set: {
          azureId: "azure-user-1",
          displayName: "Somchai Jaidee",
          name: "Somchai Jaidee",
          email: "somchai@company.com",
          userPrincipalName: "somchai@company.onmicrosoft.com",
          jobTitle: "Software Engineer",
          department: "Engineering",
          updatedAt: now,
        },
        $setOnInsert: {
          id: "azure-user-1",
          role: "employee",
          createdAt: now,
        },
      },
      upsert: true,
    },
  });

  assert.deepEqual(ops[1].updateOne.filter, {
    $or: [
      { email: "suda@company.onmicrosoft.com" },
      { azureId: "azure-user-2" },
    ],
  });
  assert.equal(
    ops[1].updateOne.update.$set.email,
    "suda@company.onmicrosoft.com",
  );
  assert.equal(ops[1].updateOne.update.$setOnInsert.role, "employee");
});

test("Microsoft 365 OAuth state signing, authorize URL, and user matching work end-to-end", async () => {
  const prevTenant = process.env.AZURE_TENANT_ID;
  const prevClient = process.env.AZURE_CLIENT_ID;
  process.env.AZURE_TENANT_ID = "5e17d7fd-2d32-453a-a450-6b2030377ee8";
  process.env.AZURE_CLIENT_ID = "9a9bed4f-2558-4a20-ae97-9a58d4f4ae74";

  try {
    const redirectUri = "http://localhost:3000/api/auth/callback/azure-ad";
    const state = signOAuthState(redirectUri);
    const parsedState = readOAuthState(state);
    assert.deepEqual(parsedState, { redirectUri });

    const authUrl = new URL(getMicrosoftAuthorizeUrl(redirectUri, state));
    assert.equal(authUrl.origin, "https://login.microsoftonline.com");
    assert.equal(
      authUrl.searchParams.get("client_id"),
      "9a9bed4f-2558-4a20-ae97-9a58d4f4ae74",
    );
    assert.equal(authUrl.searchParams.get("redirect_uri"), redirectUri);

    const synced = await syncMicrosoftLoginUser({
      id: "ms-user-101",
      displayName: "Employee One",
      mail: "employee1@age.co.th",
      userPrincipalName: "employee1@age.co.th",
      jobTitle: "Analyst",
      department: "Finance",
    });
    assert.equal(synced.id, "ms-user-101");
    assert.equal(synced.email, "employee1@age.co.th");
    assert.equal(synced.role, "employee");
  } finally {
    process.env.AZURE_TENANT_ID = prevTenant;
    process.env.AZURE_CLIENT_ID = prevClient;
  }
});

test("Email OTP Login flow: send-otp checks user existence, saves 6-digit OTP, and verify-otp consumes OTP and creates session", async () => {
  const { POST: sendOtp } = await import("../app/api/auth/send-otp/route.ts");
  const { POST: verifyOtp } = await import(
    "../app/api/auth/verify-otp/route.ts"
  );
  const { NextRequest } = await import("next/server");

  // 1. Unknown email should return 404 "ไม่พบบัญชีผู้ใช้งานในระบบ"
  const unknownReq = new NextRequest(
    "http://127.0.0.1:3000/api/auth/send-otp",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "notfound@age.co.th" }),
    },
  );
  const unknownRes = await sendOtp(unknownReq);
  assert.equal(unknownRes.status, 404);
  const unknownData = await unknownRes.json();
  assert.equal(unknownData.error, "ไม่พบบัญชีผู้ใช้งานในระบบ");

  // 2. Existing user email (employee1@age.co.th from previous test) should succeed and generate 6-digit OTP
  const sendReq = new NextRequest("http://127.0.0.1:3000/api/auth/send-otp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "EMPLOYEE1@age.co.th" }),
  });
  const sendRes = await sendOtp(sendReq);
  assert.equal(sendRes.status, 200);
  const sendData = await sendRes.json();
  assert.equal(sendData.ok, true);
  assert.equal(sendData.email, "employee1@age.co.th");
  assert.equal(sendData.devOtp, undefined);

  const savedOtp = globalThis.aagDemo?.otps?.find(
    (item) => item.email === "employee1@age.co.th",
  )?.otp;
  assert.match(String(savedOtp), /^\d{6}$/);

  // 3. Invalid OTP should be rejected
  const wrongVerifyReq = new NextRequest(
    "http://127.0.0.1:3000/api/auth/verify-otp",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "employee1@age.co.th", otp: "000000" }),
    },
  );
  const wrongVerifyRes = await verifyOtp(wrongVerifyReq);
  assert.equal(wrongVerifyRes.status, 400);

  // 4. Valid OTP should succeed, return user + token, set session cookie, and delete OTP
  const validVerifyReq = new NextRequest(
    "http://127.0.0.1:3000/api/auth/verify-otp",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "employee1@age.co.th",
        otp: savedOtp,
      }),
    },
  );
  const validVerifyRes = await verifyOtp(validVerifyReq);
  assert.equal(validVerifyRes.status, 200);
  const validData = await validVerifyRes.json();
  assert.equal(validData.ok, true);
  assert.equal(validData.user.email, "employee1@age.co.th");
  assert.ok(validData.token);
  assert.ok(validVerifyRes.headers.get("set-cookie")?.includes("aag_session="));

  // 5. Re-using the same OTP must fail because it was deleted upon verification
  const reuseReq = new NextRequest(
    "http://127.0.0.1:3000/api/auth/verify-otp",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "employee1@age.co.th",
        otp: savedOtp,
      }),
    },
  );
  const reuseRes = await verifyOtp(reuseReq);
  assert.equal(reuseRes.status, 400);
});

test("RBAC role helpers and POST /api/courses guard enforce admin/manager/employee permissions", async () => {
  const {
    ROLE_LABELS,
    getRoleLabel,
    normalizeRole,
    canManageCourses,
    isAdminRole,
  } = await import("../types/index.ts");
  const { signSession, readSessionPayload } = await import("../lib/security.ts");
  const { POST } = await import("../app/api/[...path]/route.ts");
  const { NextRequest } = await import("next/server");

  assert.equal(ROLE_LABELS.admin, "ผู้ดูแลระบบ");
  assert.equal(ROLE_LABELS.manager, "ผู้จัดการเรียน");
  assert.equal(ROLE_LABELS.employee, "ผู้เข้าอบรม");
  assert.equal(normalizeRole("student"), "employee");
  assert.equal(normalizeRole("learner"), "employee");
  assert.equal(getRoleLabel("manager"), "ผู้จัดการเรียน");

  assert.equal(canManageCourses("admin"), true);
  assert.equal(canManageCourses("manager"), true);
  assert.equal(canManageCourses("employee"), false);
  assert.equal(isAdminRole("admin"), true);
  assert.equal(isAdminRole("manager"), false);

  const token = signSession("ms-user-101", "employee");
  assert.deepEqual(readSessionPayload(token), {
    id: "ms-user-101",
    role: "employee",
  });

  // Employee attempting to create a course via POST /api/courses receives 403 Forbidden
  const empReq = new NextRequest("http://127.0.0.1:3000/api/courses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: `aag_session=${encodeURIComponent(token)}`,
    },
    body: JSON.stringify({
      title: "Unauthorized Course",
      category: "Safety",
      description: "Should fail",
      targetRole: "all",
      passingScore: 70,
      lessons: [{ id: "l1", title: "Lesson 1", durationMinutes: 5 }],
      questions: [],
    }),
  });
  const empRes = await POST(empReq, {
    params: Promise.resolve({ path: ["courses"] }),
  });
  assert.equal(empRes.status, 403);
  const empData = await empRes.json();
  assert.equal(empData.error, "ไม่มีสิทธิ์ในการสร้างหลักสูตร");
});


