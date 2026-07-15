import "dotenv/config";
import http from "http";
import { google } from "googleapis";

/**
 * One-time helper to obtain a Google Drive refresh token.
 *
 * 1. Fill in GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI in .env
 * 2. Run:  npm run get-token
 * 3. Open the printed URL, sign in with the Google account whose Drive you want to use,
 *    and grant access.
 * 4. Copy the printed refresh token into GOOGLE_REFRESH_TOKEN in your .env
 */

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  console.error("Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI in .env");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/drive.file"],
});

console.log("\n1) Open this URL in your browser and grant access:\n");
console.log(authUrl + "\n");
console.log("2) After you approve, this script will print your refresh token.\n");

const port = new URL(GOOGLE_REDIRECT_URI).port || 3000;

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith("/oauth2callback")) {
    res.writeHead(404).end();
    return;
  }
  const code = new URL(req.url, GOOGLE_REDIRECT_URI).searchParams.get("code");
  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h2>Success! You can close this tab and return to your terminal.</h2>");
    console.log("\n=== COPY THIS INTO YOUR .env ===\n");
    console.log("GOOGLE_REFRESH_TOKEN=" + tokens.refresh_token + "\n");
    server.close();
    process.exit(0);
  } catch (err) {
    res.writeHead(500).end("Error retrieving token: " + err.message);
    console.error(err);
  }
});

server.listen(port, () => console.log(`Waiting for Google redirect on port ${port}...`));
