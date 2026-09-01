/**
 * Real-time Canvas AR Filter and Overlay Engine
 * Dynamically scales and positions across Portrait, Landscape, and Square viewports
 */

export function renderAROverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filterType?: string,
  timeMs: number = Date.now()
) {
  if (!filterType || filterType === 'normal') return;

  const centerX = width / 2;
  const centerY = height / 2;
  const t = timeMs / 1000;

  const isLandscape = width > height;
  const baseDim = isLandscape ? height : width;

  // Responsive head and face anchor estimates
  const faceWidth = baseDim * (isLandscape ? 0.38 : 0.46);
  const headTopY = isLandscape ? height * 0.22 : height * 0.20;
  const faceCenterY = isLandscape ? height * 0.48 : height * 0.50;

  ctx.save();

  if (filterType === 'dog') {
    // Puppy Face AR Filter
    const earW = faceWidth * 0.28;
    const earH = faceWidth * 0.45;
    const earSpread = faceWidth * 0.65;
    const earY = headTopY + Math.sin(t * 4) * 4;

    // 1. Left Ear
    ctx.save();
    ctx.translate(centerX - earSpread, earY);
    ctx.rotate(-0.35 + Math.sin(t * 3) * 0.05);
    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath();
    ctx.ellipse(0, 0, earW, earH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d29665';
    ctx.beginPath();
    ctx.ellipse(0, earH * 0.1, earW * 0.6, earH * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Right Ear
    ctx.save();
    ctx.translate(centerX + earSpread, earY);
    ctx.rotate(0.35 - Math.cos(t * 3) * 0.05);
    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath();
    ctx.ellipse(0, 0, earW, earH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d29665';
    ctx.beginPath();
    ctx.ellipse(0, earH * 0.1, earW * 0.6, earH * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Cute Puppy Nose
    const noseY = faceCenterY * 0.96;
    const noseW = faceWidth * 0.16;
    const noseH = faceWidth * 0.11;
    ctx.save();
    ctx.translate(centerX, noseY);
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.moveTo(-noseW, -noseH * 0.4);
    ctx.quadraticCurveTo(0, -noseH * 0.8, noseW, -noseH * 0.4);
    ctx.quadraticCurveTo(0, noseH, -noseW, -noseH * 0.4);
    ctx.fill();
    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(noseW * 0.25, -noseH * 0.25, noseW * 0.25, noseH * 0.15, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Cheeks & Blush
    ctx.fillStyle = 'rgba(244, 114, 182, 0.25)';
    ctx.beginPath();
    ctx.arc(centerX - faceWidth * 0.45, faceCenterY * 1.05, faceWidth * 0.18, 0, Math.PI * 2);
    ctx.arc(centerX + faceWidth * 0.45, faceCenterY * 1.05, faceWidth * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Animated Tongue
    const tongueDrop = Math.sin(t * 3) > 0.3 ? 1 : 0;
    if (tongueDrop) {
      ctx.save();
      ctx.translate(centerX, faceCenterY * 1.06);
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.ellipse(0, faceWidth * 0.15, faceWidth * 0.12, faceWidth * 0.18, 0, 0, Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, faceWidth * 0.2);
      ctx.stroke();
      ctx.restore();
    }
  } else if (filterType === 'fire') {
    // Blazing Flame Crown - Dynamically fitted to head width
    const flameCount = 9;
    const crownW = faceWidth * 1.15;
    const crownY = headTopY;
    const flameBaseH = baseDim * (isLandscape ? 0.13 : 0.10);

    for (let i = 0; i < flameCount; i++) {
      const fx = centerX - crownW / 2 + (i * crownW) / (flameCount - 1);
      const flameHeight = flameBaseH * (1.0 + Math.sin(t * 8 + i * 1.2) * 0.35);
      const fy = crownY - (i === 4 ? flameBaseH * 0.25 : i === 3 || i === 5 ? flameBaseH * 0.12 : 0);

      ctx.save();
      ctx.translate(fx, fy);
      ctx.fillStyle = i % 2 === 0 ? '#ef4444' : '#f97316';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 18;

      const halfW = crownW / (flameCount * 1.5);
      ctx.beginPath();
      ctx.moveTo(-halfW, 0);
      ctx.quadraticCurveTo(0, -flameHeight, 0, -flameHeight - 8);
      ctx.quadraticCurveTo(halfW * 0.75, -flameHeight * 0.6, halfW, 0);
      ctx.closePath();
      ctx.fill();

      // Inner yellow core
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.5, 0);
      ctx.quadraticCurveTo(0, -flameHeight * 0.6, 0, -flameHeight * 0.65);
      ctx.quadraticCurveTo(halfW * 0.35, -flameHeight * 0.4, halfW * 0.5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  } else if (filterType === 'neon') {
    // Cyber Neon HUD & Laser Grid
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 14;

    const pad = Math.max(16, baseDim * 0.04);
    const len = Math.max(28, baseDim * 0.08);

    // Corner brackets
    ctx.beginPath();
    ctx.moveTo(pad, pad + len);
    ctx.lineTo(pad, pad);
    ctx.lineTo(pad + len, pad);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width - pad - len, pad);
    ctx.lineTo(width - pad, pad);
    ctx.lineTo(width - pad, pad + len);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pad, height - pad - len);
    ctx.lineTo(pad, height - pad);
    ctx.lineTo(pad + len, height - pad);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width - pad - len, height - pad);
    ctx.lineTo(width - pad, height - pad);
    ctx.lineTo(width - pad, height - pad - len);
    ctx.stroke();

    // Center Crosshair
    const crossRadius = Math.max(24, baseDim * 0.05);
    ctx.beginPath();
    ctx.arc(centerX, centerY, crossRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX - crossRadius * 1.4, centerY);
    ctx.lineTo(centerX - crossRadius * 0.45, centerY);
    ctx.moveTo(centerX + crossRadius * 0.45, centerY);
    ctx.lineTo(centerX + crossRadius * 1.4, centerY);
    ctx.moveTo(centerX, centerY - crossRadius * 1.4);
    ctx.lineTo(centerX, centerY - crossRadius * 0.45);
    ctx.moveTo(centerX, centerY + crossRadius * 0.45);
    ctx.lineTo(centerX, centerY + crossRadius * 1.4);
    ctx.stroke();

    // Sci-fi text
    ctx.shadowBlur = 0;
    ctx.font = '12px "Space Mono", monospace';
    ctx.fillStyle = '#00f2fe';
    ctx.fillText('CYBER_LENS v2.6 // TRACKING ACTIVE', pad, height - pad - 12);
    ctx.fillText(`FOV: 84°  |  SYNC: ${(Math.sin(t) * 10 + 90).toFixed(1)}%`, Math.max(pad, width - 220), pad + 18);
  } else if (filterType === 'vhs') {
    // 90s VHS Cam Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 1.5);
    }

    const glitchY = (t * 80) % height;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(0, glitchY, width, 8);

    const isBlink = Math.floor(t * 2) % 2 === 0;
    if (isBlink) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(36, 42, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.font = '700 16px "Space Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText('REC', 52, 48);
    ctx.fillText('PLAY ►', width - 96, 48);

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    ctx.font = '700 18px "Space Mono", monospace';
    ctx.fillText(`${dateStr}  ${timeStr}`, 30, height - 36);
    ctx.fillText('SP 0:00:42', width - 140, height - 36);
  } else if (filterType === 'sparkles') {
    // Floating Shimmering Stars
    const starCount = 14;
    for (let i = 0; i < starCount; i++) {
      const sx = (Math.sin(i * 1.7 + t * 0.8) * 0.4 + 0.5) * width;
      const sy = (Math.cos(i * 2.3 + t * 0.9) * 0.4 + 0.5) * height;
      const size = (Math.sin(t * 3 + i) * 0.5 + 0.5) * (baseDim * 0.03) + 8;
      const rot = t * 1.5 + i;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(rot);
      ctx.fillStyle = i % 2 === 0 ? '#fde047' : '#f472b6';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.quadraticCurveTo(0, 0, size, 0);
      ctx.quadraticCurveTo(0, 0, 0, size);
      ctx.quadraticCurveTo(0, 0, -size, 0);
      ctx.quadraticCurveTo(0, 0, 0, -size);
      ctx.fill();
      ctx.restore();
    }
  } else if (filterType === 'hearts') {
    // Heart Blush & Floating Hearts
    const heartCount = 10;
    for (let i = 0; i < heartCount; i++) {
      const speed = 60 + (i % 3) * 20;
      const hy = height - ((t * speed + i * 80) % (height + 60));
      const hx = (Math.sin(i * 3 + t) * 0.4 + 0.5) * width;
      const size = (baseDim * 0.02) + (i % 4) * 5;

      ctx.save();
      ctx.translate(hx, hy);
      ctx.fillStyle = i % 2 === 0 ? '#fb7185' : '#f43f5e';
      ctx.shadowColor = '#fda4af';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(0, size * 0.3);
      ctx.bezierCurveTo(-size * 0.5, -size * 0.3, -size, size * 0.2, 0, size);
      ctx.bezierCurveTo(size, size * 0.2, size * 0.5, -size * 0.3, 0, size * 0.3);
      ctx.fill();
      ctx.restore();
    }

    // Rosy Cheeks
    ctx.fillStyle = 'rgba(251, 113, 133, 0.25)';
    ctx.beginPath();
    ctx.arc(centerX - faceWidth * 0.45, faceCenterY * 1.05, faceWidth * 0.2, 0, Math.PI * 2);
    ctx.arc(centerX + faceWidth * 0.45, faceCenterY * 1.05, faceWidth * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (filterType === 'noir') {
    // Film Noir Vignette & Grain
    const grad = ctx.createRadialGradient(centerX, centerY, baseDim * 0.2, centerX, centerY, baseDim * 0.7);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 16, width - 32, height - 32);
  } else if (filterType === 'anime') {
    // Manga Action lines at outer edge
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2 + (t * 0.2);
      const r1 = baseDim * 0.45;
      const r2 = baseDim * 0.8;
      const x1 = centerX + Math.cos(angle) * r1;
      const y1 = centerY + Math.sin(angle) * r1;
      const x2 = centerX + Math.cos(angle) * r2;
      const y2 = centerY + Math.sin(angle) * r2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  } else if (filterType === 'rainbow_prism') {
    // Diagonal prismatic rainbow sheen
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, 'rgba(239, 68, 68, 0.15)');
    grad.addColorStop(0.2, 'rgba(249, 115, 22, 0.15)');
    grad.addColorStop(0.4, 'rgba(234, 179, 8, 0.15)');
    grad.addColorStop(0.6, 'rgba(34, 197, 94, 0.15)');
    grad.addColorStop(0.8, 'rgba(59, 130, 246, 0.15)');
    grad.addColorStop(1, 'rgba(168, 85, 247, 0.15)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (filterType === 'alien') {
    // Cosmic Green Aura & Antenna
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 12;

    const antW = faceWidth * 0.35;
    const antH = baseDim * 0.16;

    // Antenna left
    ctx.beginPath();
    ctx.moveTo(centerX - antW * 0.6, headTopY + 10);
    ctx.quadraticCurveTo(centerX - antW * 1.2, headTopY - antH * 0.6, centerX - antW * 1.3, headTopY - antH);
    ctx.stroke();
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc(centerX - antW * 1.3, headTopY - antH, 10, 0, Math.PI * 2);
    ctx.fill();

    // Antenna right
    ctx.beginPath();
    ctx.moveTo(centerX + antW * 0.6, headTopY + 10);
    ctx.quadraticCurveTo(centerX + antW * 1.2, headTopY - antH * 0.6, centerX + antW * 1.3, headTopY - antH);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(centerX + antW * 1.3, headTopY - antH, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
