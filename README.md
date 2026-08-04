# QR For vCard — Self-Hosted Dynamic QR Code System

A **100% free, self-hosted** dynamic QR code generator focused on vCard/digital business card profiles.

## ✨ Features

- **Dynamic QR Codes** — QR code image never changes; only the profile data behind it updates
- **vCard Mobile Profile Page** — Beautiful mobile-optimized contact card shown on scan (name, title, company, phone, email + Add Contact button)
- **Permanent Short URLs** — `/q/SHORTCODE` never changes, print once and edit forever
- **Edit Profile Anytime** — Update all vCard fields from the Dashboard → the printed QR still works perfectly
- **Scan Analytics** — Tracks every scan with device type, browser, IP
- **Custom QR Design** — Choose colors, dot shapes, eye styles, logo overlays, frame templates
- **Export PNG / SVG Vector**
- **No subscription, no cloud, 100% your data**

## 🚀 Quick Start (Local)

```bash
# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn server:app --host 0.0.0.0 --port 8000
```

Open **http://localhost:8000** in your browser.

> **Mobile testing on same Wi-Fi:** Use your local IP (e.g., `http://192.168.1.16:8000`) instead of `localhost`.

## 📱 How It Works

1. Open Generator → Select **vCard Contact**
2. Fill in: Full Name, Job Title, Company, Phone, Email
3. Enable **⚡ Dynamic QR** toggle
4. Click **Save & Store QR Code** (once — never click again for same person)
5. Download the PNG → Print it on a business card / visiting card
6. **When someone scans** → They see a beautiful mobile profile page with an "Add Contact" button

### Edit Profile Later (without reprinting)
- Go to **Dashboard**
- Find the QR card → Click **✏️ Edit Destination**
- Update any field (name, phone, email etc.)
- Click **Save Changes** — **the printed QR still works!**

## 🌐 Deploy to Railway (Free)

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select this repo
4. Railway auto-detects Python and uses the `Procfile`
5. Add a persistent volume mounted at `/app` for `db.json`

## 📁 Project Structure

```
├── server.py       # FastAPI backend — short URL router, vCard profile renderer
├── index.html      # Main SPA frontend
├── app.js          # UI controller, QR generation logic, save/edit handlers
├── qrEngine.js     # QR canvas renderer (uses qrcode-generator library)
├── storage.js      # Local DB adapter (localStorage + server sync)
├── style.css       # Dark theme design system
├── db.json         # Server-side QR database (all codes + scan logs)
├── requirements.txt
└── Procfile
```

## 🔐 Data Ownership

All QR codes, scan analytics, and profile data are stored in `db.json` on your own server.
Export anytime via **Data & Backup** tab.

## 📄 License

MIT License
