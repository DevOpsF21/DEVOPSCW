// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  let token = req.headers["authorization"];
  if (!token)
    return res.status(401).send("Access Denied / Unauthorized request");
  try {
    if (token === "null" || !token)
      return res.status(401).send("Unauthorized request");

    const verifiedUser = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verifiedUser; // Now req.user contains the decoded JWT
    next();
  } catch (error) {
    res.status(400).send("Invalid Token");
  }
};

const verifyRoles = (allowedRoles) => {
  return (req, res, next) => {
    const userRoles = req.user.roles;
    const isAuthorized = userRoles.some(role => allowedRoles.includes(role));
    if (!isAuthorized) {
      return res.status(403).send("Access denied. Insufficient permissions.");
    }
    next();
  };
};



module.exports = { verifyToken, verifyRoles };
