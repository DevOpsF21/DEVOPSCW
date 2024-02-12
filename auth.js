require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const { connectToDb, getDb } = require("./db");

const app = express();
app.use(express.json());

// Make sure to call connectToDb before starting the server
connectToDb((err) => {
  if (err) {
    console.error("Unable to connect to DB.", err);
    process.exit(1);
  }
  app.listen(3000, () => {
    console.log("Server running on port 3000");
  });
});

// Updated /users POST endpoint to store user in MongoDB
app.post("/v1/createUser", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const user = {
      username: req.body.username,
      password: hashedPassword,
      email: req.body.email,
      roles: req.body.roles,
      created_at: new Date(),
    };

    const db = getDb();
    await db.collection("users").insertOne(user);
    res.status(201).send("User created");
  } catch (error) {
    if (error.code === 11000) {
      // If the error is due to a duplicate key (e.g., email already exists)
      res.status(409).send("User with the given email already exists.");
    } else {
      console.error("Error creating user:", error);
      res.status(500).send("Error creating user");
    }
  }
});
// Add a login endpoint
app.post("/v1/login", async (req, res) => {
  try {
    const db = getDb();
    const user = await db
      .collection("users")
      .findOne({ username: req.body.username });
    console.log(user);
    if (user == null) {
      return res.status(400).send("Cannot find user");
    }
    if (await bcrypt.compare(req.body.password, user.password)) {
      // Generate and return a JWT token
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "2h",
      });
      res.json({ token: token, username: user.username, roles: user.roles });
    } else {
      res.status(401).send("Not Allowed");
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send("An error occurred during login");
  }
});

// Middleware for JWT verification (example)
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token)
    return res.status(401).send("Access Denied / Unauthorized request");
  try {
    token = token.split(" ")[1]; // Remove Bearer from string
    if (token === "null" || !token)
      return res.status(401).send("Unauthorized request");
    let verifiedUser = jwt.verify(token, process.env.JWT_SECRET); // verifies secret and checks exp
    req.user = verifiedUser; // user_id can be fetched like this
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(400).send("Invalid Token");
  }
};

// Example of a protected route
app.get("/v1/protected", verifyToken, (req, res) => {
  res.send("This is a protected route");
});

// Don't forget to set your process.env.JWT_SECRET before running the application.
