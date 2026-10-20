import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("Thiếu MONGODB_URI trong file .env");

let clientPromise;
if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  const client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;
export async function getDb() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB || "mira_beauty");
}
