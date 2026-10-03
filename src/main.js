import { soundEngine } from './audio.js';
import { Graphics } from './graphics.js';

// Game Constants & Configuration
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;
const GRAVITY = 0.55;
const GROUND_Y = 460;

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // DOM Elements
    this.scoreValEl = document.getElementById('scoreVal');
    this.highScoreValEl = document.getElementById('highScoreVal');
    this.powerValEl = document.getElementById('powerVal');
    this.lifeContainerEl = document.getElementById('lifeContainer');
    this.spellContainerEl = document.getElementById('spellContainer');
    this.bossHpContainerEl = document.getElementById('bossHpContainer');
    this.bossHpBarEl = document.getElementById('bossHpBar');
    this.bossNameEl = document.getElementById('bossName');
    this.bossSpellNameEl = document.getElementById('bossSpellName');

    this.titleScreenEl = document.getElementById('titleScreen');
    this.resultScreenEl = document.getElementById('resultScreen');
    this.resultTitleEl = document.getElementById('resultTitle');
    this.finalScoreEl = document.getElementById('finalScore');
    this.finalKillsEl = document.getElementById('finalKills');
    this.dialogueBoxEl = document.getElementById('dialogueBox');
    this.dialogueContentEl = document.getElementById('dialogueContent');
    this.speakerNameEl = document.getElementById('speakerName');
    this.spellCutinEl = document.getElementById('spellCutin');
    this.cutinUserEl = document.getElementById('cutinUser');
    this.cutinNameEl = document.getElementById('cutinName');
    this.howToModalEl = document.getElementById('howToModal');

    // Game States: TITLE, PLAYING, DIALOGUE, GAMEOVER, CLEAR
    this.state = 'TITLE';

    // Game Metrics
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('youmu_high_score') || '1000000', 10);
    this.ghostsKilled = 0;
    this.stage = 1;

    // Keys
    this.keys = {
      left: false,
      right: false,
      up: false,
      attack: false,
      spell: false
    };

    // Player (Youmu)
    this.player = null;

    // Entities
    this.ghosts = [];
    this.bullets = [];
    this.items = [];
    this.particles = [];
    this.boss = null;

    // Dialogue Queue
    this.dialogueQueue = [];
    this.currentDialogue = null;

    // Spawn Timers
    this.ghostSpawnTimer = 0;
    this.waveKills = 0;
    this.isBossSpawned = false;

    this.initInput();
    this.updateHUD();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  resetGame() {
    this.score = 0;
    this.ghostsKilled = 0;
    this.stage = 1;
    this.waveKills = 0;
    this.isBossSpawned = false;
    this.ghosts = [];
    this.bullets = [];
    this.items = [];
    this.particles = [];
    this.boss = null;

    this.player = {
      x: 150,
      y: GROUND_Y,
      vx: 0,
      vy: 0,
      speed: 6,
      jumpForce: -13,
      isGrounded: true,
      jumpsLeft: 2,
      facingRight: true,
      hp: 5,
      maxHp: 5,
      spells: 3,
      power: 1.0,
      maxPower: 4.0,
      isAttacking: false,
      attackCooldown: 0,
      attackFrame: 0,
      invincibleTimer: 0
    };

    this.bossHpContainerEl.classList.add('hidden');
    this.updateHUD();
  }

  initInput() {
    window.addEventListener('keydown', (e) => {
      soundEngine.init();

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;

      if ((e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') && !e.repeat) {
        this.keys.up = true;
        this.handleJump();
      }

      if ((e.code === 'KeyZ' || e.code === 'KeyJ') && !e.repeat) {
        this.keys.attack = true;
        this.handleAttackInput();
      }

      if ((e.code === 'KeyX' || e.code === 'KeyK') && !e.repeat) {
        this.keys.spell = true;
        this.triggerSpellCard();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') this.keys.up = false;
      if (e.code === 'KeyZ' || e.code === 'KeyJ') this.keys.attack = false;
      if (e.code === 'KeyX' || e.code === 'KeyK') this.keys.spell = false;
    });

    // On-screen buttons
    document.getElementById('btnStart').addEventListener('click', () => this.startGame());
    document.getElementById('btnRestart').addEventListener('click', () => this.startGame());
    document.getElementById('btnHowTo').addEventListener('click', () => {
      this.howToModalEl.classList.remove('hidden');
    });
    document.getElementById('btnCloseModal').addEventListener('click', () => {
      this.howToModalEl.classList.add('hidden');
    });

    this.dialogueBoxEl.addEventListener('click', () => this.advanceDialogue());
  }

  startGame() {
    this.titleScreenEl.classList.add('hidden');
    this.resultScreenEl.classList.add('hidden');
    this.resetGame();
    this.state = 'PLAYING';
    soundEngine.startBGM();
    this.triggerDialogue([
      { speaker: '魂魄 妖夢', text: '白玉楼の周りにお化けが大量発生しているわ…！刀の露にしてあげる！' },
      { speaker: '魂魄 妖夢', text: '【操作ヒント】左右キーで移動、W/↑でジャンプ、Zキーで斬撃よ！' }
    ]);
  }

  handleJump() {
    if (this.state !== 'PLAYING' || !this.player) return;
    if (this.player.isGrounded || this.player.jumpsLeft > 0) {
      this.player.vy = this.player.jumpForce;
      this.player.isGrounded = false;
      this.player.jumpsLeft--;
      this.createJumpParticles(this.player.x, this.player.y + 20);
    }
  }

  handleAttackInput() {
    if (this.state === 'DIALOGUE') {
      this.advanceDialogue();
      return;
    }
    if (this.state !== 'PLAYING' || !this.player) return;

    if (this.player.attackCooldown <= 0) {
      this.player.isAttacking = true;
      this.player.attackCooldown = 15; // Attack speed
      this.player.attackFrame = 0;
      soundEngine.playSlash();

      // Check slash hits on ghosts & boss
      this.checkSlashHits();

      // Youmu Danmaku System - Balanced & Challenging
      const power = this.player.power;
      const facing = this.player.facingRight;
      const spawnX = this.player.x + (facing ? 30 : -30);
      const spawnY = this.player.y - 10;

      if (power >= 3.0) {
        // Tier 3 (High Power 3.0+): 3-Way Moderate Crescent Wave
        [-0.15, 0, 0.15].forEach((angleOffset) => {
          const speed = 13;
          const angle = (facing ? 0 : Math.PI) + angleOffset;
          this.bullets.push({
            x: spawnX,
            y: spawnY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 12,
            isPlayer: true,
            tier: 3,
            damage: Math.floor(power * 12)
          });
        });
      } else if (power >= 2.0) {
        // Tier 2 (Power 2.0+): Single Slash Wave
        const speed = 12;
        const angle = facing ? 0 : Math.PI;
        this.bullets.push({
          x: spawnX,
          y: spawnY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 10,
          isPlayer: true,
          tier: 2,
          damage: Math.floor(power * 10)
        });
      }
      // Power < 2.0: Sword Slash only (No projectile from start, encouraging Melee/Dodging!)
    }
  }

  triggerSpellCard() {
    if (this.state !== 'PLAYING' || !this.player) return;
    if (this.player.spells > 0) {
      this.player.spells--;
      this.updateHUD();
      soundEngine.playSpell();

      // Cut-in effect
      this.cutinUserEl.innerText = '魂魄 妖夢';
      this.cutinNameEl.innerText = '人符「現世斬」';
      this.spellCutinEl.classList.remove('hidden');
      setTimeout(() => this.spellCutinEl.classList.add('hidden'), 1200);

      // Screen clearing effect & heavy damage
      this.player.invincibleTimer = 120; // 2 seconds invincibility

      for (let i = 0; i < 40; i++) {
        this.particles.push({
          x: Math.random() * CANVAS_WIDTH,
          y: Math.random() * CANVAS_HEIGHT,
          vx: (Math.random() - 0.5) * 15,
          vy: (Math.random() - 0.5) * 15,
          color: '#4cc9f0',
          size: Math.random() * 8 + 4,
          life: 40
        });
      }

      // Clear all enemy bullets
      this.bullets = this.bullets.filter(b => b.isPlayer);

      // Destroy all non-boss ghosts
      this.ghosts.forEach(ghost => {
        this.createExplosion(ghost.x, ghost.y, '#9d4edd');
        this.score += 2000;
        this.ghostsKilled++;
        this.dropItem(ghost.x, ghost.y);
      });
      this.ghosts = [];

      // Heavy Boss damage
      if (this.boss) {
        this.boss.hp -= 150;
        this.createExplosion(this.boss.x, this.boss.y, '#ff2a5f');
      }
    }
  }

  triggerDialogue(lines) {
    this.dialogueQueue = lines;
    this.state = 'DIALOGUE';
    this.advanceDialogue();
  }

  advanceDialogue() {
    if (this.dialogueQueue.length > 0) {
      const current = this.dialogueQueue.shift();
      this.speakerNameEl.innerText = current.speaker;
      this.dialogueContentEl.innerText = current.text;
      this.dialogueBoxEl.classList.remove('hidden');
    } else {
      this.dialogueBoxEl.classList.add('hidden');
      this.state = 'PLAYING';
    }
  }

  spawnGhost() {
    if (this.ghosts.length >= 4 || this.isBossSpawned) return;

    const side = Math.random() < 0.5 ? -20 : CANVAS_WIDTH + 20;
    const types = ['blue', 'red', 'purple'];
    const type = types[Math.floor(Math.random() * types.length)];
    const speed = 0.8; // Very slow and easy

    this.ghosts.push({
      id: Math.random(),
      x: side,
      y: GROUND_Y - Math.random() * 120 - 20,
      vx: side < 0 ? speed : -speed,
      vy: 0,
      radius: 12,
      type: type,
      hp: 1, // Extremely weak
      shootTimer: Math.random() * 100
    });
  }

  spawnBoss() {
    this.isBossSpawned = true;
    soundEngine.playBossWarning();

    this.boss = {
      name: '西行寺 幽々子',
      spell: '結界「生死の境」',
      x: CANVAS_WIDTH / 2,
      y: 140,
      vx: 3.5,
      hp: 500000,
      maxHp: 500000,
      phaseTimer: 0,
      attackPattern: 0,
      phase: 1
    };

    this.bossNameEl.innerText = this.boss.name;
    this.bossSpellNameEl.innerText = this.boss.spell;
    this.bossHpContainerEl.classList.remove('hidden');

    this.triggerDialogue([
      { speaker: '西行寺 幽々子', text: 'あらあら妖夢、なかなか元気がいいわね。私とお茶でもいかが？' },
      { speaker: '魂魄 妖夢', text: '幽々子様！お戯れはお控えください！幽霊たちの暴走を止めさせていただきます！' },
      { speaker: '西行寺 幽々子', text: 'ふふっ、本気の桜の弾幕、耐えられるかしら？参りますわよ！' }
    ]);
  }

  dropItem(x, y) {
    const rand = Math.random();
    let type = null;
    if (rand < 0.35) type = 'dango'; // Generous healing
    else if (rand < 0.80) type = 'power';
    else type = 'score';

    if (type) {
      this.items.push({
        id: Math.random(),
        x: x,
        y: y,
        vy: -3,
        type: type
      });
    }
  }

  update() {
    if (this.state !== 'PLAYING') return;

    // Player Movement
    if (this.keys.left) {
      this.player.vx = -this.player.speed;
      this.player.facingRight = false;
    } else if (this.keys.right) {
      this.player.vx = this.player.speed;
      this.player.facingRight = true;
    } else {
      this.player.vx *= 0.7;
    }

    this.player.x += this.player.vx;
    this.player.y += this.player.vy;
    this.player.vy += GRAVITY;

    // Boundary & Ground check
    if (this.player.x < 20) this.player.x = 20;
    if (this.player.x > CANVAS_WIDTH - 20) this.player.x = CANVAS_WIDTH - 20;

    if (this.player.y >= GROUND_Y) {
      this.player.y = GROUND_Y;
      this.player.vy = 0;
      this.player.isGrounded = true;
      this.player.jumpsLeft = 2;
    }

    if (this.player.attackCooldown > 0) this.player.attackCooldown--;
    if (this.player.isAttacking) {
      this.player.attackFrame++;
      this.checkSlashHits(); // Continuously hit during slash animation!
      if (this.player.attackFrame > 15) this.player.isAttacking = false;
    }
    if (this.player.invincibleTimer > 0) this.player.invincibleTimer--;

    // Spawning Ghosts
    this.ghostSpawnTimer++;
    if (this.ghostSpawnTimer > 100) {
      this.ghostSpawnTimer = 0;
      this.spawnGhost();
    }

    // Check Boss Spawn Condition (Only 5 kills needed)
    if (this.ghostsKilled >= 5 && !this.isBossSpawned) {
      this.spawnBoss();
    }

    // Update Ghosts
    this.ghosts.forEach((ghost, index) => {
      ghost.x += ghost.vx;
      ghost.y += Math.sin(Date.now() / 200 + ghost.id) * 1.5;

      // Wrap around bounds
      if (ghost.x < -40) ghost.x = CANVAS_WIDTH + 30;
      if (ghost.x > CANVAS_WIDTH + 40) ghost.x = -30;

      // Shooting Danmaku bullets
      ghost.shootTimer++;
      if (ghost.type === 'purple' && ghost.shootTimer > 200) {
        ghost.shootTimer = 0;
        const angle = Math.atan2(this.player.y - ghost.y, this.player.x - ghost.x);
        this.bullets.push({
          x: ghost.x,
          y: ghost.y,
          vx: Math.cos(angle) * 2.0,
          vy: Math.sin(angle) * 2.0,
          radius: 5,
          isPlayer: false,
          color: '#b5179e'
        });
      }

      // Player Collision with Ghost
      const dist = Math.hypot(this.player.x - ghost.x, (this.player.y - 15) - ghost.y);
      if (dist < ghost.radius + 15) {
        this.damagePlayer();
      }
    });

    // Update Boss
    if (this.boss) {
      // Boss Phase check (500,000 max HP: Phase 1 -> Phase 2 at 333,333 HP, Phase 2 -> Phase 3 at 166,666 HP)
      if (this.boss.hp <= 166666 && this.boss.phase === 2) {
        this.boss.phase = 3;
        this.boss.spell = '再迷「幻想郷の黄泉還り」';
        this.bossSpellNameEl.innerText = this.boss.spell;
        this.createExplosion(this.boss.x, this.boss.y, '#ff0055');
        soundEngine.playBossWarning();
      } else if (this.boss.hp <= 333333 && this.boss.phase === 1) {
        this.boss.phase = 2;
        this.boss.spell = '桜符「完全なる墨染の桜」';
        this.bossSpellNameEl.innerText = this.boss.spell;
        this.createExplosion(this.boss.x, this.boss.y, '#ff7bb0');
        soundEngine.playBossWarning();
      }

      // Sine wave movement
      this.boss.x += this.boss.vx;
      this.boss.y = 130 + Math.sin(Date.now() / 400) * 35;
      if (this.boss.x < 120 || this.boss.x > CANVAS_WIDTH - 120) {
        this.boss.vx *= -1;
      }

      this.boss.phaseTimer++;

      // Phase 1 Danmaku: 8-way Ring Waves
      if (this.boss.phase === 1) {
        if (this.boss.phaseTimer % 25 === 0) {
          const count = 8;
          const baseAngle = (this.boss.phaseTimer / 25) * 0.2;
          for (let i = 0; i < count; i++) {
            const angle = baseAngle + (i * Math.PI * 2) / count;
            this.bullets.push({
              x: this.boss.x,
              y: this.boss.y,
              vx: Math.cos(angle) * 3.5,
              vy: Math.sin(angle) * 3.5,
              radius: 6,
              isPlayer: false,
              color: '#ff7bb0'
            });
          }
        }
      } 
      // Phase 2 Danmaku: 12-way Spiral Barrage + Aimed Player Bullets
      else if (this.boss.phase === 2) {
        if (this.boss.phaseTimer % 18 === 0) {
          const count = 12;
          const baseAngle = (this.boss.phaseTimer / 18) * 0.3;
          for (let i = 0; i < count; i++) {
            const angle = baseAngle + (i * Math.PI * 2) / count;
            this.bullets.push({
              x: this.boss.x,
              y: this.boss.y,
              vx: Math.cos(angle) * 4.0,
              vy: Math.sin(angle) * 4.0,
              radius: 7,
              isPlayer: false,
              color: '#f72585'
            });
          }
        }
        // Targeted shot at player
        if (this.boss.phaseTimer % 45 === 0) {
          const angle = Math.atan2(this.player.y - this.boss.y, this.player.x - this.boss.x);
          for (let spread = -0.2; spread <= 0.2; spread += 0.2) {
            this.bullets.push({
              x: this.boss.x,
              y: this.boss.y,
              vx: Math.cos(angle + spread) * 5.5,
              vy: Math.sin(angle + spread) * 5.5,
              radius: 8,
              isPlayer: false,
              color: '#4cc9f0'
            });
          }
        }
      }
      // Phase 3 Danmaku (Final Spell): Dense Dual-rotating Flower Pattern
      else if (this.boss.phase === 3) {
        if (this.boss.phaseTimer % 12 === 0) {
          const count = 10;
          const baseAngle1 = (this.boss.phaseTimer / 12) * 0.25;
          const baseAngle2 = -(this.boss.phaseTimer / 12) * 0.25;

          for (let i = 0; i < count; i++) {
            const angle1 = baseAngle1 + (i * Math.PI * 2) / count;
            const angle2 = baseAngle2 + (i * Math.PI * 2) / count;

            this.bullets.push({
              x: this.boss.x,
              y: this.boss.y,
              vx: Math.cos(angle1) * 3.8,
              vy: Math.sin(angle1) * 3.8,
              radius: 6,
              isPlayer: false,
              color: '#7209b7'
            });
            this.bullets.push({
              x: this.boss.x,
              y: this.boss.y,
              vx: Math.cos(angle2) * 4.5,
              vy: Math.sin(angle2) * 4.5,
              radius: 6,
              isPlayer: false,
              color: '#f72585'
            });
          }
        }
      }

      // Update Boss HP UI
      const hpPercent = Math.max(0, (this.boss.hp / this.boss.maxHp) * 100);
      this.bossHpBarEl.style.width = `${hpPercent}%`;

      // Boss Defeated
      if (this.boss.hp <= 0) {
        this.createExplosion(this.boss.x, this.boss.y, '#ffd166');
        this.score += 50000;
        this.boss = null;
        this.bossHpContainerEl.classList.add('hidden');
        soundEngine.playItem();
        this.stageClear();
      }
    }

    // Update Bullets
    this.bullets = this.bullets.filter(b => {
      b.x += b.vx;
      b.y += b.vy;

      if (b.isPlayer) {
        // Player bullet hit enemy
        let hit = false;
        this.ghosts.forEach((ghost, gIdx) => {
          if (Math.hypot(b.x - ghost.x, b.y - ghost.y) < b.radius + ghost.radius) {
            ghost.hp--;
            this.createExplosion(ghost.x, ghost.y, '#4cc9f0');
            soundEngine.playHit();
            hit = true;
            if (ghost.hp <= 0) {
              this.score += 500;
              this.ghostsKilled++;
              this.dropItem(ghost.x, ghost.y);
              this.ghosts.splice(gIdx, 1);
            }
          }
        });

        if (this.boss && Math.hypot(b.x - this.boss.x, b.y - this.boss.y) < b.radius + 30) {
          this.boss.hp -= b.damage || 10;
          this.createExplosion(b.x, b.y, '#ff7bb0');
          soundEngine.playHit();
          hit = true;
        }

        return !hit; // Destroy bullet on hit
      } else {
        // Enemy bullet hit Player
        if (Math.hypot(b.x - this.player.x, b.y - (this.player.y - 15)) < b.radius + 12) {
          this.damagePlayer();
        }
        return true;
      }
    });

    // Filter out-of-bounds bullets
    this.bullets = this.bullets.filter(b => b.x > -50 && b.x < CANVAS_WIDTH + 50 && b.y > -50 && b.y < CANVAS_HEIGHT + 50);

    // Update Items
    this.items.forEach((item, iIdx) => {
      item.y += item.vy;
      item.vy += 0.15; // Gravity on item
      if (item.y > GROUND_Y + 10) item.y = GROUND_Y + 10;

      // Player Item Pickup
      if (Math.hypot(this.player.x - item.x, (this.player.y - 15) - item.y) < 28) {
        soundEngine.playItem();
        if (item.type === 'dango') {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
        } else if (item.type === 'power') {
          this.player.power = Math.min(this.player.maxPower, this.player.power + 0.75);
        } else if (item.type === 'score') {
          this.score += 3000;
        }
        this.updateHUD();
        this.items.splice(iIdx, 1);
      }
    });

    // Particles
    this.particles.forEach((p, pIdx) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    });
    this.particles = this.particles.filter(p => p.life > 0);

    this.updateHUD();
  }

  checkSlashHits() {
    const slashRange = 600; // Giant screen-wide sword slash
    const slashX = this.player.x + (this.player.facingRight ? 250 : -250);
    const slashY = this.player.y - 15;

    // Hit Ghosts
    this.ghosts = this.ghosts.filter(ghost => {
      const dist = Math.hypot(slashX - ghost.x, slashY - ghost.y);
      if (dist < slashRange + ghost.radius) {
        this.createExplosion(ghost.x, ghost.y, '#9d4edd');
        soundEngine.playHit();
        this.score += 1000;
        this.ghostsKilled++;
        this.dropItem(ghost.x, ghost.y);
        return false;
      }
      return true;
    });

    // Hit Boss
    if (this.boss) {
      const dist = Math.hypot(slashX - this.boss.x, slashY - this.boss.y);
      if (dist < slashRange + 30) {
        this.boss.hp -= Math.floor(20 * this.player.power);
        this.createExplosion(slashX, slashY, '#ff2a5f');
        soundEngine.playHit();
      }
    }
  }

  damagePlayer() {
    if (this.player.invincibleTimer > 0) return;
    this.player.hp--;
    this.player.invincibleTimer = 60; // 1 sec invincibility
    soundEngine.playHit();
    this.updateHUD();

    if (this.player.hp <= 0) {
      this.gameOver();
    }
  }

  createExplosion(x, y, color) {
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        color: color,
        size: Math.random() * 5 + 2,
        life: 25
      });
    }
  }

  createJumpParticles(x, y) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 2,
        color: '#ffffff',
        size: Math.random() * 4 + 2,
        life: 15
      });
    }
  }

  updateHUD() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('youmu_high_score', this.highScore.toString());
    }

    this.scoreValEl.innerText = this.score.toString().padStart(9, '0');
    this.highScoreValEl.innerText = this.highScore.toString().padStart(9, '0');

    if (this.player) {
      this.powerValEl.innerText = `${this.player.power.toFixed(2)} / ${this.player.maxPower.toFixed(2)}`;

      // Hearts
      let heartsHtml = '';
      for (let i = 0; i < this.player.hp; i++) {
        heartsHtml += '<span class="icon-heart">♥</span>';
      }
      this.lifeContainerEl.innerHTML = heartsHtml;

      // Spells
      let spellsHtml = '';
      for (let i = 0; i < this.player.spells; i++) {
        spellsHtml += '<span class="icon-star">★</span>';
      }
      this.spellContainerEl.innerHTML = spellsHtml;
    }
  }

  gameOver() {
    this.state = 'GAMEOVER';
    soundEngine.stopBGM();
    this.resultTitleEl.innerText = 'GAME OVER';
    this.resultTitleEl.style.color = '#ff2a5f';
    this.finalScoreEl.innerText = this.score.toLocaleString();
    this.finalKillsEl.innerText = this.ghostsKilled.toString();
    this.resultScreenEl.classList.remove('hidden');
  }

  stageClear() {
    this.state = 'CLEAR';
    soundEngine.stopBGM();
    this.resultTitleEl.innerText = 'STAGE CLEAR!!';
    this.resultTitleEl.style.color = '#ffd166';
    this.finalScoreEl.innerText = this.score.toLocaleString();
    this.finalKillsEl.innerText = this.ghostsKilled.toString();
    this.resultScreenEl.classList.remove('hidden');
  }

  render() {
    // Clear Canvas
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Background Render (Hakugyokurou Cherry Blossom Shrine Stage)
    const bgGrad = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bgGrad.addColorStop(0, '#0d0714');
    bgGrad.addColorStop(0.7, '#1f1035');
    bgGrad.addColorStop(1, '#2d1442');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Moonlight & Cherry Blossoms Particles in BG
    this.ctx.fillStyle = 'rgba(255, 182, 193, 0.4)';
    for (let i = 0; i < 20; i++) {
      const petalX = (Math.sin(Date.now() / 1000 + i) * 100 + i * 50) % CANVAS_WIDTH;
      const petalY = (Date.now() / 20 + i * 30) % CANVAS_HEIGHT;
      this.ctx.beginPath();
      this.ctx.arc(petalX, petalY, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Shrine Ground Level
    this.ctx.fillStyle = '#150a21';
    this.ctx.fillRect(0, GROUND_Y + 20, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
    this.ctx.strokeStyle = '#ff7bb0';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, GROUND_Y + 20);
    this.ctx.lineTo(CANVAS_WIDTH, GROUND_Y + 20);
    this.ctx.stroke();

    // Render Entities
    this.items.forEach(item => Graphics.drawItem(this.ctx, item));
    this.bullets.forEach(bullet => Graphics.drawBullet(this.ctx, bullet));
    this.ghosts.forEach(ghost => Graphics.drawGhost(this.ctx, ghost));
    if (this.boss) Graphics.drawYuyuko(this.ctx, this.boss);

    if (this.player) {
      Graphics.drawYoumu(
        this.ctx,
        this.player.x,
        this.player.y,
        this.player.facingRight,
        this.player.isAttacking,
        this.player.attackFrame,
        this.player.invincibleTimer > 0
      );
    }

    // Render Particles
    this.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  loop() {
    this.update();
    this.render();
    requestAnimationFrame(this.loop);
  }
}

// Initialize Game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
