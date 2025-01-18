const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    console.log("dash");
    if (req.oidc.isAuthenticated()) {
        res.sendFile(path.join(__dirname, "../public/dashboard.html"));
    } else {
        res.sendFile(path.join(__dirname, "../public/login.html"));
    }
});

module.exports = router;
