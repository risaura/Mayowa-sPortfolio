/* ═══════════════════════════════════════════
   GAMES v3 — 6 Mini-Games + Coin Rewards
   + Grim Reaper on Pong Loss
   ═══════════════════════════════════════════ */

const Games = {
    active: null,
    loop: null,
    canvas: null,
    ctx: null,
    _cleanup: null,

    launch(id) {
        this.stop();
        this.canvas = document.getElementById('miniGameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.active = id;
        Achievements.unlock('first_game');

        const titles = {
            flappy: '🐦 Flappy Bird', mario: '🍄 Super Mayowa', snake: '🍎 Snake', pong: '🏓 Pong',
            slither: '🐍 Slither Python', breakout: '🧱 Brick Breaker', invaders: '👾 Space Invaders'
        };
        document.getElementById('gamePlayTitle').textContent = titles[id] || '';
        document.getElementById('gamePlayScore').textContent = 'Score: 0';

        switch(id) {
            case 'flappy':   this.startFlappy(); break;
            case 'mario':    this.startMario(); break;
            case 'snake':    this.startSnake(); break;
            case 'pong':     this.startPong(); break;
            case 'slither':  this.startSlither(); break;
            case 'breakout': this.startBreakout(); break;
            case 'invaders': this.startInvaders(); break;
        }
    },

    stop() {
        if (this.loop) cancelAnimationFrame(this.loop);
        if (this._cleanup) this._cleanup();
        this._cleanup = null; this.active = null;
    },

    _score(s) { document.getElementById('gamePlayScore').textContent = 'Score: ' + s; },

    _awardCoin() {
        if (typeof App !== 'undefined') App.addCoin();
    },

    // ─── GRIM REAPER PIXEL ART ───
    drawReaper(ctx, cx, cy, t) {
        const s = 3;
        const bob = Math.sin(t * 3) * 4;
        ctx.save();
        ctx.translate(cx, cy + bob);

        const px = (x, y, w, h) => ctx.fillRect(x * s, y * s, w * s, h * s);

        // Cloak body (dark purple/gray)
        ctx.fillStyle = '#3a3a5c';
        px(-6, -4, 12, 16);
        px(-7, -2, 14, 12);
        px(-5, 12, 10, 4);

        // Hood
        ctx.fillStyle = '#2d2d4a';
        px(-5, -10, 10, 8);
        px(-6, -8, 12, 6);
        px(-7, -6, 14, 4);

        // Face shadow
        ctx.fillStyle = '#1a1a2e';
        px(-4, -7, 8, 5);

        // Eyes (glowing white)
        ctx.fillStyle = '#fff';
        px(-3, -6, 2, 2);
        px(1, -6, 2, 2);

        // Scythe handle
        ctx.fillStyle = '#4a2020';
        px(5, -14, 2, 22);
        ctx.fillStyle = '#6a3030';
        px(5, -14, 1, 22);

        // Scythe blade
        ctx.fillStyle = '#c0c0c0';
        px(3, -16, 6, 2);
        px(1, -14, 3, 2);
        px(-1, -12, 3, 2);
        // Blade edge highlight
        ctx.fillStyle = '#e0e0e0';
        px(3, -16, 6, 1);
        // Blade tip (red)
        ctx.fillStyle = '#8b0000';
        px(-1, -12, 1, 1);
        px(7, -16, 1, 1);

        // Cloak details (darker folds)
        ctx.fillStyle = '#2a2a44';
        px(-3, 4, 2, 8);
        px(2, 6, 2, 6);

        ctx.restore();
    },

    /* ═════════════════════════════
       1. FLAPPY BIRD (Realistic + Coins)
       ═════════════════════════════ */
    startFlappy() {
        const W = 480, H = 400, ctx = this.ctx;
        let bird = { x: 80, y: H/2, vel: 0, r: 13, wingAngle: 0 };
        let pipes = [], coins = [], score = 0, coinScore = 0, frame = 0, dead = false, coinGiven = false;
        const gap = 130, pipeW = 52, grav = 0.32, jump = -6, speed = 2.8;
        let clouds = [];
        for (let i = 0; i < 8; i++) clouds.push({ x: Math.random() * W * 2, y: 20 + Math.random() * 80, w: 40 + Math.random() * 60 });

        const spawn = () => {
            const top = 55 + Math.random() * (H - gap - 130);
            pipes.push({ x: W + 20, top, hit: false });
            // Coin in the gap
            coins.push({ x: W + 20 + pipeW / 2, y: top + gap / 2, r: 8, collected: false, angle: 0 });
            // Sometimes a bonus coin above or below
            if (Math.random() > 0.5) coins.push({ x: W + 60 + pipeW, y: 40 + Math.random() * (H - 100), r: 8, collected: false, angle: Math.random() * 6 });
        };
        spawn();

        const handle = (e) => {
            if (e.code === 'Space' || e.type === 'click') {
                e.preventDefault();
                if (dead) { bird = { x: 80, y: H/2, vel: 0, r: 13, wingAngle: 0 }; pipes = []; coins = []; score = 0; coinScore = 0; frame = 0; dead = false; coinGiven = false; spawn(); this._score(0); }
                else bird.vel = jump;
            }
        };
        this.canvas.addEventListener('click', handle);
        document.addEventListener('keydown', handle);

        const tick = () => {
            const t = performance.now() / 1000;

            // ── Sky gradient ──
            const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
            skyGrad.addColorStop(0, '#87CEEB'); skyGrad.addColorStop(0.6, '#B0E0E6'); skyGrad.addColorStop(1, '#E0F7FA');
            ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, W, H);

            // ── Clouds (parallax) ──
            clouds.forEach(c => {
                c.x -= speed * 0.3;
                if (c.x < -c.w) c.x = W + Math.random() * 100;
                ctx.fillStyle = 'rgba(255,255,255,0.8)';
                ctx.beginPath();
                ctx.arc(c.x, c.y, c.w * 0.25, 0, Math.PI * 2);
                ctx.arc(c.x + c.w * 0.2, c.y - c.w * 0.1, c.w * 0.3, 0, Math.PI * 2);
                ctx.arc(c.x + c.w * 0.5, c.y, c.w * 0.28, 0, Math.PI * 2);
                ctx.fill();
            });

            // ── City silhouette (parallax) ──
            ctx.fillStyle = 'rgba(100,130,150,0.2)';
            for (let i = 0; i < 20; i++) {
                const bx = ((i * 73 - frame * 0.3) % (W + 200)) - 50;
                const bh = 30 + (i * 17 % 60);
                ctx.fillRect(bx, H - 50 - bh, 25 + (i % 3) * 10, bh);
            }

            // ── Ground ──
            ctx.fillStyle = '#8BC34A'; ctx.fillRect(0, H - 50, W, 50);
            ctx.fillStyle = '#689F38'; ctx.fillRect(0, H - 50, W, 6);
            // Ground texture
            ctx.fillStyle = '#7CB342';
            for (let x = 0; x < W; x += 12) {
                const gx = (x + frame * speed) % W;
                ctx.fillRect(gx, H - 44, 6, 3);
            }

            if (!dead) {
                bird.vel += grav; bird.vel = Math.min(bird.vel, 10); bird.y += bird.vel; frame++;
                bird.wingAngle = Math.sin(frame * 0.25) * 0.6;
                if (bird.vel < 0) bird.wingAngle = -0.8; // wings up on flap

                if (frame % 85 === 0) spawn();

                pipes.forEach(p => p.x -= speed);
                coins.forEach(c => { c.x -= speed; c.angle += 0.08; });

                pipes.forEach(p => {
                    if (!p.hit && p.x + pipeW < bird.x) { score++; p.hit = true; this._score(score + (coinScore > 0 ? ' 🪙' + coinScore : '')); }
                    if (bird.x + bird.r > p.x && bird.x - bird.r < p.x + pipeW) {
                        if (bird.y - bird.r < p.top || bird.y + bird.r > p.top + gap) dead = true;
                    }
                });

                // Coin collection
                coins.forEach(c => {
                    if (c.collected) return;
                    const dx = bird.x - c.x, dy = bird.y - c.y;
                    if (Math.sqrt(dx * dx + dy * dy) < bird.r + c.r) {
                        c.collected = true; coinScore++;
                        this._score(score + ' 🪙' + coinScore);
                    }
                });

                pipes = pipes.filter(p => p.x > -pipeW - 20);
                coins = coins.filter(c => c.x > -20);

                if (bird.y > H - 50 || bird.y < 0) dead = true;
                if (dead) {
                    Achievements.check('flappy_10', score >= 10);
                    Achievements.check('flappy_25', score >= 25);
                    if ((score >= 10 || coinScore >= 5) && !coinGiven) { this._awardCoin(); coinGiven = true; }
                }
            }

            // ── Draw Pipes (3D-ish with highlights) ──
            pipes.forEach(p => {
                // Top pipe
                const pg = ctx.createLinearGradient(p.x, 0, p.x + pipeW, 0);
                pg.addColorStop(0, '#2E7D32'); pg.addColorStop(0.3, '#4CAF50'); pg.addColorStop(0.7, '#388E3C'); pg.addColorStop(1, '#1B5E20');
                ctx.fillStyle = pg;
                ctx.fillRect(p.x, 0, pipeW, p.top);
                ctx.fillRect(p.x, p.top + gap, pipeW, H - 50 - p.top - gap);
                // Pipe caps
                ctx.fillStyle = '#1B5E20';
                ctx.fillRect(p.x - 4, p.top - 18, pipeW + 8, 18);
                ctx.fillRect(p.x - 4, p.top + gap, pipeW + 8, 18);
                // Cap highlights
                ctx.fillStyle = '#66BB6A';
                ctx.fillRect(p.x - 2, p.top - 16, 6, 14);
                ctx.fillRect(p.x - 2, p.top + gap + 2, 6, 14);
                // Pipe shine
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                ctx.fillRect(p.x + 4, 0, 8, p.top);
                ctx.fillRect(p.x + 4, p.top + gap, 8, H - 50 - p.top - gap);
            });

            // ── Draw Coins ──
            coins.forEach(c => {
                if (c.collected) return;
                ctx.save();
                ctx.translate(c.x, c.y);
                const scaleX = Math.cos(c.angle); // spinning effect
                ctx.scale(scaleX, 1);
                // Glow
                ctx.fillStyle = 'rgba(255,215,0,0.3)';
                ctx.beginPath(); ctx.arc(0, 0, c.r + 4, 0, Math.PI * 2); ctx.fill();
                // Coin body
                ctx.fillStyle = '#FFD700';
                ctx.beginPath(); ctx.arc(0, 0, c.r, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#FFA000';
                ctx.beginPath(); ctx.arc(0, 0, c.r - 2, 0, Math.PI * 2); ctx.fill();
                // Dollar sign
                ctx.fillStyle = '#FFD700'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('$', 0, 1);
                ctx.restore();
            });

            // ── Draw Bird (realistic) ──
            ctx.save();
            ctx.translate(bird.x, bird.y);
            const rot = Math.min(Math.max(bird.vel * 4, -35), 70) * Math.PI / 180;
            ctx.rotate(rot);

            // Body
            ctx.fillStyle = '#F9A825';
            ctx.beginPath(); ctx.ellipse(0, 0, bird.r + 3, bird.r, 0, 0, Math.PI * 2); ctx.fill();
            // Belly
            ctx.fillStyle = '#FFF9C4';
            ctx.beginPath(); ctx.ellipse(2, 3, bird.r - 2, bird.r - 5, 0, 0, Math.PI * 2); ctx.fill();

            // Wing
            ctx.save();
            ctx.rotate(bird.wingAngle);
            ctx.fillStyle = '#F57F17';
            ctx.beginPath(); ctx.ellipse(-4, 2, 10, 5, -0.3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FF8F00';
            ctx.beginPath(); ctx.ellipse(-6, 3, 7, 3, -0.3, 0, Math.PI * 2); ctx.fill();
            ctx.restore();

            // Eye (white + pupil)
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(7, -5, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#111';
            ctx.beginPath(); ctx.arc(8, -5, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(9, -6, 1, 0, Math.PI * 2); ctx.fill();

            // Beak
            ctx.fillStyle = '#E65100';
            ctx.beginPath(); ctx.moveTo(13, -2); ctx.lineTo(22, 1); ctx.lineTo(13, 4); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#BF360C';
            ctx.beginPath(); ctx.moveTo(13, 1); ctx.lineTo(22, 1); ctx.lineTo(13, 4); ctx.closePath(); ctx.fill();

            // Tail feathers
            ctx.fillStyle = '#E65100';
            ctx.beginPath(); ctx.ellipse(-12, -2, 6, 3, -0.4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#F57F17';
            ctx.beginPath(); ctx.ellipse(-10, 0, 5, 2.5, -0.2, 0, Math.PI * 2); ctx.fill();

            ctx.restore();

            // ── Score display ──
            ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.font = 'bold 24px "Press Start 2P"'; ctx.textAlign = 'center';
            ctx.fillText(score, W / 2 + 2, 38);
            ctx.fillStyle = '#fff';
            ctx.fillText(score, W / 2, 36);
            if (coinScore > 0) {
                ctx.fillStyle = '#FFD700'; ctx.font = 'bold 12px "Press Start 2P"';
                ctx.fillText('🪙 ' + coinScore, W / 2, 56);
            }

            if (dead) {
                ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
                ctx.fillStyle = '#FF5252'; ctx.font = 'bold 20px "Press Start 2P"'; ctx.textAlign = 'center';
                ctx.fillText('GAME OVER', W / 2, H / 2 - 25);
                ctx.fillStyle = '#fff'; ctx.font = '12px "Press Start 2P"';
                ctx.fillText('Score: ' + score + '  Coins: ' + coinScore, W / 2, H / 2 + 5);
                if (score >= 10 || coinScore >= 5) { ctx.fillStyle = '#FFD54F'; ctx.fillText('🪙 +1 Portfolio Coin!', W / 2, H / 2 + 30); }
                ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '9px "Press Start 2P"';
                ctx.fillText('Click/Space to restart', W / 2, H / 2 + 55);
            }
            this.loop = requestAnimationFrame(tick);
        };
        tick();
        this._cleanup = () => { this.canvas.removeEventListener('click', handle); document.removeEventListener('keydown', handle); };
    },

    /* ═════════════════════════════
       1b. SUPER MAYOWA (Mario-style Platformer)
       ═════════════════════════════ */
    startMario() {
        const W = 480, H = 400, ctx = this.ctx;
        const TILE = 24, GRAV = 0.5, JUMP = -10, SPEED = 3.5;
        let camX = 0, score = 0, dead = false, won = false, coinGiven = false;
        const WORLD_W = TILE * 120; // wide level

        // Player
        let p = { x: 60, y: H - TILE * 3, vx: 0, vy: 0, dir: 1, grounded: false, frame: 0 };

        // Generate platforms
        let platforms = [];
        // Ground
        for (let x = 0; x < WORLD_W; x += TILE) {
            if (x > TILE * 25 && x < TILE * 28) continue; // pit
            if (x > TILE * 55 && x < TILE * 57) continue; // pit 2
            platforms.push({ x, y: H - TILE, w: TILE, h: TILE, type: 'ground' });
            platforms.push({ x, y: H - TILE * 2, w: TILE, h: TILE, type: 'ground2' });
        }
        // Floating platforms
        const floats = [
            [8,8,4],[14,6,3],[20,9,2],[30,7,5],[38,5,3],[45,8,4],[50,6,3],
            [60,7,6],[68,5,3],[75,8,4],[82,6,5],[90,4,3],[95,7,4],[100,5,6],[108,8,3],[115,6,4]
        ];
        floats.forEach(([tx, ty, tw]) => {
            for (let i = 0; i < tw; i++) platforms.push({ x: (tx + i) * TILE, y: H - ty * TILE, w: TILE, h: TILE, type: 'brick' });
        });
        // Question blocks with coins
        let qBlocks = [];
        [[10,7],[16,5],[22,8],[35,6],[42,7],[52,5],[62,6],[72,7],[85,5],[97,6],[110,7]].forEach(([tx,ty]) => {
            qBlocks.push({ x: tx * TILE, y: H - ty * TILE, w: TILE, h: TILE, hit: false, bounceY: 0 });
        });
        // Coins
        let mCoins = [];
        for (let i = 0; i < 50; i++) {
            const cx = 120 + i * 55 + Math.random() * 30;
            const cy = H - TILE * (3 + Math.floor(Math.random() * 6));
            mCoins.push({ x: cx, y: cy, r: 6, collected: false, sparkle: 0 });
        }
        // Goombas
        let goombas = [];
        [[12,3],[24,3],[36,3],[48,3],[58,3],[70,3],[80,3],[92,3],[105,3]].forEach(([tx,ty]) => {
            goombas.push({ x: tx * TILE, y: H - ty * TILE, vx: -1, w: TILE, h: TILE, alive: true });
        });
        // Flag at end
        const flag = { x: TILE * 117, y: H - TILE * 10 };

        const keys = {};
        const kd = (e) => {
            keys[e.code] = true;
            if (dead || won) {
                if (e.code === 'Space') {
                    // Reset
                    p = { x: 60, y: H - TILE * 3, vx: 0, vy: 0, dir: 1, grounded: false, frame: 0 };
                    camX = 0; score = 0; dead = false; won = false; coinGiven = false;
                    mCoins.forEach(c => { c.collected = false; c.sparkle = 0; });
                    goombas.forEach(g => { g.alive = true; g.x = g._ox; });
                    qBlocks.forEach(q => { q.hit = false; });
                    this._score(0);
                }
            }
            if (['ArrowLeft','ArrowRight','ArrowUp','Space'].includes(e.code)) e.preventDefault();
        };
        const ku = (e) => { keys[e.code] = false; };
        document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
        goombas.forEach(g => g._ox = g.x);

        const collideRect = (ax, ay, aw, ah, bx, by, bw, bh) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

        const tick = () => {
            const t = performance.now() / 1000;

            if (!dead && !won) {
                // Movement
                if (keys.ArrowLeft || keys.KeyA) { p.vx = -SPEED; p.dir = -1; }
                else if (keys.ArrowRight || keys.KeyD) { p.vx = SPEED; p.dir = 1; }
                else p.vx *= 0.7;
                if ((keys.ArrowUp || keys.Space || keys.KeyW) && p.grounded) { p.vy = JUMP; p.grounded = false; }

                p.vy += GRAV;
                p.x += p.vx; p.y += p.vy;
                p.grounded = false;

                // Platform collision
                const allPlats = [...platforms, ...qBlocks];
                allPlats.forEach(plat => {
                    if (!collideRect(p.x - 10, p.y - 20, 20, 28, plat.x, plat.y, plat.w, plat.h)) return;
                    // From above
                    if (p.vy > 0 && p.y - 10 < plat.y) {
                        p.y = plat.y - 8; p.vy = 0; p.grounded = true;
                    }
                    // From below (question block)
                    else if (p.vy < 0 && p.y > plat.y + plat.h / 2) {
                        p.y = plat.y + plat.h + 20; p.vy = 1;
                        if (plat.hit !== undefined && !plat.hit) {
                            plat.hit = true; plat.bounceY = -6; score += 50;
                            this._score(score);
                        }
                    }
                });

                // Coins
                mCoins.forEach(c => {
                    if (c.collected) return;
                    const dx = p.x - c.x, dy = (p.y - 10) - c.y;
                    if (Math.sqrt(dx * dx + dy * dy) < 18) { c.collected = true; c.sparkle = t; score += 10; this._score(score); }
                });

                // Goombas
                goombas.forEach(g => {
                    if (!g.alive) return;
                    g.x += g.vx;
                    // Reverse at edges or platforms
                    const onGround = platforms.some(pl => collideRect(g.x, g.y + 1, g.w, g.h, pl.x, pl.y, pl.w, pl.h));
                    const atEdge = !platforms.some(pl => collideRect(g.x + g.vx * 10, g.y + 1, g.w, g.h, pl.x, pl.y, pl.w, pl.h));
                    if (atEdge && onGround) g.vx *= -1;

                    if (collideRect(p.x - 10, p.y - 20, 20, 28, g.x, g.y, g.w, g.h)) {
                        if (p.vy > 0 && p.y - 10 < g.y + 5) {
                            g.alive = false; p.vy = -7; score += 100; this._score(score);
                        } else {
                            dead = true;
                        }
                    }
                });

                // Pits
                if (p.y > H + 50) dead = true;
                // Clamp
                p.x = Math.max(10, Math.min(WORLD_W - 10, p.x));

                // Flag
                if (p.x > flag.x - 10) {
                    won = true;
                    if (!coinGiven) { this._awardCoin(); coinGiven = true; }
                }

                if (Math.abs(p.vx) > 0.5) p.frame += 0.2;
            }

            // Q-block bounce
            qBlocks.forEach(q => { if (q.bounceY < 0) q.bounceY += 0.8; else q.bounceY = 0; });

            // Camera
            const targetCam = p.x - W / 3;
            camX += (targetCam - camX) * 0.1;
            camX = Math.max(0, Math.min(WORLD_W - W, camX));

            // ── Draw ──
            // Sky
            const skyG = ctx.createLinearGradient(0, 0, 0, H);
            skyG.addColorStop(0, '#6BB5FF'); skyG.addColorStop(1, '#B8E0FF');
            ctx.fillStyle = skyG; ctx.fillRect(0, 0, W, H);

            // Background hills
            ctx.fillStyle = 'rgba(76,175,80,0.25)';
            for (let x = -50; x < W + 50; x += 3) {
                const wx = x + camX * 0.2;
                ctx.fillRect(x, H - 80 + Math.sin(wx * 0.008) * 30, 3, 200);
            }

            // Platforms
            platforms.forEach(pl => {
                const sx = pl.x - camX;
                if (sx < -TILE || sx > W + TILE) return;
                if (pl.type === 'ground') { ctx.fillStyle = '#8BC34A'; ctx.fillRect(sx, pl.y, pl.w, pl.h); ctx.fillStyle = '#689F38'; ctx.fillRect(sx, pl.y, pl.w, 3); }
                else if (pl.type === 'ground2') { ctx.fillStyle = '#795548'; ctx.fillRect(sx, pl.y, pl.w, pl.h); ctx.strokeStyle = '#5D4037'; ctx.strokeRect(sx, pl.y, pl.w, pl.h); }
                else { ctx.fillStyle = '#8D6E63'; ctx.fillRect(sx, pl.y, pl.w, pl.h); ctx.strokeStyle = '#5D4037'; ctx.lineWidth = 1; ctx.strokeRect(sx, pl.y, pl.w, pl.h);
                    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(sx + 2, pl.y + 2, pl.w - 4, 3); }
            });

            // Q blocks
            qBlocks.forEach(q => {
                const sx = q.x - camX, sy = q.y + q.bounceY;
                if (sx < -TILE || sx > W + TILE) return;
                ctx.fillStyle = q.hit ? '#9E9E9E' : '#FFB300';
                ctx.fillRect(sx, sy, q.w, q.h);
                ctx.strokeStyle = q.hit ? '#757575' : '#FF8F00'; ctx.lineWidth = 2; ctx.strokeRect(sx, sy, q.w, q.h);
                if (!q.hit) { ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('?', sx + TILE / 2, sy + TILE - 6); }
            });

            // Coins
            mCoins.forEach(c => {
                const sx = c.x - camX;
                if (sx < -10 || sx > W + 10 || c.collected) {
                    // Sparkle effect
                    if (c.collected && t - c.sparkle < 0.5) {
                        ctx.fillStyle = '#FFD700'; ctx.font = '12px serif'; ctx.textAlign = 'center';
                        ctx.globalAlpha = 1 - (t - c.sparkle) * 2;
                        ctx.fillText('✨', sx, c.y - (t - c.sparkle) * 40);
                        ctx.globalAlpha = 1;
                    }
                    return;
                }
                const sc = Math.cos(t * 4 + c.x * 0.01);
                ctx.save(); ctx.translate(sx, c.y); ctx.scale(sc, 1);
                ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(0, 0, c.r, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#FFA000'; ctx.beginPath(); ctx.arc(0, 0, c.r - 2, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            });

            // Goombas
            goombas.forEach(g => {
                if (!g.alive) return;
                const sx = g.x - camX;
                if (sx < -TILE || sx > W + TILE) return;
                // Body
                ctx.fillStyle = '#8D6E63'; ctx.beginPath(); ctx.arc(sx + TILE / 2, g.y + TILE * 0.4, TILE * 0.45, 0, Math.PI * 2); ctx.fill();
                // Head/cap
                ctx.fillStyle = '#5D4037'; ctx.beginPath(); ctx.ellipse(sx + TILE / 2, g.y + TILE * 0.25, TILE * 0.5, TILE * 0.3, 0, Math.PI, 0); ctx.fill();
                // Eyes
                ctx.fillStyle = '#fff'; ctx.fillRect(sx + 6, g.y + 6, 4, 5); ctx.fillRect(sx + 14, g.y + 6, 4, 5);
                ctx.fillStyle = '#111'; ctx.fillRect(sx + 7, g.y + 8, 2, 3); ctx.fillRect(sx + 15, g.y + 8, 2, 3);
                // Feet
                ctx.fillStyle = '#111';
                const legOff = Math.sin(t * 5) * 2;
                ctx.fillRect(sx + 3, g.y + TILE - 5 + legOff, 6, 5);
                ctx.fillRect(sx + TILE - 9, g.y + TILE - 5 - legOff, 6, 5);
            });

            // Flag
            const fx = flag.x - camX;
            if (fx > -20 && fx < W + 20) {
                ctx.fillStyle = '#9E9E9E'; ctx.fillRect(fx, flag.y, 4, H - TILE * 2 - flag.y);
                ctx.fillStyle = '#F44336';
                ctx.beginPath(); ctx.moveTo(fx + 4, flag.y); ctx.lineTo(fx + 30, flag.y + 15); ctx.lineTo(fx + 4, flag.y + 30); ctx.closePath(); ctx.fill();
                // Flag text
                ctx.fillStyle = '#fff'; ctx.font = 'bold 7px "Press Start 2P"'; ctx.textAlign = 'left';
                ctx.fillText('GOAL', fx + 7, flag.y + 19);
            }

            // Player
            const psx = p.x - camX;
            ctx.save(); ctx.translate(psx, p.y);
            if (p.dir === -1) ctx.scale(-1, 1);
            const legAnim = Math.abs(p.vx) > 0.5 ? Math.sin(p.frame) * 3 : 0;
            // Head
            ctx.fillStyle = '#8D6E4C'; ctx.fillRect(-6, -22, 12, 10);
            // Hair
            ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-7, -24, 14, 5); ctx.fillRect(-7, -22, 2, 6);
            // Eyes
            ctx.fillStyle = '#fff'; ctx.fillRect(1, -19, 3, 3);
            ctx.fillStyle = '#111'; ctx.fillRect(2, -18, 2, 2);
            // Body
            ctx.fillStyle = '#FF9800'; ctx.fillRect(-6, -12, 12, 8);
            ctx.fillStyle = '#FFD54F'; ctx.fillRect(-5, -9, 10, 1);
            // Legs
            ctx.fillStyle = '#1565C0';
            ctx.fillRect(-5, -4 + legAnim, 4, 6);
            ctx.fillRect(1, -4 - legAnim, 4, 6);
            // Shoes
            ctx.fillStyle = '#4E342E';
            ctx.fillRect(-6, 2 + legAnim, 5, 3);
            ctx.fillRect(1, 2 - legAnim, 5, 3);
            ctx.restore();

            // HUD
            ctx.fillStyle = '#fff'; ctx.font = 'bold 10px "Press Start 2P"'; ctx.textAlign = 'left';
            ctx.fillText('SCORE: ' + score, 10, 22);

            if (dead) {
                ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H);
                this.drawReaper(ctx, W / 2, H / 2 - 50, t);
                ctx.fillStyle = '#FF5252'; ctx.font = 'bold 14px "Press Start 2P"'; ctx.textAlign = 'center';
                ctx.fillText('GAME OVER', W / 2, H / 2 + 35);
                ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '9px "Press Start 2P"';
                ctx.fillText('Space to restart', W / 2, H / 2 + 60);
            }
            if (won) {
                ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
                ctx.fillStyle = '#4DB6AC'; ctx.font = 'bold 18px "Press Start 2P"'; ctx.textAlign = 'center';
                ctx.fillText('LEVEL COMPLETE!', W / 2, H / 2 - 20);
                ctx.fillStyle = '#FFD54F'; ctx.font = '12px "Press Start 2P"';
                ctx.fillText('Score: ' + score + '  🪙 +1 Coin!', W / 2, H / 2 + 10);
                ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '9px "Press Start 2P"';
                ctx.fillText('Space to restart', W / 2, H / 2 + 35);
            }

            this.loop = requestAnimationFrame(tick);
        };
        tick();
        this._cleanup = () => { document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); };
    },

    /* ═════════════════════════════
       2. SNAKE
       ═════════════════════════════ */
    startSnake() {
        const W=480,H=400,grid=20,cols=W/grid,rows=H/grid,ctx=this.ctx;
        let snake=[{x:10,y:10}],dir={x:1,y:0},next={x:1,y:0};
        let apple,score=0,dead=false,last=0,coinGiven=false;

        const spawnApple=()=>{let a;do{a={x:Math.floor(Math.random()*cols),y:Math.floor(Math.random()*rows)};}while(snake.some(s=>s.x===a.x&&s.y===a.y));return a;};
        apple=spawnApple();

        const handle=(e)=>{
            if(dead&&e.code==='Space'){snake=[{x:10,y:10}];dir={x:1,y:0};next={x:1,y:0};apple=spawnApple();score=0;dead=false;coinGiven=false;this._score(0);return;}
            switch(e.code){
                case'ArrowUp':case'KeyW':if(!dir.y){next={x:0,y:-1};e.preventDefault();}break;
                case'ArrowDown':case'KeyS':if(!dir.y){next={x:0,y:1};e.preventDefault();}break;
                case'ArrowLeft':case'KeyA':if(!dir.x){next={x:-1,y:0};e.preventDefault();}break;
                case'ArrowRight':case'KeyD':if(!dir.x){next={x:1,y:0};e.preventDefault();}break;
            }
        };
        document.addEventListener('keydown',handle);

        const tick=(now)=>{
            if(!dead&&now-last>100){
                last=now;dir=next;
                const head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
                if(head.x<0||head.x>=cols||head.y<0||head.y>=rows||snake.some(s=>s.x===head.x&&s.y===head.y)){
                    dead=true;
                    Achievements.check('snake_50',score>=50);Achievements.check('snake_100',score>=100);
                    if(score>=20&&!coinGiven){this._awardCoin();coinGiven=true;}
                }else{
                    snake.unshift(head);
                    if(head.x===apple.x&&head.y===apple.y){score++;this._score(score);apple=spawnApple();}
                    else snake.pop();
                }
            }
            ctx.fillStyle='#060612';ctx.fillRect(0,0,W,H);
            ctx.strokeStyle='rgba(255,255,255,0.03)';
            for(let x=0;x<cols;x++){ctx.beginPath();ctx.moveTo(x*grid,0);ctx.lineTo(x*grid,H);ctx.stroke();}
            for(let y=0;y<rows;y++){ctx.beginPath();ctx.moveTo(0,y*grid);ctx.lineTo(W,y*grid);ctx.stroke();}

            ctx.fillStyle='#FF5252';ctx.shadowColor='#FF5252';ctx.shadowBlur=10;
            ctx.beginPath();ctx.arc(apple.x*grid+grid/2,apple.y*grid+grid/2,grid/2-2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;

            snake.forEach((s,i)=>{const r=1-i/snake.length;ctx.fillStyle=`hsl(${150+r*40},75%,${35+r*25}%)`;ctx.beginPath();ctx.roundRect(s.x*grid+1,s.y*grid+1,grid-2,grid-2,3);ctx.fill();});

            if(dead){
                ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,0,W,H);
                ctx.fillStyle='#FF5252';ctx.font='bold 20px "Press Start 2P"';ctx.textAlign='center';
                ctx.fillText('GAME OVER',W/2,H/2-15);
                ctx.fillStyle='#4DB6AC';ctx.font='12px "Press Start 2P"';ctx.fillText('Score: '+score,W/2,H/2+15);
                if(score>=20){ctx.fillStyle='#FFD54F';ctx.fillText('🪙 +1 Coin!',W/2,H/2+38);}
                ctx.fillStyle='rgba(255,255,255,0.4)';ctx.font='9px "Press Start 2P"';ctx.fillText('Space to restart',W/2,H/2+60);
            }
            this.loop=requestAnimationFrame(tick);
        };
        tick(performance.now());
        this._cleanup=()=>document.removeEventListener('keydown',handle);
    },

    /* ═════════════════════════════
       3. PONG — Grim Reaper on loss
       ═════════════════════════════ */
    startPong() {
        const W=480,H=400,padH=80,padW=12,ballR=7,ctx=this.ctx;
        let p={y:H/2-padH/2,score:0};
        let ai={y:H/2-padH/2,score:0,speed:3.2};
        let ball={x:W/2,y:H/2,vx:4,vy:2};
        let dead=false,winner='',coinGiven=false,deathTime=0;
        const keys={};

        const resetBall=(d)=>{ball={x:W/2,y:H/2,vx:4*d,vy:(Math.random()-0.5)*4};};
        const kd=(e)=>{keys[e.code]=true;if(dead&&e.code==='Space'){p.score=0;ai.score=0;dead=false;winner='';coinGiven=false;resetBall(1);this._score(0);}if(['ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();};
        const ku=(e)=>{keys[e.code]=false;};
        document.addEventListener('keydown',kd);document.addEventListener('keyup',ku);

        const tick=()=>{
            const t = performance.now()/1000;
            if(!dead){
                if(keys.ArrowUp||keys.KeyW)p.y-=5;if(keys.ArrowDown||keys.KeyS)p.y+=5;
                p.y=Math.max(0,Math.min(H-padH,p.y));
                const ac=ai.y+padH/2;
                if(ball.y<ac-10)ai.y-=ai.speed;if(ball.y>ac+10)ai.y+=ai.speed;
                ai.y=Math.max(0,Math.min(H-padH,ai.y));
                ball.x+=ball.vx;ball.y+=ball.vy;
                if(ball.y-ballR<0||ball.y+ballR>H)ball.vy*=-1;
                if(ball.x-ballR<20+padW&&ball.y>p.y&&ball.y<p.y+padH&&ball.vx<0){ball.vx*=-1.05;ball.vy+=(ball.y-(p.y+padH/2))*0.08;}
                if(ball.x+ballR>W-20-padW&&ball.y>ai.y&&ball.y<ai.y+padH&&ball.vx>0){ball.vx*=-1.05;ball.vy+=(ball.y-(ai.y+padH/2))*0.08;}
                if(ball.x<0){ai.score++;this._score(p.score+' - '+ai.score);resetBall(1);}
                if(ball.x>W){p.score++;this._score(p.score+' - '+ai.score);resetBall(-1);}
                if(p.score>=5){dead=true;winner='win';deathTime=t;Achievements.unlock('pong_win');if(!coinGiven){this._awardCoin();coinGiven=true;}}
                if(ai.score>=5){dead=true;winner='lose';deathTime=t;}
            }

            ctx.fillStyle='#060612';ctx.fillRect(0,0,W,H);
            ctx.setLineDash([6,6]);ctx.strokeStyle='rgba(255,255,255,0.08)';
            ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke();ctx.setLineDash([]);

            ctx.shadowColor='#00E5FF';ctx.shadowBlur=12;ctx.fillStyle='#00E5FF';
            ctx.fillRect(20,p.y,padW,padH);
            ctx.shadowColor='#D500F9';ctx.fillStyle='#D500F9';
            ctx.fillRect(W-20-padW,ai.y,padW,padH);ctx.shadowBlur=0;

            ctx.fillStyle='#fff';ctx.shadowColor='#fff';ctx.shadowBlur=15;
            ctx.beginPath();ctx.arc(ball.x,ball.y,ballR,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;

            ctx.fillStyle='rgba(255,255,255,0.15)';ctx.font='bold 36px "Press Start 2P"';ctx.textAlign='center';
            ctx.fillText(p.score,W/4,55);ctx.fillText(ai.score,3*W/4,55);

            if(dead){
                ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,W,H);

                if(winner==='win'){
                    ctx.fillStyle='#4DB6AC';ctx.font='bold 18px "Press Start 2P"';
                    ctx.fillText('YOU WIN!',W/2,H/2-30);
                    ctx.fillStyle='#FFD54F';ctx.font='12px "Press Start 2P"';
                    ctx.fillText('🪙 +1 Coin!',W/2,H/2);
                } else {
                    // Grim Reaper animation
                    this.drawReaper(ctx, W/2, H/2 - 50, t);
                    ctx.fillStyle='#FF5252';ctx.font='bold 14px "Press Start 2P"';
                    ctx.fillText('The computer beat you!',W/2,H/2+40);
                }
                ctx.fillStyle='rgba(255,255,255,0.4)';ctx.font='9px "Press Start 2P"';
                ctx.fillText('Space to restart',W/2,H/2+70);
            }
            this.loop=requestAnimationFrame(tick);
        };
        tick();
        this._cleanup=()=>{document.removeEventListener('keydown',kd);document.removeEventListener('keyup',ku);};
    },

    /* ═════════════════════════════
       4. SLITHER PYTHON
       ═════════════════════════════ */
    startSlither() {
        const W=480,H=400,ctx=this.ctx;
        let segments=[];for(let i=0;i<20;i++)segments.push({x:W/2-i*3,y:H/2});
        let angle=0,speed=2.5,score=0,coinGiven=false;
        let orbs=[];
        const spawnOrbs=(n)=>{for(let i=0;i<n;i++)orbs.push({x:30+Math.random()*(W-60),y:30+Math.random()*(H-60),r:4+Math.random()*4,hue:Math.random()*360});};
        spawnOrbs(20);

        const keys={};
        const kd=(e)=>{keys[e.code]=true;if(['ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();};
        const ku=(e)=>{keys[e.code]=false;};
        document.addEventListener('keydown',kd);document.addEventListener('keyup',ku);

        const tick=()=>{
            if(keys.ArrowLeft)angle-=0.06;if(keys.ArrowRight)angle+=0.06;
            const head=segments[0];
            const nx=head.x+Math.cos(angle)*speed,ny=head.y+Math.sin(angle)*speed;
            const hx=((nx%W)+W)%W,hy=((ny%H)+H)%H;
            segments.unshift({x:hx,y:hy});segments.pop();

            orbs=orbs.filter(o=>{
                const dx=hx-o.x,dy=hy-o.y;
                if(Math.sqrt(dx*dx+dy*dy)<o.r+8){
                    score+=Math.round(o.r*5);this._score(score);
                    for(let i=0;i<3;i++)segments.push({...segments[segments.length-1]});
                    Achievements.check('slither_500',score>=500);
                    if(score>=200&&!coinGiven){this._awardCoin();coinGiven=true;}
                    return false;
                }return true;
            });
            if(orbs.length<8)spawnOrbs(5);

            ctx.fillStyle='#060610';ctx.fillRect(0,0,W,H);
            ctx.strokeStyle='rgba(255,255,255,0.02)';
            for(let x=0;x<W;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
            for(let y=0;y<H;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

            orbs.forEach(o=>{
                ctx.fillStyle=`hsla(${o.hue},80%,60%,0.8)`;ctx.shadowColor=`hsla(${o.hue},80%,60%,0.6)`;ctx.shadowBlur=8;
                ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.fill();
            });ctx.shadowBlur=0;

            segments.forEach((s,i)=>{
                const ratio=1-i/segments.length;const size=5+ratio*6;
                const dark=i%4<2;
                ctx.fillStyle=dark?`hsl(40,${30+ratio*20}%,${20+ratio*15}%)`:`hsl(45,${40+ratio*20}%,${35+ratio*20}%)`;
                ctx.beginPath();ctx.arc(s.x,s.y,size,0,Math.PI*2);ctx.fill();
            });

            if(segments.length>0){
                const h=segments[0];
                ctx.fillStyle='#5D4037';ctx.beginPath();ctx.arc(h.x,h.y,10,0,Math.PI*2);ctx.fill();
                const ex1=h.x+Math.cos(angle-0.5)*7,ey1=h.y+Math.sin(angle-0.5)*7;
                const ex2=h.x+Math.cos(angle+0.5)*7,ey2=h.y+Math.sin(angle+0.5)*7;
                ctx.fillStyle='#FFD54F';ctx.beginPath();ctx.arc(ex1,ey1,3,0,Math.PI*2);ctx.fill();
                ctx.beginPath();ctx.arc(ex2,ey2,3,0,Math.PI*2);ctx.fill();
                ctx.fillStyle='#111';
                ctx.beginPath();ctx.arc(ex1+Math.cos(angle)*1.2,ey1+Math.sin(angle)*1.2,1.5,0,Math.PI*2);ctx.fill();
                ctx.beginPath();ctx.arc(ex2+Math.cos(angle)*1.2,ey2+Math.sin(angle)*1.2,1.5,0,Math.PI*2);ctx.fill();
                ctx.strokeStyle='#FF5252';ctx.lineWidth=1.5;
                ctx.beginPath();ctx.moveTo(h.x+Math.cos(angle)*10,h.y+Math.sin(angle)*10);
                ctx.lineTo(h.x+Math.cos(angle)*14,h.y+Math.sin(angle)*14);ctx.stroke();
            }

            ctx.fillStyle='#fff';ctx.font='bold 10px "Press Start 2P"';ctx.textAlign='left';
            ctx.fillText('Score: '+score,10,22);
            ctx.fillStyle='rgba(255,255,255,0.3)';ctx.font='8px "Press Start 2P"';
            ctx.fillText('Length: '+segments.length,10,38);

            this.loop=requestAnimationFrame(tick);
        };
        tick();
        this._cleanup=()=>{document.removeEventListener('keydown',kd);document.removeEventListener('keyup',ku);};
    },

    /* ═════════════════════════════
       5. BRICK BREAKER
       ═════════════════════════════ */
    startBreakout() {
        const W=480,H=400,ctx=this.ctx;
        const padW=80,padH=10,ballR=6;
        let padX=W/2-padW/2;
        let ball={x:W/2,y:H-40,vx:3,vy:-3};
        let score=0,dead=false,cleared=false,coinGiven=false;

        const brickR=6,brickC=10,brickW=44,brickH=16,brickP=2;
        let bricks=[];
        const colors=['#FF5252','#FF7043','#FFC107','#66BB6A','#42A5F5','#AB47BC'];
        for(let r=0;r<brickR;r++)for(let c=0;c<brickC;c++){
            bricks.push({x:c*(brickW+brickP)+4,y:r*(brickH+brickP)+40,w:brickW,h:brickH,color:colors[r],alive:true});
        }

        let mouseX=padX+padW/2;const keys={};
        const mm=(e)=>{const rect=this.canvas.getBoundingClientRect();mouseX=(e.clientX-rect.left)/rect.width*W;};
        const kd=(e)=>{
            keys[e.code]=true;
            if((dead||cleared)&&e.code==='Space'){padX=W/2-padW/2;ball={x:W/2,y:H-40,vx:3,vy:-3};score=0;dead=false;cleared=false;coinGiven=false;bricks.forEach(b=>b.alive=true);this._score(0);}
            if(['ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
        };
        const ku=(e)=>{keys[e.code]=false;};
        this.canvas.addEventListener('mousemove',mm);document.addEventListener('keydown',kd);document.addEventListener('keyup',ku);

        const tick=()=>{
            if(!dead&&!cleared){
                if(keys.ArrowLeft)padX-=6;if(keys.ArrowRight)padX+=6;
                padX=mouseX-padW/2;padX=Math.max(0,Math.min(W-padW,padX));
                ball.x+=ball.vx;ball.y+=ball.vy;
                if(ball.x-ballR<0||ball.x+ballR>W)ball.vx*=-1;
                if(ball.y-ballR<0)ball.vy*=-1;
                if(ball.y+ballR>H)dead=true;
                if(ball.vy>0&&ball.y+ballR>=H-25&&ball.x>padX&&ball.x<padX+padW){ball.vy=-Math.abs(ball.vy);ball.vx+=(ball.x-(padX+padW/2))*0.08;}
                bricks.forEach(b=>{
                    if(!b.alive)return;
                    if(ball.x+ballR>b.x&&ball.x-ballR<b.x+b.w&&ball.y+ballR>b.y&&ball.y-ballR<b.y+b.h){b.alive=false;score+=10;this._score(score);ball.vy*=-1;}
                });
                if(bricks.every(b=>!b.alive)){cleared=true;Achievements.unlock('breakout_clr');if(!coinGiven){this._awardCoin();coinGiven=true;}}
            }
            ctx.fillStyle='#060612';ctx.fillRect(0,0,W,H);
            bricks.forEach(b=>{if(!b.alive)return;ctx.fillStyle=b.color;ctx.fillRect(b.x,b.y,b.w,b.h);ctx.fillStyle='rgba(255,255,255,0.15)';ctx.fillRect(b.x,b.y,b.w,3);});
            ctx.fillStyle='#fff';ctx.shadowColor='#00E5FF';ctx.shadowBlur=10;ctx.fillRect(padX,H-25,padW,padH);ctx.shadowBlur=0;
            ctx.fillStyle='#FFD54F';ctx.shadowColor='#FFD54F';ctx.shadowBlur=12;ctx.beginPath();ctx.arc(ball.x,ball.y,ballR,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;

            if(dead){
                ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,0,W,H);
                ctx.fillStyle='#FF5252';ctx.font='bold 18px "Press Start 2P"';ctx.textAlign='center';ctx.fillText('GAME OVER',W/2,H/2-10);
                ctx.fillStyle='rgba(255,255,255,0.4)';ctx.font='9px "Press Start 2P"';ctx.fillText('Space to restart',W/2,H/2+25);
            }
            if(cleared){
                ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,0,W,H);
                ctx.fillStyle='#4DB6AC';ctx.font='bold 16px "Press Start 2P"';ctx.textAlign='center';ctx.fillText('ALL CLEARED!',W/2,H/2-20);
                ctx.fillStyle='#FFD54F';ctx.font='12px "Press Start 2P"';ctx.fillText('🪙 +1 Coin!',W/2,H/2+5);
                ctx.fillStyle='rgba(255,255,255,0.4)';ctx.font='9px "Press Start 2P"';ctx.fillText('Space to restart',W/2,H/2+30);
            }
            this.loop=requestAnimationFrame(tick);
        };
        tick();
        this._cleanup=()=>{this.canvas.removeEventListener('mousemove',mm);document.removeEventListener('keydown',kd);document.removeEventListener('keyup',ku);};
    },

    /* ═════════════════════════════
       6. SPACE INVADERS
       ═════════════════════════════ */
    startInvaders() {
        const W=480,H=400,ctx=this.ctx;
        let player={x:W/2,y:H-30,w:30,h:16,speed:4};
        let bullets=[],score=0,dead=false,won=false,coinGiven=false;
        let invaders=[];const cols=8,rows=4,invW=28,invH=20,invPad=6;
        for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
            invaders.push({x:c*(invW+invPad)+60,y:r*(invH+invPad)+40,w:invW,h:invH,alive:true,type:r<2?'hard':'easy'});
        }
        let invDir=1,invSpeed=0.6,enemyBullets=[],lastShot=0;

        const keys={};
        const kd=(e)=>{
            keys[e.code]=true;
            if((dead||won)&&e.code==='Space'){
                player.x=W/2;bullets=[];enemyBullets=[];score=0;dead=false;won=false;coinGiven=false;
                invaders.forEach((inv,i)=>{inv.alive=true;inv.x=(i%cols)*(invW+invPad)+60;inv.y=Math.floor(i/cols)*(invH+invPad)+40;});
                invDir=1;invSpeed=0.6;this._score(0);return;
            }
            if(e.code==='Space'&&!dead&&!won){bullets.push({x:player.x,y:player.y-8,vy:-6});e.preventDefault();}
            if(['ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
        };
        const ku=(e)=>{keys[e.code]=false;};
        document.addEventListener('keydown',kd);document.addEventListener('keyup',ku);

        const tick=(now)=>{
            if(!dead&&!won){
                if(keys.ArrowLeft)player.x-=player.speed;if(keys.ArrowRight)player.x+=player.speed;
                player.x=Math.max(player.w/2,Math.min(W-player.w/2,player.x));
                bullets.forEach(b=>b.y+=b.vy);bullets=bullets.filter(b=>b.y>-10);
                let hitEdge=false;
                invaders.forEach(inv=>{if(inv.alive){inv.x+=invSpeed*invDir;if(inv.x<10||inv.x+inv.w>W-10)hitEdge=true;}});
                if(hitEdge){invDir*=-1;invaders.forEach(inv=>{if(inv.alive)inv.y+=12;});invSpeed+=0.05;}
                bullets.forEach(b=>{invaders.forEach(inv=>{if(!inv.alive)return;if(b.x>inv.x&&b.x<inv.x+inv.w&&b.y>inv.y&&b.y<inv.y+inv.h){inv.alive=false;b.y=-100;score+=inv.type==='hard'?20:10;this._score(score);}});});
                if(now-lastShot>1200){lastShot=now;const alive=invaders.filter(i=>i.alive);if(alive.length){const sh=alive[Math.floor(Math.random()*alive.length)];enemyBullets.push({x:sh.x+sh.w/2,y:sh.y+sh.h,vy:3});}}
                enemyBullets.forEach(b=>b.y+=b.vy);enemyBullets=enemyBullets.filter(b=>b.y<H+10);
                enemyBullets.forEach(b=>{if(b.x>player.x-player.w/2&&b.x<player.x+player.w/2&&b.y>player.y-player.h/2&&b.y<player.y+player.h/2)dead=true;});
                invaders.forEach(inv=>{if(inv.alive&&inv.y+inv.h>player.y-10)dead=true;});
                if(invaders.every(i=>!i.alive)){won=true;Achievements.unlock('invaders_win');if(!coinGiven){this._awardCoin();coinGiven=true;}}
            }

            ctx.fillStyle='#020208';ctx.fillRect(0,0,W,H);
            ctx.fillStyle='rgba(255,255,255,0.12)';
            for(let i=0;i<25;i++){ctx.beginPath();ctx.arc((i*73)%W,(i*47+now*0.01)%H,0.8,0,Math.PI*2);ctx.fill();}
            invaders.forEach(inv=>{if(!inv.alive)return;ctx.fillStyle=inv.type==='hard'?'#FF5252':'#66BB6A';ctx.fillRect(inv.x,inv.y,inv.w,inv.h);ctx.fillStyle='#fff';ctx.fillRect(inv.x+6,inv.y+6,4,4);ctx.fillRect(inv.x+inv.w-10,inv.y+6,4,4);ctx.fillRect(inv.x+8,inv.y+14,inv.w-16,3);});
            ctx.fillStyle='#00E5FF';ctx.beginPath();ctx.moveTo(player.x,player.y-player.h);ctx.lineTo(player.x-player.w/2,player.y);ctx.lineTo(player.x+player.w/2,player.y);ctx.closePath();ctx.fill();
            ctx.fillStyle='#fff';ctx.fillRect(player.x-2,player.y-player.h-4,4,4);
            ctx.fillStyle='#FFD54F';bullets.forEach(b=>{ctx.fillRect(b.x-1.5,b.y,3,8);});
            ctx.fillStyle='#FF5252';enemyBullets.forEach(b=>{ctx.fillRect(b.x-1.5,b.y,3,8);});

            if(dead){
                const t=performance.now()/1000;
                ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,W,H);
                this.drawReaper(ctx,W/2,H/2-50,t);
                ctx.fillStyle='#FF5252';ctx.font='bold 14px "Press Start 2P"';ctx.textAlign='center';
                ctx.fillText('The computer beat you!',W/2,H/2+40);
                ctx.fillStyle='rgba(255,255,255,0.4)';ctx.font='9px "Press Start 2P"';ctx.fillText('Space to restart',W/2,H/2+65);
            }
            if(won){
                ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,0,W,H);
                ctx.fillStyle='#4DB6AC';ctx.font='bold 16px "Press Start 2P"';ctx.textAlign='center';ctx.fillText('EARTH SAVED!',W/2,H/2-20);
                ctx.fillStyle='#FFD54F';ctx.font='12px "Press Start 2P"';ctx.fillText('🪙 +1 Coin!',W/2,H/2+5);
                ctx.fillStyle='rgba(255,255,255,0.4)';ctx.font='9px "Press Start 2P"';ctx.fillText('Space to restart',W/2,H/2+30);
            }
            this.loop=requestAnimationFrame(tick);
        };
        tick(performance.now());
        this._cleanup=()=>{document.removeEventListener('keydown',kd);document.removeEventListener('keyup',ku);};
    }
};
