import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

export const db = new Pool(env.database);

export async function query(text, params = []) {
  return db.query(text, params);
}

export async function withTransaction(callback) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
