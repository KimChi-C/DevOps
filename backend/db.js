const mongoose = require("mongoose");

let connectionPromise;

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI chưa được cấu hình.");
  }
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!connectionPromise) {
    mongoose.set("strictQuery", true);
    connectionPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 0,
    }).catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }
  return connectionPromise;
}

module.exports = { connectDatabase, mongoose };
