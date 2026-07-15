import "dotenv/config";
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { Readable } from "stream";
import { google } from "googleapis";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  GOOGLE_REFRESH_TOKEN,
  DRIVE_FOLDER_ID,
  PORT = 3000,
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN || !DRIVE_FOLDER_ID) {
  console.error(
    "\nMissing config. Make sure .env has GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, " +
      "GOOGLE_REFRESH_TOKEN and DRIVE_FOLDER_ID.\nRun `npm run get-token` first if you need a refresh token.\n"
  );
  process.exit(1);
}

// --- Google Drive client (authenticated as the account that owns the Drive) ---
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);
oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
const drive = google.drive({ version: "v3", auth: oauth2Client });

const app = express();
app.use(express.static(path.join(__dirname, "public")));

// Accept up to 25MB images in memory (phone photos)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// --- Upload one or more photos to the shared Drive folder ---
app.post("/api/upload", upload.array("photos", 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files received." });
    }
    const uploaded = [];
    for (const file of req.files) {
      const result = await drive.files.create({
        requestBody: {
          name: `${Date.now()}-${file.originalname}`,
          parents: [DRIVE_FOLDER_ID],
        },
        media: {
          mimeType: file.mimetype,
          body: Readable.from(file.buffer),
        },
        fields: "id, name",
      });
      uploaded.push(result.data);
    }
    res.json({ success: true, count: uploaded.length, files: uploaded });
  } catch (err) {
    console.error("Upload error:", err.message);
    res.status(500).json({ error: "Upload failed. Please try again." });
  }
});

// --- List photos in the shared folder ---
app.get("/api/photos", async (req, res) => {
  try {
    const result = await drive.files.list({
      q: `'${DRIVE_FOLDER_ID}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: "files(id, name, thumbnailLink, webViewLink, createdTime)",
      orderBy: "createdTime desc",
      pageSize: 200,
    });
    res.json({ photos: result.data.files || [] });
  } catch (err) {
    console.error("List error:", err.message);
    res.status(500).json({ error: "Could not load photos." });
  }
});

// --- Stream a single photo (so images work even for private folders) ---
app.get("/api/photo/:id", async (req, res) => {
  try {
    const meta = await drive.files.get({
      fileId: req.params.id,
      fields: "mimeType",
    });
    res.setHeader("Content-Type", meta.data.mimeType || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    const stream = await drive.files.get(
      { fileId: req.params.id, alt: "media" },
      { responseType: "stream" }
    );
    stream.data.on("error", () => res.status(500).end()).pipe(res);
  } catch (err) {
    console.error("Photo error:", err.message);
    res.status(404).end();
  }
});

app.listen(PORT, () => {
  console.log(`\n💍 Wedding Photo Uploader running at http://localhost:${PORT}\n`);
});
