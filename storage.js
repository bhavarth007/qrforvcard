/**
 * Dynamic QR Code Storage Engine & Seed Data
 * Manages QR codes, short-code dynamic redirects, scan analytics, and JSON backup/restore.
 */

const STORAGE_KEYS = {
  QRS: 'qr_track_qrcodes_v1',
  ANALYTICS: 'qr_track_analytics_v1',
  SETTINGS: 'qr_track_settings_v1'
};

// Seed initial demo data if empty
function initializeSeedData() {
  if (!localStorage.getItem(STORAGE_KEYS.QRS)) {
    const defaultQRs = [
    {
        "id": "qr-seed-1",
        "title": "GHANSHYAM DOBARIYA - Digital Business Card",
        "type": "vcard",
        "isDynamic": true,
        "shortCode": "ghanshyam",
        "destinationUrl": "BEGIN:VCARD\r\nVERSION:3.0\r\nN:;GHANSHYAM DOBARIYA;;;\r\nFN:GHANSHYAM DOBARIYA\r\nORG:Sahjanand Polyweaves Pvt. Ltd.\r\nTITLE:MANAGING DIRECTOR\r\nTEL;TYPE=CELL:9909143742\r\nEMAIL:\r\nADR;TYPE=WORK:;;PLOT NO. C1B-4308/8, ROAD NO. 43-B, SACHIN GIDC,SURAT,GUJARAT-394230;;;;\r\nURL;TYPE=WhatsApp:https://wa.me/9909143742\r\nEND:VCARD",
        "active": true,
        "createdAt": "2026-08-05T12:45:50.000791",
        "updatedAt": "2026-08-05T12:46:46.409094",
        "options": {
            "colorDark": "#4f46e5",
            "colorLight": "#ffffff",
            "gradient": true,
            "gradientColor": "#ec4899",
            "bodyStyle": "rounded",
            "eyeStyle": "rounded",
            "eyeBallStyle": "circle",
            "logoIcon": "user",
            "frameStyle": "scan_me",
            "frameText": "SAVE CONTACT",
            "frameColor": "#4f46e5"
        }
    },
    {
        "id": "qr-seed-2",
        "title": "SHAILESH DHOLARIYA - Digital Business Card",
        "type": "vcard",
        "isDynamic": true,
        "shortCode": "shailesh",
        "destinationUrl": "BEGIN:VCARD\r\nVERSION:3.0\r\nN:;SHAILESH DHOLARIYA;;;\r\nFN:SHAILESH DHOLARIYA\r\nORG:Ghanshyam Synthetics / Silken Sonnets\r\nTITLE:SALES HEAD\r\nTEL;TYPE=CELL:9925933568\r\nEMAIL:shaileshdholariya87@gmail.com\r\nADR;TYPE=WORK:;;PLOT NO. C1B-4308/8, ROAD NO. 43-B, SACHIN GIDC,SURAT,GUJARAT-394230;;;;\r\nURL;TYPE=WhatsApp:https://wa.me/9925933568\r\nEND:VCARD",
        "active": true,
        "createdAt": "2026-08-05T12:45:50.000806",
        "updatedAt": "2026-08-05T12:47:36.241835",
        "options": {
            "colorDark": "#4f46e5",
            "colorLight": "#ffffff",
            "gradient": true,
            "gradientColor": "#ec4899",
            "bodyStyle": "rounded",
            "eyeStyle": "rounded",
            "eyeBallStyle": "circle",
            "logoIcon": "user",
            "frameStyle": "scan_me",
            "frameText": "SAVE CONTACT",
            "frameColor": "#4f46e5"
        }
    },
    {
        "id": "qr-seed-3",
        "title": "MILAN HIDAD - Digital Business Card",
        "type": "vcard",
        "isDynamic": true,
        "shortCode": "milan",
        "destinationUrl": "BEGIN:VCARD\r\nVERSION:3.0\r\nN:;MILAN HIDAD;;;\r\nFN:MILAN HIDAD\r\nORG:Ghanshyam Synthetics / Silken Sonnets\r\nTITLE:MANAGER\r\nTEL;TYPE=CELL:6355979500\r\nEMAIL:milanhidad3215@gmail.com\r\nADR;TYPE=WORK:;;PLOT NO. C1B-4308/8, ROAD NO. 43-B, SACHIN GIDC,SURAT,GUJARAT-394230;;;;\r\nURL;TYPE=WhatsApp:https://wa.me/6355979500\r\nEND:VCARD",
        "active": true,
        "createdAt": "2026-08-05T12:45:50.000811",
        "updatedAt": "2026-08-05T12:48:08.400060",
        "options": {
            "colorDark": "#4f46e5",
            "colorLight": "#ffffff",
            "gradient": true,
            "gradientColor": "#ec4899",
            "bodyStyle": "rounded",
            "eyeStyle": "rounded",
            "eyeBallStyle": "circle",
            "logoIcon": "user",
            "frameStyle": "scan_me",
            "frameText": "SAVE CONTACT",
            "frameColor": "#4f46e5"
        }
    },
    {
        "id": "qr-seed-4",
        "title": "DINESH BHUVA - Digital Business Card",
        "type": "vcard",
        "isDynamic": true,
        "shortCode": "dinesh",
        "destinationUrl": "BEGIN:VCARD\r\nVERSION:3.0\r\nN:;DINESH BHUVA;;;\r\nFN:DINESH BHUVA\r\nORG:Sahjanand Polyweaves Pvt. Ltd.\r\nTITLE:MANAGER\r\nTEL;TYPE=CELL:9299999995\r\nEMAIL:dbhuva9898@gmail.com\r\nADR;TYPE=WORK:;;PLOT NO. C-127, ROAD NO. 20, NEAR M R CIRCLE ,SAYKHA GIDC,VAGRA,BHARUCH, GUJARAT-392140;;;;\r\nURL;TYPE=WhatsApp:https://wa.me/9299999995\r\nEND:VCARD",
        "active": true,
        "createdAt": "2026-08-05T12:45:50.000816",
        "updatedAt": "2026-08-05T12:48:45.134445",
        "options": {
            "colorDark": "#4f46e5",
            "colorLight": "#ffffff",
            "gradient": true,
            "gradientColor": "#ec4899",
            "bodyStyle": "rounded",
            "eyeStyle": "rounded",
            "eyeBallStyle": "circle",
            "logoIcon": "user",
            "frameStyle": "scan_me",
            "frameText": "SAVE CONTACT",
            "frameColor": "#4f46e5"
        }
    },
    {
        "id": "qr-seed-5",
        "title": "M S YADAV - Digital Business Card",
        "type": "vcard",
        "isDynamic": true,
        "shortCode": "myadav",
        "destinationUrl": "BEGIN:VCARD\r\nVERSION:3.0\r\nN:;M .S. YADAV;;;\r\nFN:M .S. YADAV\r\nORG:Sahjanand Polyweaves Pvt. Ltd.\r\nTITLE:C.E.O.\r\nTEL;TYPE=CELL:9313509726\r\nEMAIL:\r\nADR;TYPE=WORK:;;PLOT NO. A1/8, ROAD NO. 9, HOJIWALA IND. ESTATE,SACHIN,SURAT, GUJARAT-394230;;;;\r\nURL;TYPE=WhatsApp:https://wa.me/9313509726\r\nEND:VCARD",
        "active": true,
        "createdAt": "2026-08-05T12:45:50.000821",
        "updatedAt": "2026-08-05T12:49:29.046378",
        "options": {
            "colorDark": "#4f46e5",
            "colorLight": "#ffffff",
            "gradient": true,
            "gradientColor": "#ec4899",
            "bodyStyle": "rounded",
            "eyeStyle": "rounded",
            "eyeBallStyle": "circle",
            "logoIcon": "user",
            "frameStyle": "scan_me",
            "frameText": "SAVE CONTACT",
            "frameColor": "#4f46e5"
        }
    },
    {
        "id": "qr-seed-6",
        "title": "B S CHOUHAN - Digital Business Card",
        "type": "vcard",
        "isDynamic": true,
        "shortCode": "bchouhan",
        "destinationUrl": "BEGIN:VCARD\r\nVERSION:3.0\r\nN:;B.S. CHOUHAN;;;\r\nFN:B.S. CHOUHAN\r\nORG:Sahjanand Polyweaves Pvt. Ltd.\r\nTITLE:SR. SALES MANAGER\r\nTEL;TYPE=CELL:9727564411\r\nEMAIL:\r\nADR;TYPE=WORK:;;PLOT NO. C1B-4308/8, ROAD NO. 43-B, SACHIN GIDC,SURAT,GUJARAT-394230;;;;\r\nADR;TYPE=HOME:;;PLOT NO. A1/8, ROAD NO. 9, HOJIWALA IND. ESTATE,SACHIN,SURAT, GUJARAT-394230;;;;\r\nURL;TYPE=WhatsApp:https://wa.me/9727564411\r\nEND:VCARD",
        "active": true,
        "createdAt": "2026-08-05T12:45:50.000826",
        "updatedAt": "2026-08-05T12:45:56.204808",
        "options": {
            "colorDark": "#4f46e5",
            "colorLight": "#ffffff",
            "gradient": true,
            "gradientColor": "#ec4899",
            "bodyStyle": "rounded",
            "eyeStyle": "rounded",
            "eyeBallStyle": "circle",
            "logoIcon": "user",
            "frameStyle": "scan_me",
            "frameText": "SAVE CONTACT",
            "frameColor": "#4f46e5"
        }
    },
    {
        "id": "qr-ghanshyam-card",
        "title": "GHANSHYAM DOBARIYA - Sahjanand Gold Card",
        "type": "vcard",
        "isDynamic": false,
        "shortCode": "ghanshyam-card",
        "destinationUrl": "BEGIN:VCARD\r\nVERSION:3.0\r\nN:DOBARIYA;GHANSHYAM;;;\r\nFN:GHANSHYAM DOBARIYA\r\nORG:Sahjanand Polyweaves Pvt. Ltd.\r\nTITLE:MANAGING DIRECTOR\r\nTEL;TYPE=CELL:+919909143742\r\nitem1.ADR;TYPE=WORK:;;4308/8, Road No. 43-B, Sachin GIDC;Surat;Gujarat;394230;India\r\nitem1.X-ABLabel:Address-1\r\nitem2.ADR;TYPE=HOME:;;Plot No. A1/8, Road No. 9, Hojiwala Ind. Estate;Sachin, Surat;Gujarat;394230;India\r\nitem2.X-ABLabel:Address-2\r\nitem3.URL:https://wa.me/919909143742\r\nitem3.X-ABLabel:WhatsApp\r\nNOTE:Sahjanand Polyweaves Pvt. Ltd. - MANAGING DIRECTOR\r\nEND:VCARD",
        "active": true,
        "createdAt": "2026-08-23T16:05:00.000000",
        "updatedAt": "2026-08-23T16:05:00.000000",
        "options": {
            "colorDark": "#000000",
            "colorLight": "#ffffff",
            "gradient": false,
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
    },
    {
        "id": "qr-shailesh-card",
        "title": "SHAILESH DHOLARIYA - Ghanshyam Synthetics Gold Card",
        "type": "vcard",
        "isDynamic": false,
        "shortCode": "shailesh-card",
        "destinationUrl": "BEGIN:VCARD\r\nVERSION:3.0\r\nN:DHOLARIYA;SHAILESH;;;\r\nFN:SHAILESH DHOLARIYA\r\nORG:Ghanshyam Synthetics / Silken Sonnets\r\nTITLE:SALES HEAD\r\nTEL;TYPE=CELL:+919925933568\r\nEMAIL:shaileshdholariya87@gmail.com\r\nADR;TYPE=WORK:;;PLOT NO. C1B-4308/8, ROAD NO. 43-B, SACHIN GIDC, SURAT, GUJARAT-394230, INDIA;;;;\r\nURL;TYPE=WhatsApp:https://wa.me/919925933568\r\nEND:VCARD",
        "active": true,
        "createdAt": "2026-08-26T13:00:00.000000",
        "updatedAt": "2026-08-26T13:00:00.000000",
        "options": {
            "colorDark": "#000000",
            "colorLight": "#ffffff",
            "gradient": false,
            "gradientColor": "#000000",
            "bodyStyle": "square",
            "eyeStyle": "square",
            "eyeBallStyle": "square",
            "logoIcon": "none",
            "logoText": "Ghanshyam Synthetics / Silken Sonnets",
            "frameStyle": "gold_card",
            "frameText": "SHAILESH DHOLARIYA",
            "frameColor": "#d4af37"
        }
    },
    {
        "id": "qr-milan-card",
        "title": "MILAN HIDAD - Ghanshyam Synthetics Gold Card",
        "type": "vcard",
        "isDynamic": false,
        "shortCode": "milan-card",
        "destinationUrl": "BEGIN:VCARD\r\nVERSION:3.0\r\nN:HIDAD;MILAN;;;\r\nFN:MILAN HIDAD\r\nORG:Ghanshyam Synthetics / Silken Sonnets\r\nTITLE:MANAGER\r\nTEL;TYPE=CELL:+916355979500\r\nEMAIL:milanhidad3215@gmail.com\r\nADR;TYPE=WORK:;;PLOT NO. C1B-4308/8, ROAD NO. 43-B, SACHIN GIDC, SURAT, GUJARAT-394230, INDIA;;;;\r\nURL;TYPE=WhatsApp:https://wa.me/916355979500\r\nEND:VCARD",
        "active": true,
        "createdAt": "2026-08-26T13:00:00.000000",
        "updatedAt": "2026-08-26T13:00:00.000000",
        "options": {
            "colorDark": "#000000",
            "colorLight": "#ffffff",
            "gradient": false,
            "gradientColor": "#000000",
            "bodyStyle": "square",
            "eyeStyle": "square",
            "eyeBallStyle": "square",
            "logoIcon": "none",
            "logoText": "Ghanshyam Synthetics / Silken Sonnets",
            "frameStyle": "gold_card",
            "frameText": "MILAN HIDAD",
            "frameColor": "#d4af37"
        }
    }
];

    localStorage.setItem(STORAGE_KEYS.QRS, JSON.stringify(defaultQRs));

    // Seed mock analytics
    const mockLogs = [];
    const devices = ['Mobile (iOS)', 'Mobile (Android)', 'Desktop (Windows)', 'Desktop (macOS)'];
    const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
    const ips = ['182.72.10.4', '49.36.192.11', '103.21.244.5', '172.56.21.99'];

    // Generate 35 mock scan events over the past 7 days
    for (let i = 0; i < 35; i++) {
      const qrIndex = i % 3;
      const qr = defaultQRs[qrIndex];
      const daysAgo = Math.floor(Math.random() * 7);
      const scanDate = new Date(Date.now() - daysAgo * 86400000 - Math.random() * 36000000);
      
      mockLogs.push({
        id: 'scan-' + Math.random().toString(36).substring(2, 9),
        qrId: qr.id,
        shortCode: qr.shortCode,
        timestamp: scanDate.toISOString(),
        device: devices[Math.floor(Math.random() * devices.length)],
        browser: browsers[Math.floor(Math.random() * browsers.length)],
        ip: ips[Math.floor(Math.random() * ips.length)],
        country: 'Global'
      });
    }

    localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(mockLogs));
  }
}

