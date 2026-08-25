"""
Self-Hosted Dynamic QR Code Backend & Redirect Engine
Handles real-time HTTP 307 redirects for URLs, and renders Mobile Digital Business Card Profile Pages for vCard QRs!
"""

import json
import os
import re
import time
import urllib.parse
import secrets
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import RedirectResponse, HTMLResponse, FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(title="QR Track - Dynamic Redirect & Profile Engine", version="1.0.0")

ACTIVE_SESSION = {
    "token": None,
    "last_active": 0
}
SESSION_TIMEOUT = 300  # 5 minutes session timeout

DB_FILE = os.path.join(os.path.dirname(__file__), "db.json")

DEFAULT_DB = {
    "qrcodes": [
        {
            "id": "qr-seed-1",
            "title": "GHANSHYAM DOBARIYA - Digital Business Card",
            "type": "vcard",
            "isDynamic": True,
            "shortCode": "ghanshyam",
            "destinationUrl": "BEGIN:VCARD\r\nVERSION:3.0\r\nN:;GHANSHYAM DOBARIYA;;;\r\nFN:GHANSHYAM DOBARIYA\r\nORG:Sahjanand Polyweaves Pvt. Ltd.\r\nTITLE:MANAGING DIRECTOR\r\nTEL;TYPE=CELL:+919909143742\r\nEMAIL:\r\nADR;TYPE=WORK:;;4308/8, ROAD NO. 43-B, SACHIN GIDC,SURAT,GUJARAT-394230,INDIA;;;;\r\nURL;TYPE=WhatsApp:https://wa.me/919909143742\r\nEND:VCARD",
            "active": True,
            "createdAt": "2026-08-05T12:45:50.000791",
            "updatedAt": "2026-08-05T12:46:46.409094",
            "options": {
                "colorDark": "#000000",
                "colorLight": "#ffffff",
                "gradient": True,
                "gradientColor": "#f97316",
                "bodyStyle": "square",
                "eyeStyle": "square",
                "eyeBallStyle": "square",
                "logoIcon": "none",
                "frameStyle": "none",
                "frameText": "",
                "frameColor": "#000000"
            }
        },
        {
            "id": "qr-seed-2",
            "title": "SHAILESH DHOLARIYA - Digital Business Card",
            "type": "vcard",
            "isDynamic": True,
            "shortCode": "shailesh",
            "destinationUrl": "BEGIN:VCARD\r\nVERSION:3.0\r\nN:;SHAILESH DHOLARIYA;;;\r\nFN:SHAILESH DHOLARIYA\r\nORG:Sahjanand Polyweaves Pvt. Ltd.\r\nTITLE:SALES HEAD\r\nTEL;TYPE=CELL:9925933568\r\nEMAIL:\r\nADR;TYPE=WORK:;;PLOT NO. C1B-4308/8, ROAD NO. 43-B, SACHIN GIDC,SURAT,GUJARAT-394230;;;;\r\nURL;TYPE=WhatsApp:https://wa.me/9925933568\r\nEND:VCARD",
            "active": True,
            "createdAt": "2026-08-05T12:45:50.000806",
            "updatedAt": "2026-08-05T12:47:36.241835",
            "options": {
                "colorDark": "#000000",
                "colorLight": "#ffffff",
                "gradient": True,
                "gradientColor": "#f97316",
                "bodyStyle": "square",
                "eyeStyle": "square",
                "eyeBallStyle": "square",
                "logoIcon": "none",
                "frameStyle": "none",
                "frameText": "",
                "frameColor": "#000000"
            }
        },
        {
            "id": "qr-seed-3",
            "title": "MILAN HIDAD - Digital Business Card",
            "type": "vcard",
            "isDynamic": True,
            "shortCode": "milan",
            "destinationUrl": "BEGIN:VCARD\r\nVERSION:3.0\r\nN:;MILAN HIDAD;;;\r\nFN:MILAN HIDAD\r\nORG:Sahjanand Polyweaves Pvt. Ltd.\r\nTITLE:MANAGER\r\nTEL;TYPE=CELL:6355979500\r\nEMAIL:\r\nADR;TYPE=WORK:;;PLOT NO. C1B-4308/8, ROAD NO. 43-B, SACHIN GIDC,SURAT,GUJARAT-394230;;;;\r\nURL;TYPE=WhatsApp:https://wa.me/6355979500\r\nEND:VCARD",
            "active": True,
            "createdAt": "2026-08-05T12:45:50.000811",
            "updatedAt": "2026-08-05T12:48:08.400060",
            "options": {
                "colorDark": "#000000",
                "colorLight": "#ffffff",
                "gradient": True,
                "gradientColor": "#f97316",
                "bodyStyle": "square",
                "eyeStyle": "square",
                "eyeBallStyle": "square",
                "logoIcon": "none",
                "frameStyle": "none",
                "frameText": "",
                "frameColor": "#000000"
            }
        },
        {
            "id": "qr-seed-4",
            "title": "DINESH BHUVA - Digital Business Card",
            "type": "vcard",
            "isDynamic": True,
            "shortCode": "dinesh",
            "destinationUrl": "BEGIN:VCARD\r\nVERSION:3.0\r\nN:;DINESH BHUVA;;;\r\nFN:DINESH BHUVA\r\nORG:Sahjanand Polyweaves Pvt. Ltd.\r\nTITLE:MANAGER\r\nTEL;TYPE=CELL:9299999995\r\nEMAIL:\r\nADR;TYPE=WORK:;;PLOT NO. C-127, ROAD NO. 20, NEAR M R CIRCLE ,SAYKHA GIDC,VAGRA,BHARUCH, GUJARAT-392140;;;;\r\nURL;TYPE=WhatsApp:https://wa.me/9299999995\r\nEND:VCARD",
            "active": True,
            "createdAt": "2026-08-05T12:45:50.000816",
            "updatedAt": "2026-08-05T12:48:45.134445",
            "options": {
                "colorDark": "#000000",
                "colorLight": "#ffffff",
                "gradient": True,
                "gradientColor": "#f97316",
                "bodyStyle": "square",
                "eyeStyle": "square",
                "eyeBallStyle": "square",
                "logoIcon": "none",
                "frameStyle": "none",
                "frameText": "",
                "frameColor": "#000000"
            }
        },
        {
            "id": "qr-seed-5",
            "title": "M S YADAV - Digital Business Card",
            "type": "vcard",
            "isDynamic": True,
            "shortCode": "myadav",
            "destinationUrl": "BEGIN:VCARD\r\nVERSION:3.0\r\nN:;M .S. YADAV;;;\r\nFN:M .S. YADAV\r\nORG:Sahjanand Polyweaves Pvt. Ltd.\r\nTITLE:C.E.O.\r\nTEL;TYPE=CELL:9313509726\r\nEMAIL:\r\nADR;TYPE=WORK:;;PLOT NO. A1/8, ROAD NO. 9, HOJIWALA IND. ESTATE,SACHIN,SURAT, GUJARAT-394230;;;;\r\nURL;TYPE=WhatsApp:https://wa.me/9313509726\r\nEND:VCARD",
            "active": True,
            "createdAt": "2026-08-05T12:45:50.000821",
            "updatedAt": "2026-08-05T12:49:29.046378",
            "options": {
                "colorDark": "#000000",
                "colorLight": "#ffffff",
                "gradient": True,
                "gradientColor": "#f97316",
                "bodyStyle": "square",
                "eyeStyle": "square",
                "eyeBallStyle": "square",
                "logoIcon": "none",
                "frameStyle": "none",
                "frameText": "",
                "frameColor": "#000000"
            }
        },
        {
            "id": "qr-seed-6",
            "title": "B S CHOUHAN - Digital Business Card",
            "type": "vcard",
            "isDynamic": True,
            "shortCode": "bchouhan",
            "destinationUrl": "BEGIN:VCARD\r\nVERSION:3.0\r\nN:;B.S. CHOUHAN;;;\r\nFN:B.S. CHOUHAN\r\nORG:Sahjanand Polyweaves Pvt. Ltd.\r\nTITLE:SR. SALES MANAGER\r\nTEL;TYPE=CELL:9727564411\r\nEMAIL:\r\nADR;TYPE=WORK:;;PLOT NO. C1B-4308/8, ROAD NO. 43-B, SACHIN GIDC,SURAT,GUJARAT-394230;;;;\r\nADR;TYPE=HOME:;;PLOT NO. A1/8, ROAD NO. 9, HOJIWALA IND. ESTATE,SACHIN,SURAT, GUJARAT-394230;;;;\r\nURL;TYPE=WhatsApp:https://wa.me/9727564411\r\nEND:VCARD",
            "active": True,
            "createdAt": "2026-08-05T12:45:50.000826",
            "updatedAt": "2026-08-05T12:45:56.204808",
            "options": {
                "colorDark": "#000000",
                "colorLight": "#ffffff",
                "gradient": True,
                "gradientColor": "#f97316",
                "bodyStyle": "square",
                "eyeStyle": "square",
                "eyeBallStyle": "square",
                "logoIcon": "none",
                "frameStyle": "none",
                "frameText": "",
                "frameColor": "#000000"
            }
        },
        {
            "id": "qr-ghanshyam-card",
            "title": "GHANSHYAM DOBARIYA - Sahjanand Gold Card",
            "type": "vcard",
            "isDynamic": True,
            "shortCode": "ghanshyam-card",
            "destinationUrl": "https://bhavarth007.github.io/qrforvcard/ghanshyam/",
            "active": True,
            "createdAt": "2026-08-23T16:05:00.000000",
            "updatedAt": "2026-08-23T16:05:00.000000",
            "options": {
                "colorDark": "#000000",
                "colorLight": "#ffffff",
                "gradient": False,
                "gradientColor": "#000000",
                "bodyStyle": "square",
                "eyeStyle": "square",
                "eyeBallStyle": "square",
                "logoIcon": "none",
                "logoText": "Sahjanand Polyweaves Pvt. Ltd.",
                "frameStyle": "gold_card",
                "frameText": "GHANSHYAM DOBARIYA",
                "frameColor": "#d4af37"
            }
        }
    ]
}

