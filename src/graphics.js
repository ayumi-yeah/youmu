// Canvas Render Helpers for Youmu, Ghosts, Bosses, Particles, Bullets, and Items

export class Graphics {
  // Draw Youmu Konpaku (魂魄妖夢)
  static drawYoumu(ctx, x, y, facingRight, isAttacking, attackFrame, isInvincible) {
    ctx.save();
    ctx.translate(x, y);

    if (isInvincible && Math.floor(Date.now() / 50) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    if (!facingRight) {
      ctx.scale(-1, 1);
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 26, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Half-Ghost (Myon / 半霊) floating behind Youmu
    const floatOffset = Math.sin(Date.now() / 200) * 4;
    ctx.fillStyle = 'rgba(230, 245, 255, 0.85)';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(-22, -15 + floatOffset, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-22, -3 + floatOffset);
    ctx.quadraticCurveTo(-30, 10 + floatOffset, -38, 5 + floatOffset);
    ctx.quadraticCurveTo(-30, -5 + floatOffset, -22, -15 + floatOffset);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Youmu Body & Dress (Dark Green / Black Hakama + White Top)
    // Green Skirt/Dress
    ctx.fillStyle = '#1b4332';
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(12, 0);
    ctx.lineTo(16, 24);
    ctx.lineTo(-16, 24);
    ctx.closePath();
    ctx.fill();

    // White Top / Vest
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(-10, -16, 20, 16);

    // Green Vest detail
    ctx.fillStyle = '#2d6a4f';
    ctx.fillRect(-10, -16, 6, 16);
    ctx.fillRect(4, -16, 6, 16);

    // Head / Face
    ctx.fillStyle = '#ffe0bd';
    ctx.beginPath();
    ctx.arc(0, -24, 10, 0, Math.PI * 2);
    ctx.fill();

    // Silver / Light Green Hair & Headband Ribbon
    ctx.fillStyle = '#d8f3dc';
    ctx.beginPath();
    ctx.arc(0, -26, 12, Math.PI, Math.PI * 2);
    ctx.fill();

    // Black Hair Ribbon
    ctx.fillStyle = '#111';
    ctx.fillRect(-12, -36, 10, 6);
    ctx.fillRect(-14, -34, 4, 10);

    // Eyes
    ctx.fillStyle = '#52b788';
    ctx.fillRect(3, -25, 3, 4);

    // Katanas (Roukanken & Hakuroken) on waist/back
    ctx.strokeStyle = '#c0c0c0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, -10);
    ctx.lineTo(-24, -28);
    ctx.stroke();

    // Attack Slash Animation (Screen-wide Super Long Reach Blade)
    if (isAttacking) {
      ctx.save();
      ctx.strokeStyle = '#4cc9f0';
      ctx.fillStyle = 'rgba(76, 201, 240, 0.55)';
      ctx.shadowColor = '#4cc9f0';
      ctx.shadowBlur = 35;
      ctx.lineWidth = 14;

      const slashAngle = (attackFrame / 15) * Math.PI - Math.PI / 3;
      ctx.beginPath();
      ctx.arc(30, 0, 400, slashAngle - 0.8, slashAngle + 0.8);
      ctx.stroke();

      // Blade arc fill
      ctx.beginPath();
      ctx.moveTo(30, 0);
      ctx.arc(30, 0, 410, slashAngle - 0.6, slashAngle + 0.6);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }

  // Draw Regular Ghosts / Spirits (Magatama / 勾玉 Form)
  static drawGhost(ctx, ghost) {
    ctx.save();
    ctx.translate(ghost.x, ghost.y);

    const time = Date.now() / 120 + ghost.id * 10;
    const pulse = Math.sin(time) * 2;
    const size = (ghost.radius + pulse) * 1.1;

    // Palette per spirit type
    let mainColor, innerGlow, coreGlow;
    if (ghost.type === 'red') {
      mainColor = '#ff2a5f';
      innerGlow = '#ff7bb0';
      coreGlow = '#ffe6ed';
    } else if (ghost.type === 'blue') {
      mainColor = '#00b4d8';
      innerGlow = '#48cae4';
      coreGlow = '#caf0f8';
    } else {
      mainColor = '#9d4edd';
      innerGlow = '#c77dff';
      coreGlow = '#f3e8ff';
    }

    // Facing & Floating Rotation
    const isLeft = ghost.vx < 0;
    ctx.scale(isLeft ? -1 : 1, 1);
    ctx.rotate(Math.sin(time * 0.5) * 0.15);

    // 1. Outer Ethereal Magatama Glow
    ctx.shadowColor = mainColor;
    ctx.shadowBlur = 20;

    // 2. Magatama Curved Body (勾玉の形状)
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    // Head rounded bulb
    ctx.arc(0, -size * 0.4, size * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Curved Tail sweeping downwards and back
    ctx.beginPath();
    ctx.moveTo(size * 0.7, -size * 0.3);
    ctx.bezierCurveTo(
      size * 1.4, size * 0.5,
      size * 0.2, size * 1.8,
      -size * 0.8, size * 1.6
    );
    ctx.bezierCurveTo(
      size * 0.0, size * 1.2,
      size * 0.6, size * 0.4,
      -0.2, -size * 0.2
    );
    ctx.closePath();
    ctx.fill();

    // 3. Inner Glossy Highlight (勾玉の艶やかな質感)
    const magatamaGrad = ctx.createRadialGradient(-size * 0.2, -size * 0.5, 2, 0, 0, size * 1.2);
    magatamaGrad.addColorStop(0, coreGlow);
    magatamaGrad.addColorStop(0.5, innerGlow);
    magatamaGrad.addColorStop(1, mainColor);

    ctx.fillStyle = magatamaGrad;
    ctx.beginPath();
    ctx.arc(0, -size * 0.4, size * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // 4. Magatama Hole (勾玉の穴 - 陰陽玉風の輝く穴)
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ffffff';
    ctx.fillStyle = '#0a0512';
    ctx.beginPath();
    ctx.arc(-size * 0.1, -size * 0.5, size * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Dot inside the Hole
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(-size * 0.1, -size * 0.5, size * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Draw Boss 1: Yuyuko Saigyouji (西行寺 幽々子)
  static drawYuyuko(ctx, boss) {
    ctx.save();
    ctx.translate(boss.x, boss.y);

    const floatY = Math.sin(Date.now() / 250) * 6;

    // Glowing Aura
    ctx.shadowColor = '#ff7bb0';
    ctx.shadowBlur = 20;

    // Butterfly Wings / Fan background effect
    ctx.fillStyle = 'rgba(255, 123, 176, 0.25)';
    ctx.beginPath();
    ctx.ellipse(-30, floatY - 10, 40, 25, -Math.PI / 6, 0, Math.PI * 2);
    ctx.ellipse(30, floatY - 10, 40, 25, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // Kimono (Light Pink & Blue Accent)
    ctx.fillStyle = '#ffc6ff';
    ctx.beginPath();
    ctx.moveTo(-20, floatY + 10);
    ctx.lineTo(20, floatY + 10);
    ctx.lineTo(26, floatY + 45);
    ctx.lineTo(-26, floatY + 45);
    ctx.closePath();
    ctx.fill();

    // Blue Kimono Trim
    ctx.fillStyle = '#a0c4ff';
    ctx.fillRect(-6, floatY + 10, 12, 35);

    // Face
    ctx.fillStyle = '#ffe0bd';
    ctx.beginPath();
    ctx.arc(0, floatY - 15, 14, 0, Math.PI * 2);
    ctx.fill();

    // Pink Hair & Mob Cap Hat
    ctx.fillStyle = '#ff85a1';
    ctx.beginPath();
    ctx.arc(0, floatY - 18, 16, Math.PI, Math.PI * 2);
    ctx.fill();

    // Mob Cap Hat
    ctx.fillStyle = '#e7c6ff';
    ctx.beginPath();
    ctx.arc(0, floatY - 24, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff7bb0';
    ctx.beginPath();
    ctx.arc(0, floatY - 28, 6, 0, Math.PI * 2);
    ctx.fill();

    // Folding Fan (Sensu)
    ctx.fillStyle = '#ffb703';
    ctx.beginPath();
    ctx.arc(18, floatY, 16, Math.PI * 0.8, Math.PI * 1.5);
    ctx.lineTo(18, floatY);
    ctx.fill();

    ctx.restore();
  }

  // Draw Items (Dango / Power Orbs / Score Orbs)
  static drawItem(ctx, item) {
    ctx.save();
    ctx.translate(item.x, item.y);

    const bob = Math.sin(Date.now() / 150 + item.id) * 3;

    if (item.type === 'dango') {
      // Dango (🍡 Mitara-shi / Sanshoku Dango)
      ctx.fillStyle = '#ffb703';
      ctx.fillRect(-2, -14 + bob, 4, 28); // Stick

      ctx.fillStyle = '#ff7bb0'; // Pink
      ctx.beginPath();
      ctx.arc(0, -8 + bob, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff'; // White
      ctx.beginPath();
      ctx.arc(0, 0 + bob, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#52b788'; // Green
      ctx.beginPath();
      ctx.arc(0, 8 + bob, 6, 0, Math.PI * 2);
      ctx.fill();

    } else if (item.type === 'power') {
      // Power Orb (Red P Item)
      ctx.shadowColor = '#ff2a5f';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ff2a5f';
      ctx.beginPath();
      ctx.arc(0, bob, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('P', 0, bob + 1);

    } else if (item.type === 'score') {
      // Score Orb (Blue Point Item)
      ctx.shadowColor = '#4cc9f0';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#4cc9f0';
      ctx.beginPath();
      ctx.arc(0, bob, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('点', 0, bob + 1);
    }

    ctx.restore();
  }

  // Draw Projectiles / Bullets
  static drawBullet(ctx, bullet) {
    ctx.save();
    ctx.translate(bullet.x, bullet.y);

    if (bullet.isPlayer) {
      // Youmu's Slash Wave projectile (3 Tiers)
      const tier = bullet.tier || 1;
      const angle = Math.atan2(bullet.vy, bullet.vx);
      ctx.rotate(angle);

      if (tier === 3) {
        // Tier 3: 桜花光輪波 (Sakura Aura Wave - Bright Pink/Cyan Glow with Trail)
        ctx.shadowColor = '#ff4d6d';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255, 119, 182, 0.9)';
        ctx.lineWidth = 4;

        ctx.beginPath();
        ctx.arc(0, 0, bullet.radius, -Math.PI / 2, Math.PI / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner Cherry Blade Core
        ctx.fillStyle = '#4cc9f0';
        ctx.beginPath();
        ctx.arc(4, 0, bullet.radius * 0.5, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
      } else if (tier === 2) {
        // Tier 2: 双月光牙 (Cyan Crescent Wave)
        ctx.shadowColor = '#4cc9f0';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = 'rgba(76, 201, 240, 0.85)';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.arc(0, 0, bullet.radius, -Math.PI / 2, Math.PI / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Tier 1: 疾風斬撃 (White/Light Green Slash Wave)
        ctx.shadowColor = '#52b788';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = 'rgba(216, 243, 220, 0.8)';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(0, 0, bullet.radius, -Math.PI / 2, Math.PI / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else {
      // Enemy Danmaku Bullet (Glowing Danmaku Sphere / Butterfly)
      ctx.shadowColor = bullet.color || '#ff4d6d';
      ctx.shadowBlur = 10;

      ctx.fillStyle = bullet.color || '#ff4d6d';
      ctx.beginPath();
      ctx.arc(0, 0, bullet.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, bullet.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
