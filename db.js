require("dotenv").config();
const { MongoClient } = require("mongodb");
const databaseUrl = process.env.DATABASE_URL_AUTH;

let dbConnection;

module.exports = {
  connectToDb: (cb) => {
    MongoClient.connect(databaseUrl)
      .then((client) => {
        dbConnection = client.db();
        return cb();
      })
      .catch((err) => {
        console.log(err);
        return cb(err);
      });
  },
  getDb: () => {
    if (!dbConnection) {
      throw new Error("Database connection not established.");
      // Alternatively, you can return null or a custom error message depending on how you want to handle this case.
      // return null;
    }
    return dbConnection;
  },
};
