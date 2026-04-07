import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Database = ReturnType<typeof drizzle>;

let dbInstance: Database | null = null;

function getDb(): Database {
  if (dbInstance) {
    return dbInstance;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL");
  }

  const client = postgres(connectionString);
  dbInstance = drizzle(client, { schema });
  return dbInstance;
}

export const db = new Proxy({} as Database, {
  get(_target, property, receiver) {
    const value = Reflect.get(getDb() as object, property, receiver);
    return typeof value === "function" ? value.bind(getDb()) : value;
  }
});

export { schema };
