/* ═══════════════════════════════════════════
   LOADING SCREEN — Space Theme
   Stars, Moon, Blue Planet, Rocket
   ═══════════════════════════════════════════ */

const Loader = {
    canvas: null,
    ctx: null,
    stars: [],
    progress: 0,
    done: false,

    init() {
        this.canvas = document.getElementById('loaderCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Generate stars
        for (let i = 0; i < 150; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                r: Math.random() * 1.8 + 0.3,
                twinkle: Math.random() * Math.PI * 2,
                speed: 0.5 + Math.random() * 2,
            });
        }

        this.animate();
        this.simulateLoading();
    },

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    simulateLoading() {
        const steps = [
            'INITIALIZING SYSTEMS...',
            'LOADING PIXEL ART...',
            'GENERATING CHERRY BLOSSOMS...',
            'TUNING JAZZ PIANO...',
            'PREPARING GAMES...',
            'ALMOST READY...',
            'WELCOME HOME!'
        ];

        const tick = () => {
            this.progress += 1 + Math.random() * 2.5;
            if (this.progress > 100) this.progress = 100;

            const bar = document.getElementById('loaderBar');
            const status = document.getElementById('loaderStatus');
            const pct = document.getElementById('loaderPercent');

            if (bar) bar.style.width = this.progress + '%';
            if (pct) pct.textContent = Math.floor(this.progress) + '%';
            if (status) {
                const idx = Math.min(Math.floor(this.progress / 16), steps.length - 1);
                status.textContent = steps[idx];
            }

            if (this.progress >= 100) {
                setTimeout(() => {
                    this.done = true;
                    document.getElementById('loader').classList.add('done');
                    // Show HUD and controls
                    document.getElementById('hud').classList.remove('hidden');
                    document.getElementById('controlsHint').classList.remove('hidden');
                    // Start main app
                    if (typeof App !== 'undefined') App.start();
                }, 600);
            } else {
                setTimeout(tick, 80 + Math.random() * 60);
            }
        };

        setTimeout(tick, 300);
    },

    animate() {
        if (this.done) return;
        requestAnimationFrame(() => this.animate());

        const { ctx, canvas: c } = this;
        const W = c.width, H = c.height;
        const t = performance.now() / 1000;

        // Background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);

        // Stars
        this.stars.forEach(s => {
            const alpha = 0.4 + Math.sin(t * s.speed + s.twinkle) * 0.4;
            ctx.fillStyle = `rgba(255,255,255,${Math.max(0.1, alpha)})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
        });

        // Moon (top right)
        const mx = W - W * 0.12;
        const my = H * 0.18;
        const mr = Math.min(W, H) * 0.08;

        // Moon glow
        const moonGlow = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 2.5);
        moonGlow.addColorStop(0, 'rgba(200,200,210,0.15)');
        moonGlow.addColorStop(1, 'rgba(200,200,210,0)');
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(mx, my, mr * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Moon body
        const moonGrad = ctx.createRadialGradient(mx - mr * 0.2, my - mr * 0.2, mr * 0.1, mx, my, mr);
        moonGrad.addColorStop(0, '#e8e8e8');
        moonGrad.addColorStop(0.6, '#c0c0c0');
        moonGrad.addColorStop(1, '#999');
        ctx.fillStyle = moonGrad;
        ctx.beginPath();
        ctx.arc(mx, my, mr, 0, Math.PI * 2);
        ctx.fill();

        // Moon craters
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        [[0.25, -0.2, 0.15], [-0.15, 0.3, 0.12], [0.35, 0.2, 0.08]].forEach(([ox, oy, or]) => {
            ctx.beginPath();
            ctx.arc(mx + mr * ox, my + mr * oy, mr * or, 0, Math.PI * 2);
            ctx.fill();
        });

        // Blue planet (bottom left)
        const px = W * 0.1;
        const py = H * 0.78;
        const pr = Math.min(W, H) * 0.07;

        // Planet glow
        const planetGlow = ctx.createRadialGradient(px, py, pr * 0.5, px, py, pr * 2);
        planetGlow.addColorStop(0, 'rgba(0,100,255,0.2)');
        planetGlow.addColorStop(1, 'rgba(0,100,255,0)');
        ctx.fillStyle = planetGlow;
        ctx.beginPath();
        ctx.arc(px, py, pr * 2, 0, Math.PI * 2);
        ctx.fill();

        // Planet body
        const planetGrad = ctx.createRadialGradient(px - pr * 0.3, py - pr * 0.3, 0, px, py, pr);
        planetGrad.addColorStop(0, '#4488ff');
        planetGrad.addColorStop(0.7, '#2266dd');
        planetGrad.addColorStop(1, '#1144aa');
        ctx.fillStyle = planetGrad;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
    }
};

// Auto-start loader
window.addEventListener('DOMContentLoaded', () => Loader.init());
