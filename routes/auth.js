const express = require("express");
const { auth } = require("express-openid-connect");

const router = express.Router();

router.get('/auth/login', (req, res) => {
    console.log("HELP");
    res.oidc.login();
});

router.get("/profile", (req, res) => {
  if (req.oidc.isAuthenticated()) {
    res.json(req.oidc.user);
  } else {
    res.status(401).send("Not authenticated");
  }
});

module.exports = router;
