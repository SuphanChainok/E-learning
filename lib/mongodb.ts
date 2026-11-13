import { MongoClient, type Db } from "mongodb";

export let dbLastError: string | null = null;

export interface MongoConfig {
  rawUri: string;
  composedUri: string;
  dbName: string;
}

/**
 * Normalizes and validates the MongoDB configuration from environment variables.
 * Automatically incorporates MONGODB_DB into the URI if not already present.
 */
export function resolveMongoConfig(): MongoConfig {
  let rawUri = (process.env.MONGODB_URI || "").trim();
  // Strip surrounding quotes if present (e.g. from .env file parsing)
  if (
    (rawUri.startsWith('"') && rawUri.endsWith('"')) ||
    (rawUri.startsWith("'") && rawUri.endsWith("'"))
  ) {
    rawUri = rawUri.slice(1, -1).trim();
  }

  let dbName = (process.env.MONGODB_DB || "aag_learning").trim();
  if (
    (dbName.startsWith('"') && dbName.endsWith('"')) ||
    (dbName.startsWith("'") && dbName.endsWith("'"))
  ) {
    dbName = dbName.slice(1, -1).trim();
  }

  if (!rawUri) {
    const errorMsg = "MONGODB_URI is required (not found in .env.local or environment variables)";
    dbLastError = errorMsg;
    throw new Error(errorMsg);
  }

  let composedUri = rawUri;
  try {
    const url = new URL(rawUri);
    // If pathname is empty or just '/', append the database name
    if ((!url.pathname || url.pathname === "/" || url.pathname === "") && dbName) {
      url.pathname = `/${dbName}`;
      composedUri = url.toString();
    }
  } catch {
    // If standard URL parsing fails on mongodb+srv://, use string manipulation
    if (rawUri.endsWith("/") && dbName) {
      composedUri = `${rawUri}${dbName}`;
    } else if (!rawUri.includes("?") && !rawUri.includes("/", rawUri.indexOf("://") + 3) && dbName) {
      composedUri = `${rawUri}/${dbName}`;
    }
  }

  return { rawUri, composedUri, dbName };
}

const globals = globalThis as unknown as {
  aagMongo?: Promise<MongoClient> | null;
  aagMongoose?: any;
};

/**
 * Connects to MongoDB using the official mongodb driver.
 * Logs full diagnostic information to the terminal on failure.
 */
export async function connectToDatabase(): Promise<Db> {
  const { composedUri, dbName } = resolveMongoConfig();

  if (!globals.aagMongo) {
    console.log(`[MongoDB] Initializing connection to database "${dbName}"...`);
    const client = new MongoClient(composedUri, {
      serverSelectionTimeoutMS: 5000,
    });

    globals.aagMongo = client
      .connect()
      .then((connectedClient) => {
        console.log(`[MongoDB] Connected successfully to database "${dbName}"!`);
        dbLastError = null;
        return connectedClient;
      })
      .catch((e: unknown) => {
        globals.aagMongo = null;
        const errName = e instanceof Error ? e.name : "UnknownError";
        const errMsg = e instanceof Error ? e.message : String(e);
        const errCode = (e as any)?.code;
        const errCodeName = (e as any)?.codeName;
        const errCause = (e as any)?.cause?.message || (e as any)?.cause;

        dbLastError = `[${errName}] ${errMsg}`;

        // Requirement 1: console.error with real underlying error details
        console.error("❌ [MongoDB Connection Error]:", {
          name: errName,
          message: errMsg,
          code: errCode,
          codeName: errCodeName,
          cause: errCause,
        });

        // Diagnostic hints for common MongoDB Atlas issues
        if (
          errMsg.includes("alert number 80") ||
          errMsg.includes("SSL") ||
          errMsg.includes("TLS") ||
          errMsg.includes("ETIMEDOUT") ||
          errName === "MongoServerSelectionError"
        ) {
          console.error(
            "💡 [MongoDB Atlas Hint]: TLS alert or server selection timeout usually indicates that your CURRENT PUBLIC IP is NOT whitelisted in MongoDB Atlas Network Access.\n   👉 Go to https://cloud.mongodb.com -> Network Access -> Add IP Address (choose 'Allow Access from Anywhere' 0.0.0.0/0 for testing)."
          );
        } else if (
          errMsg.includes("bad auth") ||
          errMsg.includes("AuthenticationFailed") ||
          errCode === 8000
        ) {
          console.error(
            "💡 [MongoDB Auth Hint]: Authentication failed. Please verify the database username and password in MONGODB_URI in your .env.local file."
          );
        }

        if (e instanceof Error && e.stack) {
          console.error("❌ [MongoDB Stack Trace]:\n", e.stack);
        }

        throw e;
      });
  }

  const connectedClient = await globals.aagMongo;
  return connectedClient.db(dbName);
}

/**
 * Optional helper for Mongoose connections if Mongoose is used in the project.
 */
export async function connectWithMongoose(): Promise<any> {
  const { composedUri, dbName } = resolveMongoConfig();
  try {
    const mongoose = await import("mongoose");
    if (mongoose.default.connection.readyState >= 1) {
      return mongoose.default.connection;
    }
    console.log(`[Mongoose] Connecting to database "${dbName}"...`);
    await mongoose.default.connect(composedUri, {
      dbName,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Mongoose] Connected successfully to database "${dbName}"!`);
    return mongoose.default.connection;
  } catch (e: unknown) {
    const errName = e instanceof Error ? e.name : "UnknownError";
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error("❌ [Mongoose Connection Error]:", {
      name: errName,
      message: errMsg,
      cause: (e as any)?.cause,
    });
    throw e;
  }
}

