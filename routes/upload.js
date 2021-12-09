const express = require("express");
const router = express.Router();
const fs = require("fs");
const csv = require("csv-parser");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const Data = require("../models/data");
const { XMLParser } = require("fast-xml-parser");

router.post("/csv", upload.single("file"), function (req, res) {
  if (!req.file) {
    res.send("No file uploaded");
    return;
  }
  const results = [];
  const temp = [];

  fs.createReadStream(req.file.path)
    .pipe(
      csv([
        "Transaction_Identificator",
        "Amount",
        "Currency_Code",
        "Transaction_Date",
        "Status",
      ])
    )
    .on("data", (row) => {
      if (
        !row.Transaction_Identificator ||
        !row.Amount ||
        !row.Currency_Code ||
        !row.Transaction_Date ||
        !row.Status
      ) {
        temp.push(row);
      } else {
        results.push(row);
      }
    })
    .on("error", (err) => {
      res.status(500).json({
        error: err,
      });
    })
    .on("end", async () => {
      if (temp.length > 0) {
        res.status(400).json({
          message: "Unknown format --- Please input CSV file",
        });
      } else {
        const arr = results.map((item) => {
          if (item.Status === "Approved") {
            item.Status = "A";
          } else if (item.Status === "Failed") {
            item.Status = "R";
          } else {
            item.Status = "D";
          }
          const dt = {
            id: item.Transaction_Identificator,
            payment: item.Amount + " " + item.Currency_Code,
            status: item.Status,
          };
          return {
            ...dt,
          };
        });
        try {
          Data.insertMany(arr);
          res.status(200).json({
            message: "Upload successfully",
            results: arr,
          });
        } catch (err) {
          res.status(500).json({
            error: err,
          });
        }
      }
    });
});

router.post("/xml", upload.single("file"), async function (req, res) {
  if (!req.file) {
    res.send("No file uploaded");
    return;
  }
  const file = fs.readFileSync(req.file.path);
  const parser = new XMLParser({ ignoreAttributes: false });
  const results = parser.parse(file);
  const temp = [];
  const datas = [];
  results.Transactions.Transaction.map((item) => {
    const tempObj = {
      Transaction_Identificator: item["@_id"],
      Amount: item.PaymentDetails.Amount,
      Currency_Code: item.PaymentDetails.CurrencyCode,
      Transaction_Date: new Date(item.TransactionDate),
      Status: item.Status,
    };
    if (
      !tempObj.Transaction_Identificator ||
      !tempObj.Amount ||
      !tempObj.Currency_Code ||
      !tempObj.Transaction_Date ||
      !tempObj.Status
    ) {
      temp.push(tempObj);
    } else {
      datas.push(tempObj);
    }
  });
  if (temp.length > 0) {
    res.status(400).json({
      message: "Unknown format --- Please input XML file",
    });
  } else {
    const arr = datas.map((item) => {
      if (item.Status === "Approved") {
        item.Status = "A";
      } else if (item.Status === "Rejected") {
        item.Status = "R";
      } else {
        item.Status = "D";
      }
      const dt = {
        id: item.Transaction_Identificator,
        payment: item.Amount + " " + item.Currency_Code,
        status: item.Status,
      };
      return {
        ...dt,
      };
    });
    try {
      Data.insertMany(arr);
      res.status(200).json({
        message: "Upload successfully",
        results: arr,
      });
    } catch (err) {
      res.status(500).json({
        error: err,
      });
    }
  }
});

module.exports = router;
