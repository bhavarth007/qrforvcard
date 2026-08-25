/**
 * Main Application Controller & UI Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // State
  let currentType = 'vcard';
  let isDynamic = true;
  let customLogoDataUrl = null;

  // Customization Options State
  const qrOptions = {
    colorDark: '#4f46e5',
    colorLight: '#ffffff',
    gradient: true,
    gradientColor: '#ec4899',
    bodyStyle: 'rounded',
    eyeStyle: 'rounded',
    eyeBallStyle: 'circle',
    logoIcon: 'web',
    frameStyle: 'scan_me',
    frameText: 'SCAN ME',
    frameColor: '#4f46e5'
  };

  // Chart Instances
  let trendChartInstance = null;
  let deviceChartInstance = null;
  let browserChartInstance = null;

  // Init App
  initNavigation();
  initTypeSelector();
  initFormInputs();
  initCustomizer();
  initDashboard();
  initAnalytics();
  initSimulator();
  initSettings();
  initAuthListeners();

  // --- 0. AUTHENTICATION & SINGLE SESSION LOCK ---
  let heartbeatTimer = null;

  async function checkSessionStatus() {
    const token = localStorage.getItem('admin_session_token');
    if (!token) {
      showLoginScreen();
      return false;
    }

    try {
      const res = await fetch(`/api/session-status?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (data.authenticated) {
        hideLoginScreen();
        startSessionHeartbeat();
        return true;
      } else {
        localStorage.removeItem('admin_session_token');
        showLoginScreen();
        return false;
      }
    } catch (err) {
      console.error('Session check error:', err);
      return false;
    }
  }

  function showLoginScreen() {
    stopSessionHeartbeat();
    const overlay = document.getElementById('loginOverlay');
    const logoutBtn = document.getElementById('btnHeaderLogout');
    if (overlay) overlay.style.display = 'flex';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }

  function hideLoginScreen() {
    const overlay = document.getElementById('loginOverlay');
    const logoutBtn = document.getElementById('btnHeaderLogout');
    if (overlay) overlay.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
  }

  function startSessionHeartbeat() {
    stopSessionHeartbeat();
    heartbeatTimer = setInterval(async () => {
      const token = localStorage.getItem('admin_session_token');
      if (token) {
        try {
          const res = await fetch(`/api/session-status?token=${encodeURIComponent(token)}`);
          const data = await res.json();
          if (!data.authenticated) {
            showToast('Session ended or active on another device.', 'error');
            localStorage.removeItem('admin_session_token');
            showLoginScreen();
          }
        } catch (e) {}
      }
    }, 20000);
  }

  function stopSessionHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  function initAuthListeners() {
    const form = document.getElementById('loginForm');
    const errBanner = document.getElementById('loginError');
    const logoutBtn = document.getElementById('btnHeaderLogout');

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        const submitBtn = document.getElementById('btnLoginSubmit');

        if (!username || !password) {
          if (errBanner) {
            errBanner.textContent = 'Please enter both User Name and Password.';
            errBanner.style.display = 'block';
          }
          return;
        }

        if (errBanner) errBanner.style.display = 'none';
        if (submitBtn) submitBtn.disabled = true;

        try {
          const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });

          const data = await res.json();
          if (res.ok && data.success && data.token) {
            localStorage.setItem('admin_session_token', data.token);
            hideLoginScreen();
            startSessionHeartbeat();
            showToast(data.message || 'Welcome Admin! Logged in successfully.', 'success');

            // Default redirect to Dashboard page
            const dashBtn = document.querySelector('.nav-btn[data-tab="dashboard"]');
            if (dashBtn) dashBtn.click();
          } else {
            const errMsg = data.detail || 'Invalid User Name or Password.';
            if (errBanner) {
              errBanner.textContent = errMsg;
              errBanner.style.display = 'block';
            }
          }
        } catch (err) {
          console.error(err);
          if (errBanner) {
            errBanner.textContent = 'Server connection error. Please try again.';
            errBanner.style.display = 'block';
          }
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        const token = localStorage.getItem('admin_session_token');
        if (token) {
          try {
            await fetch('/api/logout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token })
            });
          } catch (e) {}
        }
        localStorage.removeItem('admin_session_token');
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
        showLoginScreen();
        showToast('Logged out successfully.', 'info');
      });
    }

    // Perform initial session check
    checkSessionStatus();
  }

  // Sync state from server on startup
  function syncFromServer() {
    fetch('/api/qrcodes')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data)) {
          // If we got items from the server, update local storage to match server database
          localStorage.setItem('qr_track_qrcodes_v1', JSON.stringify(data));
          // If on dashboard, re-render to show updated items
          const activeTab = document.querySelector('.nav-btn.active')?.getAttribute('data-tab');
          if (activeTab === 'dashboard') {
            renderDashboard();
          }
        }
      })
      .catch(err => console.error('Failed to sync on startup:', err));
  }
  syncFromServer();

  // --- 1. NAVIGATION & TABS ---
  function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabPages = document.querySelectorAll('.tab-page');

    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabTarget = btn.getAttribute('data-tab');

        navButtons.forEach(b => b.classList.remove('active'));
        tabPages.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetPage = document.getElementById(`page-${tabTarget}`);
        if (targetPage) targetPage.classList.add('active');

        // Refresh views on tab change
        if (tabTarget === 'dashboard') renderDashboard();
        if (tabTarget === 'analytics') renderAnalytics();
      });
    });
  }

  // --- 2. DYNAMIC TOGGLE & FORM FIELDS ---
  function initTypeSelector() {
    const dynamicToggle = document.getElementById('dynamicToggle');
    dynamicToggle.addEventListener('change', (e) => {
      isDynamic = e.target.checked;
      const previewTypeBadge = document.getElementById('previewTypeBadge');
      if (previewTypeBadge) {
        previewTypeBadge.textContent = isDynamic ? 'Dynamic Link' : 'Static QR';
      }
      updateLivePreview();
    });
  }

  function renderDynamicFormFields() {
    const container = document.getElementById('dynamicFields');
    const urlInputGroup = document.getElementById('urlInputGroup');
    if (!container) return;

    container.innerHTML = '';
    urlInputGroup.style.display = 'block';

    container.innerHTML = `
        <div style="background: linear-gradient(135deg, rgba(79,70,229,0.12), rgba(236,72,153,0.08)); border: 1px solid rgba(79,70,229,0.25); border-radius: 12px; padding: 12px 16px; margin-bottom: 14px; display:flex; align-items:center; gap:10px;">
          <span style="font-size:1.4rem;">📱</span>
          <div>
            <div style="font-weight:700; color:var(--text-primary); font-size:0.88rem;">Mobile Profile Card</div>
            <div style="color:var(--text-muted); font-size:0.8rem;">When scanned, shows a beautiful profile page with all these details + Add Contact button</div>
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input type="text" id="vName" class="form-control" placeholder="e.g. Alex Morgan" value="Alex Morgan">
          </div>
          <div class="form-group">
            <label class="form-label">Job Title</label>
            <input type="text" id="vTitle" class="form-control" placeholder="e.g. Product Manager" value="Product Manager">
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Profile Photo (Cloudinary)</label>
            <input type="file" id="vPhotoUpload" class="form-control" accept="image/*">
            <input type="hidden" id="vPhotoUrl" value="">
            <small id="uploadStatus" style="color: var(--text-muted); font-size: 0.75rem;">Select an image to upload</small>
          </div>
          <div class="form-group">
            <label class="form-label">Company / Organization</label>
            <input type="text" id="vOrg" class="form-control" placeholder="e.g. Acme Technologies" value="Acme Technologies">
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="tel" id="vPhone" class="form-control" placeholder="+1 (555) 234-5678" value="+1 (555) 234-5678">
          </div>
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" id="vEmail" class="form-control" placeholder="alex@acmetech.com" value="alex@acmetech.com">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Corporate Office Address</label>
          <input type="text" id="vAddr1" class="form-control" placeholder="e.g. Plot No. 123, Road 4, City" value="">
        </div>
        <div class="form-group">
          <label class="form-label">Factory Address (Optional)</label>
          <input type="text" id="vAddr2" class="form-control" placeholder="e.g. Plot No. 456, Road 9, City" value="">
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">WhatsApp Number</label>
            <input type="tel" id="vWhatsapp" class="form-control" placeholder="+91 9909143742" value="">
          </div>
          <div class="form-group">
            <label class="form-label">Facebook URL</label>
            <input type="url" id="vFacebook" class="form-control" placeholder="https://facebook.com/..." value="">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Catalog URL</label>
          <input type="url" id="vCatalog" class="form-control" placeholder="https://example.com/catalog.pdf" value="">
        </div>
      `;

    // Attach input listeners
    container.querySelectorAll('input:not([type="file"]), select, textarea').forEach(el => {
      el.addEventListener('input', updateLivePreview);
    });

    // Cloudinary Upload Logic
    const photoInput = document.getElementById('vPhotoUpload');
    const photoUrlInput = document.getElementById('vPhotoUrl');
    const uploadStatus = document.getElementById('uploadStatus');

    if (photoInput) {
      photoInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        uploadStatus.textContent = 'Uploading to Cloudinary...';
        uploadStatus.style.color = '#f59e0b'; // warning color

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'vcard_profiles');

        try {
          // Cloud name from user: nop0auzt
          const res = await fetch('https://api.cloudinary.com/v1_1/nop0auzt/image/upload', {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          if (data.secure_url) {
            photoUrlInput.value = data.secure_url;
            uploadStatus.textContent = 'Upload successful! ✓';
            uploadStatus.style.color = '#10b981'; // success color
            updateLivePreview();
          } else {
            uploadStatus.textContent = 'Upload failed.';
            uploadStatus.style.color = '#ef4444'; // error color
          }
        } catch (err) {
          console.error(err);
          uploadStatus.textContent = 'Error uploading image.';
          uploadStatus.style.color = '#ef4444';
        }
      });
    }
  }

  function initFormInputs() {
    document.getElementById('qrTitle').addEventListener('input', updateLivePreview);
    document.getElementById('destinationUrl').addEventListener('input', updateLivePreview);
  }

  // Calculate the raw payload text to encode in QR
  function getRawQRPayload(overrideShortCode) {
    let payload = '';

    const name  = document.getElementById('vName')?.value  || 'Contact Name';
    const org   = document.getElementById('vOrg')?.value   || '';
    const phone = document.getElementById('vPhone')?.value || '';
    const email = document.getElementById('vEmail')?.value || '';
    const title = document.getElementById('vTitle')?.value || '';
    const addr1 = document.getElementById('vAddr1')?.value || '';
    const addr2 = document.getElementById('vAddr2')?.value || '';
    const whatsapp = document.getElementById('vWhatsapp')?.value || '';
    const facebook = document.getElementById('vFacebook')?.value || '';
    const catalog = document.getElementById('vCatalog')?.value || '';
    const photo = document.getElementById('vPhotoUrl')?.value || '';

    let adrStr = '';
    if (addr1) adrStr += `\r\nitem1.ADR;TYPE=WORK:;;${addr1};;;;\r\nitem1.X-ABLabel:Address-1`;
    if (addr2) adrStr += `\r\nitem2.ADR;TYPE=HOME:;;${addr2};;;;\r\nitem2.X-ABLabel:Address-2`;

    let customUrls = '';
    if (whatsapp) {
      let waNum = whatsapp.replace(/[^0-9]/g, '');
      if (waNum.length === 10) waNum = '91' + waNum;
      customUrls += `\r\nitem3.URL:https://wa.me/${waNum}\r\nitem3.X-ABLabel:WhatsApp`;
    }
    if (facebook) customUrls += `\r\nURL;TYPE=Facebook:${facebook}`;
    if (catalog) customUrls += `\r\nURL;TYPE=Catalog:${catalog}`;
    if (photo) customUrls += `\r\nPHOTO;VALUE=URI:${photo}\r\nURL;TYPE=Photo:${photo}`;

    const nameParts = name.trim().split(/\s+/);
    let nProp = `;${name};;;`;
    if (nameParts.length > 1) {
      const lastName = nameParts.pop();
      const firstName = nameParts.join(' ');
      nProp = `${lastName};${firstName};;;`;
    }

    payload = `BEGIN:VCARD\r\nVERSION:3.0\r\nN:${nProp}\r\nFN:${name}\r\nORG:${org}\r\nTITLE:${title}\r\nTEL;TYPE=CELL:${phone}\r\nEMAIL:${email}${adrStr}${customUrls}\r\nEND:VCARD`;

    // For DYNAMIC QRs of ANY type: the QR matrix encodes the server short URL.
    // The raw payload (vCard string, destination URL, etc.) is stored in the DB.
    // overrideShortCode is passed after saving so the QR uses the real short code.
    if (isDynamic) {
      const code   = overrideShortCode || 'preview';
      const origin = window.location.origin;  // e.g. http://127.0.0.1:8000
      payload = `${origin}/q/${code}`;
    }

    return payload;
  }

  // --- 3. CUSTOMIZER CONTROLS & EVENT LISTENERS ---
  function initCustomizer() {
    // Customizer sub-tab navigation
    const custTabBtns = document.querySelectorAll('.cust-tab-btn');
    const custSections = document.querySelectorAll('.cust-section');

    custTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        custTabBtns.forEach(b => b.classList.remove('active'));
        custSections.forEach(s => s.classList.remove('active'));

        btn.classList.add('active');
        const secId = `cust-sec-${btn.getAttribute('data-sec')}`;
        document.getElementById(secId)?.classList.add('active');
      });
    });

    // Color Pickers
    const darkInput = document.getElementById('colorDark');
    darkInput.addEventListener('input', (e) => {
      qrOptions.colorDark = e.target.value;
      document.getElementById('colorDarkText').textContent = e.target.value;
      updateLivePreview();
    });

    const lightInput = document.getElementById('colorLight');
    lightInput.addEventListener('input', (e) => {
      qrOptions.colorLight = e.target.value;
      document.getElementById('colorLightText').textContent = e.target.value;
      updateLivePreview();
    });

    const gradToggle = document.getElementById('gradientToggle');
    const gradGroup = document.getElementById('gradientColorGroup');
    gradToggle.addEventListener('change', (e) => {
      qrOptions.gradient = e.target.checked;
      gradGroup.style.display = e.target.checked ? 'block' : 'none';
      updateLivePreview();
    });

    const gradInput = document.getElementById('gradientColor');
    gradInput.addEventListener('input', (e) => {
      qrOptions.gradientColor = e.target.value;
      document.getElementById('gradientColorText').textContent = e.target.value;
      updateLivePreview();
    });

    // Preset Options Cards (Body, Eye, Frame, Logo)
    document.querySelectorAll('.opt-card').forEach(card => {
      card.addEventListener('click', () => {
        const optKey = card.getAttribute('data-opt');
        const optVal = card.getAttribute('data-val');

        if (optKey && optVal) {
          // Deselect siblings
          card.parentElement.querySelectorAll(`.opt-card[data-opt="${optKey}"]`).forEach(c => c.classList.remove('active'));
          card.classList.add('active');

          if (optKey === 'logoIcon' && optVal === 'none') {
            qrOptions.logoIcon = null;
          } else {
            qrOptions[optKey] = optVal;
          }
          updateLivePreview();
        }
      });
    });

    // Logo Upload Input
    const logoUploadInput = document.getElementById('logoUploadInput');
    logoUploadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (evt) {
          customLogoDataUrl = evt.target.result;
          qrOptions.logoIcon = customLogoDataUrl;
          showToast('Custom logo loaded!', 'success');
          updateLivePreview();
        };
        reader.readAsDataURL(file);
      }
    });

    // Logo Text Input
    const logoTextInput = document.getElementById('logoTextInput');
    if (logoTextInput) {
      logoTextInput.addEventListener('input', (e) => {
        qrOptions.logoText = e.target.value;
        updateLivePreview();
      });
    }

    // Frame Customizer
    document.getElementById('frameText').addEventListener('input', (e) => {
      qrOptions.frameText = e.target.value || 'SCAN ME';
      updateLivePreview();
    });

    const frameColorInput = document.getElementById('frameColor');
    frameColorInput.addEventListener('input', (e) => {
      qrOptions.frameColor = e.target.value;
      document.getElementById('frameColorText').textContent = e.target.value;
      updateLivePreview();
    });

    // Download Buttons & Save Button
    document.getElementById('btnSaveQR').addEventListener('click', handleSaveQR);
    document.getElementById('btnDownloadPNG').addEventListener('click', handleDownloadPNG);
    document.getElementById('btnDownloadSVG').addEventListener('click', handleDownloadSVG);
  }

  // Render to canvas
  function updateLivePreview() {
    const canvas = document.getElementById('qrCanvas');
    if (!canvas) return;

    const payload = getRawQRPayload();
    window.QREngine.renderToCanvas(canvas, payload, qrOptions);
  }

  // Track whether the current QR session has been saved (to prevent duplicates)
  let savedShortCodeThisSession = null;

  // --- 4. SAVE & DOWNLOAD HANDLERS ---
  function handleSaveQR() {
    // PREVENT DUPLICATE SAVES: if already saved this session, just show the URL
    if (savedShortCodeThisSession) {
      const scanUrl = `${window.location.origin}/q/${savedShortCodeThisSession}`;
      showToast(`⚠️ Already saved! Permanent QR URL: ${scanUrl}`, 'info');
      return;
    }

    const title = document.getElementById('qrTitle').value.trim() || 'Untitled QR';
    const shortCode = window.QRStorage.generateShortCode();

    // Build the real destination to store in the DB:
    //   - For URL type: user's typed destination URL
    //   - For ALL other types (vcard, wifi, etc.): store the raw payload
    //     so the server can parse it (e.g. render vCard profile page on scan)
    let destinationUrl;
    if (currentType === 'url') {
      destinationUrl = document.getElementById('destinationUrl').value.trim() || 'https://example.com';
    } else {
      const wasDynamic = isDynamic;
      isDynamic = false;
      destinationUrl = getRawQRPayload();
      isDynamic = wasDynamic;
    }

    const newQr = {
      title:          title,
      type:           currentType,
      isDynamic:      isDynamic,
      shortCode:      shortCode,
      destinationUrl: destinationUrl,
      active:         true,
      options:        Object.assign({}, qrOptions)
    };

    window.QRStorage.saveQR(newQr);
    savedShortCodeThisSession = shortCode;

    // Re-render canvas with the real short code (so downloaded PNG is scannable)
    if (isDynamic) {
      const canvas  = document.getElementById('qrCanvas');
      const payload = getRawQRPayload(shortCode);
      window.QREngine.renderToCanvas(canvas, payload, qrOptions);
    }

    // Update the Save button to show the permanent link
    const saveBtn = document.getElementById('btnSaveQR');
    const scanUrl = `${window.location.origin}/q/${shortCode}`;
    saveBtn.innerHTML = `✅ Saved! <span style="font-size:0.78rem;opacity:0.8;">/q/${shortCode}</span>`;
    saveBtn.style.background = 'linear-gradient(135deg, #059669, #047857)';
    saveBtn.title = `Permanent scan URL: ${scanUrl}`;

    showToast(`✅ QR saved permanently! Short code: /q/${shortCode} — Download PNG now!`, 'success');
    renderDashboard();
  }

  // Reset save state when user changes type or any field (new QR = new session)
  function resetSaveSession() {
    savedShortCodeThisSession = null;
    const saveBtn = document.getElementById('btnSaveQR');
    if (saveBtn) {
      saveBtn.innerHTML = '💾 Save & Store QR Code';
      saveBtn.style.background = '';
    }
  }

  function handleDownloadPNG() {
    const canvas = document.getElementById('qrCanvas');
    const title = document.getElementById('qrTitle').value.trim() || 'qrcode';
    const link = document.createElement('a');
    link.download = `${title.toLowerCase().replace(/\s+/g, '_')}_qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('PNG Download started!', 'success');
  }

  function handleDownloadSVG() {
    const payload = getRawQRPayload();
    const title = document.getElementById('qrTitle').value.trim() || 'qrcode';
    const svgStr = window.QREngine.exportSVG(payload, qrOptions);

    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${title.toLowerCase().replace(/\s+/g, '_')}_qr.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    showToast('SVG Vector Download started!', 'success');
  }

  // --- 5. DASHBOARD & MANAGEMENT VIEW ---
  function initDashboard() {
    document.getElementById('dashSearch').addEventListener('input', renderDashboard);
    document.getElementById('dashTypeFilter').addEventListener('change', renderDashboard);
    document.getElementById('btnNewQR').addEventListener('click', () => {
      document.querySelector('.nav-btn[data-tab="generator"]').click();
    });

    // Modal buttons
    document.getElementById('btnCancelEdit').addEventListener('click', closeEditModal);
    document.getElementById('btnSaveEditUrl').addEventListener('click', saveEditUrlModal);
  }

  function renderDashboard() {
    const allQRs = window.QRStorage.getAllQRs();
    const allAnalytics = window.QRStorage.getAllAnalytics();

    // Metrics Update
    document.getElementById('metricTotalQRs').textContent = allQRs.length;
    document.getElementById('metricTotalScans').textContent = allAnalytics.length;
    document.getElementById('metricDynamicQRs').textContent = allQRs.filter(q => q.isDynamic && q.active).length;

    // Filter Logic
    const searchTerm = document.getElementById('dashSearch').value.toLowerCase();
    const typeFilter = document.getElementById('dashTypeFilter').value;

    const filtered = allQRs.filter(q => {
      const matchesSearch = q.title.toLowerCase().includes(searchTerm) ||
                            q.shortCode.toLowerCase().includes(searchTerm) ||
                            q.destinationUrl.toLowerCase().includes(searchTerm);
      const matchesType = typeFilter === 'all' || q.type === typeFilter;
      return matchesSearch && matchesType;
    });

    const grid = document.getElementById('qrGridContainer');
    grid.innerHTML = '';

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
          <p>No QR codes found matching your query.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(qr => {
      const scansCount = allAnalytics.filter(a => a.qrId === qr.id).length;

      const card = document.createElement('div');
      card.className = 'qr-item-card';

      card.innerHTML = `
        <div class="qr-item-header">
          <div style="display: flex; align-items: center; gap: 0.5rem; overflow: hidden;">
            <span class="qr-item-title">${escapeHtml(qr.title)}</span>
            <span class="qr-type-tag">${qr.type}</span>
          </div>
          <label class="switch" style="width: 42px; height: 22px;">
            <input type="checkbox" ${qr.active ? 'checked' : ''} data-id="${qr.id}" class="active-toggle-chk">
            <span class="slider"></span>
          </label>
        </div>

        <div class="qr-item-body">
          <div class="qr-thumbnail" id="thumb-${qr.id}">
            <canvas width="72" height="72"></canvas>
          </div>
          <div class="qr-item-details">
            ${qr.isDynamic ? `<span class="short-code-badge" data-code="${qr.shortCode}">/q/${qr.shortCode}</span>` : '<span class="brand-badge" style="background: rgba(255,255,255,0.06); color: var(--text-dim);">Static QR</span>'}
            <span class="qr-url-text" title="${escapeHtml(qr.destinationUrl)}">${escapeHtml(qr.destinationUrl)}</span>
            <span class="scan-count-badge">📊 ${scansCount} Scans</span>
          </div>
        </div>

        <div class="qr-item-footer">
          ${qr.isDynamic ? `<button class="btn btn-secondary btn-sm btn-edit-url" data-id="${qr.id}" data-url="${escapeHtml(qr.destinationUrl)}">✏️ Edit Destination</button>` : '<span></span>'}
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-secondary btn-sm btn-download-dash" data-id="${qr.id}" style="background: var(--primary); color: white; border: none;">⬇️ Download</button>
            <button class="btn btn-secondary btn-sm btn-test-link" data-code="${qr.shortCode}">🔗 Test</button>
            <button class="btn btn-danger btn-sm btn-delete-qr" data-id="${qr.id}">🗑️</button>
          </div>
        </div>
      `;

      grid.appendChild(card);

      // Render thumbnail on card canvas using correct scannable URL
      setTimeout(() => {
        const thumbCanvas = card.querySelector(`#thumb-${qr.id} canvas`);
        if (thumbCanvas) {
          // For dynamic QRs: encode the real server short URL (same as what was printed)
          const payload = qr.isDynamic
            ? `${window.location.origin}/q/${qr.shortCode}`
            : qr.destinationUrl;
          window.QREngine.renderToCanvas(thumbCanvas, payload, Object.assign({}, qr.options, { size: 120, frameStyle: 'none' }));
        }
      }, 10);
    });

    // Attach card event listeners
    grid.querySelectorAll('.active-toggle-chk').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        const state = window.QRStorage.toggleActiveState(id);
        showToast(`QR Code is now ${state ? 'Active' : 'Disabled'}`, 'info');
      });
    });

    grid.querySelectorAll('.btn-edit-url').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const url = btn.getAttribute('data-url');
        openEditModal(id, url);
      });
    });

    grid.querySelectorAll('.btn-test-link').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-code');
        document.querySelector('.nav-btn[data-tab="simulator"]').click();
        document.getElementById('simShortCode').value = code;
        document.getElementById('btnSimulateScan').click();
      });
    });

    // Dashboard delete buttons
    grid.querySelectorAll('.btn-delete-qr').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this QR code and its scan analytics?')) {
          window.QRStorage.deleteQR(id);
          showToast('QR Code deleted.', 'info');
          renderDashboard();
        }
      });
    });

    // Dashboard download buttons
    grid.querySelectorAll('.btn-download-dash').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const qr = window.QRStorage.getAllQRs().find(q => q.id === id);
        if (!qr) return;

        showToast('Generating high-res QR code for printing...', 'info');
        const payload = qr.isDynamic ? `${window.location.origin}/q/${qr.shortCode}` : qr.destinationUrl;
        const tempCanvas = document.createElement('canvas');
        
        window.QREngine.renderToCanvas(tempCanvas, payload, Object.assign({ size: 1000 }, qr.options));
        
        setTimeout(() => {
          const link = document.createElement('a');
          link.download = `${qr.shortCode}_qr_print.png`;
          link.href = tempCanvas.toDataURL('image/png');
          link.click();
          showToast('Download started!', 'success');
        }, 150);
      });
    });
  }

  function formatWhatsappDisplay(val) {
    if (!val) return '';
    let raw = val.replace('https://wa.me/', '').trim();
    let digits = raw.replace(/\D/g, '');
    if (digits.length === 10) {
      return '+91 ' + digits;
    }
    if (digits.length === 12 && digits.startsWith('91')) {
      return '+91 ' + digits.substring(2);
    }
    return raw;
  }

  // Modal Handlers — Smart edit that handles both URL and vCard types
  function openEditModal(id, currentPayload) {
    document.getElementById('editQrId').value = id;
    const qr = window.QRStorage.getAllQRs().find(q => q.id === id);
    const modal = document.getElementById('editUrlModal');

    // Detect vCard
    if (qr && qr.type === 'vcard') {
      // Parse current vCard fields
      const fn    = (currentPayload.match(/FN:(.*)/i)    || [])[1]?.trim() || '';
      const title = (currentPayload.match(/TITLE:(.*)/i)  || [])[1]?.trim() || '';
      const org   = (currentPayload.match(/ORG:(.*)/i)    || [])[1]?.trim() || '';
      const phone = (currentPayload.match(/TEL[^:]*:(.*)/i) || [])[1]?.trim() || '';
      const email = (currentPayload.match(/EMAIL[^:]*:(.*)/i) || [])[1]?.trim() || '';
      const photo = (currentPayload.match(/PHOTO;VALUE=URI:(.*)/i) || [])[1]?.trim() || '';
      
      const addr1 = (currentPayload.match(/ADR;TYPE=WORK:;;(.*);;;;/i) || [])[1]?.trim() || '';
      const addr2 = (currentPayload.match(/ADR;TYPE=HOME:;;(.*);;;;/i) || [])[1]?.trim() || '';
      const wa    = (currentPayload.match(/URL;TYPE=WhatsApp:(.*)/i) || [])[1]?.trim() || '';
      const fb    = (currentPayload.match(/URL;TYPE=Facebook:(.*)/i) || [])[1]?.trim() || '';
      const cat   = (currentPayload.match(/URL;TYPE=Catalog:(.*)/i) || [])[1]?.trim() || '';

      document.getElementById('editModalBody').innerHTML = `
        <div style="background:linear-gradient(135deg,rgba(79,70,229,.12),rgba(236,72,153,.08));border:1px solid rgba(79,70,229,.25);border-radius:12px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:10px;">
          <span style="font-size:1.3rem;">📱</span>
          <div>
            <div style="font-weight:700;color:var(--text-primary);font-size:.88rem;">Edit vCard Profile</div>
            <div style="color:var(--text-muted);font-size:.78rem;">The QR code URL stays the same — only the profile data updates instantly</div>
          </div>
        </div>
        <div class="form-group" style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <label class="form-label">Profile Photo (Cloudinary)</label>
          <input type="file" id="ef_photoUpload" class="form-control" accept="image/*">
          <input type="hidden" id="ef_photoUrl" value="${escapeHtml(photo)}">
          <small id="ef_uploadStatus" style="color: var(--text-muted); font-size: 0.75rem;">
            ${photo ? 'Current photo saved. Select a new one to replace.' : 'Select an image to upload'}
          </small>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input id="ef_name" class="form-control" value="${escapeHtml(fn)}">
          </div>
          <div class="form-group">
            <label class="form-label">Job Title</label>
            <input id="ef_title" class="form-control" value="${escapeHtml(title)}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Company / Organization</label>
          <input id="ef_org" class="form-control" value="${escapeHtml(org)}">
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input id="ef_phone" class="form-control" value="${escapeHtml(phone)}">
          </div>
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input id="ef_email" class="form-control" value="${escapeHtml(email)}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Corporate Office Address</label>
          <input id="ef_addr1" class="form-control" value="${escapeHtml(addr1)}">
        </div>
        <div class="form-group">
          <label class="form-label">Factory Address</label>
          <input id="ef_addr2" class="form-control" value="${escapeHtml(addr2)}">
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">WhatsApp Number</label>
            <input id="ef_wa" class="form-control" value="${escapeHtml(formatWhatsappDisplay(wa))}">
          </div>
          <div class="form-group">
            <label class="form-label">Facebook URL</label>
            <input id="ef_fb" class="form-control" value="${escapeHtml(fb)}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Catalog URL</label>
          <input id="ef_cat" class="form-control" value="${escapeHtml(cat)}">
        </div>
      `;
      document.getElementById('editModalTitle').textContent = '✏️ Edit vCard Profile';

      // Attach upload listener for modal
      const photoInput = document.getElementById('ef_photoUpload');
      const photoUrlInput = document.getElementById('ef_photoUrl');
      const uploadStatus = document.getElementById('ef_uploadStatus');

      if (photoInput) {
        photoInput.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          uploadStatus.textContent = 'Uploading to Cloudinary...';
          uploadStatus.style.color = '#f59e0b'; // warning color

          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', 'vcard_profiles');

          try {
            // Cloud name from user: nop0auzt
            const res = await fetch('https://api.cloudinary.com/v1_1/nop0auzt/image/upload', {
              method: 'POST',
              body: formData
            });
            const data = await res.json();
            if (data.secure_url) {
              photoUrlInput.value = data.secure_url;
              uploadStatus.textContent = 'Upload successful! ✓';
              uploadStatus.style.color = '#10b981'; // success color
            } else {
              uploadStatus.textContent = 'Upload failed.';
              uploadStatus.style.color = '#ef4444'; // error color
            }
          } catch (err) {
            console.error(err);
            uploadStatus.textContent = 'Error uploading image.';
            uploadStatus.style.color = '#ef4444';
          }
        });
      }
    } else {
      // URL / other type
      document.getElementById('editModalBody').innerHTML = `
        <div class="form-group">
          <label class="form-label">New Destination URL</label>
          <input id="editDestinationUrl" type="url" class="form-control" value="${escapeHtml(currentPayload)}" placeholder="https://new-destination.com">
        </div>
        <p style="color:var(--text-dim);font-size:0.8rem;margin-top:6px;">The printed QR code URL (/q/${qr?.shortCode}) never changes — only the redirect target updates.</p>
      `;
      document.getElementById('editModalTitle').textContent = '✏️ Edit Destination URL';
    }

    modal.classList.add('active');
  }

  function closeEditModal() {
    document.getElementById('editUrlModal').classList.remove('active');
  }

  function saveEditUrlModal() {
    const id = document.getElementById('editQrId').value;
    const qr = window.QRStorage.getAllQRs().find(q => q.id === id);

    let newPayload;
    if (qr && qr.type === 'vcard') {
      const fn    = document.getElementById('ef_name')?.value.trim()  || 'Contact';
      const title = document.getElementById('ef_title')?.value.trim() || '';
      const org   = document.getElementById('ef_org')?.value.trim()   || '';
      const phone = document.getElementById('ef_phone')?.value.trim() || '';
      const email = document.getElementById('ef_email')?.value.trim() || '';
      const addr1 = document.getElementById('ef_addr1')?.value.trim() || '';
      const addr2 = document.getElementById('ef_addr2')?.value.trim() || '';
      const wa    = document.getElementById('ef_wa')?.value.trim() || '';
      const fb    = document.getElementById('ef_fb')?.value.trim() || '';
      const cat   = document.getElementById('ef_cat')?.value.trim() || '';
      const photo = document.getElementById('ef_photoUrl')?.value.trim() || '';

      let adrStr = '';
      if (addr1) adrStr += `\r\nitem1.ADR;TYPE=WORK:;;${addr1};;;;\r\nitem1.X-ABLabel:Address-1`;
      if (addr2) adrStr += `\r\nitem2.ADR;TYPE=HOME:;;${addr2};;;;\r\nitem2.X-ABLabel:Address-2`;

      let customUrls = '';
      if (wa) customUrls += `\r\nitem3.URL:https://wa.me/${wa.replace(/[^0-9]/g, '')}\r\nitem3.X-ABLabel:WhatsApp`;
      if (fb) customUrls += `\r\nURL;TYPE=Facebook:${fb}`;
      if (cat) customUrls += `\r\nURL;TYPE=Catalog:${cat}`;
      if (photo) customUrls += `\r\nPHOTO;VALUE=URI:${photo}\r\nURL;TYPE=Photo:${photo}`;

      const fnParts = fn.trim().split(/\s+/);
      let nProp = `;${fn};;;`;
      if (fnParts.length > 1) {
        const lastName = fnParts.pop();
        const firstName = fnParts.join(' ');
        nProp = `${lastName};${firstName};;;`;
      }

      newPayload = `BEGIN:VCARD\r\nVERSION:3.0\r\nN:${nProp}\r\nFN:${fn}\r\nORG:${org}\r\nTITLE:${title}\r\nTEL;TYPE=CELL:${phone}\r\nEMAIL:${email}${adrStr}${customUrls}\r\nEND:VCARD`;
    } else {
      newPayload = document.getElementById('editDestinationUrl')?.value.trim();
      if (!newPayload) return alert('Please enter a destination URL');
    }

    const ok = window.QRStorage.updateDestinationUrl(id, newPayload);
    if (ok) {
      showToast('✅ Profile updated! The printed QR still works perfectly.', 'success');
      closeEditModal();
      renderDashboard();
    }
  }

  // --- 6. ANALYTICS VIEW & CHARTS ---
  function initAnalytics() {
    // Initialized on tab click
  }

  let currentAuditPage = 1;
  const AUDIT_PAGE_SIZE = 20;

  function renderAnalytics() {
    const rawAnalytics = window.QRStorage.getAllAnalytics();
    const qrs = window.QRStorage.getAllQRs();

    // Sort descending by timestamp (newest scans first)
    const sortedAnalytics = rawAnalytics.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // 1. Audit Trail Table with Pagination (20 items per page)
    renderAuditTrailTable(sortedAnalytics, qrs);

    // 2. Chart.js Visualizations
    renderCharts(sortedAnalytics);
  }

  function renderAuditTrailTable(analytics, qrs) {
    const tbody = document.getElementById('scanAuditTableBody');
    const pageInfo = document.getElementById('auditPageInfo');
    const pageControls = document.getElementById('auditPageControls');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (analytics.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="padding: 2rem; text-align: center; color: var(--text-dim);">No scan activity recorded yet.</td></tr>';
      if (pageInfo) pageInfo.textContent = 'Showing 0 records';
      if (pageControls) pageControls.innerHTML = '';
      return;
    }

    const totalRecords = analytics.length;
    const totalPages = Math.ceil(totalRecords / AUDIT_PAGE_SIZE);
    if (currentAuditPage > totalPages) currentAuditPage = totalPages;
    if (currentAuditPage < 1) currentAuditPage = 1;

    const startIndex = (currentAuditPage - 1) * AUDIT_PAGE_SIZE;
    const endIndex = Math.min(startIndex + AUDIT_PAGE_SIZE, totalRecords);

    const pageLogs = analytics.slice(startIndex, endIndex);

    pageLogs.forEach(log => {
      const qr = qrs.find(q => q.id === log.qrId);
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--border-color)';
      tr.innerHTML = `
        <td style="padding: 0.75rem 1rem; color: var(--text-muted);">${new Date(log.timestamp).toLocaleString()}</td>
        <td style="padding: 0.75rem 1rem; font-family: monospace; color: var(--accent-cyan);">/q/${log.shortCode} (${qr ? escapeHtml(qr.title) : 'Deleted'})</td>
        <td style="padding: 0.75rem 1rem;">${log.device}</td>
        <td style="padding: 0.75rem 1rem;">${log.browser}</td>
        <td style="padding: 0.75rem 1rem; font-family: monospace; color: var(--text-dim);">${log.ip}</td>
      `;
      tbody.appendChild(tr);
    });

    if (pageInfo) {
      pageInfo.textContent = `Showing ${startIndex + 1}-${endIndex} of ${totalRecords} (Page ${currentAuditPage} of ${totalPages})`;
    }

    if (pageControls) {
      pageControls.innerHTML = '';

      // Previous Button
      const prevBtn = document.createElement('button');
      prevBtn.className = 'btn btn-secondary btn-sm';
      prevBtn.textContent = '◀ Prev';
      prevBtn.disabled = currentAuditPage === 1;
      prevBtn.style.opacity = currentAuditPage === 1 ? '0.4' : '1';
      prevBtn.onclick = () => {
        if (currentAuditPage > 1) {
          currentAuditPage--;
          renderAuditTrailTable(analytics, qrs);
        }
      };
      pageControls.appendChild(prevBtn);

      // Page Number Buttons
      for (let p = 1; p <= totalPages; p++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = p === currentAuditPage ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm';
        pageBtn.style.minWidth = '32px';
        pageBtn.textContent = p;
        pageBtn.onclick = () => {
          currentAuditPage = p;
          renderAuditTrailTable(analytics, qrs);
        };
        pageControls.appendChild(pageBtn);
      }

      // Next Button
      const nextBtn = document.createElement('button');
      nextBtn.className = 'btn btn-secondary btn-sm';
      nextBtn.textContent = 'Next ▶';
      nextBtn.disabled = currentAuditPage === totalPages;
      nextBtn.style.opacity = currentAuditPage === totalPages ? '0.4' : '1';
      nextBtn.onclick = () => {
        if (currentAuditPage < totalPages) {
          currentAuditPage++;
          renderAuditTrailTable(analytics, qrs);
        }
      };
      pageControls.appendChild(nextBtn);
    }
  }

  function renderCharts(analytics) {
    if (typeof Chart === 'undefined') return;

    // Devices count
    const deviceCounts = {};
    const browserCounts = {};

    analytics.forEach(log => {
      deviceCounts[log.device] = (deviceCounts[log.device] || 0) + 1;
      browserCounts[log.browser] = (browserCounts[log.browser] || 0) + 1;
    });

    // 1. Trend Chart
    const ctxTrend = document.getElementById('scanTrendsChart');
    if (ctxTrend) {
      if (trendChartInstance) trendChartInstance.destroy();

      // Days grouped
      const daysMap = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        daysMap[key] = 0;
      }

      analytics.forEach(log => {
        const key = new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (daysMap[key] !== undefined) daysMap[key]++;
      });

      trendChartInstance = new Chart(ctxTrend, {
        type: 'line',
        data: {
          labels: Object.keys(daysMap),
          datasets: [{
            label: 'Daily QR Scans',
            data: Object.values(daysMap),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            borderWidth: 3,
            fill: true,
            tension: 0.35
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
            x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
          }
        }
      });
    }

    // 2. Device Donut Chart
    const ctxDevice = document.getElementById('deviceChart');
    if (ctxDevice) {
      if (deviceChartInstance) deviceChartInstance.destroy();
      deviceChartInstance = new Chart(ctxDevice, {
        type: 'doughnut',
        data: {
          labels: Object.keys(deviceCounts),
          datasets: [{
            data: Object.values(deviceCounts),
            backgroundColor: ['#6366f1', '#ec4899', '#06b6d4', '#10b981']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } }
        }
      });
    }

    // 3. Browser Bar Chart
    const ctxBrowser = document.getElementById('browserChart');
    if (ctxBrowser) {
      if (browserChartInstance) browserChartInstance.destroy();
      browserChartInstance = new Chart(ctxBrowser, {
        type: 'bar',
        data: {
          labels: Object.keys(browserCounts),
          datasets: [{
            label: 'Scans',
            data: Object.values(browserCounts),
            backgroundColor: '#06b6d4',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
            x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
          }
        }
      });
    }
  }

  // --- 7. REDIRECT SIMULATOR ---
  function initSimulator() {
    document.getElementById('btnSimulateScan').addEventListener('click', () => {
      const code = document.getElementById('simShortCode').value.trim();
      if (!code) return alert('Enter a short code');

      const result = window.QRStorage.recordScan(code);
      const resBox = document.getElementById('simResultBox');
      resBox.style.display = 'block';

      if (!result) {
        resBox.innerHTML = `
          <div style="color: var(--accent-rose);">
            <h3>❌ Short Code Not Found</h3>
            <p>No active QR code with short code "<strong>${escapeHtml(code)}</strong>" exists in database.</p>
          </div>
        `;
        return;
      }

      const { qr, logEntry } = result;

      if (!qr.active) {
        resBox.innerHTML = `
          <div style="color: var(--accent-amber);">
            <h3>⚠️ Link Inactive / Expired</h3>
            <p>The owner of QR code "<strong>${escapeHtml(qr.title)}</strong>" has paused this dynamic link.</p>
          </div>
        `;
        return;
      }

      let redirectActionHtml = '';
      if (qr.type === 'vcard' || qr.destinationUrl.includes('BEGIN:VCARD')) {
        // Parse vcard details
        let fn = qr.title || 'User Profile';
        let org = '';
        let phone = '';
        let email = '';
        
        const fnMatch = qr.destinationUrl.match(/FN:(.*)/i);
        if (fnMatch) fn = fnMatch[1].trim();
        const orgMatch = qr.destinationUrl.match(/ORG:(.*)/i);
        if (orgMatch) org = orgMatch[1].trim();
        const phoneMatch = qr.destinationUrl.match(/TEL[^:]*:(.*)/i);
        if (phoneMatch) phone = phoneMatch[1].trim();
        const emailMatch = qr.destinationUrl.match(/EMAIL[^:]*:(.*)/i);
        if (emailMatch) email = emailMatch[1].trim();

        const initials = fn.split(' ').map(p => p[0]).join('').substring(0,2).toUpperCase() || 'U';

        redirectActionHtml = `
          <div style="background: rgba(18, 24, 39, 0.95); border: 1px solid var(--primary); border-radius: 20px; padding: 1.5rem; text-align: center; margin-top: 1rem;">
            <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem auto; font-size: 1.5rem; font-weight: 800; color: #fff;">${initials}</div>
            <h4 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 0.2rem;">${escapeHtml(fn)}</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">${escapeHtml(org)}</p>
            
            <div style="display: flex; flex-direction: column; gap: 0.5rem; text-align: left; font-size: 0.85rem; margin-bottom: 1.25rem;">
              ${phone ? `<div style="background: rgba(255,255,255,0.05); padding: 0.6rem 0.85rem; border-radius: 8px;">📞 <strong>Phone:</strong> ${escapeHtml(phone)}</div>` : ''}
              ${email ? `<div style="background: rgba(255,255,255,0.05); padding: 0.6rem 0.85rem; border-radius: 8px;">✉️ <strong>Email:</strong> ${escapeHtml(email)}</div>` : ''}
            </div>

            <a href="/q/${qr.shortCode}" target="_blank" class="btn btn-primary" style="width: 100%;">
              📱 Open Full Mobile Profile Card Page
            </a>
          </div>
        `;
      } else {
        redirectActionHtml = `
          <a href="${escapeHtml(qr.destinationUrl)}" target="_blank" class="btn btn-primary" style="width: 100%;">
            🌐 Open Destination URL Now
          </a>
        `;
      }

      resBox.innerHTML = `
        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <h3 style="color: var(--accent-green);">✅ Scan Recorded &amp; Profile Loaded</h3>
            <span class="brand-badge">HTTP 200 OK</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
            <div><strong>QR Title:</strong> ${escapeHtml(qr.title)}</div>
            <div><strong>Type:</strong> ${qr.type.toUpperCase()}</div>
            <div><strong>Recorded Device:</strong> ${logEntry.device}</div>
            <div><strong>Browser:</strong> ${logEntry.browser}</div>
          </div>

          ${redirectActionHtml}
        </div>
      `;

      showToast(`Scan logged for /q/${code}`, 'success');
    });
  }

  // --- 8. SETTINGS & BACKUP ---
  function initSettings() {
    document.getElementById('btnExportJSON').addEventListener('click', () => {
      const jsonStr = window.QRStorage.exportBackupJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `qr_track_backup_${new Date().toISOString().slice(0, 10)}.json`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      showToast('Database exported as JSON file!', 'success');
    });

    const importInput = document.getElementById('importJSONInput');
    document.getElementById('btnImportJSON').addEventListener('click', () => {
      importInput.click();
    });

    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (evt) {
          const ok = window.QRStorage.importBackupJSON(evt.target.result);
          if (ok) {
            showToast('Backup restored successfully!', 'success');
            renderDashboard();
          } else {
            showToast('Invalid JSON file format', 'error');
          }
        };
        reader.readAsText(file);
      }
    });

    document.getElementById('btnResetSeed').addEventListener('click', () => {
      if (confirm('Clear all custom data and restore default seed QR codes?')) {
        localStorage.clear();
        window.QRStorage.init();
        showToast('Seed data restored!', 'info');
        renderDashboard();
      }
    });
  }

  // --- UTILS ---
  function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.borderColor = type === 'success' ? 'var(--accent-green)' : (type === 'error' ? 'var(--accent-rose)' : 'var(--primary)');

    toast.innerHTML = `
      <span>${type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️')}</span>
      <span>${escapeHtml(msg)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
});
