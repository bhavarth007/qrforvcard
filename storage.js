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
        id: 'qr-seed-1',
        title: 'Main Company Website',
        type: 'url',
        isDynamic: true,
        shortCode: 'web888',
        destinationUrl: 'https://github.com/tuxxin/qr-track',
        active: true,
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        options: {
          colorDark: '#4f46e5',
          colorLight: '#ffffff',
          gradient: true,
          gradientColor: '#ec4899',
          bodyStyle: 'rounded',
          eyeStyle: 'rounded',
          eyeBallStyle: 'circle',
          logoIcon: 'web',
          frameStyle: 'scan_me',
          frameText: 'SCAN WEBSITE',
          frameColor: '#4f46e5'
        }
      },
      {
        id: 'qr-seed-2',
        title: 'Office WiFi Network',
        type: 'wifi',
        isDynamic: false,
        shortCode: 'wifi01',
        destinationUrl: 'WIFI:S:Guest_HQ;T:WPA;P:SecretPass2026;;',
        active: true,
        createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        options: {
          colorDark: '#0f172a',
          colorLight: '#ffffff',
          gradient: false,
          bodyStyle: 'square',
          eyeStyle: 'square',
          eyeBallStyle: 'square',
          logoIcon: 'wifi',
          frameStyle: 'wifi',
          frameText: 'CONNECT TO WI-FI',
          frameColor: '#06b6d4'
        }
      },
      {
        id: 'qr-seed-3',
        title: 'Summer Discount Promo',
        type: 'url',
        isDynamic: true,
        shortCode: 'sale26',
        destinationUrl: 'https://qr-track.tuxxin.com',
        active: true,
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        options: {
          colorDark: '#059669',
          colorLight: '#ffffff',
          gradient: true,
          gradientColor: '#10b981',
          bodyStyle: 'extra_rounded',
          eyeStyle: 'circle',
          eyeBallStyle: 'circle',
          logoIcon: 'star',
          frameStyle: 'simple',
          frameText: 'GET PROMO CODE',
          frameColor: '#10b981'
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
    return qrData;
  },

  updateDestinationUrl(id, newUrl) {
    const qrs = this.getAllQRs();
    const target = qrs.find(q => q.id === id);
    if (target) {
      target.destinationUrl = newUrl;
      target.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.QRS, JSON.stringify(qrs));
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
