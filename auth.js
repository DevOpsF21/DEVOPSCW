require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { verifyToken } = require("./middleware/authMiddleware");
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

// Updated /users POST endpoint to store user in MongoDB
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
    if (user == null) {
      return res.status(400).send("Cannot find user");
    }
    if (await bcrypt.compare(req.body.password, user.password)) {
      // Generate and return a JWT token
      const token = jwt.sign(
        {
          _id: user._id,
          username: user.username,
          roles: user.roles,
        },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );

      if (user.roles[0] === "clerk") {
        let redirectTo_ListOfPatients = "http://localhost:8080/v1/list/";
        let redirectTo_Delete = "http://localhost:8080/v1/10/";
        let redirectTo_Register_Patient = "http://localhost:8080/v1/reg/";
        let redirectTo_Search_Number = "http://localhost:8080/v1/pname/";
        let redirectTo_Search_Name = "http://localhost:8080/v1/pnumber/";
        res.json({
          message:
            "Welcome " + user.username + "!, You are logged in Successfuly ",
          token: token,
          redirectTo_ListOfPatients,
          redirectTo_Delete,
          redirectTo_Register_Patient,
          redirectTo_Search_Number,
          redirectTo_Search_Name,
        });
      } else if (user.roles[0] === "nurse") {
        let redirectTo_list_rooms = "http://localhost:8686/v1/rooms/";
        let redirectTo_medical_equipment =
          "http://localhost:8686/v1/medicalequipment/";
        let redirectTo_ward = "http://localhost:8686/v1/ward/";
        let redirectTo_maintenance = "http://localhost:8686/v1/maintenance/";
        let redirectTo_nurse = "http://localhost:8686/v1/nurse/";
        let redirectTo_addroom = "http://localhost:8686/v1/addroom/";
        let redirectTo_roomsearch = "http://localhost:8686/v1/roomsearch/";
        let redirectTo_admission = "http://localhost:8686/v1/admission/";
        let redirectTo_patientsearch =
          "http://localhost:8686/v1/patientsearch/";
        let redirectTo_discharge = "http://localhost:8686/v1/discharge/";
        res.json({
          message:
            "Welcome " + user.username + "!, You are logged in Successfuly ",
          token: token,
          redirectTo_list_rooms,
          redirectTo_medical_equipment,
          redirectTo_ward,
          redirectTo_maintenance,
          redirectTo_nurse,
          redirectTo_addroom,
          redirectTo_roomsearch,
          redirectTo_admission,
          redirectTo_patientsearch,
          redirectTo_discharge,
        });
      }
    } else {
      res.send("Not Allowed");
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send("An error occurred during login");
  }
});
// Protected route
app.get("/v1/protected", verifyToken, (req, res) => {
  res.send("This is a protected route");
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
