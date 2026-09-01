/**
 * Real-time Canvas AR Filter and Overlay Engine
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

  ctx.save();

  if (filterType === 'dog') {
    // Puppy Face AR Filter
    // 1. Left Ear
    ctx.save();
    ctx.translate(centerX - width * 0.28, height * 0.15 + Math.sin(t * 4) * 4);
    ctx.rotate(-0.35 + Math.sin(t * 3) * 0.05);
    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath();
    ctx.ellipse(0, 0, width * 0.12, height * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d29665';
    ctx.beginPath();
    ctx.ellipse(0, 10, width * 0.07, height * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Right Ear
    ctx.save();
    ctx.translate(centerX + width * 0.28, height * 0.15 + Math.cos(t * 4) * 4);
    ctx.rotate(0.35 - Math.cos(t * 3) * 0.05);
    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath();
    ctx.ellipse(0, 0, width * 0.12, height * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d29665';
    ctx.beginPath();
    ctx.ellipse(0, 10, width * 0.07, height * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Cute Puppy Nose
    ctx.save();
    ctx.translate(centerX, centerY * 0.95);
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.moveTo(-width * 0.07, -height * 0.02);
    ctx.quadraticCurveTo(0, -height * 0.04, width * 0.07, -height * 0.02);
    ctx.quadraticCurveTo(0, height * 0.05, -width * 0.07, -height * 0.02);
    ctx.fill();
    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(width * 0.02, -height * 0.015, width * 0.015, height * 0.008, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Cheeks & Freckles
    ctx.fillStyle = 'rgba(244, 114, 182, 0.25)';
    ctx.beginPath();
    ctx.arc(centerX - width * 0.22, centerY * 1.05, width * 0.09, 0, Math.PI * 2);
    ctx.arc(centerX + width * 0.22, centerY * 1.05, width * 0.09, 0, Math.PI * 2);
    ctx.fill();

    // Animated Tongue
    const tongueDrop = Math.sin(t * 3) > 0.3 ? 1 : 0;
    if (tongueDrop) {
      ctx.save();
      ctx.translate(centerX, centerY * 1.06);
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.ellipse(0, height * 0.06, width * 0.06, height * 0.08, 0, 0, Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.01);
      ctx.lineTo(0, height * 0.09);
      ctx.stroke();
      ctx.restore();
    }
  } else if (filterType === 'neon') {
    // Cyber Neon HUD & Laser Grid
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 14;

    // Corner targeting brackets
    const pad = 24;
    const len = 40;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(pad, pad + len);
    ctx.lineTo(pad, pad);
    ctx.lineTo(pad + len, pad);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(width - pad - len, pad);
    ctx.lineTo(width - pad, pad);
    ctx.lineTo(width - pad, pad + len);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(pad, height - pad - len);
    ctx.lineTo(pad, height - pad);
    ctx.lineTo(pad + len, height - pad);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(width - pad - len, height - pad);
    ctx.lineTo(width - pad, height - pad);
    ctx.lineTo(width - pad, height - pad - len);
    ctx.stroke();

    // Center Crosshair
    ctx.beginPath();
    ctx.arc(centerX, centerY, 36, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX - 48, centerY);
    ctx.lineTo(centerX - 16, centerY);
    ctx.moveTo(centerX + 16, centerY);
    ctx.lineTo(centerX + 48, centerY);
    ctx.moveTo(centerX, centerY - 48);
    ctx.lineTo(centerX, centerY - 16);
    ctx.moveTo(centerX, centerY + 16);
    ctx.lineTo(centerX, centerY + 48);
    ctx.stroke();

    // Sci-fi text
    ctx.shadowBlur = 0;
    ctx.font = '12px "Space Mono", monospace';
    ctx.fillStyle = '#00f2fe';
    ctx.fillText('CYBER_LENS v2.6 // TRACKING ACTIVE', pad, height - pad - 12);
    ctx.fillText(`FOV: 84°  |  SYNC: ${(Math.sin(t) * 10 + 90).toFixed(1)}%`, width - 210, pad + 18);
  } else if (filterType === 'vhs') {
    // 90s VHS Cam Overlay
    // Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 1.5);
    }

    // Glitch line
    const glitchY = (t * 80) % height;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(0, glitchY, width, 8);

    // REC blinking dot & PLAY badge
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

    // Retro Timestamp
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    ctx.font = '700 18px "Space Mono", monospace';
    ctx.fillText(`${dateStr}  ${timeStr}`, 30, height - 36);
    ctx.fillText('SP 0:00:42', width - 140, height - 36);
  } else if (filterType === 'sparkles') {
    // Floating Shimmering Stars / Glam
    const starCount = 14;
    for (let i = 0; i < starCount; i++) {
      const sx = (Math.sin(i * 1.7 + t * 0.8) * 0.4 + 0.5) * width;
      const sy = (Math.cos(i * 2.3 + t * 0.9) * 0.4 + 0.5) * height;
      const size = (Math.sin(t * 3 + i) * 0.5 + 0.5) * 16 + 8;
      const rot = t * 1.5 + i;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(rot);
      ctx.fillStyle = i % 2 === 0 ? '#fde047' : '#f472b6';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;

      // 4-point sparkle diamond star
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.quadraticCurveTo(0, 0, size, 0);
      ctx.quadraticCurveTo(0, 0, 0, size);
      ctx.quadraticCurveTo(0, 0, -size, 0);
      ctx.quadraticCurveTo(0, 0, 0, -size);
      ctx.fill();
      ctx.restore();
    }
  } else if (filterType === 'fire') {
    // Blazing Flame Crown
    const flameCount = 9;
    const crownY = height * 0.16;
    for (let i = 0; i < flameCount; i++) {
      const fx = centerX - width * 0.28 + (i * width * 0.56) / (flameCount - 1);
      const flameHeight = height * (0.09 + Math.sin(t * 8 + i * 1.2) * 0.04);
      const fy = crownY - (i === 4 ? height * 0.03 : 0);

      ctx.save();
      ctx.translate(fx, fy);
      ctx.fillStyle = i % 2 === 0 ? '#ef4444' : '#f97316';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 18;

      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.quadraticCurveTo(0, -flameHeight, 0, -flameHeight - 10);
      ctx.quadraticCurveTo(12, -flameHeight * 0.6, 16, 0);
      ctx.closePath();
      ctx.fill();

      // Inner yellow core
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.quadraticCurveTo(0, -flameHeight * 0.6, 0, -flameHeight * 0.65);
      ctx.quadraticCurveTo(6, -flameHeight * 0.4, 8, 0);
      ctx.closePath();
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
      const size = 12 + (i % 4) * 6;

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
    ctx.arc(centerX - width * 0.22, centerY * 1.05, width * 0.1, 0, Math.PI * 2);
    ctx.arc(centerX + width * 0.22, centerY * 1.05, width * 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (filterType === 'noir') {
    // Film Noir Vignette & Grain
    const grad = ctx.createRadialGradient(centerX, centerY, width * 0.2, centerX, centerY, width * 0.7);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 35mm frame mark
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 16, width - 32, height - 32);
  } else if (filterType === 'anime') {
    // Manga Action lines at outer edge
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2 + (t * 0.2);
      const r1 = width * 0.45;
      const r2 = width * 0.8;
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

    // Antenna left
    ctx.beginPath();
    ctx.moveTo(centerX - width * 0.15, height * 0.18);
    ctx.quadraticCurveTo(centerX - width * 0.25, height * 0.06, centerX - width * 0.28, height * 0.08);
    ctx.stroke();
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc(centerX - width * 0.28, height * 0.08, 10, 0, Math.PI * 2);
    ctx.fill();

    // Antenna right
    ctx.beginPath();
    ctx.moveTo(centerX + width * 0.15, height * 0.18);
    ctx.quadraticCurveTo(centerX + width * 0.25, height * 0.06, centerX + width * 0.28, height * 0.08);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(centerX + width * 0.28, height * 0.08, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
