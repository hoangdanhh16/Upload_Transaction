const express = require("express");
const router = express.Router();

const Data = require("../models/data");



/* GET home page. */
router.get("/", async (req, res) => {
    try {
        const data = await Data.find();
        res.json(data);
      } catch (err) {
        res.json({ message: err });
      }
});


module.exports = router;
