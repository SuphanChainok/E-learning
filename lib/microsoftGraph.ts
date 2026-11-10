import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import nodemailer from "nodemailer";

export interface GraphUser {
  id: string;
  displayName?: string | null;
  mail?: string | null;
  userPrincipalName?: string | null;
  jobTitle?: string | null;
  department?: string | null;
}

let cachedGraphClient: Client | null = null;

export function getGraphClient(): Client {
  if (cachedGraphClient) return cachedGraphClient;

  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Missing Azure Entra ID environment variables (AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET)",
    );
  }

  const credential = new ClientSecretCredential(
    tenantId,
    clientId,
    clientSecret,
  );

  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ["https://graph.microsoft.com/.default"],
  });

  cachedGraphClient = Client.initWithMiddleware({
    authProvider,
  });

  return cachedGraphClient;
}

export const graphClient = new Proxy({} as Client, {
  get(_target, prop) {
    const client = getGraphClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export function buildUserBulkWriteOps(users: GraphUser[], now = new Date()) {
  const seenEmails = new Set<string>();
  const seenAzureIds = new Set<string>();
  const ops = [];

  for (const user of users) {
    const azureId = user?.id?.trim();
    const email = (user?.mail || user?.userPrincipalName || "")
      .trim()
      .toLowerCase();

    if (!azureId || !email) {
      continue;
    }

    if (seenEmails.has(email) || seenAzureIds.has(azureId)) {
      continue;
    }

    seenEmails.add(email);
    seenAzureIds.add(azureId);

    const displayName = (
      user.displayName ||
      user.userPrincipalName ||
      email
    ).trim();

    ops.push({
      updateOne: {
        filter: {
          $or: [{ email }, { azureId }],
        },
        update: {
          $set: {
            azureId,
            displayName: user.displayName ?? "",
            name: displayName,
            email,
            userPrincipalName: user.userPrincipalName ?? "",
            jobTitle: user.jobTitle ?? null,
            department: user.department ?? null,
            updatedAt: now,
          },
          $setOnInsert: {
            id: azureId,
            role: "employee" as const,
            createdAt: now,
          },
        },
        upsert: true,
      },
    });
  }

  return ops;
}

export function getMicrosoftAuthorizeUrl(
  redirectUri: string,
  state: string,
): string {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;

  if (!tenantId || !clientId) {
    throw new Error(
      "Missing Azure Entra ID environment variables (AZURE_TENANT_ID, AZURE_CLIENT_ID)",
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope: "openid profile email User.Read",
    state,
    prompt: "select_account",
  });

  return `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/authorize?${params.toString()}`;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export async function exchangeMicrosoftCodeForProfile(
  code: string,
  redirectUri: string,
): Promise<GraphUser> {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Missing Azure Entra ID environment variables (AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET)",
    );
  }

  const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
    scope: "openid profile email User.Read",
  });

  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    id_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(
      tokenData.error_description ||
      tokenData.error ||
      "ไม่สามารถแลกเปลี่ยนโทเค็นจาก Microsoft 365 ได้",
    );
  }

  const meRes = await fetch(
    "https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName,jobTitle,department",
    {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    },
  );

  if (meRes.ok) {
    const profile = (await meRes.json()) as GraphUser;
    if (profile?.id) {
      return profile;
    }
  }

  // Fallback to id_token claims if /me endpoint is unavailable
  const claims = tokenData.id_token
    ? decodeJwtPayload(tokenData.id_token)
    : null;
  const id = String(claims?.oid || claims?.sub || "");
  const email = String(
    claims?.email || claims?.preferred_username || claims?.upn || "",
  );
  const displayName = String(claims?.name || email || "");

  if (!id || !email) {
    throw new Error("ไม่สามารถดึงข้อมูลโปรไฟล์ผู้ใช้จาก Microsoft 365 ได้");
  }

  return {
    id,
    displayName,
    mail: email,
    userPrincipalName: email,
    jobTitle: null,
    department: null,
  };
}

