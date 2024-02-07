const express = require("express");
const app = express();

users = [
  {
    username: "user1",
    password: "password1",
  },
  {
    username: "user2",
    password: "password2",
  },
  {
    username: "user3",
    password: "password3",
  },
];
app.get("/users", (req, resp) => {
  resp.json(users);
});
app.listen(3000);
