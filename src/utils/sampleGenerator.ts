export type SamplePreset = 'architecture' | 'botanical' | 'emblem';

export async function generateSampleFile(preset: SamplePreset): Promise<File> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  if (preset === 'architecture') {
    canvas.width = 1920;
    canvas.height = 1080;

    // Sky-to-studio gradient backdrop
    const bg = ctx.createLinearGradient(0, 0, 1920, 1080);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(0.55, '#1e293b');
    bg.addColorStop(1, '#334155');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1920, 1080);

    // Warm sunlit architectural facade panels
    const sunGrad = ctx.createRadialGradient(1420, 220, 60, 1420, 220, 920);
    sunGrad.addColorStop(0, 'rgba(251, 191, 36, 0.55)');
    sunGrad.addColorStop(0.45, 'rgba(56, 189, 248, 0.22)');
    sunGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, 1920, 1080);

    // Concrete & glass structural perspective columns
    for (let i = 0; i < 12; i++) {
      const x = 140 + i * 145;
      const shade = 210 - i * 10;
      ctx.fillStyle = `rgba(${shade}, ${shade + 8}, ${shade + 18}, 0.14)`;
      ctx.fillRect(x, 120, 92, 840);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, 120, 92, 840);
    }

    // Geometric daylight beams
    ctx.fillStyle = 'rgba(255, 247, 237, 0.16)';
    ctx.beginPath();
    ctx.moveTo(980, 0);
    ctx.lineTo(1740, 0);
    ctx.lineTo(1320, 1080);
    ctx.lineTo(420, 1080);
    ctx.closePath();
    ctx.fill();

    // Subtle film-like surface texture noise so PNG compression has real detail to compress
    const imgData = ctx.getImageData(0, 0, 1920, 1080);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = ((i * 2654435761) & 15) - 7;
      d[i] = Math.max(0, Math.min(255, d[i] + n));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    const blob = await new Promise<Blob>((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej(new Error('Blob failed'))), 'image/png')
    );
    return new File([blob], 'architectural_vista_1920x1080.png', {
      type: 'image/png',
    });
  }

  if (preset === 'botanical') {
    canvas.width = 1600;
    canvas.height = 1200;

    const bg = ctx.createLinearGradient(0, 0, 1600, 1200);
    bg.addColorStop(0, '#022c22');
    bg.addColorStop(0.5, '#064e3b');
    bg.addColorStop(1, '#065f46');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1600, 1200);

    // Layered botanical leaves & specular droplets
    for (let i = 0; i < 18; i++) {
      ctx.save();
      const cx = (i % 6) * 290 + 120;
      const cy = Math.floor(i / 6) * 380 + 210;
      ctx.translate(cx, cy);
      ctx.rotate((i * 0.42) % Math.PI);
      const leafGrad = ctx.createLinearGradient(-180, -90, 180, 90);
      leafGrad.addColorStop(0, '#10b981');
      leafGrad.addColorStop(0.6, '#059669');
      leafGrad.addColorStop(1, '#064e3b');
      ctx.fillStyle = leafGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 240, 105, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(209, 250, 229, 0.32)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-220, 0);
      ctx.lineTo(220, 0);
      ctx.stroke();
      ctx.restore();
    }

    // Specular water droplets
    for (let i = 0; i < 45; i++) {
      const dx = ((i * 397) % 1480) + 60;
      const dy = ((i * 541) % 1080) + 60;
      const r = 10 + (i % 18);
      const drop = ctx.createRadialGradient(dx - r * 0.3, dy - r * 0.3, 1, dx, dy, r);
      drop.addColorStop(0, 'rgba(255,255,255,0.9)');
      drop.addColorStop(0.5, 'rgba(167,243,208,0.45)');
      drop.addColorStop(1, 'rgba(6,78,59,0.1)');
      ctx.fillStyle = drop;
      ctx.beginPath();
      ctx.arc(dx, dy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const blob = await new Promise<Blob>((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej(new Error('Blob failed'))), 'image/png')
    );
    return new File([blob], 'botanical_texture_1600x1200.png', {
      type: 'image/png',
    });
  }

  // Transparent emblem 1024x1024
  canvas.width = 1024;
  canvas.height = 1024;
  ctx.clearRect(0, 0, 1024, 1024);

  const ringGrad = ctx.createLinearGradient(140, 140, 884, 884);
  ringGrad.addColorStop(0, '#2563eb');
  ringGrad.addColorStop(0.5, '#0ea5e9');
  ringGrad.addColorStop(1, '#10b981');

  ctx.fillStyle = ringGrad;
  ctx.beginPath();
  ctx.arc(512, 512, 390, 0, Math.PI * 2);
  ctx.fill();

  // Inner cutout ring
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(512, 512, 235, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // Precision aperture blades inside
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(512, 512, 165, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(512, 395);
  ctx.lineTo(612, 572);
  ctx.lineTo(412, 572);
  ctx.closePath();
  ctx.fill();

  const blob = await new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error('Blob failed'))), 'image/png')
  );
  return new File([blob], 'transparent_emblem_1024x1024.png', {
    type: 'image/png',
  });
}
