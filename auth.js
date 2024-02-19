require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { verifyToken, verifyClerkRole } = require('./middleware/authMiddleware');

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
  const { username, email, password, roles } = req.body;
  try {
    const db = getDb();

    // Check for existing user with the same username or email
    const existingUser = await db.collection("auth").findOne({
      $or: [{ username: username }, { email: email }]
    });

    if (existingUser) {
      return res.status(409).send("Username or email already exists.");
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      username,
      email,
      password: hashedPassword,
      roles,
      created_at: new Date(),
    };

    await db.collection("auth").insertOne(newUser);
    res.status(201).send("User created");
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).send("Error creating user");
  }
});

// Add a login endpoint
app.post("/v1/login", async (req, res) => {
  try {
    const db = getDb();
    const user = await db
      .collection("auth")
      .findOne({ username: req.body.username });
    console.log(user);
    if (user == null) {
      return res.status(400).send("Cannot find user");
    }
    if (await bcrypt.compare(req.body.password, user.password)) {
      // Generate and return a JWT token
      const token = jwt.sign({
        _id: user._id,
        username: user.username, // Include username here
        roles: user.roles
      }, process.env.JWT_SECRET, { expiresIn: "2h" });
      res.json({ token: token, username: user.username, roles: user.roles });
    } else {
      res.status(401).send("Not Allowed");
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send("An error occurred during login");
  }
});

// Example of a protected route
app.get("/v1/protected", verifyToken, (req, res) => {
  res.send("This is a protected route");
});

// Don't forget to set your process.env.JWT_SECRET before running the application.