def load_db() -> Dict[str, Any]:
    if not os.path.exists(DB_FILE):
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(DEFAULT_DB, f, indent=2)
        return DEFAULT_DB
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            updated = False
            for seed in DEFAULT_DB["qrcodes"]:
                idx = next((i for i, q in enumerate(data.get("qrcodes", [])) if q["id"] == seed["id"]), None)
                if idx is None:
                    data.setdefault("qrcodes", []).append(seed)
                    updated = True
                else:
                    curr = data["qrcodes"][idx]
                    curr_url = curr.get("destinationUrl", "")
                    if seed["id"] == "qr-ghanshyam-card":
                        data["qrcodes"][idx]["destinationUrl"] = seed["destinationUrl"]
                        data["qrcodes"][idx]["title"] = seed["title"]
                        data["qrcodes"][idx]["options"] = seed["options"]
                        updated = True
                    elif "Sahjanand Pvt. Ltd." in curr_url or "Ghanshayam Synthetic" in curr_url:
                        data["qrcodes"][idx]["destinationUrl"] = seed["destinationUrl"]
                        data["qrcodes"][idx]["title"] = seed["title"]
                        updated = True
            if updated:
                save_db(data)
            return data
    except Exception:
        return DEFAULT_DB

def save_db(db_data: Dict[str, Any]):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(db_data, f, indent=2)