export async function sendOtpEmail(
  toEmail: string,
  otp: string,
  userName?: string,
): Promise<{ sent: boolean; error?: string }> {
  console.info(
    `[AAG+ Email OTP] รหัส OTP สำหรับ ${toEmail} (${userName || "ผู้ใช้งาน"}): ${otp} (หมดอายุใน 5 นาที)`,
  );

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; border: 1px solid #dbe6d5; border-radius: 12px; background: #ffffff; color: #1e3318;">
      <h2 style="margin: 0 0 12px; color: #2d4e24;">AAG+ Learning</h2>
      <p style="margin: 0 0 16px; font-size: 15px;">สวัสดีคุณ <strong>${userName || toEmail}</strong>,</p>
      <p style="margin: 0 0 16px; font-size: 14px; color: #44593e;">รหัสยืนยันตัวตน (OTP) สำหรับเข้าสู่ระบบ AAG+ Learning ของคุณคือ:</p>
      <div style="text-align: center; margin: 24px 0; padding: 18px; background: #f4f8f2; border-radius: 10px; border: 1px dashed #9ab892;">
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1e4c19;">${otp}</span>
      </div>
      <p style="margin: 0 0 8px; font-size: 13px; color: #6b7d65;">* รหัสนี้มีอายุการใช้งาน <strong>5 นาที</strong> กรุณาอย่าเปิดเผยรหัสนี้แก่ผู้อื่น</p>
    </div>
  `;

  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();

  // 1. ส่งอีเมลจริงผ่าน Nodemailer (SMTP) เมื่อตั้งค่า SMTP_HOST, SMTP_USER, SMTP_PASS ใน .env.local
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"AAG+ Learning" <${process.env.SMTP_FROM || smtpUser}>`,
        to: toEmail,
        subject: `[AAG+ Learning] รหัส OTP สำหรับเข้าสู่ระบบ: ${otp}`,
        text: `รหัส OTP สำหรับเข้าสู่ระบบ AAG+ Learning ของคุณคือ ${otp} (รหัสมีอายุการใช้งาน 5 นาที)`,
        html: htmlContent,
      });

      return { sent: true };
    } catch (smtpError) {
      const errMsg =
        smtpError instanceof Error
          ? smtpError.message
          : "ส่งอีเมลผ่าน SMTP ไม่สำเร็จ";
      console.error(`[AAG+ Email OTP] Nodemailer SMTP Error: ${errMsg}`);
      return { sent: false, error: errMsg };
    }
  }

  // 2. Fallback: ส่งผ่าน Microsoft Graph Client หากยังไม่ได้ตั้งค่า SMTP
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    return {
      sent: false,
      error: "ยังไม่ได้ตั้งค่า SMTP_HOST, SMTP_USER, SMTP_PASS ใน .env.local",
    };
  }

  const senderEmail =
    process.env.AZURE_SENDER_EMAIL || process.env.SMTP_FROM || toEmail;

  try {
    const client = getGraphClient();
    await client.api(`/users/${encodeURIComponent(senderEmail)}/sendMail`).post({
      message: {
        subject: `[AAG+ Learning] รหัส OTP สำหรับเข้าสู่ระบบ: ${otp}`,
        body: {
          contentType: "HTML",
          content: htmlContent,
        },
        toRecipients: [
          {
            emailAddress: {
              address: toEmail,
            },
          },
        ],
      },
      saveToSentItems: false,
    });
    return { sent: true };
  } catch (error) {
    const errMsg =
      error instanceof Error ? error.message : "ส่งอีเมลผ่าน Microsoft Graph ไม่สำเร็จ";
    console.warn(
      `[AAG+ Email OTP] ไม่สามารถส่งอีเมลผ่าน Microsoft Graph (${senderEmail} -> ${toEmail}): ${errMsg}`,
    );
    return { sent: false, error: errMsg };
  }
}

