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
        document.getElementById('gamesBtn').addEventListener('click', () => { this.openModal('gamesModal'); Achievements.visitSection('games'); });

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
            const dayAlpha = 1 - nf * 2;
            ctx.globalAlpha = dayAlpha;

            // ── Outer haze (atmospheric scattering) ──
            const haze = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 6);
            haze.addColorStop(0, 'rgba(255,230,150,0.15)');
            haze.addColorStop(0.4, 'rgba(255,200,100,0.06)');
            haze.addColorStop(1, 'rgba(255,180,80,0)');
            ctx.fillStyle = haze; ctx.beginPath(); ctx.arc(cx, cy, r * 6, 0, Math.PI * 2); ctx.fill();

            // ── Rotating sun rays ──
            ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.08);
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const rayLen = r * 2.5 + Math.sin(t * 1.5 + i * 1.3) * r * 0.6;
                const rayW = 0.06 + Math.sin(t * 2 + i) * 0.02;
                const rg = ctx.createRadialGradient(0, 0, r * 0.8, 0, 0, rayLen);
                rg.addColorStop(0, 'rgba(255,220,100,0.2)');
                rg.addColorStop(1, 'rgba(255,200,50,0)');
                ctx.fillStyle = rg;
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle - rayW) * r * 0.8, Math.sin(angle - rayW) * r * 0.8);
                ctx.lineTo(Math.cos(angle) * rayLen, Math.sin(angle) * rayLen);
                ctx.lineTo(Math.cos(angle + rayW) * r * 0.8, Math.sin(angle + rayW) * r * 0.8);
                ctx.closePath(); ctx.fill();
            }
            ctx.restore();

            // ── Corona glow ──
            const corona = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 2.5);
            corona.addColorStop(0, 'rgba(255,210,80,0.5)');
            corona.addColorStop(0.3, 'rgba(255,180,50,0.2)');
            corona.addColorStop(0.7, 'rgba(255,140,30,0.05)');
            corona.addColorStop(1, 'rgba(255,120,20,0)');
            ctx.fillStyle = corona; ctx.beginPath(); ctx.arc(cx, cy, r * 2.5, 0, Math.PI * 2); ctx.fill();

            // ── Sun body (gradient from center to edge) ──
            const body = ctx.createRadialGradient(cx - r * 0.15, cy - r * 0.15, r * 0.1, cx, cy, r);
            body.addColorStop(0, '#FFFDE7');
            body.addColorStop(0.3, '#FFE082');
            body.addColorStop(0.7, '#FFB300');
            body.addColorStop(0.9, '#FF8F00');
            body.addColorStop(1, '#E65100');
            ctx.fillStyle = body; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

            // ── Limb darkening (edge is darker) ──
            const limb = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r);
            limb.addColorStop(0, 'rgba(255,255,255,0)');
            limb.addColorStop(0.7, 'rgba(0,0,0,0)');
            limb.addColorStop(1, 'rgba(120,50,0,0.25)');
            ctx.fillStyle = limb; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

            // ── Sunspots (subtle dark patches) ──
            ctx.fillStyle = 'rgba(180,100,20,0.15)';
            ctx.beginPath(); ctx.arc(cx - 8, cy + 5, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx + 12, cy - 3, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx + 4, cy + 10, 2.5, 0, Math.PI * 2); ctx.fill();

            // ── Inner brightness (hot center) ──
            const hot = ctx.createRadialGradient(cx - 5, cy - 5, 0, cx, cy, r * 0.5);
            hot.addColorStop(0, 'rgba(255,255,255,0.35)');
            hot.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = hot; ctx.beginPath(); ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2); ctx.fill();

            // ── Lens flare (small streaks) ──
            const flareDist = r * 3;
            const flareAngle = Math.PI * 0.25;
            for (let i = 1; i <= 3; i++) {
                const fx = cx + Math.cos(flareAngle) * flareDist * i * 0.4;
                const fy = cy + Math.sin(flareAngle) * flareDist * i * 0.4;
                const fr = 3 + i * 2;
                const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr);
                fg.addColorStop(0, `rgba(255,240,200,${0.15 - i * 0.03})`);
                fg.addColorStop(1, 'rgba(255,240,200,0)');
                ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(fx, fy, fr, 0, Math.PI * 2); ctx.fill();
            }

        } else {
            // ── Moon (unchanged) ──
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

            // Wooden post
            ctx.fillStyle = '#5D4037'; ctx.fillRect(sx - 6, gy - 140, 12, 140);
            ctx.fillStyle = '#3E2723'; ctx.fillRect(sx - 8, gy - 142, 16, 7);

            const bw = 190, bh = 65;
            const bx = sx - bw / 2, by = gy - 200 + hover;

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(bx + 4, by + 4, bw, bh);
            // Board
            ctx.fillStyle = '#6D4C41'; ctx.fillRect(bx, by, bw, bh);
            ctx.fillStyle = '#8D6E63'; ctx.fillRect(bx, by, bw, 7);
            ctx.strokeStyle = '#3E2723'; ctx.lineWidth = 3; ctx.strokeRect(bx, by, bw, bh);

            // Nails
            ctx.fillStyle = '#aaa';
            [[bx + 10, by + 10], [bx + bw - 10, by + 10]].forEach(([nx, ny]) => {
                ctx.beginPath(); ctx.arc(nx, ny, 3.5, 0, Math.PI * 2); ctx.fill();
            });

            // Text
            ctx.fillStyle = '#FFD54F'; ctx.font = 'bold 16px "Press Start 2P"'; ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(255,213,79,0.4)'; ctx.shadowBlur = 10;
            ctx.fillText(sign.emoji + ' ' + sign.label, sx, by + 42);
            ctx.shadowBlur = 0;

            sign._screenX = bx; sign._screenY = by; sign._screenW = bw; sign._screenH = bh;
        });
    },

    /* ═══════════ PIXEL CHARACTER ═══════════ */

    drawCharacter(t, cam) {
        const { ctx, H } = this;
        const ch = this.character;
        const sx = ch.x - cam;
        const sy = ch.y;
        const S = 5;
        const walking = Math.abs(ch.vx) > 0.5;
        const running = Math.abs(ch.vx) > 4;
        const airborne = !ch.grounded;
        const breathe = ch.grounded ? Math.sin(t * 2) * 1.5 : 0;

        // Dust particles when skidding
        if (walking && ch.grounded && Math.abs(ch.vx) > 2) {
            ctx.globalAlpha = 0.3;
            for (let i = 0; i < 3; i++) {
                const dx = sx - ch.dir * (10 + Math.random() * 20);
                const dy = sy + 55 + Math.random() * 10;
                const dr = 2 + Math.random() * 4;
                ctx.fillStyle = 'rgba(200,180,150,0.5)';
                ctx.beginPath(); ctx.arc(dx, dy, dr, 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        ctx.save();
        ctx.translate(sx, sy + breathe);
        ctx.scale(ch.dir * ch.squash, ch.stretch);

        const px = (x, y, w, h) => ctx.fillRect(x * S, y * S, w * S, h * S);
        const animSpeed = running ? 1.2 : 0.8;

        // Smooth limb offsets (Y only — no rotation means no gaps)
        const limbPhase = ch.frame * animSpeed;
        const swing = walking ? Math.sin(limbPhase) : 0;
        const armOffL = airborne ? (ch.vy < 0 ? -2 : 1) : swing * 2.5;
        const armOffR = airborne ? (ch.vy < 0 ? 2 : -1) : -swing * 2.5;
        const legOffL = airborne ? (ch.vy < 0 ? -1.5 : 0.8) : swing * 2;
        const legOffR = airborne ? (ch.vy < 0 ? 1.5 : -0.8) : -swing * 2;

        // DRAW ORDER: back leg -> back arm -> body -> front leg -> front arm

        // BACK LEG (slightly darker for depth)
        ctx.fillStyle = '#7a5e3c';
        ctx.fillRect(1 * S, (2 + legOffR) * S, 3 * S, 6 * S);
        ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0 * S, (8 + legOffR) * S, 4 * S, 3 * S);
        ctx.fillStyle = '#e06060'; ctx.fillRect(0 * S, (10 + legOffR) * S, 4 * S, 1 * S);

        // BACK ARM (slightly darker)
        ctx.fillStyle = '#7a5e3c';
        ctx.fillRect(5 * S, (-8 + armOffR) * S, 2 * S, 6 * S);
        ctx.fillStyle = '#e6c35a'; ctx.fillRect(5 * S, (-2 + armOffR) * S, 2 * S, 2 * S);

        // HAIR
        ctx.fillStyle = '#1a1a1a';
        px(-5, -28, 10, 6); px(-6, -26, 12, 4); px(-6, -22, 2, 11); px(4, -22, 2, 11); px(-6, -22, 2, 14);
        ctx.fillStyle = '#333'; px(-3, -28, 4, 2);
        ctx.fillStyle = '#e53935'; px(-5, -25, 2, 2);

        // FACE
        ctx.fillStyle = '#8D6E4C'; px(-4, -22, 8, 9);
        const blink = Math.sin(t * 0.8) > 0.97;
        if (blink) {
            ctx.fillStyle = '#5a4030'; px(-3, -19, 2, 1); px(1, -19, 2, 1);
        } else {
            ctx.fillStyle = '#111'; px(-3, -19, 2, 2); px(1, -19, 2, 2);
            ctx.fillStyle = '#fff'; px(-3, -19, 1, 1); px(1, -19, 1, 1);
        }
        ctx.fillStyle = '#333'; px(-3, -21, 2, 1); px(1, -21, 2, 1);
        ctx.fillStyle = '#fff'; px(-2, -15, 4, 1);
        ctx.fillStyle = '#7a5e3c'; px(0, -17, 1, 2);

        // NECK
        ctx.fillStyle = '#8D6E4C'; px(-2, -13, 4, 2);

        // TORSO (covers arm/leg connections)
        ctx.fillStyle = '#FFB74D'; px(-5, -11, 10, 3);
        ctx.fillStyle = '#FF9800'; px(-5, -8, 10, 4);
        ctx.fillStyle = '#F57C00'; px(-5, -4, 10, 2);
        ctx.fillStyle = '#FFD54F'; px(-4, -7, 8, 1);
        ctx.fillStyle = '#FFB74D'; px(-7, -11, 2, 3); px(5, -11, 2, 3);

        // SHORTS (covers leg connections)
        ctx.fillStyle = '#ccc'; px(-5, -2, 10, 4);
        ctx.fillStyle = '#bbb'; px(-5, 1, 4, 1); px(1, 1, 4, 1);
        ctx.fillStyle = '#888'; px(-5, -2, 10, 1);

        // FRONT LEG
        ctx.fillStyle = '#8D6E4C';
        ctx.fillRect(-4 * S, (2 + legOffL) * S, 3 * S, 6 * S);
        ctx.fillStyle = '#222'; ctx.fillRect(-5 * S, (8 + legOffL) * S, 4 * S, 3 * S);
        ctx.fillStyle = '#FF8A80'; ctx.fillRect(-5 * S, (10 + legOffL) * S, 4 * S, 1 * S);
        ctx.fillStyle = '#fff'; ctx.fillRect(-4 * S, (8 + legOffL) * S, 2 * S, 1 * S);

        // FRONT ARM
        ctx.fillStyle = '#8D6E4C';
        if (ch.drinking) {
            ctx.fillRect(-7 * S, (-10) * S, 2 * S, 6 * S);
            ctx.fillStyle = '#FFD54F'; ctx.fillRect(-7 * S, (-4) * S, 2 * S, 2 * S);
        } else {
            ctx.fillRect(-7 * S, (-8 + armOffL) * S, 2 * S, 6 * S);
            ctx.fillStyle = '#FFD54F'; ctx.fillRect(-7 * S, (-2 + armOffL) * S, 2 * S, 2 * S);
        }

        ctx.restore();

        // Drinking animation
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
                    ctx.fillText('\u2728', px2, py);
                }
            }
            ctx.globalAlpha = 1;
        }

        // Speed lines
        if (running && ch.grounded) {
            ctx.globalAlpha = 0.2; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
            for (let i = 0; i < 4; i++) {
                const ly = sy - 20 + i * 20;
                const lx = sx - ch.dir * 25;
                ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx - ch.dir * (15 + Math.random() * 15), ly); ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }

        // Name tag
        const nameY = sy - 155 + Math.sin(t * 1.5) * 3;
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.font = 'bold 12px "Press Start 2P"'; ctx.textAlign = 'center';
        ctx.fillText('Mayowa', sx + 1, nameY + 1);
        ctx.fillStyle = '#fff';
        ctx.fillText('Mayowa', sx, nameY);

        // Jump hint
        if (!airborne && ch.grounded && t < 15) {
            ctx.globalAlpha = 0.4 + Math.sin(t * 3) * 0.2;
            ctx.font = '7px "Press Start 2P"'; ctx.fillStyle = '#FFD54F';
            ctx.fillText('\u2191 JUMP', sx, sy + 12 * S + 20);
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
        const t = performance.now() / 1000;

        // ═══ FLOOR — dark metallic grid ═══
        const floorY = H * 0.6;
        const floorGrad = ctx.createLinearGradient(0, floorY, 0, H);
        floorGrad.addColorStop(0, '#1a1a2e'); floorGrad.addColorStop(1, '#0d0d1a');
        ctx.fillStyle = floorGrad; ctx.fillRect(0, floorY, W, H * 0.4);
        // Grid lines with glow
        ctx.strokeStyle = 'rgba(0,255,255,0.08)'; ctx.lineWidth = 1;
        for (let y = floorY; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, floorY); ctx.lineTo(x, H); ctx.stroke(); }
        // Perspective glow strip
        const stripGrad = ctx.createLinearGradient(0, floorY, 0, floorY + 4);
        stripGrad.addColorStop(0, 'rgba(0,255,255,0.3)'); stripGrad.addColorStop(1, 'rgba(0,255,255,0)');
        ctx.fillStyle = stripGrad; ctx.fillRect(0, floorY, W, 4);

        // ═══ WALL — dark with holographic panels ═══
        const wallGrad = ctx.createLinearGradient(0, 0, 0, floorY);
        wallGrad.addColorStop(0, '#0a0a1a'); wallGrad.addColorStop(0.5, '#12122a'); wallGrad.addColorStop(1, '#1a1a30');
        ctx.fillStyle = wallGrad; ctx.fillRect(0, 0, W, floorY);

        // Animated neon trim line at wall base
        const neonHue = (Math.sin(t * 0.5) * 0.5 + 0.5);
        const neonR = Math.floor(neonHue < 0.5 ? 0 : (neonHue - 0.5) * 2 * 255);
        const neonG = Math.floor(255 - Math.abs(neonHue - 0.5) * 2 * 255);
        const neonB = Math.floor(neonHue < 0.5 ? (0.5 - neonHue) * 2 * 255 : 0);
        ctx.shadowColor = 'rgb(' + neonR + ',' + neonG + ',' + neonB + ')'; ctx.shadowBlur = 12;
        ctx.fillStyle = 'rgb(' + neonR + ',' + neonG + ',' + neonB + ')';
        ctx.fillRect(0, floorY - 2, W, 2);
        ctx.shadowBlur = 0;

        // Wall hex pattern (subtle)
        ctx.globalAlpha = 0.04; ctx.strokeStyle = '#00ffff';
        for (let r = 0; r < 8; r++) {
            for (let col = 0; col < 12; col++) {
                const hx = col * 65 + (r % 2) * 32;
                const hy = r * 42 + 15;
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const a = Math.PI / 3 * i - Math.PI / 6;
                    const px = hx + 20 * Math.cos(a), py = hy + 20 * Math.sin(a);
                    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                }
                ctx.closePath(); ctx.stroke();
            }
        }
        ctx.globalAlpha = 1;

        // ═══ HOLOGRAPHIC POSTERS ═══
        // Gaming poster with animated border
        const pulse1 = Math.sin(t * 3) * 0.3 + 0.7;
        ctx.fillStyle = '#0a0a20'; ctx.fillRect(50, 25, 95, 125);
        ctx.strokeStyle = 'rgba(57,255,20,' + pulse1 + ')'; ctx.lineWidth = 2; ctx.strokeRect(50, 25, 95, 125);
        ctx.fillStyle = '#39FF14'; ctx.font = 'bold 32px serif'; ctx.textAlign = 'center'; ctx.fillText('🎮', 97, 75);
        ctx.fillStyle = '#39FF14'; ctx.font = '8px "Press Start 2P"'; ctx.fillText('GAME', 97, 100);
        ctx.fillStyle = '#00ffff'; ctx.font = '6px "Press Start 2P"'; ctx.fillText('DEV', 97, 115);
        // Scanline effect
        ctx.globalAlpha = 0.1;
        for (let y = 26; y < 149; y += 3) { ctx.fillStyle = '#000'; ctx.fillRect(51, y, 93, 1); }
        ctx.globalAlpha = 1;

        // Cherry blossom poster
        const pulse2 = Math.sin(t * 2.5 + 1) * 0.3 + 0.7;
        ctx.fillStyle = '#1a0a15'; ctx.fillRect(170, 18, 85, 115);
        ctx.strokeStyle = 'rgba(255,107,157,' + pulse2 + ')'; ctx.lineWidth = 2; ctx.strokeRect(170, 18, 85, 115);
        ctx.fillStyle = '#FF6B9D'; ctx.font = 'bold 30px serif'; ctx.fillText('🌸', 212, 65);
        ctx.fillStyle = '#ff6b9d'; ctx.font = '7px "Press Start 2P"'; ctx.fillText('桜', 212, 90);
        ctx.fillStyle = '#ff9dbd'; ctx.font = '5px "Press Start 2P"'; ctx.fillText('SAKURA', 212, 108);

        // Roblox poster with hologram effect
        const pulse3 = Math.sin(t * 2 + 2) * 0.3 + 0.7;
        ctx.fillStyle = '#0a0a15'; ctx.fillRect(520, 20, 105, 80);
        ctx.strokeStyle = 'rgba(255,0,0,' + pulse3 + ')'; ctx.lineWidth = 2; ctx.strokeRect(520, 20, 105, 80);
        ctx.fillStyle = '#FF0000'; ctx.font = 'bold 12px "Press Start 2P"'; ctx.fillText('ROBLOX', 572, 52);
        ctx.fillStyle = '#00ffff'; ctx.font = '6px "Press Start 2P"'; ctx.fillText('Coming 2026', 572, 72);
        // Hologram flicker
        if (Math.sin(t * 8) > 0.3) {
            ctx.globalAlpha = 0.05; ctx.fillStyle = '#00ffff'; ctx.fillRect(521, 21, 103, 78); ctx.globalAlpha = 1;
        }

        // ═══ FLOATING DESK (glass/metal) ═══
        const deskY = H * 0.42;
        // Glass top with neon edge
        ctx.fillStyle = 'rgba(30,40,60,0.8)'; ctx.fillRect(295, deskY, 260, 10);
        ctx.fillStyle = 'rgba(0,200,255,0.4)'; ctx.fillRect(295, deskY + 8, 260, 2);
        // Floating legs (thin metal with glow)
        ctx.fillStyle = '#334'; ctx.fillRect(310, deskY + 10, 4, 80); ctx.fillRect(541, deskY + 10, 4, 80);
        ctx.fillStyle = 'rgba(0,200,255,0.15)'; ctx.fillRect(309, deskY + 10, 6, 80); ctx.fillRect(540, deskY + 10, 6, 80);

        // ═══ MONITOR (ultra-wide curved) ═══
        const monY = H * 0.17;
        // Bezel
        ctx.fillStyle = '#111'; ctx.beginPath(); ctx.roundRect(345, monY, 160, 100, 6); ctx.fill();
        // Screen
        const scrGrad = ctx.createLinearGradient(350, monY + 4, 350, monY + 94);
        scrGrad.addColorStop(0, '#0a0a2e'); scrGrad.addColorStop(1, '#0a1a1a');
        ctx.fillStyle = scrGrad; ctx.beginPath(); ctx.roundRect(350, monY + 4, 150, 90, 4); ctx.fill();
        // Code on screen
        ctx.fillStyle = '#39FF14'; ctx.font = '7px monospace'; ctx.textAlign = 'left';
        const codeLines = ['class GameDev {', '  build() {', '    this.render();', '    this.score++;', '  }', "  // Mayowa's code"];
        codeLines.forEach((l, i) => ctx.fillText(l, 358, monY + 20 + i * 12));
        // Cursor blink
        if (Math.sin(t * 4) > 0) { ctx.fillStyle = '#39FF14'; ctx.fillRect(358 + 7 * 16, monY + 20 + 5 * 12 - 7, 6, 8); }
        // Monitor stand
        ctx.fillStyle = '#222'; ctx.fillRect(415, monY + 98, 20, 15);
        ctx.fillStyle = '#333'; ctx.fillRect(405, monY + 111, 40, 4);
        // Screen glow on wall
        ctx.globalAlpha = 0.06; ctx.fillStyle = '#39FF14'; ctx.fillRect(340, monY - 15, 170, 15); ctx.globalAlpha = 1;

        // ═══ KEYBOARD (RGB) ═══
        ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.roundRect(375, deskY - 14, 90, 14, 3); ctx.fill();
        const kbColors = ['#ff0040','#ff8000','#ffff00','#00ff40','#00ffff','#4080ff','#8000ff','#ff00ff'];
        for (let kx = 0; kx < 10; kx++) {
            for (let ky = 0; ky < 2; ky++) {
                ctx.fillStyle = kbColors[(kx + ky) % kbColors.length];
                ctx.globalAlpha = 0.4 + Math.sin(t * 3 + kx * 0.5) * 0.3;
                ctx.fillRect(379 + kx * 8, deskY - 12 + ky * 6, 5, 4);
            }
        }
        ctx.globalAlpha = 1;
        // Mouse
        ctx.fillStyle = '#222'; ctx.beginPath(); ctx.ellipse(480, deskY - 7, 10, 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(0,255,255,0.3)'; ctx.fillRect(479, deskY - 14, 2, 6);

        // ═══ GAMING BED (futuristic pod) ═══
        // Pod frame
        ctx.fillStyle = '#1a1a30'; ctx.beginPath(); ctx.roundRect(15, H * 0.52, 195, 90, 10); ctx.fill();
        ctx.strokeStyle = 'rgba(100,80,200,0.5)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(15, H * 0.52, 195, 90, 10); ctx.stroke();
        // Mattress
        const bedGrad = ctx.createLinearGradient(20, H * 0.54, 20, H * 0.54 + 30);
        bedGrad.addColorStop(0, '#4527A0'); bedGrad.addColorStop(1, '#311B92');
        ctx.fillStyle = bedGrad; ctx.beginPath(); ctx.roundRect(20, H * 0.54, 185, 30, 6); ctx.fill();
        // Pillow
        ctx.fillStyle = '#E8EAF6'; ctx.beginPath(); ctx.ellipse(55, H * 0.56 + 5, 30, 12, 0, 0, Math.PI * 2); ctx.fill();
        // LED strip under bed
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle = 'rgba(100,80,200,' + (0.3 + Math.sin(t * 2 + i * 0.5) * 0.2) + ')';
            ctx.fillRect(25 + i * 23, H * 0.52 + 85, 15, 3);
        }

        // ═══ HOLOGRAPHIC BOOKSHELF ═══
        ctx.fillStyle = 'rgba(20,20,40,0.8)'; ctx.fillRect(598, H * 0.28, 88, 140);
        ctx.strokeStyle = 'rgba(0,200,255,0.3)'; ctx.lineWidth = 1;
        ctx.strokeRect(598, H * 0.28, 88, 140);
        // Shelves with glow
        [H * 0.28 + 46, H * 0.28 + 92].forEach(sy => {
            ctx.fillStyle = 'rgba(0,200,255,0.15)'; ctx.fillRect(598, sy, 88, 2);
        });
        // Glowing books
        const bookColors = ['#FF5252','#2196F3','#39FF14','#FF9800','#E040FB','#FFD740','#00E5FF','#FF6E40'];
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle = bookColors[i];
            ctx.globalAlpha = 0.7 + Math.sin(t * 1.5 + i) * 0.2;
            ctx.fillRect(606 + (i % 3) * 26, H * 0.28 + 8 + Math.floor(i / 3) * 46, 18, 36);
            ctx.globalAlpha = 0.15;
            ctx.fillRect(606 + (i % 3) * 26 - 2, H * 0.28 + 6 + Math.floor(i / 3) * 46, 22, 40);
        }
        ctx.globalAlpha = 1;

        // ═══ NEON LAMP ═══
        const lampGlow = 0.5 + Math.sin(t * 1.8) * 0.3;
        ctx.fillStyle = '#222'; ctx.fillRect(557, deskY, 6, 12);
        ctx.fillStyle = 'rgba(0,255,255,' + lampGlow + ')';
        ctx.beginPath();
        ctx.moveTo(548, H * 0.28); ctx.lineTo(572, H * 0.28); ctx.lineTo(564, deskY); ctx.lineTo(556, deskY);
        ctx.closePath(); ctx.fill();
        ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 20;
        ctx.fillStyle = 'rgba(0,255,255,0.2)'; ctx.beginPath(); ctx.arc(560, H * 0.32, 35, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        // ═══ NEON RUG (circular light pad) ═══
        const rugPulse = 0.1 + Math.sin(t) * 0.05;
        const rugGrad = ctx.createRadialGradient(W / 2, H * 0.82, 10, W / 2, H * 0.82, 120);
        rugGrad.addColorStop(0, 'rgba(100,50,200,' + rugPulse + ')');
        rugGrad.addColorStop(0.5, 'rgba(50,20,150,' + (rugPulse * 0.5) + ')');
        rugGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rugGrad; ctx.beginPath(); ctx.ellipse(W / 2, H * 0.82, 130, 40, 0, 0, Math.PI * 2); ctx.fill();
        // Ring
        ctx.strokeStyle = 'rgba(100,50,200,0.2)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(W / 2, H * 0.82, 120, 35, 0, 0, Math.PI * 2); ctx.stroke();

        // ═══ BACKPACK (futuristic) ═══
        ctx.fillStyle = '#0d47a1'; ctx.beginPath(); ctx.roundRect(238, H * 0.72, 38, 48, 8); ctx.fill();
        ctx.strokeStyle = 'rgba(0,200,255,0.4)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(238, H * 0.72, 38, 48, 8); ctx.stroke();
        ctx.fillStyle = '#00ffff'; ctx.fillRect(252, H * 0.72 + 6, 10, 10);

        // ═══ SNEAKERS ═══
        ctx.fillStyle = '#FF5252'; ctx.beginPath(); ctx.roundRect(628, H * 0.88, 24, 13, 3); ctx.fill();
        ctx.fillStyle = '#E53935'; ctx.beginPath(); ctx.roundRect(655, H * 0.89, 24, 12, 3); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(630, H * 0.88 + 9, 20, 2); ctx.fillRect(657, H * 0.89 + 8, 20, 2);

        // ═══ DIGITAL CLOCK (holographic) ═══
        const now = new Date();
        const timeStr = now.getHours().toString().padStart(2,'0') + (Math.sin(t * 2) > 0 ? ':' : ' ') + now.getMinutes().toString().padStart(2,'0');
        ctx.fillStyle = '#0a0a15'; ctx.beginPath(); ctx.roundRect(425, 25, 80, 40, 6); ctx.fill();
        ctx.strokeStyle = 'rgba(0,255,255,0.4)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(425, 25, 80, 40, 6); ctx.stroke();
        ctx.fillStyle = '#00ffff'; ctx.font = '14px "Press Start 2P"'; ctx.textAlign = 'center';
        ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 8;
        ctx.fillText(timeStr, 465, 52);
        ctx.shadowBlur = 0;

        // ═══ FLOATING PARTICLES ═══
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 15; i++) {
            const px = (i * 47 + t * 20) % W;
            const py = (i * 31 + Math.sin(t + i) * 30) % (floorY - 20) + 10;
            const size = 1 + Math.sin(t * 2 + i) * 0.5;
            ctx.fillStyle = i % 3 === 0 ? '#00ffff' : i % 3 === 1 ? '#ff6b9d' : '#39FF14';
            ctx.beginPath(); ctx.arc(px, py, size, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
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
