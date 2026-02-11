/* ═══════════════════════════════════════════
   MAIN — Portfolio Scene Engine v3
   Coins · Vending Machine · Home Notification
   Contact Form · Visitor Tracking · Drinking
   ═══════════════════════════════════════════ */

const App = {
    canvas: null, ctx: null,
    W: 0, H: 0,
    camera: { x: 0 },
    worldW: 3200,
    keys: {},
    character: {
        x: 800, y: 0, vx: 0, vy: 0, dir: 1, frame: 0,
        grounded: true, jumping: false,
        accel: 0.45, friction: 0.82, maxSpeed: 5.5, runMax: 7.5,
        jumpPower: -11, gravity: 0.55,
        squash: 1, stretch: 1, // squash & stretch for juice
        drinking: false, drinkTimer: 0, drinkEmoji: '',
    },
    petals: [],
    trees: [],
    clouds: [],
    signs: [],
    house: null,
    vendingMachine: null,
    dayNight: { time: 0, isNight: false, cycleLen: 90 },
    coins: 0,
    homeNotifShown: false,
    homeNotifDismissed: false,

    /* ═══════════════════════════════════════════
       ✏️  FUN FACTS — EDIT THESE!
       Change, add, or remove any facts you want.
       They rotate every 90 seconds in-game.
       ═══════════════════════════════════════════ */
    funFacts: {
        list: [
            "I can solve a Rubik's cube in under 2 minutes!",
            "My favorite programming language is JavaScript.",
            "I want to study Biomedical Engineering in college.",
            "I've been coding since I was 14 years old.",
            "My favorite game of all time is Minecraft.",
            "I dream of creating my own game studio one day.",
            "I love watching anime in my free time.",
            "Medicine + Engineering + CS = my perfect career combo.",
            "I built this entire portfolio by myself!",
            "My school banned game websites... so I made my own 😎",
            "I'm working on a Roblox game releasing May 2026.",
            "Cherry blossoms are my favorite trees 🌸",
            "I'm from Avon, Indiana — Go Orioles!",
            "I love a good jazz playlist while I code.",
            "Fun fact: this site has 14 hidden achievements!",
        ],
        current: 0,
        lastChange: 0,
        interval: 90000,
    },

    started: false,

    start() {
        if (this.started) return;
        this.started = true;

        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Load saved coins
        try { this.coins = parseInt(localStorage.getItem('mayowa_coins')) || 0; } catch(e) {}
        this.updateCoinDisplay();

        // Input
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code)) e.preventDefault();
        });
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);

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

        // Back buttons from game
        document.getElementById('backToPortfolio').addEventListener('click', () => this.closeGame());
        document.getElementById('backToGames').addEventListener('click', () => {
            this.closeGame();
            setTimeout(() => this.openModal('gamesModal'), 100);
        });

        // Drink cards in vending machine
        document.querySelectorAll('.drink-card').forEach(card => {
            card.addEventListener('click', () => this.buyDrink(card.dataset.drink));
        });

        // Close modals on backdrop click
        document.querySelectorAll('.modal').forEach(m => {
            m.addEventListener('click', (e) => { if (e.target === m) this.closeModal(m.id); });
        });

        // Contact form
        this.setupContactForm();

        // Visitor tracking
        this.trackVisitor();

        // Initialize scene
        this.initTrees();
        this.initClouds();
        this.initSigns();
        this.initHouse();
        this.initVendingMachine();
        this.initPetals();
        Achievements.init();
        this.drawAboutChar();
        this.showFunFact();

        // Show home notification after a brief delay
        setTimeout(() => {
            if (!this.homeNotifDismissed) {
                document.getElementById('homeNotif').classList.remove('hidden');
                this.homeNotifShown = true;
                // Auto-dismiss after 8 seconds
                setTimeout(() => {
                    document.getElementById('homeNotif').classList.add('hidden');
                    this.homeNotifDismissed = true;
                }, 8000);
            }
        }, 2000);

        this.loop();
    },

    resize() {
        this.W = window.innerWidth;
        this.H = window.innerHeight;
        this.canvas.width = this.W;
        this.canvas.height = this.H;
        this.character.y = this.H - 130;
    },

    /* ═══════════ COIN SYSTEM ═══════════ */

    addCoin() {
        this.coins++;
        try { localStorage.setItem('mayowa_coins', String(this.coins)); } catch(e) {}
        this.updateCoinDisplay();
        // Show toast
        const toast = document.getElementById('coinToast');
        toast.classList.remove('hidden');
        clearTimeout(this._coinTimer);
        this._coinTimer = setTimeout(() => toast.classList.add('hidden'), 2500);
    },

    updateCoinDisplay() {
        const el = document.getElementById('coinDisplay');
        if (el) el.textContent = '🪙 ' + this.coins;
    },

    buyDrink(drinkId) {
        const status = document.getElementById('vendingStatus');
        if (this.coins < 1) {
            status.textContent = '❌ Not enough coins! Win games to earn coins.';
            status.style.color = '#FF5252';
            return;
        }

        const drinkEmojis = {
            cola: '🥤', juice: '🧃', water: '💧',
            coffee: '☕', boba: '🧋', energy: '⚡'
        };
        const drinkNames = {
            cola: 'Cola', juice: 'Juice Box', water: 'Water',
            coffee: 'Coffee', boba: 'Boba Tea', energy: 'Energy Drink'
        };

        this.coins--;
        try { localStorage.setItem('mayowa_coins', String(this.coins)); } catch(e) {}
        this.updateCoinDisplay();

        const emoji = drinkEmojis[drinkId] || '🥤';
        const name = drinkNames[drinkId] || 'Drink';
        status.textContent = `✅ Bought ${emoji} ${name}! Watch Mayowa drink it!`;
        status.style.color = '#4DB6AC';

        // Trigger drinking animation
        this.character.drinking = true;
        this.character.drinkEmoji = emoji;
        this.character.drinkTimer = performance.now();

        // Close modal after a moment
        setTimeout(() => this.closeModal('vendingModal'), 1500);
    },

    /* ═══════════ CONTACT FORM ═══════════ */

    setupContactForm() {
        const form = document.getElementById('contactForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const status = document.getElementById('formStatus');
            const formData = new FormData(form);

            status.textContent = 'Sending...';
            status.style.color = 'rgba(255,255,255,0.5)';

            try {
                const resp = await fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' },
                });

                if (resp.ok) {
                    status.textContent = '✅ Message sent! Thanks for reaching out!';
                    status.style.color = '#4DB6AC';
                    form.reset();
                } else {
                    throw new Error('Failed');
                }
            } catch(err) {
                // Fallback: open mailto
                const name = formData.get('name') || '';
                const email = formData.get('email') || '';
                const msg = formData.get('message') || '';
                const subject = encodeURIComponent('Portfolio Message from ' + name);
                const body = encodeURIComponent(`From: ${name} (${email})\n\n${msg}`);
                window.open(`mailto:fazemayhyper12@gmail.com?subject=${subject}&body=${body}`);
                status.textContent = '📧 Opening email client... (Or set up Formspree for direct delivery)';
                status.style.color = '#FFD54F';
            }
        });
    },

    /* ═══════════ VISITOR TRACKING ═══════════ */

    trackVisitor() {
        // Simple visitor counter using localStorage + a free counting API
        // For REAL analytics with location, set up GoatCounter (free) — see README
        try {
            // Local visit count
            let visits = parseInt(localStorage.getItem('mayowa_total_visits')) || 0;
            const lastVisit = localStorage.getItem('mayowa_last_visit_date');
            const today = new Date().toDateString();

            if (lastVisit !== today) {
                visits++;
                localStorage.setItem('mayowa_total_visits', String(visits));
                localStorage.setItem('mayowa_last_visit_date', today);
            }

            // Try to fetch from a free counter API (works when deployed)
            this.fetchVisitorCount();
        } catch(e) {}
    },

    async fetchVisitorCount() {
        const el = document.getElementById('visitorCount');
        if (!el) return;

        try {
            // Use countapi.xyz (free, no signup needed)
            const resp = await fetch('https://api.countapi.xyz/hit/mayowa-portfolio/visits');
            const data = await resp.json();
            if (data && data.value) {
                el.textContent = data.value.toLocaleString();
                return;
            }
        } catch(e) {}

        // Fallback to local count
        try {
            const local = parseInt(localStorage.getItem('mayowa_total_visits')) || 1;
            el.textContent = local.toLocaleString();
        } catch(e) {
            el.textContent = '—';
        }
    },

    /* ═══════════ FUN FACTS ═══════════ */

    showFunFact() {
        const ff = this.funFacts;
        const el = document.getElementById('funFactText');
        const container = document.getElementById('funFacts');
        if (!el || !container) return;

        el.textContent = ff.list[ff.current % ff.list.length];
        container.classList.remove('hidden');
        container.style.animation = 'none';
        container.offsetHeight;
        container.style.animation = '';
        ff.current++;
        ff.lastChange = performance.now();
    },

    updateFunFacts() {
        if (performance.now() - this.funFacts.lastChange > this.funFacts.interval) {
            this.showFunFact();
        }
    },

    /* ═══════════ SCENE INIT ═══════════ */

    initTrees() {
        this.trees = [];
        [100, 420, 750, 1150, 1550, 2000, 2400, 2750, 3050].forEach(x => {
            this.trees.push({
                x,
                height: 200 + Math.random() * 100,
                canopyR: 100 + Math.random() * 55,
                blossomHue: 330 + Math.random() * 20,
                sway: Math.random() * Math.PI * 2,
            });
        });
    },

    initClouds() {
        this.clouds = [];
        for (let i = 0; i < 10; i++) {
            this.clouds.push({
                x: Math.random() * this.worldW,
                y: 30 + Math.random() * 90,
                w: 90 + Math.random() * 140,
                speed: 0.12 + Math.random() * 0.25,
            });
        }
    },

    initSigns() {
        this.signs = [
            { x: 400, label: 'ABOUT ME', action: 'about', emoji: '📜' },
            { x: 1250, label: 'GAMES', action: 'games', emoji: '🎮' },
        ];
    },

    initHouse() {
        this.house = { x: 1900, w: 260, h: 200, roofH: 80, doorW: 50, doorH: 70 };
    },

    initVendingMachine() {
        this.vendingMachine = { x: 2550, w: 70, h: 130 };
    },

    initPetals() {
        this.petals = [];
        for (let i = 0; i < 80; i++) this.petals.push(this.makePetal());
    },

    makePetal() {
        return {
            x: Math.random() * this.worldW,
            y: -20 - Math.random() * (this.H || 600),
            size: 3 + Math.random() * 5,
            speedY: 0.3 + Math.random() * 0.7,
            speedX: -0.4 + Math.random() * 0.8,
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
        this.updateClouds();
        this.updateFunFacts();
        this.updateHomeNotif();
        this.draw(t);
    },

    /* ═══════════ DAY/NIGHT ═══════════ */

    updateDayNight(t) {
        const cycle = this.dayNight.cycleLen;
        const phase = (t % (cycle * 2)) / (cycle * 2);
        this.dayNight.time = phase;
        const wasNight = this.dayNight.isNight;
        this.dayNight.isNight = phase > 0.5;
        if (!wasNight && this.dayNight.isNight) Achievements.unlock('night_owl');

        const display = document.getElementById('timeDisplay');
        if (display) {
            if (this.dayNight.isNight) { display.textContent = '🌙 Night'; display.style.color = '#BB86FC'; }
            else { display.textContent = '☀️ Day'; display.style.color = '#FFD54F'; }
        }
    },

    getDayNightFactor() {
        const p = this.dayNight.time;
        if (p < 0.4) return 0;
        if (p < 0.5) return (p - 0.4) / 0.1;
        if (p < 0.9) return 1;
        return 1 - (p - 0.9) / 0.1;
    },

    /* ═══════════ HOME NOTIFICATION ═══════════ */

    updateHomeNotif() {
        if (this.homeNotifDismissed) return;
        const dist = Math.abs(this.character.x - this.house.x);
        if (dist < 500 && !this.homeNotifShown) {
            document.getElementById('homeNotif').classList.remove('hidden');
            this.homeNotifShown = true;
            setTimeout(() => {
                document.getElementById('homeNotif').classList.add('hidden');
                this.homeNotifDismissed = true;
            }, 6000);
        }
    },

    /* ═══════════ CHARACTER (Mario-style physics) ═══════════ */

    updateCharacter() {
        const ch = this.character;
        const groundY = this.H - 130; // taller char needs higher ground ref
        const running = this.keys.ShiftLeft || this.keys.ShiftRight;
        const maxSpd = running ? ch.runMax : ch.maxSpeed;

        // ── Horizontal acceleration (not instant speed) ──
        if (this.keys.ArrowLeft || this.keys.KeyA) {
            ch.vx -= ch.accel;
            ch.dir = -1;
        } else if (this.keys.ArrowRight || this.keys.KeyD) {
            ch.vx += ch.accel;
            ch.dir = 1;
        } else {
            // Friction / slide
            ch.vx *= ch.friction;
            if (Math.abs(ch.vx) < 0.15) ch.vx = 0;
        }

        // Clamp to max speed
        ch.vx = Math.max(-maxSpd, Math.min(maxSpd, ch.vx));

        // ── Jump ──
        if ((this.keys.ArrowUp || this.keys.Space || this.keys.KeyW) && ch.grounded && !ch.jumping) {
            ch.vy = ch.jumpPower;
            ch.grounded = false;
            ch.jumping = true;
            ch.squash = 0.7; ch.stretch = 1.3; // launch stretch
            AudioManager.playSfx('click');
        }
        // Variable jump height — release early = shorter jump
        if (!(this.keys.ArrowUp || this.keys.Space || this.keys.KeyW) && ch.vy < -3) {
            ch.vy *= 0.6; // cut upward velocity
        }
        if (!(this.keys.ArrowUp || this.keys.Space || this.keys.KeyW)) {
            ch.jumping = false;
        }

        // ── Gravity ──
        ch.vy += ch.gravity;
        ch.y += ch.vy;

        // ── Ground collision ──
        if (ch.y >= groundY) {
            if (ch.vy > 3) { ch.squash = 1.25; ch.stretch = 0.75; } // land squash
            ch.y = groundY;
            ch.vy = 0;
            ch.grounded = true;
        }

        // ── Position clamping ──
        ch.x += ch.vx;
        ch.x = Math.max(40, Math.min(this.worldW - 40, ch.x));

        // ── Squash & Stretch spring back ──
        ch.squash += (1 - ch.squash) * 0.15;
        ch.stretch += (1 - ch.stretch) * 0.15;

        // ── Animation speed scales with movement ──
        const absVx = Math.abs(ch.vx);
        if (absVx > 0.5) {
            ch.frame += 0.06 + absVx * 0.04; // faster run = faster anim
            Achievements.addWalk(absVx);
        }

        // Drinking timer (3 seconds)
        if (ch.drinking && performance.now() - ch.drinkTimer > 3000) {
            ch.drinking = false;
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
            if (p.y > this.H + 20) { p.y = -20; p.x = this.camera.x + Math.random() * this.W; }
        });
    },

    updateClouds() {
        this.clouds.forEach(c => {
            c.x += c.speed;
            if (c.x > this.worldW + 200) c.x = -200;
        });
    },

    /* ═══════════ DRAW ═══════════ */

    draw(t) {
        const { ctx, W, H } = this;
        const cam = this.camera.x;
        const nf = this.getDayNightFactor();

        this.drawSky(nf);
        if (nf > 0.1) this.drawStars(t, nf);
        this.drawCelestial(t, nf);
        this.drawClouds(cam, nf);
        this.drawHills(cam, nf);
        this.drawGround(cam, nf);
        this.drawTrees(t, cam, nf);
        this.drawHouse(t, cam, nf);
        this.drawVendingMachine(t, cam, nf);
        this.drawSigns(t, cam);
        this.drawCharacter(t, cam);
        this.drawPetals(cam);
        this.drawVignette();
    },

    drawSky(nf) {
        const { ctx, W, H } = this;
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        const lerp = (a, b, f) => a.map((v, i) => Math.round(v + (b[i] - v) * f));
        const top = lerp([135,206,250], [10,10,35], nf);
        const bot = lerp([200,230,201], [20,15,50], nf);
        grad.addColorStop(0, `rgb(${top})`);
        grad.addColorStop(1, `rgb(${bot})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
    },

    drawStars(t, nf) {
        const { ctx, W, H } = this;
        for (let i = 0; i < 80; i++) {
            const sx = (i * 97 + 10) % W;
            const sy = (i * 53 + 5) % (H * 0.5);
            ctx.globalAlpha = (0.3 + Math.sin(t * 2 + i * 0.7) * 0.3) * nf;
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(sx, sy, 1 + (i % 3) * 0.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
    },

    drawCelestial(t, nf) {
        const { ctx, W } = this;
        const cx = W * 0.82, cy = 65, r = 38;
        if (nf < 0.5) {
            ctx.globalAlpha = 1 - nf * 2;
            const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 3);
            glow.addColorStop(0, 'rgba(255,200,50,0.3)'); glow.addColorStop(1, 'rgba(255,200,50,0)');
            ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, r * 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FFE082'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        } else {
            ctx.globalAlpha = (nf - 0.5) * 2;
            const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 2.5);
            glow.addColorStop(0, 'rgba(200,200,220,0.2)'); glow.addColorStop(1, 'rgba(200,200,220,0)');
            ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, r * 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#dde'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(0,0,0,0.08)';
            ctx.beginPath(); ctx.arc(cx + 8, cy - 5, 7, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx - 10, cy + 8, 5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
    },

    drawClouds(cam, nf) {
        const { ctx } = this;
        const b = 255 - Math.round(nf * 180);
        this.clouds.forEach(c => {
            const sx = c.x - cam * 0.3;
            ctx.fillStyle = `rgba(${b},${b},${b + 10},${0.55 - nf * 0.3})`;
            ctx.beginPath();
            ctx.arc(sx, c.y, c.w * 0.2, 0, Math.PI * 2);
            ctx.arc(sx + c.w * 0.22, c.y - c.w * 0.08, c.w * 0.26, 0, Math.PI * 2);
            ctx.arc(sx + c.w * 0.52, c.y, c.w * 0.22, 0, Math.PI * 2);
            ctx.arc(sx + c.w * 0.37, c.y + c.w * 0.05, c.w * 0.18, 0, Math.PI * 2);
            ctx.fill();
        });
    },

    drawHills(cam, nf) {
        const { ctx, W, H } = this;
        const lc = (d, n, f) => `rgb(${d.map((v, i) => Math.round(v + (n[i] - v) * f))})`;
        ctx.fillStyle = lc([120,180,80], [20,40,25], nf);
        ctx.beginPath(); ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 2) { const wx = x + cam * 0.35; ctx.lineTo(x, H * 0.5 + Math.sin(wx * 0.003) * 55 + Math.sin(wx * 0.007) * 30); }
        ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
        ctx.fillStyle = lc([100,160,60], [15,30,15], nf);
        ctx.beginPath(); ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 2) { const wx = x + cam * 0.55; ctx.lineTo(x, H * 0.6 + Math.sin(wx * 0.005 + 1) * 40 + Math.sin(wx * 0.01) * 22); }
        ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    },

    drawGround(cam, nf) {
        const { ctx, W, H } = this;
        const gy = H - 80;
        const lc = (d, n, f) => `rgb(${d.map((v, i) => Math.round(v + (n[i] - v) * f))})`;
        ctx.fillStyle = lc([90,150,50], [20,40,15], nf);
        ctx.fillRect(0, gy, W, H - gy);

        ctx.strokeStyle = nf < 0.5 ? `rgba(50,120,30,${0.35 - nf * 0.25})` : 'rgba(20,50,10,0.15)';
        ctx.lineWidth = 1.5;
        for (let x = 0; x < W; x += 7) {
            const wx = x + cam;
            ctx.beginPath();
            ctx.moveTo(x, gy);
            ctx.quadraticCurveTo(x + 2, gy - 7 - Math.sin(wx * 0.1) * 3, x + 4, gy);
            ctx.stroke();
        }

        const cols = ['#FF6B9D', '#FFB74D', '#E040FB', '#FF5252', '#FFEB3B'];
        ctx.globalAlpha = 0.7 - nf * 0.4;
        for (let i = 0; i < 40; i++) {
            const fx = ((i * 79) % this.worldW) - cam;
            if (fx < -10 || fx > W + 10) continue;
            ctx.fillStyle = cols[i % cols.length];
            ctx.beginPath(); ctx.arc(fx, gy + 3 + (i % 5) * 3, 2.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
    },

    /* ═══════════ TREES (BIGGER) ═══════════ */

    drawTrees(t, cam, nf) {
        const { ctx, H } = this;
        const gy = H - 80;

        this.trees.forEach(tree => {
            const sx = tree.x - cam;
            if (sx < -200 || sx > this.W + 200) return;
            const sway = Math.sin(t * 0.5 + tree.sway) * 4;

            // Trunk
            ctx.fillStyle = nf > 0.5 ? '#2a1a10' : '#4a3020';
            ctx.beginPath();
            ctx.moveTo(sx - 9, gy);
            ctx.lineTo(sx - 6 + sway * 0.3, gy - tree.height);
            ctx.lineTo(sx + 6 + sway * 0.3, gy - tree.height);
            ctx.lineTo(sx + 9, gy);
            ctx.closePath(); ctx.fill();

            // Branches
            const by = gy - tree.height;
            ctx.strokeStyle = nf > 0.5 ? '#2a1a10' : '#4a3020';
            ctx.lineWidth = 4;
            [[-1, -0.6], [1, -0.4], [-0.5, -0.8], [0.7, -0.7]].forEach(([dx, dy]) => {
                ctx.beginPath();
                ctx.moveTo(sx + sway * 0.3, by + 20);
                ctx.quadraticCurveTo(
                    sx + dx * tree.canopyR * 0.5 + sway,
                    by + dy * tree.canopyR * 0.3,
                    sx + dx * tree.canopyR * 0.7 + sway,
                    by + dy * tree.canopyR * 0.5
                );
                ctx.stroke();
            });

            // Cherry blossom canopy
            const alpha = 0.85 - nf * 0.3;
            const cr = tree.canopyR;
            [
                [0, 0, cr * 0.85], [-cr * 0.45, cr * 0.1, cr * 0.65], [cr * 0.5, cr * 0.12, cr * 0.6],
                [-cr * 0.2, -cr * 0.4, cr * 0.55], [cr * 0.25, -cr * 0.35, cr * 0.5],
                [-cr * 0.55, -cr * 0.15, cr * 0.45], [cr * 0.6, -cr * 0.08, cr * 0.42],
                [0, -cr * 0.5, cr * 0.4],
            ].forEach(([ox, oy, r]) => {
                const grad = ctx.createRadialGradient(sx + ox + sway, by + oy, r * 0.1, sx + ox + sway, by + oy, r);
                const h = tree.blossomHue;
                grad.addColorStop(0, `hsla(${h},80%,80%,${alpha})`);
                grad.addColorStop(0.6, `hsla(${h},70%,70%,${alpha * 0.65})`);
                grad.addColorStop(1, `hsla(${h},60%,65%,0)`);
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(sx + ox + sway, by + oy, r, 0, Math.PI * 2); ctx.fill();
            });
        });
    },

    /* ═══════════ HOUSE ═══════════ */

    drawHouse(t, cam, nf) {
        const { ctx, H } = this;
        const gy = H - 80;
        const h = this.house;
        const sx = h.x - cam;
        if (sx < -300 || sx > this.W + 300) return;

        const baseY = gy - h.h;
        const roofPeak = baseY - h.roofH;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(sx - h.w / 2 + 8, gy - 4, h.w, 8);

        // Walls
        const wallGrad = ctx.createLinearGradient(sx - h.w / 2, baseY, sx + h.w / 2, gy);
        wallGrad.addColorStop(0, `rgb(${180 - nf * 80},${160 - nf * 70},${140 - nf * 60})`);
        wallGrad.addColorStop(1, `rgb(${160 - nf * 70},${140 - nf * 60},${120 - nf * 50})`);
        ctx.fillStyle = wallGrad;
        ctx.fillRect(sx - h.w / 2, baseY, h.w, h.h);
        ctx.strokeStyle = `rgba(60,40,20,${0.5 - nf * 0.2})`; ctx.lineWidth = 3;
        ctx.strokeRect(sx - h.w / 2, baseY, h.w, h.h);

        // Roof
        ctx.fillStyle = nf > 0.5 ? '#5a2020' : '#8B4513';
        ctx.beginPath();
        ctx.moveTo(sx - h.w / 2 - 20, baseY);
        ctx.lineTo(sx, roofPeak);
        ctx.lineTo(sx + h.w / 2 + 20, baseY);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = nf > 0.5 ? '#3a1010' : '#6B3010'; ctx.lineWidth = 3;
        ctx.stroke();

        // Chimney
        ctx.fillStyle = nf > 0.5 ? '#3a2020' : '#6D4C41';
        ctx.fillRect(sx + h.w / 4, roofPeak - 10, 25, 50);
        ctx.fillStyle = nf > 0.5 ? '#2a1515' : '#5D4037';
        ctx.fillRect(sx + h.w / 4 - 3, roofPeak - 10, 31, 8);

        // Smoke at night
        if (nf > 0.3) {
            ctx.globalAlpha = nf * 0.3;
            for (let i = 0; i < 4; i++) {
                const sy2 = roofPeak - 20 - i * 18 + Math.sin(t * 2 + i) * 5;
                const sx2 = sx + h.w / 4 + 12 + Math.sin(t + i * 0.5) * 8;
                ctx.fillStyle = 'rgba(200,200,200,0.3)';
                ctx.beginPath(); ctx.arc(sx2, sy2, 6 + i * 3, 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        // Door
        const doorX = sx - h.doorW / 2, doorY = gy - h.doorH;
        ctx.fillStyle = nf > 0.5 ? '#3E2010' : '#6D4C41';
        ctx.fillRect(doorX, doorY, h.doorW, h.doorH);
        ctx.strokeStyle = '#3E2723'; ctx.lineWidth = 2; ctx.strokeRect(doorX, doorY, h.doorW, h.doorH);
        ctx.fillStyle = '#FFD54F';
        ctx.beginPath(); ctx.arc(doorX + h.doorW - 10, doorY + h.doorH / 2, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = nf > 0.5 ? '#2a1510' : '#4E342E';
        ctx.fillRect(doorX - 5, doorY - 5, h.doorW + 10, 5);
        ctx.fillRect(doorX - 5, doorY, 5, h.doorH);
        ctx.fillRect(doorX + h.doorW, doorY, 5, h.doorH);

        // Windows
        const winSize = 36;
        [[-h.w / 2 + 30, baseY + 35], [h.w / 2 - 30 - winSize, baseY + 35]].forEach(([wx, wy]) => {
            if (nf > 0.3) { ctx.fillStyle = `rgba(255,200,100,${nf * 0.4})`; ctx.fillRect(sx + wx - 4, wy - 4, winSize + 8, winSize + 8); }
            ctx.fillStyle = nf > 0.5 ? `rgba(255,230,150,${0.3 + nf * 0.4})` : 'rgba(135,206,250,0.5)';
            ctx.fillRect(sx + wx, wy, winSize, winSize);
            ctx.strokeStyle = nf > 0.5 ? '#3E2723' : '#5D4037'; ctx.lineWidth = 3;
            ctx.strokeRect(sx + wx, wy, winSize, winSize);
            ctx.beginPath(); ctx.moveTo(sx + wx + winSize / 2, wy); ctx.lineTo(sx + wx + winSize / 2, wy + winSize);
            ctx.moveTo(sx + wx, wy + winSize / 2); ctx.lineTo(sx + wx + winSize, wy + winSize / 2); ctx.stroke();
        });

        // "Enter" prompt
        const dist = Math.abs(this.character.x - h.x);
        if (dist < 100) {
            const bob = Math.sin(t * 3) * 4;
            ctx.fillStyle = '#FFD54F'; ctx.font = 'bold 11px "Press Start 2P"'; ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 4;
            ctx.fillText('🏠 CLICK TO ENTER', sx, roofPeak - 15 + bob);
            ctx.shadowBlur = 0;
        }

        h._screenX = sx - h.w / 2 - 20;
        h._screenY = roofPeak;
        h._screenW = h.w + 40;
        h._screenH = gy - roofPeak;
    },

    /* ═══════════ VENDING MACHINE ═══════════ */

    drawVendingMachine(t, cam, nf) {
        const { ctx, H } = this;
        const gy = H - 80;
        const vm = this.vendingMachine;
        const sx = vm.x - cam;
        if (sx < -100 || sx > this.W + 100) return;

        const baseY = gy - vm.h;

        // Machine body
        ctx.fillStyle = '#b71c1c';
        ctx.fillRect(sx - vm.w / 2, baseY, vm.w, vm.h);

        // Machine front panel
        ctx.fillStyle = '#d32f2f';
        ctx.fillRect(sx - vm.w / 2 + 5, baseY + 5, vm.w - 10, vm.h - 20);

        // Glass display area
        ctx.fillStyle = 'rgba(200,230,255,0.3)';
        ctx.fillRect(sx - vm.w / 2 + 8, baseY + 10, vm.w - 16, 60);

        // Drink rows inside
        const drinkEmojis = ['🥤', '🧃', '💧', '☕', '🧋', '⚡'];
        ctx.font = '10px serif'; ctx.textAlign = 'center';
        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 3; c++) {
                ctx.fillText(drinkEmojis[r * 3 + c], sx - 15 + c * 15, baseY + 28 + r * 22);
            }
        }

        // Coin slot
        ctx.fillStyle = '#FFD54F';
        ctx.fillRect(sx + vm.w / 2 - 18, baseY + 80, 10, 14);
        ctx.fillStyle = '#F9A825';
        ctx.fillRect(sx + vm.w / 2 - 16, baseY + 85, 6, 4);

        // Dispenser slot
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(sx - vm.w / 2 + 10, baseY + vm.h - 18, vm.w - 20, 14);

        // Border
        ctx.strokeStyle = '#7f0000'; ctx.lineWidth = 3;
        ctx.strokeRect(sx - vm.w / 2, baseY, vm.w, vm.h);

        // Label
        ctx.fillStyle = '#FFD54F'; ctx.font = 'bold 7px "Press Start 2P"'; ctx.textAlign = 'center';
        ctx.fillText('DRINKS', sx, baseY + vm.h - 2);

        // "Buy" prompt when near
        const dist = Math.abs(this.character.x - vm.x);
        if (dist < 80) {
            const bob = Math.sin(t * 3) * 3;
            ctx.fillStyle = '#FFD54F'; ctx.font = 'bold 10px "Press Start 2P"';
            ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 4;
            ctx.fillText('🪙 CLICK TO BUY', sx, baseY - 15 + bob);
            ctx.shadowBlur = 0;
        }

        vm._screenX = sx - vm.w / 2;
        vm._screenY = baseY;
        vm._screenW = vm.w;
        vm._screenH = vm.h;
    },

    /* ═══════════ SIGNS ═══════════ */

    drawSigns(t, cam) {
        const { ctx, H } = this;
        const gy = H - 80;

        this.signs.forEach(sign => {
            const sx = sign.x - cam;
            if (sx < -120 || sx > this.W + 120) return;
            const hover = Math.sin(t * 2) * 3;

            ctx.fillStyle = '#5D4037'; ctx.fillRect(sx - 6, gy - 140, 12, 140);
            ctx.fillStyle = '#3E2723'; ctx.fillRect(sx - 8, gy - 142, 16, 7);

            const bw = 190, bh = 65;
            const bx = sx - bw / 2, by = gy - 200 + hover;

            ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(bx + 4, by + 4, bw, bh);
            ctx.fillStyle = '#6D4C41'; ctx.fillRect(bx, by, bw, bh);
            ctx.fillStyle = '#8D6E63'; ctx.fillRect(bx, by, bw, 7);
            ctx.strokeStyle = '#3E2723'; ctx.lineWidth = 3; ctx.strokeRect(bx, by, bw, bh);

            ctx.fillStyle = '#aaa';
            [[bx + 10, by + 10], [bx + bw - 10, by + 10]].forEach(([nx, ny]) => {
                ctx.beginPath(); ctx.arc(nx, ny, 3.5, 0, Math.PI * 2); ctx.fill();
            });

            ctx.fillStyle = '#FFD54F'; ctx.font = 'bold 16px "Press Start 2P"'; ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(255,213,79,0.4)'; ctx.shadowBlur = 10;
            ctx.fillText(sign.emoji + ' ' + sign.label, sx, by + 42);
            ctx.shadowBlur = 0;

            sign._screenX = bx; sign._screenY = by; sign._screenW = bw; sign._screenH = bh;
        });
    },

    /* ═══════════ PIXEL CHARACTER (BIGGER) ═══════════ */

    drawCharacter(t, cam) {
        const { ctx, H } = this;
        const ch = this.character;
        const sx = ch.x - cam;
        const sy = ch.y;
        const S = 5; // Big pixel scale
        const walking = Math.abs(ch.vx) > 0.5;
        const running = Math.abs(ch.vx) > 4;
        const airborne = !ch.grounded;
        const breathe = ch.grounded ? Math.sin(t * 2) * 1.5 : 0;

        // ── Dust particles when skidding ──
        if (walking && ch.grounded && Math.abs(ch.vx) > 2) {
            ctx.globalAlpha = 0.3;
            for (let i = 0; i < 3; i++) {
                const dx = sx - ch.dir * (10 + Math.random() * 20);
                const dy = sy + 12 * S * ch.stretch - 5 + Math.random() * 10;
                const dr = 2 + Math.random() * 4;
                ctx.fillStyle = 'rgba(200,180,150,0.5)';
                ctx.beginPath(); ctx.arc(dx, dy, dr, 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        ctx.save();
        ctx.translate(sx, sy + breathe);

        // ── Squash & Stretch transform ──
        ctx.scale(ch.dir * ch.squash, ch.stretch);

        const px = (x, y, w, h) => ctx.fillRect(x * S, y * S, w * S, h * S);
        const animSpeed = running ? 1.2 : 0.8;

        // ═══ HAIR ═══
        ctx.fillStyle = '#1a1a1a';
        px(-5, -28, 10, 6); px(-6, -26, 12, 4); px(-6, -22, 2, 11); px(4, -22, 2, 11); px(-6, -22, 2, 14);
        // Hair highlight
        ctx.fillStyle = '#333'; px(-3, -28, 4, 2);

        // Red hair accessory
        ctx.fillStyle = '#e53935'; px(-5, -25, 2, 2);

        // ═══ FACE ═══
        ctx.fillStyle = '#8D6E4C'; px(-4, -22, 8, 9);
        // Eyes (blink every 4 seconds)
        const blink = Math.sin(t * 0.8) > 0.97;
        if (blink) {
            ctx.fillStyle = '#5a4030'; px(-3, -19, 2, 1); px(1, -19, 2, 1);
        } else {
            ctx.fillStyle = '#111'; px(-3, -19, 2, 2); px(1, -19, 2, 2);
            ctx.fillStyle = '#fff'; px(-3, -19, 1, 1); px(1, -19, 1, 1); // eye highlights
        }
        // Eyebrows
        ctx.fillStyle = '#333'; px(-3, -21, 2, 1); px(1, -21, 2, 1);
        // Mouth
        ctx.fillStyle = '#fff'; px(-2, -15, 4, 1);
        // Nose
        ctx.fillStyle = '#7a5e3c'; px(0, -17, 1, 2);

        // ═══ NECK ═══
        ctx.fillStyle = '#8D6E4C'; px(-2, -13, 4, 2);

        // ═══ TORSO (longer) ═══
        ctx.fillStyle = '#FFB74D'; px(-5, -11, 10, 3);
        ctx.fillStyle = '#FF9800'; px(-5, -8, 10, 4);
        ctx.fillStyle = '#F57C00'; px(-5, -4, 10, 2);
        // Shirt stripe detail
        ctx.fillStyle = '#FFD54F'; px(-4, -7, 8, 1);

        // ═══ SLEEVES ═══
        ctx.fillStyle = '#FFB74D'; px(-7, -11, 2, 3); px(5, -11, 2, 3);

        // ═══ LEFT ARM + HAND (rotate from shoulder) ═══
        const armAngleL = airborne ? (ch.vy < 0 ? -0.5 : 0.3) : walking ? Math.sin(ch.frame * animSpeed) * 0.45 : Math.sin(t * 1.2) * 0.04;
        const armAngleR = airborne ? (ch.vy < 0 ? 0.5 : -0.3) : walking ? -Math.sin(ch.frame * animSpeed) * 0.45 : -Math.sin(t * 1.2) * 0.04;

        // Left arm
        ctx.save();
        ctx.translate(-6 * S, -10 * S); // shoulder pivot
        ctx.rotate(armAngleL);
        ctx.fillStyle = '#8D6E4C';
        ctx.fillRect(-1 * S, 0, 2 * S, 6 * S); // arm
        if (ch.drinking) {
            ctx.fillStyle = '#FFD54F'; ctx.fillRect(-1 * S, 6 * S, 2 * S, 2 * S);
        } else {
            ctx.fillStyle = '#FFD54F'; ctx.fillRect(-1 * S, 6 * S, 2 * S, 2 * S); // hand
        }
        ctx.restore();

        // Right arm
        ctx.save();
        ctx.translate(6 * S, -10 * S); // shoulder pivot
        if (ch.drinking) {
            ctx.rotate(-0.8); // raised for drinking
            ctx.fillStyle = '#8D6E4C'; ctx.fillRect(-1 * S, 0, 2 * S, 6 * S);
            ctx.fillStyle = '#FFD54F'; ctx.fillRect(-1 * S, 6 * S, 2 * S, 2 * S);
        } else {
            ctx.rotate(armAngleR);
            ctx.fillStyle = '#8D6E4C'; ctx.fillRect(-1 * S, 0, 2 * S, 6 * S);
            ctx.fillStyle = '#FFD54F'; ctx.fillRect(-1 * S, 6 * S, 2 * S, 2 * S);
        }
        ctx.restore();

        // ═══ SHORTS (longer) ═══
        ctx.fillStyle = '#ccc'; px(-5, -2, 10, 4);
        ctx.fillStyle = '#bbb'; px(-5, 1, 4, 1); px(1, 1, 4, 1);
        // Belt
        ctx.fillStyle = '#888'; px(-5, -2, 10, 1);

        // ═══ LEGS (rotate from hip) ═══
        const legAngleL = airborne ? (ch.vy < 0 ? -0.3 : 0.15) : walking ? Math.sin(ch.frame * animSpeed) * 0.38 : 0;
        const legAngleR = airborne ? (ch.vy < 0 ? 0.3 : -0.15) : walking ? -Math.sin(ch.frame * animSpeed) * 0.38 : 0;

        // Left leg
        ctx.save();
        ctx.translate(-2.5 * S, 2 * S); // hip pivot
        ctx.rotate(legAngleL);
        ctx.fillStyle = '#8D6E4C'; ctx.fillRect(-1.5 * S, 0, 3 * S, 6 * S);
        ctx.fillStyle = '#222'; ctx.fillRect(-2 * S, 6 * S, 4 * S, 3 * S); // shoe
        ctx.fillStyle = '#FF8A80'; ctx.fillRect(-2 * S, 8 * S, 4 * S, 1 * S); // sole
        ctx.fillStyle = '#fff'; ctx.fillRect(-1 * S, 6 * S, 2 * S, 1 * S); // lace
        ctx.restore();

        // Right leg
        ctx.save();
        ctx.translate(2.5 * S, 2 * S); // hip pivot
        ctx.rotate(legAngleR);
        ctx.fillStyle = '#8D6E4C'; ctx.fillRect(-1.5 * S, 0, 3 * S, 6 * S);
        ctx.fillStyle = '#222'; ctx.fillRect(-2 * S, 6 * S, 4 * S, 3 * S);
        ctx.fillStyle = '#FF8A80'; ctx.fillRect(-2 * S, 8 * S, 4 * S, 1 * S);
        ctx.fillStyle = '#fff'; ctx.fillRect(-1 * S, 6 * S, 2 * S, 1 * S);
        ctx.restore();

        ctx.restore();

        // Drinking animation — emoji floats above
        if (ch.drinking) {
            const elapsed = (performance.now() - ch.drinkTimer) / 1000;
            const drinkBob = Math.sin(elapsed * 4) * 3;
            const drinkAlpha = elapsed < 2.5 ? 1 : 1 - (elapsed - 2.5) / 0.5;
            ctx.globalAlpha = Math.max(0, drinkAlpha);
            ctx.font = '24px serif'; ctx.textAlign = 'center';
            ctx.fillText(ch.drinkEmoji, sx + 30, sy - 50 + drinkBob);
            if (elapsed > 0.5 && elapsed < 2.5) {
                ctx.font = '12px serif';
                for (let i = 0; i < 3; i++) {
                    const py = sy - 70 - i * 15 - elapsed * 10;
                    const px2 = sx + 30 + Math.sin(elapsed * 3 + i) * 8;
                    ctx.globalAlpha = Math.max(0, 0.6 - i * 0.2);
                    ctx.fillText('✨', px2, py);
                }
            }
            ctx.globalAlpha = 1;
        }

        // ── Speed lines when running fast ──
        if (running && ch.grounded) {
            ctx.globalAlpha = 0.2;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            for (let i = 0; i < 4; i++) {
                const ly = sy - 20 + i * 20;
                const lx = sx - ch.dir * 25;
                ctx.beginPath();
                ctx.moveTo(lx, ly);
                ctx.lineTo(lx - ch.dir * (15 + Math.random() * 15), ly);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }

        // Name tag
        const nameY = sy - 155 + Math.sin(t * 1.5) * 3;
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.font = 'bold 12px "Press Start 2P"'; ctx.textAlign = 'center';
        ctx.fillText('Mayowa', sx + 1, nameY + 1);
        ctx.fillStyle = '#fff';
        ctx.fillText('Mayowa', sx, nameY);

        // Jump hint (if not jumped yet)
        if (!airborne && ch.grounded && t < 15) {
            ctx.globalAlpha = 0.4 + Math.sin(t * 3) * 0.2;
            ctx.font = '7px "Press Start 2P"';
            ctx.fillStyle = '#FFD54F';
            ctx.fillText('↑ JUMP', sx, sy + 12 * S + 20);
            ctx.globalAlpha = 1;
        }
    },

    drawAboutChar() {
        const c = document.getElementById('aboutCharCanvas');
        if (!c) return;
        c.width = 80; c.height = 150;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        const s = 3, ox = 25, oy = 5;
        const px = (x, y, w, h) => ctx.fillRect(ox + x * s, oy + y * s, w * s, h * s);

        // Hair
        ctx.fillStyle = '#1a1a1a'; px(-5, 0, 10, 6); px(-6, 2, 12, 4); px(-6, 6, 2, 11); px(4, 6, 2, 11);
        ctx.fillStyle = '#e53935'; px(-5, 3, 2, 2);
        // Face
        ctx.fillStyle = '#8D6E4C'; px(-4, 6, 8, 9);
        ctx.fillStyle = '#111'; px(-3, 9, 2, 2); px(1, 9, 2, 2);
        ctx.fillStyle = '#fff'; px(-2, 14, 4, 1);
        // Neck
        ctx.fillStyle = '#8D6E4C'; px(-2, 15, 4, 2);
        // Torso
        ctx.fillStyle = '#FF9800'; px(-5, 17, 10, 7);
        ctx.fillStyle = '#FFD54F'; px(-4, 20, 8, 1);
        // Arms
        ctx.fillStyle = '#8D6E4C'; px(-7, 18, 2, 6); px(5, 18, 2, 6);
        // Belt
        ctx.fillStyle = '#888'; px(-5, 24, 10, 1);
        // Shorts
        ctx.fillStyle = '#ccc'; px(-5, 25, 10, 4);
        // Legs
        ctx.fillStyle = '#8D6E4C'; px(-4, 29, 3, 6); px(1, 29, 3, 6);
        // Shoes
        ctx.fillStyle = '#222'; px(-5, 35, 4, 3); px(1, 35, 4, 3);
        ctx.fillStyle = '#FF8A80'; px(-5, 37, 4, 1); px(1, 37, 4, 1);
    },

    drawPetals(cam) {
        const { ctx } = this;
        const nf = this.getDayNightFactor();
        this.petals.forEach(p => {
            const sx = p.x - cam;
            if (sx < -20 || sx > this.W + 20) return;
            ctx.save();
            ctx.translate(sx, p.y); ctx.rotate(p.rot);
            ctx.globalAlpha = p.alpha * (1 - nf * 0.5);
            ctx.fillStyle = `hsl(${335 + Math.sin(p.rot) * 15},70%,${80 - nf * 20}%)`;
            ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        });
        ctx.globalAlpha = 1;
    },

    drawVignette() {
        const { ctx, W, H } = this;
        const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.25)');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    },

    /* ═══════════ ROOM INTERIOR ═══════════ */

    drawRoom() {
        const c = document.getElementById('roomCanvas');
        if (!c) return;
        const ctx = c.getContext('2d');
        const W = c.width, H = c.height;
        ctx.imageSmoothingEnabled = false;

        // Floor
        ctx.fillStyle = '#5D4037'; ctx.fillRect(0, H * 0.6, W, H * 0.4);
        ctx.strokeStyle = '#4E342E'; ctx.lineWidth = 1;
        for (let y = H * 0.6; y < H; y += 25) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, H * 0.6); ctx.lineTo(x, H); ctx.stroke(); }

        // Wall
        const wallGrad = ctx.createLinearGradient(0, 0, 0, H * 0.6);
        wallGrad.addColorStop(0, '#6A7FDB'); wallGrad.addColorStop(1, '#5C6BC0');
        ctx.fillStyle = wallGrad; ctx.fillRect(0, 0, W, H * 0.6);
        ctx.fillStyle = '#fff'; ctx.fillRect(0, H * 0.6 - 4, W, 8);

        // Posters
        ctx.fillStyle = '#1a1a2e'; ctx.fillRect(50, 30, 90, 120);
        ctx.fillStyle = '#FF5252'; ctx.font = 'bold 14px "Press Start 2P"'; ctx.textAlign = 'center';
        ctx.fillText('🎮', 95, 75);
        ctx.fillStyle = '#fff'; ctx.font = '8px "Press Start 2P"'; ctx.fillText('GAME', 95, 100); ctx.fillText('ON', 95, 115);
        ctx.strokeStyle = '#333'; ctx.lineWidth = 3; ctx.strokeRect(50, 30, 90, 120);

        ctx.fillStyle = '#FFE0EC'; ctx.fillRect(170, 20, 80, 110);
        ctx.fillStyle = '#FF6B9D'; ctx.font = 'bold 28px serif'; ctx.fillText('桜', 210, 75);
        ctx.fillStyle = '#e91e63'; ctx.font = '7px "Press Start 2P"'; ctx.fillText('ANIME', 210, 100);
        ctx.strokeStyle = '#f48fb1'; ctx.lineWidth = 2; ctx.strokeRect(170, 20, 80, 110);

        ctx.fillStyle = '#2a2a2a'; ctx.fillRect(520, 25, 100, 70);
        ctx.fillStyle = '#FF0000'; ctx.font = 'bold 11px "Press Start 2P"'; ctx.fillText('ROBLOX', 570, 55);
        ctx.fillStyle = '#aaa'; ctx.font = '6px "Press Start 2P"'; ctx.fillText('Coming 2026', 570, 75);
        ctx.strokeStyle = '#555'; ctx.lineWidth = 2; ctx.strokeRect(520, 25, 100, 70);

        // Desk
        ctx.fillStyle = '#6D4C41'; ctx.fillRect(300, H * 0.42, 250, 15);
        ctx.fillStyle = '#5D4037'; ctx.fillRect(310, H * 0.42 + 15, 10, 80); ctx.fillRect(530, H * 0.42 + 15, 10, 80);

        // Monitor
        ctx.fillStyle = '#111'; ctx.fillRect(370, H * 0.2, 120, 85);
        ctx.fillStyle = '#1a1a3e'; ctx.fillRect(375, H * 0.2 + 4, 110, 75);
        ctx.fillStyle = '#39FF14'; ctx.font = '7px monospace'; ctx.textAlign = 'left';
        ['function play() {', '  score++;', '  render();', '}', "// Mayowa's code"].forEach((l, i) => ctx.fillText(l, 380, H * 0.2 + 18 + i * 13));
        ctx.fillStyle = '#333'; ctx.fillRect(420, H * 0.2 + 85, 20, 15);
        ctx.fillRect(410, H * 0.2 + 98, 40, 5);

        // Keyboard + mouse
        ctx.fillStyle = '#333'; ctx.fillRect(380, H * 0.42 - 12, 80, 12);
        ctx.fillStyle = '#555';
        for (let kx = 383; kx < 457; kx += 8) for (let ky = H * 0.42 - 10; ky < H * 0.42; ky += 6) ctx.fillRect(kx, ky, 5, 4);
        ctx.fillStyle = '#333'; ctx.beginPath(); ctx.ellipse(475, H * 0.42 - 5, 10, 14, 0, 0, Math.PI * 2); ctx.fill();

        // Bed
        ctx.fillStyle = '#4527A0'; ctx.fillRect(20, H * 0.55, 180, 80);
        ctx.fillStyle = '#7E57C2'; ctx.fillRect(20, H * 0.55, 180, 25);
        ctx.fillStyle = '#E8EAF6'; ctx.beginPath(); ctx.ellipse(55, H * 0.55 + 12, 30, 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3E2723'; ctx.fillRect(15, H * 0.53, 190, 6); ctx.fillRect(15, H * 0.55 + 78, 190, 8);

        // Bookshelf
        ctx.fillStyle = '#5D4037'; ctx.fillRect(600, H * 0.3, 80, 130);
        ctx.fillStyle = '#4E342E';
        [H * 0.3 + 42, H * 0.3 + 84].forEach(sy => ctx.fillRect(600, sy, 80, 5));
        const bookColors = ['#FF5252','#2196F3','#4CAF50','#FF9800','#9C27B0','#FFEB3B','#00BCD4','#E91E63'];
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle = bookColors[i]; ctx.fillRect(608 + (i % 3) * 22, H * 0.3 + 6 + Math.floor(i / 3) * 42, 16, 34);
        }

        // Lamp
        ctx.fillStyle = '#FFD54F';
        ctx.beginPath(); ctx.moveTo(560, H * 0.42); ctx.lineTo(545, H * 0.28); ctx.lineTo(575, H * 0.28); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,213,79,0.15)'; ctx.beginPath(); ctx.arc(560, H * 0.32, 30, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5D4037'; ctx.fillRect(557, H * 0.42, 6, 12);

        // Rug
        ctx.fillStyle = 'rgba(106,27,154,0.3)'; ctx.beginPath(); ctx.ellipse(W / 2, H * 0.82, 130, 40, 0, 0, Math.PI * 2); ctx.fill();

        // Backpack
        ctx.fillStyle = '#1565C0'; ctx.beginPath(); ctx.roundRect(240, H * 0.72, 35, 45, 6); ctx.fill();
        ctx.fillStyle = '#FFD54F'; ctx.fillRect(254, H * 0.72 + 4, 8, 8);

        // Sneakers
        ctx.fillStyle = '#FF5252'; ctx.fillRect(630, H * 0.88, 22, 12);
        ctx.fillStyle = '#E53935'; ctx.fillRect(655, H * 0.89, 22, 11);
        ctx.fillStyle = '#fff'; ctx.fillRect(630, H * 0.88 + 8, 22, 3); ctx.fillRect(655, H * 0.89 + 7, 22, 3);

        // Clock
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#333'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(450, 45, 25, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#111'; ctx.font = '7px "Press Start 2P"'; ctx.textAlign = 'center';
        ctx.fillText('12', 450, 32); ctx.fillText('6', 450, 66); ctx.fillText('3', 470, 49); ctx.fillText('9', 430, 49);
        const now = new Date();
        const hr = (now.getHours() % 12 + now.getMinutes() / 60) * (Math.PI * 2 / 12) - Math.PI / 2;
        const mn = (now.getMinutes() / 60) * Math.PI * 2 - Math.PI / 2;
        ctx.strokeStyle = '#111'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(450, 45); ctx.lineTo(450 + Math.cos(hr) * 13, 45 + Math.sin(hr) * 13); ctx.stroke();
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(450, 45); ctx.lineTo(450 + Math.cos(mn) * 18, 45 + Math.sin(mn) * 18); ctx.stroke();
    },

    /* ═══════════ INTERACTIONS ═══════════ */

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Signs
        this.signs.forEach(sign => {
            if (sign._screenX === undefined) return;
            if (mx >= sign._screenX && mx <= sign._screenX + sign._screenW &&
                my >= sign._screenY && my <= sign._screenY + sign._screenH) {
                AudioManager.playSfx('click');
                if (sign.action === 'about') { this.openModal('aboutModal'); Achievements.visitSection('about'); }
                else if (sign.action === 'games') { this.openModal('gamesModal'); Achievements.visitSection('games'); }
            }
        });

        // House
        const h = this.house;
        if (h && h._screenX !== undefined) {
            if (mx >= h._screenX && mx <= h._screenX + h._screenW &&
                my >= h._screenY && my <= h._screenY + h._screenH) {
                if (Math.abs(this.character.x - h.x) < 150) {
                    AudioManager.playSfx('click');
                    this.openModal('roomModal');
                    this.drawRoom();
                }
            }
        }

        // Vending machine
        const vm = this.vendingMachine;
        if (vm && vm._screenX !== undefined) {
            if (mx >= vm._screenX && mx <= vm._screenX + vm._screenW &&
                my >= vm._screenY && my <= vm._screenY + vm._screenH) {
                if (Math.abs(this.character.x - vm.x) < 120) {
                    AudioManager.playSfx('click');
                    document.getElementById('vendingStatus').textContent = '';
                    this.openModal('vendingModal');
                }
            }
        }

        // Character
        const ch = this.character;
        const csx = ch.x - this.camera.x;
        if (Math.abs(mx - csx) < 45 && Math.abs(my - ch.y + 40) < 90) {
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
            "Walk to the house and click it! 🏠",
            "Find the vending machine for drinks! 🥤",
            "My school banned game sites... so I made my own 😎",
        ];
        const bubble = document.getElementById('speechBubble');
        const text = document.getElementById('speechText');
        text.textContent = phrases[Math.floor(Math.random() * phrases.length)];

        const sx = this.character.x - this.camera.x;
        bubble.style.left = sx + 'px';
        bubble.style.top = (this.character.y - 175) + 'px';
        bubble.classList.remove('hidden');

        clearTimeout(this._speechTimer);
        this._speechTimer = setTimeout(() => bubble.classList.add('hidden'), 3000);
    },

    openModal(id) { document.getElementById(id).classList.remove('hidden'); },
    closeModal(id) { document.getElementById(id).classList.add('hidden'); },

    launchGame(id) {
        this.closeModal('gamesModal');
        this.openModal('gamePlayModal');
        Games.launch(id);
    },

    closeGame() {
        Games.stop();
        this.closeModal('gamePlayModal');
    },

    toggleMusic() {
        const btn = document.getElementById('musicToggle');
        if (AudioManager.playing) { AudioManager.stop(); btn.textContent = '🎵 Music: OFF'; }
        else { AudioManager.start(); btn.textContent = '🎵 Music: ON'; Achievements.unlock('music_lover'); }
    }
};