def parse_user_agent(ua_str: str) -> tuple[str, str]:
    device = "Desktop"
    if "Android" in ua_str:
        device = "Mobile (Android)"
    elif "iPhone" in ua_str or "iPad" in ua_str:
        device = "Mobile (iOS)"
    elif "Macintosh" in ua_str:
        device = "Desktop (macOS)"
    elif "Windows" in ua_str:
        device = "Desktop (Windows)"

    browser = "Chrome"
    if "Edg" in ua_str:
        browser = "Edge"
    elif "Firefox" in ua_str:
        browser = "Firefox"
    elif "Safari" in ua_str and "Chrome" not in ua_str:
        browser = "Safari"

    return device, browser

# Helper to parse raw vCard payload into key-values
def parse_vcard_data(raw_vcard: str) -> Dict[str, str]:
    info = {"fn": "User Profile", "org": "", "title": "Digital Business Card", "phone": "", "email": "", "addr1": "", "addr2": "", "wa": "", "fb": "", "cat": "", "photo": ""}
    
    fn_match = re.search(r'FN:(.*)', raw_vcard, re.IGNORECASE)
    if fn_match:
        info["fn"] = fn_match.group(1).strip()
    else:
        n_match = re.search(r'N:;?([^;\r\n]+)', raw_vcard, re.IGNORECASE)
        if n_match:
            info["fn"] = n_match.group(1).replace(';', ' ').strip()

    org_match = re.search(r'ORG:(.*)', raw_vcard, re.IGNORECASE)
    if org_match:
        info["org"] = org_match.group(1).strip()

    title_match = re.search(r'TITLE:(.*)', raw_vcard, re.IGNORECASE)
    if title_match:
        info["title"] = title_match.group(1).strip()

    phone_match = re.search(r'TEL[^:]*:(.*)', raw_vcard, re.IGNORECASE)
    if phone_match:
        info["phone"] = phone_match.group(1).strip()

    email_match = re.search(r'EMAIL[^:]*:(.*)', raw_vcard, re.IGNORECASE)
    if email_match:
        info["email"] = email_match.group(1).strip()
        
    addr_work = re.search(r'ADR;TYPE=WORK:;;?([^;\r\n]+)', raw_vcard, re.IGNORECASE)
    if not addr_work:
        addr_work = re.search(r'ADR;TYPE=WORK:(.*)', raw_vcard, re.IGNORECASE)
    if addr_work:
        info["addr1"] = addr_work.group(1).replace(';', ' ').strip()

    addr_home = re.search(r'ADR;TYPE=HOME:;;?([^;\r\n]+)', raw_vcard, re.IGNORECASE)
    if not addr_home:
        addr_home = re.search(r'ADR;TYPE=HOME:(.*)', raw_vcard, re.IGNORECASE)
    if addr_home:
        info["addr2"] = addr_home.group(1).replace(';', ' ').strip()
        
    wa = re.search(r'URL;TYPE=WhatsApp:(.*)', raw_vcard, re.IGNORECASE)
    if wa:
        wa_val = wa.group(1).strip()
        digits = re.sub(r'\D', '', wa_val)
        if len(digits) == 10:
            digits = '91' + digits
        info["wa"] = f"https://wa.me/{digits}" if digits else wa_val
        
    fb = re.search(r'URL;TYPE=Facebook:(.*)', raw_vcard, re.IGNORECASE)
    if fb:
        info["fb"] = fb.group(1).strip()
        
    cat = re.search(r'URL;TYPE=Catalog:(.*)', raw_vcard, re.IGNORECASE)
    if cat:
        info["cat"] = cat.group(1).strip()
        
    photo = re.search(r'URL;TYPE=Photo:(.*)', raw_vcard, re.IGNORECASE)
    if not photo:
        photo = re.search(r'PHOTO;VALUE=URI:(.*)', raw_vcard, re.IGNORECASE)
    if photo:
        info["photo"] = photo.group(1).strip()

    return info


