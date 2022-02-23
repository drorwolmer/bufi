import * as fs from "fs";
import { google } from "googleapis";
import express from "express";
import { Request } from "express";
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
app.get("/expenses", async (req: Request<{ since?: string }>, res) => {
  const r = await SHEETS.spreadsheets.values.get({
    spreadsheetId: "1sIcPmC3Thkm_0D7OBGNKEOLVaz7Iloe7Y_Zvkw7_5W4",
    range: "poop!A3:E",
  });

  const since =
    req.query.since !== undefined
      ? moment.utc(req.query.since as string, "DD/MM/YYYY")
      : undefined;

  res.send(
    r.data.values
      .filter((row) => {
        if (since) {
          const d = moment(row[0], "DD/MM/YYYY");
          return d.isSameOrAfter(since);
        }
        return true;
      })
      .map(([date, category, amount, who, what]) => ({
        date,
        amount: parseFloat(amount),
        category,
        who,
        what,
      }))
  );
});

app.get("/budget", async (req, res) => {
  const r = await SHEETS.spreadsheets.values.get({
    spreadsheetId: "1sIcPmC3Thkm_0D7OBGNKEOLVaz7Iloe7Y_Zvkw7_5W4",
    range: "Budget2!A2:B",
  });

  const data: { [category: string]: number } = {};
  for (const row of r.data.values) {
    if (row.length === 1) {
      continue;
    }
    data[row[0]] = parseFloat(row[1].replace(",", ""));
  }
  res.send(data);
});

app.delete("/expense", async (req: Request<{ id: string }>, res) => {
  // https://docs.google.com/spreadsheets/d/1sIcPmC3Thkm_0D7OBGNKEOLVaz7Iloe7Y_Zvkw7_5W4/edit#gid=613526617
  const POOP_SHEET_ID = 613526617;

  if (!req.query.id) {
    return res.status(400).send("Missing id");
  }

  // Get the row index by id
  const r = await SHEETS.spreadsheets.values.get({
    spreadsheetId: "1sIcPmC3Thkm_0D7OBGNKEOLVaz7Iloe7Y_Zvkw7_5W4",
    range: "poop!A:E",
  });

  let rowIndex: number;
  r.data.values.forEach((row, i) => {
    if (row[4] === req.query.id) {
      rowIndex = i;
    }
  });

  if (!rowIndex) {
    return res.status(400).send("Invalid id");
  }

  await SHEETS.spreadsheets.batchUpdate({
    spreadsheetId: "1sIcPmC3Thkm_0D7OBGNKEOLVaz7Iloe7Y_Zvkw7_5W4",
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: POOP_SHEET_ID,
              dimension: "ROWS",
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    },
  });
  res.send({ success: true });
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
    range: "poop!A3:F",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",

    requestBody: {
      range: "poop!A3:F",
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
  // console.error(r);
  res.send(expense);
});

app.listen(port, () => {
  return console.log(`server is listening on ${port}`);
});