// Data Storage API
window.QRStorage = {
  init() {
    initializeSeedData();
  },

  generateShortCode() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  getAllQRs() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QRS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading QRs from storage', e);
      return [];
    }
  },

  getQRById(id) {
    const qrs = this.getAllQRs();
    return qrs.find(q => q.id === id) || null;
  },

  getQRByShortCode(code) {
    const qrs = this.getAllQRs();
    return qrs.find(q => q.shortCode === code) || null;
  },

  saveQR(qrData) {
    const qrs = this.getAllQRs();
    if (!qrData.id) {
      qrData.id = 'qr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    }
    if (!qrData.shortCode) {
      qrData.shortCode = this.generateShortCode();
    }
    qrData.createdAt = qrData.createdAt || new Date().toISOString();
    qrData.updatedAt = new Date().toISOString();
    qrData.active = qrData.active !== undefined ? qrData.active : true;

    const existingIndex = qrs.findIndex(q => q.id === qrData.id);
    if (existingIndex >= 0) {
      qrs[existingIndex] = qrData;
    } else {
      qrs.unshift(qrData);
    }

    localStorage.setItem(STORAGE_KEYS.QRS, JSON.stringify(qrs));

    // SYNC TO SERVER
    fetch('/api/qrcodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(qrData)
    })
    .then(res => res.json())
    .then(data => console.log('Successfully synced QR to server:', data))
    .catch(err => console.error('Failed to sync QR to server:', err));

    return qrData;
  },

  updateDestinationUrl(id, newUrl) {
    const qrs = this.getAllQRs();
    const target = qrs.find(q => q.id === id);
    if (target) {
      target.destinationUrl = newUrl;
      target.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.QRS, JSON.stringify(qrs));

      // SYNC TO SERVER
      fetch(`/api/qrcodes/${id}/destination`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinationUrl: newUrl })
      })
      .then(res => res.json())
      .then(data => console.log('Successfully synced update to server:', data))
      .catch(err => console.error('Failed to sync update to server:', err));

      return true;
    }
    return false;
  },

  toggleActiveState(id) {
    const qrs = this.getAllQRs();
    const target = qrs.find(q => q.id === id);
    if (target) {
      target.active = !target.active;
      target.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.QRS, JSON.stringify(qrs));
      
      // SYNC TO SERVER (Send updated QR model)
      fetch('/api/qrcodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(target)
      }).catch(err => console.error('Failed to sync toggle state:', err));

      return target.active;
    }
    return null;
  },

  deleteQR(id) {
    let qrs = this.getAllQRs();
    qrs = qrs.filter(q => q.id !== id);
    localStorage.setItem(STORAGE_KEYS.QRS, JSON.stringify(qrs));

    // Also clean up analytics for deleted QR
    let analytics = this.getAllAnalytics();
    analytics = analytics.filter(a => a.qrId !== id);
    localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));

    // SYNC TO SERVER
    fetch(`/api/qrcodes/${id}`, {
      method: 'DELETE'
    })
    .then(res => res.json())
    .then(data => console.log('Successfully synced delete to server:', data))
    .catch(err => console.error('Failed to sync delete to server:', err));
  },

  // Analytics API
  getAllAnalytics() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  getAnalyticsForQR(qrId) {
    const all = this.getAllAnalytics();
    return all.filter(a => a.qrId === qrId);
  },

  recordScan(shortCode) {
    const qr = this.getQRByShortCode(shortCode);
    if (!qr) return null;

    // Detect browser/device from user agent
    const ua = navigator.userAgent;
    let device = 'Desktop';
    if (/android/i.test(ua)) device = 'Mobile (Android)';
    else if (/iPhone|iPad|iPod/i.test(ua)) device = 'Mobile (iOS)';
    else if (/Macintosh/i.test(ua)) device = 'Desktop (macOS)';
    else if (/Windows/i.test(ua)) device = 'Desktop (Windows)';

    let browser = 'Chrome';
    if (/edg/i.test(ua)) browser = 'Edge';
    else if (/firefox/i.test(ua)) browser = 'Firefox';
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';

    const logEntry = {
      id: 'scan-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      qrId: qr.id,
      shortCode: shortCode,
      timestamp: new Date().toISOString(),
      device: device,
      browser: browser,
      ip: '127.0.0.1 (Local)',
      country: 'Self-Hosted'
    };

    const analytics = this.getAllAnalytics();
    analytics.unshift(logEntry);
    localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));
    return { logEntry, qr };
  },

  // Backup & Import
  exportBackupJSON() {
    const backupObj = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      qrcodes: this.getAllQRs(),
      analytics: this.getAllAnalytics()
    };
    return JSON.stringify(backupObj, null, 2);
  },

  importBackupJSON(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (data.qrcodes && Array.isArray(data.qrcodes)) {
        localStorage.setItem(STORAGE_KEYS.QRS, JSON.stringify(data.qrcodes));
      }
      if (data.analytics && Array.isArray(data.analytics)) {
        localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(data.analytics));
      }
      return true;
    } catch (e) {
      console.error('Failed to import JSON backup', e);
      return false;
    }
  }
};

// Auto-initialize on file load
window.QRStorage.init();
