import express from "express";
import session from "express-session";
import { google } from "googleapis";
import { oauth2Client, uploadFile } from "./utils/googleDrive.js";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

app.use(
  session({
    secret: "random_secret_key",
    resave: false,
    saveUninitialized: true,
  })
);

app.get("/", (req, res) => {
  res.send("Server is running.");
}); 

// ✅ Route to Start Google OAuth
app.get("/auth/google", (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive.file"],
    prompt: "consent",
  });
  res.redirect(authUrl);
});

// ✅ OAuth Callback Route (Save Tokens in Session)
app.get("/auth/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);

    req.session.tokens = tokens;
    oauth2Client.setCredentials(tokens);

    console.log("✅ Access Token:", tokens.access_token);
    console.log("✅ Refresh Token:", tokens.refresh_token || "Not Provided");

    res.redirect("http://localhost:3000"); // Redirect back to frontend
  } catch (error) {
    console.error("OAuth Callback Error:", error);
    res.status(500).send("Authentication failed.");
  }
});

// ✅ Upload a File to Google Drive (Ensure User is Logged In)
app.post("/save", async (req, res) => {
  if (!req.session.tokens) {
    return res.status(401).json({ error: "User is not authenticated." });
  }

  oauth2Client.setCredentials(req.session.tokens);

  try {
    const fileName = `Letter_${Date.now()}.txt`;
    const filePath = path.join("./uploads", fileName);

    if (!fs.existsSync("./uploads")) fs.mkdirSync("./uploads", { recursive: true });

    fs.writeFileSync(filePath, req.body.text);

    const result = await uploadFile(filePath, fileName, "text/plain");

    res.json({ success: true, fileId: result.id });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

// ✅ Server Start
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
