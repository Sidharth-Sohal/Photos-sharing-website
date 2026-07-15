# 💍 Wedding Photo Uploader

A clean, wedding-themed web app that lets your party guests upload photos from
their phones straight into **your Google Drive**, and view the shared album —
all from one simple page with two buttons: **Upload Photos** and **View Photos**.

Photos are stored in a Google Drive folder you own. Guests never need a Google
account or a login — they just open the link and tap.

---

## How it works

- Guests open the web app on their phones.
- **Upload Photos** → their pictures are sent to a Drive folder in *your* account.
- **View Photos** → everyone sees the shared gallery, pulled live from that folder.

Under the hood the app authenticates **once** as you (the Drive owner) using a
Google refresh token, so guests don't have to sign in.

---

## Setup (about 10 minutes, one time)

### 1. Install
```bash
npm install
```

### 2. Create Google OAuth credentials
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project (or use an existing one).
3. Enable the **Google Drive API** (APIs & Services → Library → search "Drive").
4. Go to **APIs & Services → OAuth consent screen**, choose **External**, fill in
   the basics, and add your Google account as a **Test user**.
5. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Application type: **Web application**
   - Authorized redirect URI: `http://localhost:3000/oauth2callback`
6. Copy the **Client ID** and **Client secret**.

### 3. Create the Drive folder
Create a folder in Google Drive for the wedding photos. Open it and copy the ID
from the URL:
```
https://drive.google.com/drive/folders/THIS_IS_THE_FOLDER_ID
```

### 4. Configure `.env`
```bash
cp .env.example .env
```
Fill in `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `DRIVE_FOLDER_ID`.

### 5. Get your refresh token
```bash
npm run get-token
```
Open the printed URL, sign in with the Google account that owns the Drive folder,
approve access, then copy the printed `GOOGLE_REFRESH_TOKEN` into your `.env`.

### 6. Run it
```bash
npm start
```
Open **http://localhost:3000** 🎉

---

## Sharing with guests

To let guests reach it from their own phones, host the app somewhere public
(e.g. [Render](https://render.com), [Railway](https://railway.app), a VPS, or
any Node host). When you do:

- Add your production redirect URI (e.g. `https://yourapp.com/oauth2callback`)
  in the Google Cloud Console credentials.
- Update `GOOGLE_REDIRECT_URI` in your `.env` accordingly.
- Set all the `.env` values as environment variables on your host.

Then share the app's URL (a QR code on the tables works great!).

---

## Notes

- Uses the `drive.file` scope — the app can only see and manage files it creates
  in the folder, nothing else in your Drive. Safe and minimal.
- Max upload size is 25 MB per photo (adjustable in `server.js`).
- Photos are streamed through the app, so the folder can stay private.

## Tech
Node.js · Express · Google Drive API · vanilla HTML/CSS/JS — no build step.
