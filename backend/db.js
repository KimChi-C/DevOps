
require("dotenv").config();

const windowsAuth =
  (process.env.DB_AUTH || "windows").toLowerCase() === "windows";

const sql = windowsAuth
  ? require("mssql/msnodesqlv8")
  : require("mssql");

const config = {
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_NAME || "MiraBeautyShopDb",
  driver: windowsAuth
    ? process.env.DB_ODBC_DRIVER || "ODBC Driver 18 for SQL Server"
    : undefined,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate:
      process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

if (windowsAuth) {
  config.server = process.env.DB_SERVER || "localhost";
  config.options.instanceName =
    process.env.DB_INSTANCE || "SQLEXPRESS";
  config.options.trustedConnection = true;
} else {
  config.user = process.env.DB_USER;
  config.password = process.env.DB_PASSWORD;

  if (!config.user || !config.password) {
    throw new Error(
      "Thiếu DB_USER hoặc DB_PASSWORD khi sử dụng SQL Authentication"
    );
  }
}

let poolPromise;

async function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .catch((error) => {
        poolPromise = null;
        throw error;
      });
  }

  return poolPromise;
}

module.exports = { sql, getPool };
