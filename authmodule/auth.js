require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { verifyToken, verifyRoles } = require("./authMiddleware");
const { ObjectId } = require("mongodb");

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
// Function to validate required fields
function validateUserInput({ username, email, password, roles }) {
  // Check if any of the required fields is missing or empty
  if (!username || !email || !password || !roles) {
    return false;
  }

  return true;
}
// Updated /users POST endpoint to store user in MongoDB
// Create a new user
app.post("/v1/user", async (req, res) => {
  const { username, email, password, roles } = req.body;
  try {
    const db = getDb();

    // Check for existing user with the same username or email
    const existingUser = await db.collection("auth").findOne({
      $or: [{ username: username }, { email: email }],
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

    // Validate user input before inserting into the database
    if (!validateUserInput(newUser)) {
      res.status(400).send("All fields are required, except 'created_at'.");
    } else {
      await db.collection("auth").insertOne(newUser);
      res.status(201).send("User created");
    }
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).send("Error creating user");
  }
});


// Endpoint to log in
app.post("/v1/login", async (req, res) => {
  try {
    const db = getDb();
    const user = await db.collection("auth").findOne({ username: req.body.username });
    if (user == null) {
      return res.status(400).send("Cannot find user");
    }
    if (await bcrypt.compare(req.body.password, user.password)) {
      // Generate and return a JWT token
      const token = jwt.sign(
        { _id: user._id, username: user.username, roles: user.roles },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );
      res.json({
        message: "Login successful",
        token: token,
      });
    } else {
      res.status(401).send("Login not allowed");
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send("An error occurred during login");
  }
});



// Endpoint to change user password
app.post("/v1/authChange", verifyToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user._id;
  try {
    const db = getDb();
    const user = await db
      .collection("auth")
      .findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.send("User not found.");
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).send("Old password is incorrect.");
    }

    // Hash new password
    const salt = await bcrypt.genSalt();
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update password in the database
    await db
      .collection("auth")
      .updateOne(
        { _id: new ObjectId(userId) },
        { $set: { password: hashedNewPassword } }
      );

    res.send("Password changed successfully.");
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).send("An error occurred while changing the password.");
  }
});

// Endpoint to delete a user by username
app.delete("/v1/user", verifyToken, verifyRoles(["admin"]), async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).send("Username is required");
  }

  try {
    const db = getDb();
    const result = await db.collection("auth").deleteOne({ username });

    if (result.deletedCount === 0) {
      return res.status(404).send("User not found");
    }

    res.status(200).send("User deleted successfully");
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).send("An error occurred while deleting the user");
  }
});
// Endpoint to log out
app.post("/v1/logout", async (req, res) => {
  try {
    res
      .status(200)
      .send(
        "We have been logged out Successfuly! to login - " +
          "http://localhost:3000/v1/login"
      );
  } catch (error) {
    console.log(error);
  }
});

