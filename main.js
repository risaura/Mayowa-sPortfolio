/* ═══════════════════════════════════════════
   MAIN — Portfolio Scene Engine
   Cherry Blossom Background · Pixel Character
   Day/Night Cycle · Wooden Signs · Camera
   ═══════════════════════════════════════════ */

const App = {
    canvas: null, ctx: null,
    W: 0, H: 0,
    camera: { x: 0 },
    worldW: 2400,
    keys: {},
    character: { x: 600, y: 0, vx: 0, dir: 1, frame: 0, grounded: true },
    petals: [],
    trees: [],
    clouds: [],
    signs: [],
    dayNight: { time: 0, isNight: false, cycleLen: 90 }, // 90 seconds
    started: false,
    modalsVisited: new Set(),

    start() {
        if (this.started) return;
        this.started = true;

        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Input
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code)) e.preventDefault();
        });
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);

        // Click detection
        this.canvas.addEventListener('click', (e) => this.handleClick(e));

        // UI Buttons
        document.getElementById('musicToggle').addEventListener('click', () => this.toggleMusic());
        document.getElementById('achievementsBtn').addEventListener('click', () => this.openModal('achievementsModal'));

        // Close buttons
        document.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal(btn.dataset.close));
        });

        // Game cards
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => {
                this.closeModal('gamesModal');
                this.launchGame(card.dataset.game);
            });
        });

        // Back from game
        document.getElementById('backToPortfolio').addEventListener('click', () => this.closeGame());

        // Close modals on backdrop click
        document.querySelectorAll('.modal').forEach(m => {
            m.addEventListener('click', (e) => { if (e.target === m) this.closeModal(m.id); });
        });

        // Initialize scene
        this.initTrees();
        this.initClouds();
        this.initSigns();
        this.initPetals();
        Achievements.init();

        // Draw character in about modal
        this.drawAboutChar();

        this.loop();
    },

    resize() {
        this.W = window.innerWidth;
        this.H = window.innerHeight;
        this.canvas.width = this.W;
        this.canvas.height = this.H;
        this.character.y = this.H - 90;
    },

    /* ═══════════ SCENE INIT ═══════════ */

    initTrees() {
        this.trees = [];
        // Cherry blossom trees spread across the world
        const positions = [80, 350, 650, 1000, 1350, 1650, 1950, 2250];
        positions.forEach(x => {
            this.trees.push({
                x, height: 140 + Math.random() * 80,
                canopyR: 70 + Math.random() * 40,
                blossomHue: 330 + Math.random() * 20,
                sway: Math.random() * Math.PI * 2,
            });
        });
    },

    initClouds() {
        this.clouds = [];
        for (let i = 0; i < 8; i++) {
            this.clouds.push({
                x: Math.random() * this.worldW,
                y: 30 + Math.random() * 80,
                w: 80 + Math.random() * 120,
                speed: 0.15 + Math.random() * 0.3,
            });
        }
    },

    initSigns() {
        this.signs = [
            { x: 300, label: 'ABOUT ME', action: 'about', emoji: '📜' },
            { x: 900, label: 'GAMES', action: 'games', emoji: '🎮' },
        ];
    },

    initPetals() {
        this.petals = [];
        for (let i = 0; i < 60; i++) {
            this.petals.push(this.makePetal());
        }
    },

    makePetal() {
        return {
            x: Math.random() * this.worldW,
            y: -20 - Math.random() * this.H,
            size: 3 + Math.random() * 4,
            speedY: 0.3 + Math.random() * 0.6,
            speedX: -0.5 + Math.random() * 1,
            rot: Math.random() * Math.PI * 2,
            rotSpeed: 0.01 + Math.random() * 0.03,
            alpha: 0.5 + Math.random() * 0.5,
        };
    },

    /* ═══════════ MAIN LOOP ═══════════ */

    loop() {
        requestAnimationFrame(() => this.loop());
        const t = performance.now() / 1000;

        this.updateDayNight(t);
        this.updateCharacter();
        this.updateCamera();
        this.updatePetals();
        this.updateClouds(t);
        this.draw(t);
    },

    /* ═══════════ DAY/NIGHT ═══════════ */

    updateDayNight(t) {
        const cycle = this.dayNight.cycleLen;
        const phase = (t % (cycle * 2)) / (cycle * 2); // 0-1 full cycle
        this.dayNight.time = phase;
        const wasNight = this.dayNight.isNight;
        this.dayNight.isNight = phase > 0.5;

        if (!wasNight && this.dayNight.isNight) Achievements.unlock('night_owl');

        const display = document.getElementById('timeDisplay');
        if (display) {
            if (this.dayNight.isNight) {
                display.textContent = '🌙 Night';
                display.style.color = '#BB86FC';
            } else {
                display.textContent = '☀️ Day';
                display.style.color = '#FFD54F';
            }
        }
    },

    getDayNightFactor() {
        // 0 = full day, 1 = full night
        const phase = this.dayNight.time;
        if (phase < 0.4) return 0;
        if (phase < 0.5) return (phase - 0.4) / 0.1;
        if (phase < 0.9) return 1;
        return 1 - (phase - 0.9) / 0.1;
    },

    /* ═══════════ CHARACTER ═══════════ */

    updateCharacter() {
        const ch = this.character;
        const speed = 3;

        if (this.keys.ArrowLeft || this.keys.KeyA) { ch.vx = -speed; ch.dir = -1; }
        else if (this.keys.ArrowRight || this.keys.KeyD) { ch.vx = speed; ch.dir = 1; }
        else { ch.vx *= 0.8; if (Math.abs(ch.vx) < 0.2) ch.vx = 0; }

        ch.x += ch.vx;
        ch.x = Math.max(30, Math.min(this.worldW - 30, ch.x));
        ch.y = this.H - 90;

        if (Math.abs(ch.vx) > 0.5) {
            ch.frame += 0.15;
            Achievements.addWalk(Math.abs(ch.vx));
        }
    },

    updateCamera() {
        const target = this.character.x - this.W / 2;
        this.camera.x += (target - this.camera.x) * 0.08;
        this.camera.x = Math.max(0, Math.min(this.worldW - this.W, this.camera.x));
    },

    updatePetals() {
        this.petals.forEach(p => {
            p.y += p.speedY;
            p.x += p.speedX + Math.sin(performance.now() / 1000 + p.rot) * 0.3;
            p.rot += p.rotSpeed;
            if (p.y > this.H + 20) {
                p.y = -20;
                p.x = this.camera.x + Math.random() * this.W;
            }
        });
    },

    updateClouds(t) {
        this.clouds.forEach(c => {
            c.x += c.speed;
            if (c.x > this.worldW + 200) c.x = -200;
        });
    },

    /* ═══════════ DRAW ═══════════ */

    draw(t) {
        const { ctx, W, H } = this;
        const cam = this.camera.x;
        const nightFactor = this.getDayNightFactor();

        // Sky gradient
        this.drawSky(nightFactor);

        // Stars (night)
        if (nightFactor > 0.1) this.drawStars(t, nightFactor);

        // Sun or Moon
        this.drawCelestial(t, nightFactor);

        // Clouds
        this.drawClouds(cam, nightFactor);

        // Hills (parallax background)
        this.drawHills(cam, nightFactor);

        // Ground
        this.drawGround(cam, nightFactor);

        // Trees
        this.drawTrees(t, cam, nightFactor);

        // Signs
        this.drawSigns(t, cam);

        // Character
        this.drawCharacter(t, cam);

        // Petals (foreground)
        this.drawPetals(cam);

        // Vignette
        this.drawVignette();
    },

    drawSky(nf) {
        const { ctx, W, H } = this;
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        // Lerp between day and night colors
        const dayTop = [135, 206, 250];
        const dayBot = [200, 230, 201];
        const nightTop = [10, 10, 35];
        const nightBot = [20, 15, 50];

        const t = (a, b, f) => a.map((v, i) => Math.round(v + (b[i] - v) * f));
        const top = t(dayTop, nightTop, nf);
        const bot = t(dayBot, nightBot, nf);

        grad.addColorStop(0, `rgb(${top.join(',')})`);
        grad.addColorStop(1, `rgb(${bot.join(',')})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
    },

    drawStars(t, nf) {
        const { ctx, W, H } = this;
        ctx.fillStyle = `rgba(255,255,255,${nf * 0.6})`;
        for (let i = 0; i < 80; i++) {
            const sx = (i * 97 + 10) % W;
            const sy = (i * 53 + 5) % (H * 0.5);
            const twinkle = 0.3 + Math.sin(t * 2 + i * 0.7) * 0.3;
            ctx.globalAlpha = twinkle * nf;
            ctx.beginPath(); ctx.arc(sx, sy, 1 + (i % 3) * 0.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
    },

    drawCelestial(t, nf) {
        const { ctx, W, H } = this;
        const cx = W * 0.8;
        const cy = 70;
        const r = 35;

        if (nf < 0.5) {
            // Sun
            const sunAlpha = 1 - nf * 2;
            ctx.globalAlpha = sunAlpha;
            // Sun glow
            const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 3);
            glow.addColorStop(0, 'rgba(255,200,50,0.3)');
            glow.addColorStop(1, 'rgba(255,200,50,0)');
            ctx.fillStyle = glow;
            ctx.beginPath(); ctx.arc(cx, cy, r * 3, 0, Math.PI * 2); ctx.fill();
            // Sun body
            ctx.fillStyle = '#FFE082';
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
        } else {
            // Moon
            const moonAlpha = (nf - 0.5) * 2;
            ctx.globalAlpha = moonAlpha;
            const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 2.5);
            glow.addColorStop(0, 'rgba(200,200,220,0.2)');
            glow.addColorStop(1, 'rgba(200,200,220,0)');
            ctx.fillStyle = glow;
            ctx.beginPath(); ctx.arc(cx, cy, r * 2.5, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = '#dde';
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(0,0,0,0.08)';
            ctx.beginPath(); ctx.arc(cx + 8, cy - 5, 6, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx - 10, cy + 8, 4, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
        }
    },

    drawClouds(cam, nf) {
        const { ctx, H } = this;
        const brightness = 255 - Math.round(nf * 180);
        this.clouds.forEach(c => {
            const sx = c.x - cam * 0.3;
            ctx.fillStyle = `rgba(${brightness},${brightness},${brightness + 10},${0.6 - nf * 0.3})`;
            // Fluffy cloud shape
            ctx.beginPath();
            ctx.arc(sx, c.y, c.w * 0.2, 0, Math.PI * 2);
            ctx.arc(sx + c.w * 0.2, c.y - c.w * 0.08, c.w * 0.25, 0, Math.PI * 2);
            ctx.arc(sx + c.w * 0.5, c.y, c.w * 0.22, 0, Math.PI * 2);
            ctx.arc(sx + c.w * 0.35, c.y + c.w * 0.05, c.w * 0.18, 0, Math.PI * 2);
            ctx.fill();
        });
    },

    drawHills(cam, nf) {
        const { ctx, W, H } = this;
        // Background hills
        const hillColor = nf < 0.5
            ? `rgb(${120 - nf * 100}, ${180 - nf * 120}, ${80 - nf * 60})`
            : `rgb(${20 + (1 - nf) * 80}, ${40 + (1 - nf) * 100}, ${25 + (1 - nf) * 40})`;

        ctx.fillStyle = hillColor;
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 2) {
            const wx = x + cam * 0.4;
            const y = H * 0.55 + Math.sin(wx * 0.003) * 50 + Math.sin(wx * 0.007) * 30;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

        // Foreground hills
        const hill2Color = nf < 0.5
            ? `rgb(${100 - nf * 80}, ${160 - nf * 100}, ${60 - nf * 40})`
            : `rgb(${15 + (1 - nf) * 60}, ${30 + (1 - nf) * 80}, ${15 + (1 - nf) * 30})`;

        ctx.fillStyle = hill2Color;
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 2) {
            const wx = x + cam * 0.6;
            const y = H * 0.65 + Math.sin(wx * 0.005 + 1) * 35 + Math.sin(wx * 0.01) * 20;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    },

    drawGround(cam, nf) {
        const { ctx, W, H } = this;
        const groundY = H - 70;

        // Main ground
        const gc = nf < 0.5
            ? `rgb(${90 - nf * 60}, ${150 - nf * 80}, ${50 - nf * 30})`
            : `rgb(${20 + (1 - nf) * 50}, ${40 + (1 - nf) * 70}, ${15 + (1 - nf) * 25})`;
        ctx.fillStyle = gc;
        ctx.fillRect(0, groundY, W, H - groundY);

        // Grass detail
        ctx.strokeStyle = nf < 0.5
            ? `rgba(50,120,30,${0.4 - nf * 0.3})`
            : `rgba(20,50,10,${0.2})`;
        ctx.lineWidth = 1.5;
        for (let x = 0; x < W; x += 8) {
            const wx = x + cam;
            const gx = (wx * 7) % W;
            ctx.beginPath();
            ctx.moveTo(x, groundY);
            ctx.quadraticCurveTo(x + 2, groundY - 6 - Math.sin(wx * 0.1) * 3, x + 4, groundY);
            ctx.stroke();
        }

        // Flowers
        const flowerColors = ['#FF6B9D', '#FFB74D', '#E040FB', '#FF5252', '#FFEB3B'];
        for (let i = 0; i < 30; i++) {
            const fx = ((i * 83) % this.worldW) - cam;
            if (fx < -10 || fx > W + 10) continue;
            const fy = groundY + 2 + (i % 5) * 4;
            ctx.fillStyle = flowerColors[i % flowerColors.length];
            ctx.globalAlpha = 0.7 - nf * 0.4;
            ctx.beginPath();
            ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    },

    drawTrees(t, cam, nf) {
        const { ctx, H } = this;
        const groundY = H - 70;

        this.trees.forEach(tree => {
            const sx = tree.x - cam;
            if (sx < -150 || sx > this.W + 150) return;

            const sway = Math.sin(t * 0.5 + tree.sway) * 3;

            // Trunk
            const trunkW = 14;
            ctx.fillStyle = nf > 0.5 ? '#2a1a10' : '#4a3020';
            ctx.beginPath();
            ctx.moveTo(sx - trunkW / 2, groundY);
            ctx.lineTo(sx - trunkW / 2 + 2 + sway * 0.3, groundY - tree.height);
            ctx.lineTo(sx + trunkW / 2 - 2 + sway * 0.3, groundY - tree.height);
            ctx.lineTo(sx + trunkW / 2, groundY);
            ctx.closePath();
            ctx.fill();

            // Branches
            const branchY = groundY - tree.height;
            ctx.strokeStyle = nf > 0.5 ? '#2a1a10' : '#4a3020';
            ctx.lineWidth = 3;
            [[-1, -0.6], [1, -0.4], [-0.5, -0.8]].forEach(([dx, dy]) => {
                ctx.beginPath();
                ctx.moveTo(sx + sway * 0.3, branchY + 20);
                ctx.quadraticCurveTo(
                    sx + dx * tree.canopyR * 0.5 + sway,
                    branchY + dy * tree.canopyR * 0.3,
                    sx + dx * tree.canopyR * 0.7 + sway,
                    branchY + dy * tree.canopyR * 0.5
                );
                ctx.stroke();
            });

            // Cherry blossom canopy (multiple circles)
            const blossomAlpha = 0.85 - nf * 0.3;
            const cr = tree.canopyR;
            const cy = branchY;
            [
                [0, 0, cr * 0.8],
                [-cr * 0.4, cr * 0.1, cr * 0.6],
                [cr * 0.45, cr * 0.15, cr * 0.55],
                [-cr * 0.15, -cr * 0.35, cr * 0.5],
                [cr * 0.2, -cr * 0.3, cr * 0.45],
                [-cr * 0.5, -cr * 0.15, cr * 0.4],
                [cr * 0.55, -cr * 0.05, cr * 0.4],
            ].forEach(([ox, oy, r]) => {
                const grad = ctx.createRadialGradient(
                    sx + ox + sway, cy + oy, r * 0.1,
                    sx + ox + sway, cy + oy, r
                );
                const h = tree.blossomHue;
                grad.addColorStop(0, `hsla(${h}, 80%, 80%, ${blossomAlpha})`);
                grad.addColorStop(0.6, `hsla(${h}, 70%, 70%, ${blossomAlpha * 0.7})`);
                grad.addColorStop(1, `hsla(${h}, 60%, 65%, 0)`);
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(sx + ox + sway, cy + oy, r, 0, Math.PI * 2);
                ctx.fill();
            });
        });
    },

    drawSigns(t, cam) {
        const { ctx, H } = this;
        const groundY = H - 70;

        this.signs.forEach(sign => {
            const sx = sign.x - cam;
            if (sx < -100 || sx > this.W + 100) return;

            const hover = Math.sin(t * 2) * 2;

            // Post
            ctx.fillStyle = '#5D4037';
            ctx.fillRect(sx - 5, groundY - 120, 10, 120);

            // Post cap
            ctx.fillStyle = '#3E2723';
            ctx.fillRect(sx - 7, groundY - 122, 14, 6);

            // Sign board
            const signW = 160, signH = 55;
            const signX = sx - signW / 2;
            const signY = groundY - 170 + hover;

            // Board shadow
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(signX + 3, signY + 3, signW, signH);

            // Board body
            ctx.fillStyle = '#6D4C41';
            ctx.fillRect(signX, signY, signW, signH);

            // Board highlight (top)
            ctx.fillStyle = '#8D6E63';
            ctx.fillRect(signX, signY, signW, 6);

            // Board border
            ctx.strokeStyle = '#3E2723';
            ctx.lineWidth = 3;
            ctx.strokeRect(signX, signY, signW, signH);

            // Nails
            ctx.fillStyle = '#999';
            [[signX + 8, signY + 8], [signX + signW - 8, signY + 8]].forEach(([nx, ny]) => {
                ctx.beginPath(); ctx.arc(nx, ny, 3, 0, Math.PI * 2); ctx.fill();
            });

            // Text
            ctx.fillStyle = '#FFD54F';
            ctx.font = 'bold 14px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(255,213,79,0.4)';
            ctx.shadowBlur = 8;
            ctx.fillText(sign.emoji + ' ' + sign.label, sx, signY + 35);
            ctx.shadowBlur = 0;

            // Store sign screen bounds for click detection
            sign._screenX = signX;
            sign._screenY = signY;
            sign._screenW = signW;
            sign._screenH = signH;
        });
    },

    /* ═══════════ PIXEL ART CHARACTER ═══════════ */

    drawCharacter(t, cam) {
        const { ctx, H } = this;
        const ch = this.character;
        const sx = ch.x - cam;
        const sy = ch.y;
        const scale = 3; // Pixel scale
        const walking = Math.abs(ch.vx) > 0.5;
        const f = Math.floor(ch.frame) % 4;
        const breathe = Math.sin(t * 2) * 1;

        ctx.save();
        ctx.translate(sx, sy + breathe);

        if (ch.dir === -1) {
            ctx.scale(-1, 1);
        }

        // Draw pixel art character (based on reference image)
        // Brown skin, dark hair with red accessory, orange/yellow top, white shorts, dark shoes
        const px = (x, y, w, h) => ctx.fillRect(x * scale, y * scale, w * scale, h * scale);

        // Hair (black with red accessory)
        ctx.fillStyle = '#222';
        px(-4, -20, 8, 5);  // Top hair
        px(-5, -18, 10, 3); // Wide part
        px(-5, -15, 2, 8);  // Left side
        px(3, -15, 2, 8);   // Right side

        // Red hair accessory
        ctx.fillStyle = '#e53935';
        px(-4, -18, 2, 2);

        // Face (brown skin)
        ctx.fillStyle = '#8D6E4C';
        px(-3, -15, 6, 7);

        // Eyes
        ctx.fillStyle = '#111';
        px(-2, -13, 2, 2);
        px(1, -13, 2, 2);

        // Eyebrows
        ctx.fillStyle = '#333';
        px(-2, -14, 2, 1);
        px(1, -14, 2, 1);

        // Mouth (smile)
        ctx.fillStyle = '#fff';
        px(-1, -10, 3, 1);

        // Neck
        ctx.fillStyle = '#8D6E4C';
        px(-1, -8, 2, 2);

        // Torso (orange/yellow top)
        ctx.fillStyle = '#FF9800';
        px(-4, -6, 8, 4);
        ctx.fillStyle = '#FFB74D';
        px(-4, -6, 8, 2); // Lighter top half
        ctx.fillStyle = '#F57C00';
        px(-4, -2, 8, 3); // Darker bottom

        // Arms (skin + yellow sleeves)
        const armSwing = walking ? Math.sin(ch.frame * 0.8) * 3 : 0;
        ctx.fillStyle = '#FFB74D';
        px(-6, -6, 2, 3); // Left sleeve
        px(4, -6, 2, 3);  // Right sleeve

        ctx.fillStyle = '#8D6E4C';
        // Left arm with swing
        ctx.fillRect((-6) * scale, (-3 + armSwing) * scale, 2 * scale, 4 * scale);
        // Right arm with opposite swing
        ctx.fillRect((4) * scale, (-3 - armSwing) * scale, 2 * scale, 4 * scale);

        // Shorts (white/gray)
        ctx.fillStyle = '#ccc';
        px(-3, 1, 6, 3);
        ctx.fillStyle = '#aaa';
        px(-3, 3, 3, 1); // Left leg gap
        px(0, 3, 3, 1);

        // Legs (brown skin)
        const legSwing = walking ? Math.sin(ch.frame * 0.8) * 2 : 0;
        ctx.fillStyle = '#8D6E4C';
        ctx.fillRect((-3) * scale, (4 + legSwing) * scale, 2 * scale, 3 * scale);
        ctx.fillRect((1) * scale, (4 - legSwing) * scale, 2 * scale, 3 * scale);

        // Shoes (dark + pink soles)
        ctx.fillStyle = '#333';
        ctx.fillRect((-4) * scale, (7 + legSwing) * scale, 3 * scale, 2 * scale);
        ctx.fillRect((1) * scale, (7 - legSwing) * scale, 3 * scale, 2 * scale);
        ctx.fillStyle = '#FF8A80';
        ctx.fillRect((-4) * scale, (8 + legSwing) * scale, 3 * scale, 1 * scale);
        ctx.fillRect((1) * scale, (8 - legSwing) * scale, 3 * scale, 1 * scale);

        ctx.restore();

        // Name tag floating above
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '10px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('Mayowa', sx, sy - 70 + Math.sin(t * 1.5) * 3);
    },

    drawAboutChar() {
        const c = document.getElementById('aboutCharCanvas');
        if (!c) return;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        const s = 4;
        const ox = 20, oy = 10;

        const px = (x, y, w, h) => ctx.fillRect(ox + x * s, oy + y * s, w * s, h * s);

        ctx.fillStyle = '#222'; px(-4, 0, 8, 5); px(-5, 2, 10, 3); px(-5, 5, 2, 8); px(3, 5, 2, 8);
        ctx.fillStyle = '#e53935'; px(-4, 2, 2, 2);
        ctx.fillStyle = '#8D6E4C'; px(-3, 5, 6, 7);
        ctx.fillStyle = '#111'; px(-2, 7, 2, 2); px(1, 7, 2, 2);
        ctx.fillStyle = '#fff'; px(-1, 10, 3, 1);
        ctx.fillStyle = '#8D6E4C'; px(-1, 12, 2, 2);
        ctx.fillStyle = '#FF9800'; px(-4, 14, 8, 5);
        ctx.fillStyle = '#8D6E4C'; px(-6, 15, 2, 5); px(4, 15, 2, 5);
        ctx.fillStyle = '#ccc'; px(-3, 19, 6, 3);
        ctx.fillStyle = '#8D6E4C'; px(-3, 22, 2, 3); px(1, 22, 2, 3);
        ctx.fillStyle = '#333'; px(-4, 25, 3, 2); px(1, 25, 3, 2);
    },

    /* ═══════════ PETALS ═══════════ */

    drawPetals(cam) {
        const { ctx } = this;
        const nf = this.getDayNightFactor();
        this.petals.forEach(p => {
            const sx = p.x - cam;
            if (sx < -20 || sx > this.W + 20) return;

            ctx.save();
            ctx.translate(sx, p.y);
            ctx.rotate(p.rot);
            ctx.globalAlpha = p.alpha * (1 - nf * 0.5);
            ctx.fillStyle = `hsl(${335 + Math.sin(p.rot) * 15}, 70%, ${80 - nf * 20}%)`;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        ctx.globalAlpha = 1;
    },

    drawVignette() {
        const { ctx, W, H } = this;
        const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.3)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
    },

    /* ═══════════ INTERACTIONS ═══════════ */

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Check signs
        this.signs.forEach(sign => {
            if (sign._screenX === undefined) return;
            if (mx >= sign._screenX && mx <= sign._screenX + sign._screenW &&
                my >= sign._screenY && my <= sign._screenY + sign._screenH) {
                AudioManager.playSfx('click');
                if (sign.action === 'about') {
                    this.openModal('aboutModal');
                    Achievements.visitSection('about');
                } else if (sign.action === 'games') {
                    this.openModal('gamesModal');
                    Achievements.visitSection('games');
                }
            }
        });

        // Check character click
        const ch = this.character;
        const csx = ch.x - this.camera.x;
        const csy = ch.y;
        if (Math.abs(mx - csx) < 30 && Math.abs(my - csy + 20) < 50) {
            Achievements.unlock('first_click');
            this.showSpeech();
        }
    },

    showSpeech() {
        const phrases = [
            "Hey! Welcome to my portfolio!",
            "Check out my games! →",
            "I love Medicine, Engineering & CS!",
            "← Read about me over there!",
            "Thanks for stopping by!",
            "I'm working on Roblox games too!",
            "My school banned game sites... so I made my own 😎",
        ];
        const bubble = document.getElementById('speechBubble');
        const text = document.getElementById('speechText');
        text.textContent = phrases[Math.floor(Math.random() * phrases.length)];

        const ch = this.character;
        const sx = ch.x - this.camera.x;
        bubble.style.left = sx + 'px';
        bubble.style.top = (ch.y - 100) + 'px';
        bubble.classList.remove('hidden');

        clearTimeout(this._speechTimer);
        this._speechTimer = setTimeout(() => bubble.classList.add('hidden'), 3000);
    },

    /* ═══════════ MODALS ═══════════ */

    openModal(id) {
        document.getElementById(id).classList.remove('hidden');
    },

    closeModal(id) {
        document.getElementById(id).classList.add('hidden');
    },

    launchGame(id) {
        this.openModal('gamePlayModal');
        Games.launch(id);
    },

    closeGame() {
        Games.stop();
        this.closeModal('gamePlayModal');
    },

    toggleMusic() {
        const btn = document.getElementById('musicToggle');
        if (AudioManager.playing) {
            AudioManager.stop();
            btn.textContent = '🎵 Music: OFF';
        } else {
            AudioManager.start();
            btn.textContent = '🎵 Music: ON';
            Achievements.unlock('music_lover');
        }
    }
};
