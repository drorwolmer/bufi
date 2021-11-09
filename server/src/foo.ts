import * as fs from "fs";
import { google } from "googleapis";
import express from "express";
import cors from "cors";
import moment from "moment";

process.on("SIGINT", function () {
  process.exit();
});

const CREDENTIALS = JSON.parse(fs.readFileSync("./creds.json", "utf8"));

const AUTH = new google.auth.JWT({
  key: CREDENTIALS.private_key,
  email: CREDENTIALS.client_email,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SHEETS = google.sheets({ version: "v4", auth: AUTH });

const app = express();
app.use(cors());
app.use(express.json());
const port = 3001;
app.get("/expenses", async (req, res) => {
  const r = await SHEETS.spreadsheets.values.get({
    spreadsheetId: "1sIcPmC3Thkm_0D7OBGNKEOLVaz7Iloe7Y_Zvkw7_5W4",
    range: "poop!A3:E",
  });
  res.send(r.data.values);
});

app.get("/budget", async (req, res) => {
  const r = await SHEETS.spreadsheets.values.get({
    spreadsheetId: "1sIcPmC3Thkm_0D7OBGNKEOLVaz7Iloe7Y_Zvkw7_5W4",
    range: "Budget!A3:C",
  });
  res.send(r.data.values);
});

app.post("/expense", async (req, res) => {
  const expense = req.body as {
    date: string;
    who: string;
    category: string;
    amount: number;
    what: string;
  };

  const r = await SHEETS.spreadsheets.values.append({
    spreadsheetId: "1sIcPmC3Thkm_0D7OBGNKEOLVaz7Iloe7Y_Zvkw7_5W4",
    range: "poop!A3:E",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",

    requestBody: {
      range: "poop!A3:E",
      majorDimension: "ROWS",
      values: [
        [
          moment(expense.date, "YYYY-MM-DD").format("DD/MM/YYYY"),
          expense.category,
          expense.amount,
          expense.who,
          expense.what,
        ],
      ],
    },
  });
  console.error(r);
  res.send("OK");
});

app.listen(port, () => {
  return console.log(`server is listening on ${port}`);
});
