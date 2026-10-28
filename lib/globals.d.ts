import type { MongoClient } from "mongodb";
import type { DemoStore } from "./types";
declare global {
  var aagMongo: Promise<MongoClient> | null | undefined;
  var aagDemo: DemoStore | undefined;
  var aagLocalSecret: string | undefined;
}
export {};
