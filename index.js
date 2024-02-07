const express = require("express");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
users = [];
app.post("/users", async (req, resp) => {
  try {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    console.log(salt);
    console.log(hashedPassword);
    const user = { name: req.body.name, password: hashedPassword };
    resp.status(201).send();
  } catch {
    resp.status(400).send();
  }

});
app.listen(3000);
