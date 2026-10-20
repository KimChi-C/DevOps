
import { MongoClient } from "mongodb";

let clientPromise;

export async function getDb() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "Thiếu biến môi trường MONGODB_URI trên server"
    );
  }

  if (!clientPromise) {
    const client = new MongoClient(uri);
    clientPromise = client.connect();
  }

  const client = await clientPromise;

  return client.db(
    process.env.MONGODB_DB || "mira_beauty"
  );
}
