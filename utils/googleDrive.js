import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

export const getAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
};

// ✅ Function to Upload a File to Google Drive
export const uploadFile = async (filePath, fileName, mimeType) => {
  try {
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const response = await drive.files.create({
      requestBody: { name: fileName, mimeType },
      media: { mimeType, body: fs.createReadStream(filePath) },
    });

    return response.data;
  } catch (error) {
    console.error("Google Drive Upload Error:", error);
    throw error;
  }
};