# --- DYNAMIC SHORT-CODE ROUTER ---
@app.get("/q/{short_code}")
async def dynamic_redirect(short_code: str, request: Request):

    # Special case: "preview" is the placeholder used in the live QR preview
    # before the user clicks Save. Show a friendly instructional page.
    if short_code == "preview":
        return HTMLResponse(status_code=200, content="""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>QR Preview - Not Saved Yet</title>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
            <style>
                * { margin:0; padding:0; box-sizing:border-box; font-family:'Plus Jakarta Sans',sans-serif; }
                body { background:#090d16; color:#f8fafc; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:2rem; }
                .card { background:rgba(18,24,39,.9); border:1px solid rgba(255,255,255,.1); border-radius:24px; padding:2.5rem 2rem; max-width:380px; text-align:center; }
                .icon { font-size:3.5rem; margin-bottom:1rem; }
                h1 { font-size:1.4rem; font-weight:800; margin-bottom:.75rem; color:#f59e0b; }
                p { color:#94a3b8; font-size:.9rem; line-height:1.6; margin-bottom:1.5rem; }
                .badge { background:rgba(99,102,241,.15); color:#818cf8; border:1px solid rgba(99,102,241,.3); border-radius:999px; padding:.4rem 1rem; font-size:.82rem; font-weight:600; display:inline-block; }
                a { color:#6366f1; text-decoration:none; font-weight:600; }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="icon">⚠️</div>
                <h1>QR Not Saved Yet</h1>
                <p>This is a <strong>live preview</strong> QR code — it hasn't been saved to the database yet.</p>
                <p>Go back to the generator, fill in your details, then click <strong>"💾 Save &amp; Store QR Code"</strong> to make this QR permanent and scannable.</p>
                <span class="badge">Preview Mode — Data Not Stored</span>
            </div>
        </body>
        </html>
        """)

    db = load_db()
    qr = next((q for q in db.get("qrcodes", []) if q.get("shortCode") == short_code), None)

    if not qr:
        return HTMLResponse(
            status_code=404,
            content=f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>404 - QR Not Found</title>
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700&display=swap" rel="stylesheet">
                <style>
                    * {{ margin:0; padding:0; box-sizing:border-box; font-family:'Plus Jakarta Sans',sans-serif; }}
                    body {{ background:#090d16; color:#f8fafc; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:2rem; text-align:center; }}
                    .card {{ background:rgba(18,24,39,.9); border:1px solid rgba(244,63,94,.2); border-radius:24px; padding:2.5rem 2rem; max-width:380px; }}
                    .icon {{ font-size:3.5rem; margin-bottom:1rem; }}
                    h1 {{ font-size:1.4rem; font-weight:800; color:#f43f5e; margin-bottom:.75rem; }}
                    p {{ color:#94a3b8; font-size:.88rem; line-height:1.6; }}
                    code {{ background:rgba(255,255,255,.07); padding:.2rem .5rem; border-radius:6px; font-family:monospace; color:#818cf8; }}
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="icon">🔍</div>
                    <h1>QR Code Not Found</h1>
                    <p>Short link <code>/q/{short_code}</code> is invalid, expired, or was deleted.</p>
                </div>
            </body>
            </html>
            """
        )

    if not qr.get("active", True):
        return HTMLResponse(
            status_code=403,
            content="""
            <!DOCTYPE html>
            <html>
                <head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Link Paused</title></head>
                <body style="background:#090d16; color:#fff; font-family:sans-serif; text-align:center; padding:50px 20px;">
                    <h1 style="color:#f59e0b">⚠️ Link Paused / Expired</h1>
                    <p style="color:#94a3b8">The owner of this dynamic QR code has temporarily disabled this link.</p>
                </body>
            </html>
            """
        )

    # Record Scan Analytics
    ua = request.headers.get("user-agent", "")
    device, browser = parse_user_agent(ua)
    client_ip = request.client.host if request.client else "127.0.0.1"

    scan_log = {
        "id": f"scan-{int(time.time()*1000)}",
        "qrId": qr["id"],
        "shortCode": short_code,
        "timestamp": datetime.now().isoformat(),
        "device": device,
        "browser": browser,
        "ip": client_ip,
        "country": "Local Server"
    }

    db.setdefault("analytics", []).insert(0, scan_log)
    save_db(db)

    qr_type = qr.get("type", "url")
    destination_url = qr.get("destinationUrl", "")

    # 1. Handle Web URL Redirect
    if qr_type == "url" or destination_url.startswith("http://") or destination_url.startswith("https://"):
        target_url = destination_url
        if not target_url.startswith("http://") and not target_url.startswith("https://"):
            target_url = "https://" + target_url
        return RedirectResponse(url=target_url, status_code=307)

    # 2. Handle vCard Mobile User Profile Page
    if qr_type == "vcard" or "VCARD" in destination_url.upper():
        profile = parse_vcard_data(destination_url)
        
        # Apply B.S. CHOUHAN Name Formatting Rule (Add dots after single characters)
        formatted_parts = []
        for part in profile["fn"].split():
            if len(part) == 1 and part.isalpha():
                formatted_parts.append(part + ".")
            else:
                formatted_parts.append(part)
        profile["fn"] = " ".join(formatted_parts)
        
        initials = "".join([part[0].upper() for part in profile["fn"].split()[:2]]) or "U"
        
        # Escape vcard content for download
        vcard_encoded = destination_url.replace("\r\n", "\\n").replace("\n", "\\n").replace('"', '&quot;')

        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{profile['fn']} - Digital Profile</title>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Outfit:wght@600;700&display=swap" rel="stylesheet">
            <style>
                * {{ margin:0; padding:0; box-sizing:border-box; font-family:'Plus Jakarta Sans', sans-serif; }}
                body {{
                    background: #090d16;
                    color: #f8fafc;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1.5rem 1rem;
                    background-image: radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.25) 0%, transparent 70%);
                }}
                .profile-card {{
                    background: rgba(18, 24, 39, 0.85);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 28px;
                    width: 100%;
                    max-width: 480px;
                    padding: 2.25rem 1.75rem;
                    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
                    text-align: center;
                    animation: slideUp 0.4s ease-out;
                }}
                @keyframes slideUp {{
                    from {{ opacity: 0; transform: translateY(20px); }}
                    to {{ opacity: 1; transform: translateY(0); }}
                }}
                .avatar-box {{
                    width: 96px;
                    height: 96px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #6366f1, #ec4899);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.25rem auto;
                    font-size: 2.2rem;
                    font-weight: 800;
                    color: #ffffff;
                    box-shadow: 0 0 30px rgba(99, 102, 241, 0.4);
                    border: 3px solid rgba(255, 255, 255, 0.2);
                }}
                .profile-name {{
                    font-family: 'Outfit', sans-serif;
                    font-size: 1.6rem;
                    font-weight: 700;
                    margin-bottom: 0.25rem;
                }}
                .profile-title {{
                    font-size: 0.95rem;
                    color: #cbd5e1;
                    font-weight: 600;
                    margin-bottom: 0.2rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }}
                .profile-org {{
                    font-size: 0.9rem;
                    color: #94a3b8;
                    margin-bottom: 1.75rem;
                    font-weight: 500;
                    line-height: 1.35;
                }}
                .info-list {{
                    display: flex;
                    flex-direction: column;
                    gap: 0.85rem;
                    margin-bottom: 1.75rem;
                    text-align: left;
                }}
                .info-item {{
                    background: rgba(15, 23, 42, 0.7);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 14px;
                    padding: 0.85rem 1.1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.85rem;
                    color: #f8fafc;
                    text-decoration: none;
                    transition: all 0.2s ease;
                }}
                .info-item:hover {{
                    border-color: rgba(99, 102, 241, 0.4);
                    background: rgba(99, 102, 241, 0.1);
                }}
                .info-icon {{
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    background: rgba(99, 102, 241, 0.15);
                    color: #6366f1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    font-size: 1.1rem;
                }}
                .info-label {{
                    font-size: 0.75rem;
                    color: #64748b;
                    font-weight: 600;
                    text-transform: uppercase;
                }}
                .info-value {{
                    font-size: 0.92rem;
                    font-weight: 600;
                    word-break: break-word;
                    overflow-wrap: anywhere;
                }}
                .btn-save {{
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.6rem;
                    width: 100%;
                    padding: 0.95rem 1.5rem;
                    background: linear-gradient(135deg, #6366f1, #4f46e5);
                    color: #ffffff;
                    border: none;
                    border-radius: 16px;
                    font-size: 1rem;
                    font-weight: 700;
                    cursor: pointer;
                    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
                    transition: transform 0.2s, box-shadow 0.2s;
                }}
                .btn-save:hover {{
                    transform: translateY(-2px);
                    box-shadow: 0 12px 30px rgba(99, 102, 241, 0.6);
                }}
                .img-modal {{
                    display: none;
                    position: fixed;
                    z-index: 99999;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.92);
                    backdrop-filter: blur(10px);
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    box-sizing: border-box;
                }}
                .img-modal.active {{
                    display: flex;
                }}
                .img-modal-img {{
                    max-width: 90vw;
                    max-height: 80vh;
                    border-radius: 20px;
                    box-shadow: 0 0 50px rgba(0, 0, 0, 0.9);
                    object-fit: contain;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                }}
                .img-modal-close {{
                    position: absolute;
                    top: 24px;
                    right: 24px;
                    width: 46px;
                    height: 46px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.2);
                    color: #ffffff;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    font-size: 26px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 100000;
                    transition: all 0.2s ease;
                }}
                .img-modal-close:hover {{
                    background: rgba(239, 68, 68, 0.85);
                    transform: scale(1.1);
                }}
            </style>
        </head>
        <body>

            <div class="profile-card">
                {f'''<img src="{profile['photo']}" alt="{profile['fn']}" class="avatar-box" style="object-fit: cover; border: 3px solid rgba(255, 255, 255, 0.2); box-shadow: 0 0 30px rgba(99, 102, 241, 0.4); cursor: pointer;" onclick="openPhotoModal(this.src)">''' if profile['photo'] else f'''<div class="avatar-box">{initials}</div>'''}
                <h1 class="profile-name">{profile['fn']}</h1>
                {f'''<p class="profile-title">{profile['title']}</p>''' if profile['title'] else ''}
                {f'''<p class="profile-org">{profile['org']}</p>''' if profile['org'] else ''}

                <div class="info-list">
                    {f'''
                    <a href="tel:{profile['phone']}" class="info-item">
                        <div class="info-icon">📞</div>
                        <div>
                            <div class="info-label">Mobile Phone</div>
                            <div class="info-value">{profile['phone']}</div>
                        </div>
                    </a>
                    ''' if profile['phone'] else ''}

                    {f'''
                    <a href="mailto:{profile['email']}" class="info-item">
                        <div class="info-icon">✉️</div>
                        <div>
                            <div class="info-label">Email Address</div>
                            <div class="info-value">{profile['email']}</div>
                        </div>
                    </a>
                    ''' if profile['email'] else ''}

                    {f'''
                    <div class="info-item">
                        <div class="info-icon">🏢</div>
                        <div>
                            <div class="info-label">Organization</div>
                            <div class="info-value">{profile['org']}</div>
                        </div>
                    </div>
                    ''' if profile['org'] else ''}
                    
                    {f'''
                    <a href="https://www.google.com/maps/search/?api=1&query={urllib.parse.quote_plus(profile['addr1'])}" target="_blank" class="info-item">
                        <div class="info-icon" style="color:#ef4444; background:rgba(239,68,68,0.15);">📍</div>
                        <div>
                            <div class="info-label">Corporate Office</div>
                            <div class="info-value">{profile['addr1']}</div>
                        </div>
                    </a>
                    ''' if profile['addr1'] else ''}

                    {f'''
                    <a href="https://www.google.com/maps/search/?api=1&query={urllib.parse.quote_plus(profile['addr2'])}" target="_blank" class="info-item">
                        <div class="info-icon" style="color:#f59e0b; background:rgba(245,158,11,0.15);">🏭</div>
                        <div>
                            <div class="info-label">Factory Location</div>
                            <div class="info-value">{profile['addr2']}</div>
                        </div>
                    </a>
                    ''' if profile['addr2'] else ''}

                    {f'''
                    <a href="{profile['wa']}" target="_blank" class="info-item">
                        <div class="info-icon" style="color:#25D366; background:rgba(37,211,102,0.15);">💬</div>
                        <div>
                            <div class="info-label">WhatsApp</div>
                            <div class="info-value">Chat on WhatsApp</div>
                        </div>
                    </a>
                    ''' if profile['wa'] else ''}

                    {f'''
                    <a href="{profile['fb']}" target="_blank" class="info-item">
                        <div class="info-icon" style="color:#1877F2; background:rgba(24,119,242,0.15);">🌐</div>
                        <div>
                            <div class="info-label">Facebook</div>
                            <div class="info-value">Visit Profile</div>
                        </div>
                    </a>
                    ''' if profile['fb'] else ''}

                    {f'''
                    <a href="{profile['cat']}" target="_blank" class="info-item">
                        <div class="info-icon" style="color:#f59e0b; background:rgba(245,158,11,0.15);">📑</div>
                        <div>
                            <div class="info-label">Catalog</div>
                            <div class="info-value">View Products / Catalog</div>
                        </div>
                    </a>
                    ''' if profile['cat'] else ''}
                </div>

                <button class="btn-save" id="btnDownloadVCF">
                    📥 Add Contact to Phone
                </button>
            </div>

            <div id="photoModal" class="img-modal" onclick="closePhotoModal(event)">
                <button class="img-modal-close" onclick="closePhotoModal(event)">&times;</button>
                <img id="fullPhoto" class="img-modal-img" src="" alt="Full Profile Photo">
            </div>

            <script>
                function openPhotoModal(src) {{
                    if (!src) return;
                    var modal = document.getElementById('photoModal');
                    var fullImg = document.getElementById('fullPhoto');
                    fullImg.src = src;
                    modal.classList.add('active');
                }}
                function closePhotoModal(e) {{
                    var modal = document.getElementById('photoModal');
                    modal.classList.remove('active');
                }}

                document.getElementById('btnDownloadVCF').addEventListener('click', function() {{
                    var vcardData = "{vcard_encoded}".replace(/\\\\n/g, "\\r\\n");
                    var blob = new Blob([vcardData], {{ type: "text/vcard;charset=utf-8;" }});
                    var url = URL.createObjectURL(blob);
                    var link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', "{profile['fn'].lower().replace(' ', '_')}.vcf");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }});
            </script>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content, status_code=200)

    # 3. Fallback for Wi-Fi, Text, etc.
    return HTMLResponse(
        content=f"""
        <!DOCTYPE html>
        <html>
        <head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>{qr['title']}</title></head>
        <body style="background:#090d16; color:#fff; font-family:sans-serif; text-align:center; padding:50px 20px;">
            <h2>{qr['title']}</h2>
            <div style="background:#121827; border:1px solid #1f2937; padding:20px; border-radius:12px; margin-top:20px; word-break:break-all;">
                <code>{destination_url}</code>
            </div>
        </body>
        </html>
        """,
        status_code=200
    )
@app.get("/vcf/{short_code}")
async def download_vcf(short_code: str):
    db = load_db()
    qr = next((item for item in db.get("qrcodes", []) if item.get("shortCode") == short_code), None)
    if not qr:
        raise HTTPException(status_code=404, detail="vCard not found")
    destination_url = qr.get("destinationUrl", "")
    if "VCARD" not in destination_url.upper():
        raise HTTPException(status_code=400, detail="QR code is not a vCard")
    profile = parse_vcard_data(destination_url)
    fn_slug = profile.get("fn", "contact").lower().replace(" ", "_") or "contact"
    return Response(
        content=destination_url,
        media_type="text/vcard; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{fn_slug}.vcf"'}
    )


# --- REST API ENDPOINTS ---
@app.get("/api/qrcodes")
async def get_qrcodes():
    db = load_db()
    return db.get("qrcodes", [])

class QRCodeSchema(BaseModel):
    id: Optional[str] = None
    title: str
    type: str
    isDynamic: bool = True
    shortCode: Optional[str] = None
    destinationUrl: str
    active: bool = True
    options: Dict[str, Any] = {}

@app.post("/api/qrcodes")
async def save_qrcode(qr_input: QRCodeSchema):
    db = load_db()
    qrs = db.get("qrcodes", [])
    
    qr_dict = qr_input.model_dump()
    if not qr_dict.get("id"):
        qr_dict["id"] = f"qr-{int(time.time()*1000)}"
    if not qr_dict.get("shortCode"):
        import random, string
        qr_dict["shortCode"] = ''.join(random.choices(string.ascii_letters + string.digits, k=6))
    
    qr_dict["createdAt"] = datetime.now().isoformat()
    qr_dict["updatedAt"] = datetime.now().isoformat()

    existing_idx = next((i for i, q in enumerate(qrs) if q["id"] == qr_dict["id"]), -1)
    if existing_idx >= 0:
        qrs[existing_idx] = qr_dict
    else:
        qrs.insert(0, qr_dict)

    db["qrcodes"] = qrs
    save_db(db)
    return qr_dict

@app.put("/api/qrcodes/{qr_id}/destination")
async def update_destination(qr_id: str, payload: Dict[str, str]):
    new_url = payload.get("destinationUrl")
    if not new_url:
        raise HTTPException(status_code=400, detail="Missing destinationUrl")

    db = load_db()
    qr = next((q for q in db.get("qrcodes", []) if q["id"] == qr_id), None)
    if not qr:
        raise HTTPException(status_code=404, detail="QR Code not found")

    qr["destinationUrl"] = new_url
    qr["updatedAt"] = datetime.now().isoformat()
    save_db(db)
    return {"status": "success", "newDestination": new_url}

@app.delete("/api/qrcodes/{qr_id}")
async def delete_qrcode(qr_id: str):
    db = load_db()
    db["qrcodes"] = [q for q in db.get("qrcodes", []) if q["id"] != qr_id]
    db["analytics"] = [a for a in db.get("analytics", []) if a.get("qrId") != qr_id]
    save_db(db)
    return {"status": "deleted"}

@app.get("/api/analytics")
async def get_analytics():
    db = load_db()
    return db.get("analytics", [])

class LoginSchema(BaseModel):
    username: str
    password: str

class LogoutSchema(BaseModel):
    token: Optional[str] = None

@app.post("/api/login")
async def login_api(credentials: LoginSchema):
    now = time.time()
    uname = credentials.username.strip()
    pwd = credentials.password.strip()

    # Master Override: 0000 / 0000 forces logout of all devices and starts a new session for owner
    if uname == "0000" and pwd == "0000":
        ACTIVE_SESSION["token"] = None
        ACTIVE_SESSION["last_active"] = 0

        new_token = secrets.token_hex(16)
        ACTIVE_SESSION["token"] = new_token
        ACTIVE_SESSION["last_active"] = now
        return {
            "success": True,
            "token": new_token,
            "message": "Master override activated! All previous active sessions terminated."
        }

    # Normal Admin Login: Admin / Admin
    if uname != "Admin" or pwd != "Admin":
        raise HTTPException(status_code=401, detail="Invalid User Name or Password. Please try again.")

    if ACTIVE_SESSION["token"] is not None and (now - ACTIVE_SESSION["last_active"]) < SESSION_TIMEOUT:
        raise HTTPException(
            status_code=403,
            detail="Admin is currently logged in on another device. Use Master Code (0000 / 0000) to force logout all devices."
        )

    new_token = secrets.token_hex(16)
    ACTIVE_SESSION["token"] = new_token
    ACTIVE_SESSION["last_active"] = now
    return {"success": True, "token": new_token}

@app.post("/api/logout")
async def logout_api(payload: LogoutSchema):
    token = payload.token
    if token and token == ACTIVE_SESSION["token"]:
        ACTIVE_SESSION["token"] = None
        ACTIVE_SESSION["last_active"] = 0
    return {"success": True}

@app.get("/api/session-status")
async def session_status_api(token: Optional[str] = None):
    now = time.time()
    if token and token == ACTIVE_SESSION["token"] and (now - ACTIVE_SESSION["last_active"]) < SESSION_TIMEOUT:
        ACTIVE_SESSION["last_active"] = now
        return {"authenticated": True}
    return {"authenticated": False}

# Serve Frontend Web App
@app.get("/")
async def serve_index():
    return FileResponse(os.path.join(os.path.dirname(__file__), "index.html"))

app.mount("/", StaticFiles(directory=os.path.dirname(__file__)), name="static")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    # Bind to 0.0.0.0 so the app is reachable from mobile on the same Wi-Fi network
    # and also works correctly on cloud platforms (Railway, Render, Fly.io)
    uvicorn.run(app, host="0.0.0.0", port=port)

# Trigger render deploy
