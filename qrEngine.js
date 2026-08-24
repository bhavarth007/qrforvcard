/**
 * QR Track - QR Rendering Engine
 * Uses the industry-standard `qrcode-generator` library for correct ISO/IEC 18004
 * QR matrix generation with full Reed-Solomon error correction.
 * Custom canvas renderer applies dot shapes, eye styles, gradients, logos, and frames on top.
 */

window.QREngine = {

  ICONS: {
    web:  `<path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm6.93 6h-3.41a15.4 15.4 0 00-1.38-4.07A8.03 8.03 0 0118.93 8zM12 4.07c.83 1.2 1.5 2.58 1.95 3.93h-3.9A13.8 13.8 0 0112 4.07zM4.07 14h3.41c.32 1.45.8 2.84 1.38 4.07A8.03 8.03 0 014.07 14zm3.41-2H4.07a8.03 8.03 0 010-4h3.41c-.13 1.3-.13 2.7 0 4zm1.38-6A15.4 15.4 0 007.48 8h3.41c.45-1.35 1.12-2.73 1.95-3.93zM12 19.93c-.83-1.2-1.5-2.58-1.95-3.93h3.9c-.45 1.35-1.12 2.73-1.95 3.93zm2.52-5.93h-5.04c-.14-1.3-.14-2.7 0-4h5.04c.14 1.3.14 2.7 0 4zm.63 5.93c.58-1.23 1.06-2.62 1.38-4.07h3.41a8.03 8.03 0 01-4.79 4.07zM16.52 12c.13-1.3.13-2.7 0-4h3.41a8.03 8.03 0 010 4h-3.41z"/>`,
    wifi: `<path d="M12 3C7.03 3 2.6 5.02-.57 8.28l2.12 2.12C4.1 7.85 7.8 6.2 12 6.2s7.9 1.65 10.45 4.2l2.12-2.12C21.4 5.02 16.97 3 12 3zm0 6c-3.31 0-6.27 1.35-8.38 3.53l2.12 2.12C7.3 13.1 9.5 12 12 12s4.7 1.1 6.26 2.65l2.12-2.12C18.27 10.35 15.31 9 12 9zm0 6c-1.66 0-3.14.68-4.2 1.77L12 21l4.2-4.23A5.95 5.95 0 0012 15z"/>`,
    phone:`<path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C9.61 21 3 14.39 3 6c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>`,
    mail: `<path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>`,
    star: `<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>`,
    user: `<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>`
  },

  /**
   * Build the QR matrix using qrcode-generator with proper error correction.
   * Returns an object with .isDark(row, col) and .getModuleCount().
   */
  _buildMatrix(text, withLogo) {
    // Error Correction: 'H' (30%) when logo present, 'Q' (25%) otherwise
    const eccLevel = withLogo ? 'H' : 'Q';

    // Use auto type-number (0) so the library picks the smallest version that fits
    const qr = qrcode(0, eccLevel);
    qr.addData(text, 'Byte');
    qr.make();
    return qr;
  },

  /**
   * Render a fully styled QR code onto an HTML5 Canvas element.
   */
  renderToCanvas(canvas, text, options) {
    options = Object.assign({
      size: 400,
      colorDark: '#4f46e5',
      colorLight: '#ffffff',
      gradient: false,
      gradientColor: '#ec4899',
      bodyStyle: 'rounded',   // square | rounded | extra_rounded | classy
      eyeStyle: 'square',     // square | rounded | circle
      eyeBallStyle: 'square', // square | circle
      logoIcon: null,
      frameStyle: 'none',     // none | scan_me | wifi | simple
      frameText: 'SCAN ME',
      frameColor: '#4f46e5'
    }, options);

    let qr;
    try {
      const hasOverlay = !!((options.logoIcon && options.logoIcon !== 'none') || (options.logoText && options.logoText.trim() !== ''));
      qr = this._buildMatrix(text, hasOverlay);
    } catch (e) {
      console.error('QR generation failed:', e);
      return;
    }

    const moduleCount = qr.getModuleCount();
    const ctx = canvas.getContext('2d');

    // Frame padding
    let topPad = 0, botPad = 0;
    if (options.frameStyle === 'scan_me')  { topPad = 20; botPad = 60; }
    if (options.frameStyle === 'wifi')     { topPad = 60; botPad = 20; }
    if (options.frameStyle === 'simple')   { topPad = 30; botPad = 40; }
    if (options.frameStyle === 'gold_card' || options.frameStyle === 'card') { topPad = 20; botPad = 90; }

    const W = options.size;
    const H = options.size + topPad + botPad;
    canvas.width  = W;
    canvas.height = H;

    // --- Background & Frame ---
    let margin   = 24;
    let qrAreaX  = margin;
    let qrAreaY  = margin + topPad;
    let qrArea   = W - margin * 2;

    if (options.frameStyle === 'gold_card' || options.frameStyle === 'card') {
      // Dark background fill
      ctx.fillStyle = '#0f1115';
      ctx.fillRect(0, 0, W, H);

      const cardMargin = Math.round(W * 0.04);
      const cardW = W - cardMargin * 2;
      const cardH = cardW;
      const cardX = cardMargin;
      const cardY = cardMargin;
      const cardRadius = Math.round(W * 0.05);

      // White inner card box
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
      ctx.fill();

      // Gold border
      const goldColor = options.frameColor || '#d4af37';
      ctx.strokeStyle = goldColor;
      ctx.lineWidth = Math.max(2, Math.round(W * 0.005));
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
      ctx.stroke();

      // Bottom Name Label
      const nameText = (options.frameText || 'GHANSHYAM DOBARIYA').toUpperCase();
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(W * 0.052)}px "Outfit", "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const textY = cardY + cardH + (H - (cardY + cardH)) * 0.42;
      ctx.fillText(nameText, W / 2, textY);

      // Gold Underline
      ctx.strokeStyle = goldColor;
      ctx.lineWidth = Math.max(2, Math.round(W * 0.004));
      const textWidth = ctx.measureText(nameText).width;
      const lineW = Math.max(textWidth * 0.85, Math.round(W * 0.35));
      const lineY = textY + Math.round(W * 0.042);
      ctx.beginPath();
      ctx.moveTo((W - lineW) / 2, lineY);
      ctx.lineTo((W + lineW) / 2, lineY);
      ctx.stroke();

      const qrPad = Math.round(cardW * 0.05);
      qrAreaX = cardX + qrPad;
      qrAreaY = cardY + qrPad;
      qrArea  = cardW - qrPad * 2;
    } else {
      ctx.fillStyle = options.colorLight;
      ctx.fillRect(0, 0, W, H);

      if (options.frameStyle !== 'none') {
        ctx.fillStyle = options.frameColor;
        if (options.frameStyle === 'scan_me') {
          ctx.beginPath(); ctx.roundRect(10, 10, W - 20, H - 20, 16); ctx.fill();
          ctx.fillStyle = options.colorLight;
          ctx.beginPath(); ctx.roundRect(20, 20, W - 40, options.size - 20, 12); ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 18px "Outfit", sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(options.frameText.toUpperCase(), W / 2, H - 30);
        } else if (options.frameStyle === 'wifi') {
          ctx.beginPath(); ctx.roundRect(10, 10, W - 20, H - 20, 16); ctx.fill();
          ctx.fillStyle = options.colorLight;
          ctx.beginPath(); ctx.roundRect(20, 60, W - 40, options.size - 20, 12); ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 18px "Outfit", sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(options.frameText.toUpperCase(), W / 2, 35);
        } else if (options.frameStyle === 'simple') {
          ctx.strokeStyle = options.frameColor; ctx.lineWidth = 6;
          ctx.beginPath(); ctx.roundRect(10, 10, W - 20, H - 20, 16); ctx.stroke();
          ctx.fillStyle = options.frameColor;
          ctx.font = 'bold 16px "Outfit", sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(options.frameText.toUpperCase(), W / 2, H - 25);
        }
      }
    }

    // --- QR Drawing Area (4-module quiet zone) ---
    const cellSize = qrArea / moduleCount;

    // Gradient or solid fill
    let fillStyle = options.colorDark;
    if (options.gradient) {
      const g = ctx.createLinearGradient(qrAreaX, qrAreaY, qrAreaX + qrArea, qrAreaY + qrArea);
      g.addColorStop(0, options.colorDark);
      g.addColorStop(1, options.gradientColor);
      fillStyle = g;
    }

    // Helper — is this cell inside one of the three 7×7 finder patterns?
    function isFinder(r, c) {
      return (r < 7 && c < 7) ||
             (r < 7 && c >= moduleCount - 7) ||
             (r >= moduleCount - 7 && c < 7);
    }

    // --- Draw Data Modules ---
    ctx.fillStyle = fillStyle;
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (isFinder(r, c)) continue;
        if (!qr.isDark(r, c)) continue;

        const x = qrAreaX + c * cellSize;
        const y = qrAreaY + r * cellSize;
        ctx.beginPath();
        if (options.bodyStyle === 'rounded') {
          ctx.roundRect(x + 0.3, y + 0.3, cellSize - 0.6, cellSize - 0.6, cellSize * 0.35);
        } else if (options.bodyStyle === 'extra_rounded') {
          ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.45, 0, Math.PI * 2);
        } else if (options.bodyStyle === 'classy') {
          ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.38, 0, Math.PI * 2);
        } else {
          ctx.rect(x, y, cellSize, cellSize);
        }
        ctx.fill();
      }
    }

    // --- Draw 3 Finder Pattern Eyes ---
    const eyes = [
      { r: 0, c: 0 },
      { r: 0, c: moduleCount - 7 },
      { r: moduleCount - 7, c: 0 }
    ];

    eyes.forEach(eye => {
      const ex   = qrAreaX + eye.c * cellSize;
      const ey   = qrAreaY + eye.r * cellSize;
      const eS   = cellSize * 7;   // 7×7 outer
      const iGap = cellSize;        // 1-module gap
      const iS   = cellSize * 5;   // 5×5 inner hole
      const bGap = cellSize * 2;   // 2-module ball offset
      const bS   = cellSize * 3;   // 3×3 ball

      // Outer frame
      ctx.fillStyle = fillStyle;
      ctx.beginPath();
      if (options.eyeStyle === 'circle') {
        ctx.arc(ex + eS / 2, ey + eS / 2, eS / 2, 0, Math.PI * 2);
      } else if (options.eyeStyle === 'rounded') {
        ctx.roundRect(ex, ey, eS, eS, eS * 0.22);
      } else {
        ctx.rect(ex, ey, eS, eS);
      }
      ctx.fill();

      // White inner cutout
      ctx.fillStyle = options.colorLight || '#ffffff';
      ctx.beginPath();
      if (options.eyeStyle === 'circle') {
        ctx.arc(ex + eS / 2, ey + eS / 2, iS / 2, 0, Math.PI * 2);
      } else if (options.eyeStyle === 'rounded') {
        ctx.roundRect(ex + iGap, ey + iGap, iS, iS, iS * 0.2);
      } else {
        ctx.rect(ex + iGap, ey + iGap, iS, iS);
      }
      ctx.fill();

      // Center eyeball
      ctx.fillStyle = fillStyle;
      ctx.beginPath();
      if (options.eyeBallStyle === 'circle') {
        ctx.arc(ex + eS / 2, ey + eS / 2, bS / 2, 0, Math.PI * 2);
      } else {
        ctx.rect(ex + bGap, ey + bGap, bS, bS);
      }
      ctx.fill();
    });

    // --- Center Overlay (Text Badge or Logo Icon) ---
    const hasTextLogo = options.logoText && options.logoText.trim() !== '' && (options.logoIcon === 'none' || options.logoIcon === 'text' || !options.logoIcon);

    if (hasTextLogo) {
      const textVal = options.logoText.trim();
      let mainText = textVal;
      let subText = '';

      if (textVal.includes('\n')) {
        const parts = textVal.split('\n');
        mainText = parts[0].trim();
        subText = parts.slice(1).join(' ').trim();
      } else if (textVal.toUpperCase().includes('SAHJANAND POLYWEAVES')) {
        mainText = 'SAHJANAND';
        subText = 'POLYWEAVES PVT. LTD.';
      } else {
        const words = textVal.split(' ');
        if (words.length >= 3) {
          mainText = words[0];
          subText = words.slice(1).join(' ');
        }
      }

      mainText = mainText.toUpperCase();
      subText = subText.toUpperCase();

      const bw = Math.round(qrArea * 0.52);
      const bh = Math.round(qrArea * 0.165);
      const bx = qrAreaX + (qrArea - bw) / 2;
      const by = qrAreaY + (qrArea - bh) / 2;
      const pad = Math.max(3, Math.round(qrArea * 0.012));

      // 1. Light backing quiet zone to clear QR dots underneath
      ctx.fillStyle = options.colorLight || '#ffffff';
      ctx.beginPath();
      ctx.roundRect(bx - pad, by - pad, bw + pad * 2, bh + pad * 2, pad * 2);
      ctx.fill();

      // 2. 3D Metallic Dark Gradient Box Background
      const boxGrad = ctx.createLinearGradient(bx, by, bx, by + bh);
      boxGrad.addColorStop(0, '#131824');
      boxGrad.addColorStop(0.5, '#0a0d14');
      boxGrad.addColorStop(1, '#040609');
      ctx.fillStyle = boxGrad;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, Math.round(pad * 1.5));
      ctx.fill();

      // 3. Main Gold Border Stroke
      const goldColor = (options.frameStyle === 'gold_card' || options.frameStyle === 'card')
        ? (options.frameColor || '#d4af37')
        : (options.gradient ? (options.gradientColor || '#f97316') : '#d4af37');

      ctx.strokeStyle = goldColor;
      ctx.lineWidth = Math.max(1.5, Math.round(qrArea * 0.005));
      ctx.stroke();

      // 4. Subtle Inner Inset Border Frame
      const inset = Math.max(2, Math.round(qrArea * 0.005));
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx + inset, by + inset, bw - inset * 2, bh - inset * 2, Math.round(pad * 0.8));
      ctx.stroke();

      // Maximum text width allowed inside badge (leaving safe margins)
      const maxTextW = bw - Math.max(20, Math.round(bw * 0.18));

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (subText) {
        // --- Line 1: Main Text (SAHJANAND) in Metallic White-Silver Gradient ---
        let mainFontSize = Math.round(bh * 0.42);
        ctx.font = `900 ${mainFontSize}px "Orbitron", "Outfit", "Rajdhani", "Plus Jakarta Sans", sans-serif`;
        let mWidth = ctx.measureText(mainText).width;
        if (mWidth > maxTextW) {
          mainFontSize = Math.floor(mainFontSize * (maxTextW / mWidth));
          ctx.font = `900 ${mainFontSize}px "Orbitron", "Outfit", "Rajdhani", "Plus Jakarta Sans", sans-serif`;
        }

        const textGrad = ctx.createLinearGradient(bx, by + bh * 0.10, bx, by + bh * 0.45);
        textGrad.addColorStop(0, '#ffffff');
        textGrad.addColorStop(0.7, '#f1f5f9');
        textGrad.addColorStop(1, '#cbd5e1');
        ctx.fillStyle = textGrad;
        ctx.fillText(mainText, bx + bw / 2, by + bh * 0.33);

        // --- Line 2: Subtext (POLYWEAVES PVT. LTD.) with Gold Side Wings ---
        let subFontSize = Math.round(bh * 0.21);
        ctx.font = `700 ${subFontSize}px "Outfit", "Rajdhani", "Plus Jakarta Sans", sans-serif`;
        let sWidth = ctx.measureText(subText).width;

        const maxSubW = bw - Math.max(30, Math.round(bw * 0.28));
        if (sWidth > maxSubW) {
          subFontSize = Math.floor(subFontSize * (maxSubW / sWidth));
          ctx.font = `700 ${subFontSize}px "Outfit", "Rajdhani", "Plus Jakarta Sans", sans-serif`;
          sWidth = ctx.measureText(subText).width;
        }

        const subY = by + bh * 0.74;

        // Render Subtext in Gold
        ctx.fillStyle = goldColor;
        ctx.fillText(subText, bx + bw / 2, subY);

        // Render Left & Right Golden Side-Wing Lines (matching MEERA GROUP)
        const lineGap = Math.max(6, Math.round(bw * 0.035));
        const leftX2  = (bx + bw / 2) - (sWidth / 2) - lineGap;
        const leftX1  = bx + Math.max(10, Math.round(bw * 0.07));

        const rightX1 = (bx + bw / 2) + (sWidth / 2) + lineGap;
        const rightX2 = (bx + bw) - Math.max(10, Math.round(bw * 0.07));

        if (leftX2 > leftX1 + 8) {
          ctx.strokeStyle = goldColor;
          ctx.lineWidth = Math.max(1, Math.round(qrArea * 0.003));

          // Left Wing Line
          ctx.beginPath();
          ctx.moveTo(leftX1, subY);
          ctx.lineTo(leftX2, subY);
          ctx.stroke();

          // Left Diamond Dot
          ctx.fillStyle = goldColor;
          ctx.beginPath();
          ctx.arc(leftX2, subY, Math.max(1.5, Math.round(qrArea * 0.0035)), 0, Math.PI * 2);
          ctx.fill();

          // Right Wing Line
          ctx.beginPath();
          ctx.moveTo(rightX1, subY);
          ctx.lineTo(rightX2, subY);
          ctx.stroke();

          // Right Diamond Dot
          ctx.beginPath();
          ctx.arc(rightX1, subY, Math.max(1.5, Math.round(qrArea * 0.0035)), 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        let mainFontSize = Math.round(bh * 0.48);
        ctx.font = `900 ${mainFontSize}px "Orbitron", "Outfit", "Rajdhani", "Plus Jakarta Sans", sans-serif`;
        let mWidth = ctx.measureText(mainText).width;
        if (mWidth > maxTextW) {
          mainFontSize = Math.floor(mainFontSize * (maxTextW / mWidth));
          ctx.font = `900 ${mainFontSize}px "Orbitron", "Outfit", "Rajdhani", "Plus Jakarta Sans", sans-serif`;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillText(mainText, bx + bw / 2, by + bh / 2);
      }
    } else if (options.logoIcon && options.logoIcon !== 'none') {
      const ls = qrArea * 0.20;                        // 20% of QR area
      const lx = qrAreaX + (qrArea - ls) / 2;
      const ly = qrAreaY + (qrArea - ls) / 2;

      // White backing
      ctx.fillStyle = options.colorLight || '#ffffff';
      ctx.beginPath();
      ctx.arc(lx + ls / 2, ly + ls / 2, ls / 2 + 5, 0, Math.PI * 2);
      ctx.fill();

      if (this.ICONS[options.logoIcon]) {
        const p = new Path2D(this.ICONS[options.logoIcon]);
        ctx.save();
        ctx.translate(lx + 4, ly + 4);
        ctx.scale((ls - 8) / 24, (ls - 8) / 24);
        ctx.fillStyle = options.colorDark;
        ctx.fill(p);
        ctx.restore();
      } else {
        if (!this._imgCache) this._imgCache = {};
        const logoSrc = options.logoIcon;

        const drawLogoImg = (img) => {
          const aspect = (img.width && img.height) ? (img.width / img.height) : 1.75;
          let lw = qrArea * 0.28;
          let lh = lw / aspect;
          if (lh > qrArea * 0.22) {
            lh = qrArea * 0.22;
            lw = lh * aspect;
          }
          const lx = qrAreaX + (qrArea - lw) / 2;
          const ly = qrAreaY + (qrArea - lh) / 2;
          const pad = Math.max(4, Math.round(qrArea * 0.015));

          ctx.fillStyle = options.colorLight || '#ffffff';
          ctx.beginPath();
          ctx.roundRect(lx - pad, ly - pad, lw + pad * 2, lh + pad * 2, pad * 1.5);
          ctx.fill();

          const logoBorderColor = (options.frameStyle === 'gold_card' || options.frameStyle === 'card') 
            ? (options.frameColor || '#d4af37') 
            : (options.gradient ? (options.gradientColor || '#f97316') : (options.frameColor && options.frameColor !== '#000000' ? options.frameColor : '#ffffff'));
          ctx.strokeStyle = logoBorderColor;
          ctx.lineWidth = Math.max(1.5, Math.round(qrArea * 0.005));
          ctx.stroke();

          ctx.drawImage(img, lx, ly, lw, lh);
        };

        if (this._imgCache[logoSrc]) {
          drawLogoImg(this._imgCache[logoSrc]);
        } else {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = () => {
            this._imgCache[logoSrc] = img;
            drawLogoImg(img);
          };
          img.src = logoSrc;
        }
      }
    }
  },

  /**
   * Export a native SVG string with proper vector shapes (no raster embed).
   */
  exportSVG(text, options) {
    options = Object.assign({
      size: 400,
      colorDark: '#000000',
      colorLight: '#ffffff',
      bodyStyle: 'square',
      eyeStyle: 'square',
      eyeBallStyle: 'square',
      logoIcon: null,
      logoText: ''
    }, options);

    let qr;
    try {
      const hasOverlay = !!((options.logoIcon && options.logoIcon !== 'none') || (options.logoText && options.logoText.trim() !== ''));
      qr = this._buildMatrix(text, hasOverlay);
    } catch (e) {
      console.error('QR SVG generation failed:', e);
      return '';
    }

    const moduleCount = qr.getModuleCount();
    const margin   = 24;
    const size     = options.size;
    const qrArea   = size - margin * 2;
    const cellSize = qrArea / moduleCount;

    const parts = [];
    parts.push(`<rect width="${size}" height="${size}" fill="${options.colorLight}"/>`);

    function isFinder(r, c) {
      return (r < 7 && c < 7) ||
             (r < 7 && c >= moduleCount - 7) ||
             (r >= moduleCount - 7 && c < 7);
    }

    // Data dots
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (isFinder(r, c) || !qr.isDark(r, c)) continue;
        const x = margin + c * cellSize;
        const y = margin + r * cellSize;
        if (options.bodyStyle === 'extra_rounded') {
          parts.push(`<circle cx="${x + cellSize/2}" cy="${y + cellSize/2}" r="${cellSize*0.45}" fill="${options.colorDark}"/>`);
        } else if (options.bodyStyle === 'rounded') {
          parts.push(`<rect x="${x+0.3}" y="${y+0.3}" width="${cellSize-0.6}" height="${cellSize-0.6}" rx="${cellSize*0.35}" fill="${options.colorDark}"/>`);
        } else {
          parts.push(`<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${options.colorDark}"/>`);
        }
      }
    }

    // Finder eyes
    const eyePos = [{ r:0, c:0 }, { r:0, c:moduleCount-7 }, { r:moduleCount-7, c:0 }];
    eyePos.forEach(e => {
      const ex = margin + e.c * cellSize, ey = margin + e.r * cellSize;
      const eS = cellSize * 7, iS = cellSize * 5, bS = cellSize * 3;
      const cd = options.colorDark;
      parts.push(`<rect x="${ex}" y="${ey}" width="${eS}" height="${eS}" fill="${cd}"/>`);
      parts.push(`<rect x="${ex+cellSize}" y="${ey+cellSize}" width="${iS}" height="${iS}" fill="${options.colorLight}"/>`);
      parts.push(`<rect x="${ex+cellSize*2}" y="${ey+cellSize*2}" width="${bS}" height="${bS}" fill="${cd}"/>`);
    });

    // SVG Center Overlay (Text Badge)
    if (options.logoText && options.logoText.trim() !== '' && (options.logoIcon === 'none' || options.logoIcon === 'text' || !options.logoIcon)) {
      const textVal = options.logoText.trim();
      let mainText = textVal;
      let subText = '';
      if (textVal.includes('\n')) {
        const p = textVal.split('\n');
        mainText = p[0].trim(); subText = p.slice(1).join(' ').trim();
      } else if (textVal.toUpperCase().includes('SAHJANAND POLYWEAVES')) {
        mainText = 'SAHJANAND'; subText = 'POLYWEAVES PVT. LTD.';
      } else {
        const w = textVal.split(' ');
        if (w.length >= 3) { mainText = w[0]; subText = w.slice(1).join(' '); }
      }
      mainText = mainText.toUpperCase();
      subText = subText.toUpperCase();

      const bw = Math.round(qrArea * 0.52);
      const bh = Math.round(qrArea * 0.165);
      const bx = margin + (qrArea - bw) / 2;
      const by = margin + (qrArea - bh) / 2;
      const pad = Math.max(3, Math.round(qrArea * 0.012));
      const goldColor = (options.frameStyle === 'gold_card' || options.frameStyle === 'card')
        ? (options.frameColor || '#d4af37')
        : (options.gradient ? (options.gradientColor || '#f97316') : '#d4af37');

      const maxTextW = bw - Math.max(20, Math.round(bw * 0.18));
      let mainFontSize = Math.min(Math.round(bh * 0.42), Math.round(maxTextW / (mainText.length * 0.65)));
      let subFontSize = Math.min(Math.round(bh * 0.21), Math.round((bw * 0.55) / (subText.length * 0.55)));

      parts.push(`<rect x="${bx-pad}" y="${by-pad}" width="${bw+pad*2}" height="${bh+pad*2}" rx="${pad*2}" fill="${options.colorLight}"/>`);
      parts.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${pad*1.5}" fill="#0a0d14" stroke="${goldColor}" stroke-width="${Math.max(1.5, Math.round(qrArea*0.005))}"/>`);
      const inset = Math.max(2, Math.round(qrArea * 0.005));
      parts.push(`<rect x="${bx+inset}" y="${by+inset}" width="${bw-inset*2}" height="${bh-inset*2}" rx="${pad*0.8}" fill="none" stroke="rgba(212, 175, 55, 0.4)" stroke-width="1"/>`);

      if (subText) {
        const subY = by + bh * 0.76;
        const lineX1 = bx + Math.max(10, Math.round(bw * 0.07));
        const lineX2 = (bx + bw / 2) - Math.round(subText.length * subFontSize * 0.32) - 6;
        const lineX3 = (bx + bw / 2) + Math.round(subText.length * subFontSize * 0.32) + 6;
        const lineX4 = (bx + bw) - Math.max(10, Math.round(bw * 0.07));

        parts.push(`<text x="${bx+bw/2}" y="${by+bh*0.38}" fill="#ffffff" font-family="'Orbitron', 'Outfit', sans-serif" font-weight="900" font-size="${mainFontSize}" text-anchor="middle">${mainText}</text>`);
        parts.push(`<text x="${bx+bw/2}" y="${subY}" fill="${goldColor}" font-family="'Outfit', sans-serif" font-weight="700" font-size="${subFontSize}" text-anchor="middle">${subText}</text>`);

        if (lineX2 > lineX1 + 8) {
          parts.push(`<line x1="${lineX1}" y1="${subY-2}" x2="${lineX2}" y2="${subY-2}" stroke="${goldColor}" stroke-width="1"/>`);
          parts.push(`<circle cx="${lineX2}" cy="${subY-2}" r="1.5" fill="${goldColor}"/>`);
          parts.push(`<line x1="${lineX3}" y1="${subY-2}" x2="${lineX4}" y2="${subY-2}" stroke="${goldColor}" stroke-width="1"/>`);
          parts.push(`<circle cx="${lineX3}" cy="${subY-2}" r="1.5" fill="${goldColor}"/>`);
        }
      } else {
        parts.push(`<text x="${bx+bw/2}" y="${by+bh*0.58}" fill="#ffffff" font-family="'Orbitron', 'Outfit', sans-serif" font-weight="900" font-size="${mainFontSize}" text-anchor="middle">${mainText}</text>`);
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">\n${parts.join('\n')}\n</svg>`;
  }
};
