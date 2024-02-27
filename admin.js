require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { verifyToken } = require("./middleware/authMiddleware");
const { ObjectId } = require("mongodb");

const { connectToDb, getDb } = require("./db");

const app = express();
app.use(express.json());
