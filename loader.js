/* ═══════════════════════════════════════════
   LOADER — Epic Solar System + Milky Way
   Galaxy band, nebulae, asteroid belt,
   shooting stars, solar flares, comets
   ═══════════════════════════════════════════ */

const Loader = {
    scene: null, camera: null, renderer: null,
    planets: [], sun: null, asteroids: null,
    shootingStars: [], comet: null,

    init() {
        const canvas = document.getElementById('loaderCanvas');
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
        this.camera.position.set(0, 40, 140);
        this.camera.lookAt(0, 0, 0);

        this.scene.add(new THREE.AmbientLight(0x111133, 0.2));

        this.createMilkyWay();
        this.createDeepStarfield();
        this.createNebulae();
        this.createSun();
        this.createPlanets();
        this.createAsteroidBelt();
        this.createComet();

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        this.animate();
        this.simulateLoading();
    },

    /* ── Glow sprite from RGB values ── */
    makeGlow(r, g, b, size, opacity) {
        const c = document.createElement('canvas');
        c.width = c.height = 256;
        const ctx = c.getContext('2d');
        const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        grad.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',1)');
        grad.addColorStop(0.1, 'rgba(' + r + ',' + g + ',' + b + ',0.8)');
        grad.addColorStop(0.3, 'rgba(' + r + ',' + g + ',' + b + ',0.3)');
        grad.addColorStop(0.6, 'rgba(' + r + ',' + g + ',' + b + ',0.06)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 256);
        const tex = new THREE.CanvasTexture(c);
        const mat = new THREE.SpriteMaterial({
            map: tex, transparent: true,
            blending: THREE.AdditiveBlending,
            opacity: opacity || 1,
            depthWrite: false,
        });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(size, size, 1);
        return sprite;
    },

    /* ═══════════ MILKY WAY GALAXY ═══════════ */
    createMilkyWay() {
        // Giant galaxy band — a wide curved stripe of dense stars + haze
        const galaxyGroup = new THREE.Group();

        // Galaxy haze — multiple large semi-transparent sprites forming the band
        for (let i = 0; i < 60; i++) {
            const angle = (i / 60) * Math.PI * 2;
            const radius = 600 + Math.sin(i * 0.3) * 80;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = (Math.random() - 0.5) * 60 + Math.sin(angle * 3) * 30;

            const c = document.createElement('canvas');
            c.width = c.height = 128;
            const ctx = c.getContext('2d');
            const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
            // Vary colors along the band
            const hue = (i / 60) * 40 + 220; // blue to purple
            const sat = 30 + Math.random() * 30;
            const lum = 40 + Math.random() * 20;
            g.addColorStop(0, 'hsla(' + hue + ',' + sat + '%,' + lum + '%,0.15)');
            g.addColorStop(0.4, 'hsla(' + hue + ',' + (sat-10) + '%,' + (lum-10) + '%,0.06)');
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 128, 128);

            const tex = new THREE.CanvasTexture(c);
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                map: tex, transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                opacity: 0.6 + Math.random() * 0.4,
            }));
            sprite.position.set(x, y, z);
            const s = 150 + Math.random() * 200;
            sprite.scale.set(s, s * (0.3 + Math.random() * 0.4), 1);
            galaxyGroup.add(sprite);
        }

        // Dense star clusters along the band
        const bandGeo = new THREE.BufferGeometry();
        const bandPos = new Float32Array(15000);
        const bandCol = new Float32Array(15000);
        const bandSizes = new Float32Array(5000);
        for (let i = 0; i < 5000; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 500 + (Math.random() - 0.5) * 200;
            const spread = (Math.random() - 0.5) * 80;
            bandPos[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 60;
            bandPos[i * 3 + 1] = spread + Math.sin(angle * 3) * 20;
            bandPos[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 60;
            const bright = 0.5 + Math.random() * 0.5;
            const tint = Math.random();
            bandCol[i * 3] = bright * (0.8 + tint * 0.2);
            bandCol[i * 3 + 1] = bright * (0.7 + tint * 0.2);
            bandCol[i * 3 + 2] = bright;
            bandSizes[i] = 0.5 + Math.random() * 1.5;
        }
        bandGeo.setAttribute('position', new THREE.Float32BufferAttribute(bandPos, 3));
        bandGeo.setAttribute('color', new THREE.Float32BufferAttribute(bandCol, 3));

        const bandMat = new THREE.PointsMaterial({
            size: 1.2, vertexColors: true, transparent: true,
            opacity: 0.7, blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        const bandStars = new THREE.Points(bandGeo, bandMat);
        galaxyGroup.add(bandStars);

        // Tilt the galaxy band
        galaxyGroup.rotation.x = 0.3;
        galaxyGroup.rotation.z = 0.15;
        this.scene.add(galaxyGroup);
        this.milkyWay = galaxyGroup;
    },

    /* ═══════════ DEEP STARFIELD ═══════════ */
    createDeepStarfield() {
        // Layer 1: Distant dim stars
        const makeStarLayer = (count, minR, maxR, size, opacity) => {
            const geo = new THREE.BufferGeometry();
            const pos = new Float32Array(count * 3);
            const col = new Float32Array(count * 3);
            for (let i = 0; i < count; i++) {
                const r = minR + Math.random() * (maxR - minR);
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
                pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                pos[i * 3 + 2] = r * Math.cos(phi);
                const b = 0.4 + Math.random() * 0.6;
                const temp = Math.random();
                // Star color variety: blue, white, yellow, orange
                if (temp < 0.3) { col[i*3] = b * 0.7; col[i*3+1] = b * 0.8; col[i*3+2] = b; }
                else if (temp < 0.6) { col[i*3] = b; col[i*3+1] = b; col[i*3+2] = b; }
                else if (temp < 0.85) { col[i*3] = b; col[i*3+1] = b * 0.9; col[i*3+2] = b * 0.6; }
                else { col[i*3] = b; col[i*3+1] = b * 0.6; col[i*3+2] = b * 0.3; }
            }
            geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
            geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
            const mat = new THREE.PointsMaterial({
                size, vertexColors: true, transparent: true,
                opacity, blending: THREE.AdditiveBlending, depthWrite: false,
            });
            return new THREE.Points(geo, mat);
        };

        this.starLayers = [];
        // Background — thousands of tiny stars
        const bg = makeStarLayer(8000, 400, 1500, 0.6, 0.8);
        this.scene.add(bg);
        this.starLayers.push(bg);
        // Mid — medium stars
        const mid = makeStarLayer(2000, 200, 600, 1.0, 0.9);
        this.scene.add(mid);
        this.starLayers.push(mid);
        // Bright foreground stars
        const fg = makeStarLayer(300, 100, 400, 1.8, 1.0);
        this.scene.add(fg);
        this.starLayers.push(fg);
    },

    /* ═══════════ NEBULAE ═══════════ */
    createNebulae() {
        const nebulae = [
            { x: -400, y: 150, z: -500, r: 200, g: 50, b: 120, size: 300 },  // Pink nebula
            { x: 300, y: -100, z: -600, r: 50, g: 80, b: 200, size: 250 },   // Blue nebula
            { x: -200, y: 200, z: 400, r: 180, g: 100, b: 50, size: 200 },   // Orange nebula
            { x: 500, y: 80, z: 200, r: 100, g: 40, b: 180, size: 280 },     // Purple nebula
            { x: 0, y: -200, z: -400, r: 40, g: 150, b: 130, size: 220 },    // Teal nebula
        ];

        nebulae.forEach(n => {
            // Multiple overlapping sprites per nebula for depth
            for (let i = 0; i < 4; i++) {
                const c = document.createElement('canvas');
                c.width = c.height = 256;
                const ctx = c.getContext('2d');

                // Randomized nebula cloud shape
                const cx = 128 + (Math.random() - 0.5) * 40;
                const cy = 128 + (Math.random() - 0.5) * 40;
                const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 100 + Math.random() * 28);
                const rr = n.r + Math.floor((Math.random()-0.5) * 30);
                const gg = n.g + Math.floor((Math.random()-0.5) * 30);
                const bb = n.b + Math.floor((Math.random()-0.5) * 30);
                g.addColorStop(0, 'rgba(' + rr + ',' + gg + ',' + bb + ',0.12)');
                g.addColorStop(0.3, 'rgba(' + rr + ',' + gg + ',' + bb + ',0.06)');
                g.addColorStop(0.7, 'rgba(' + rr + ',' + gg + ',' + bb + ',0.02)');
                g.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, 256, 256);

                const tex = new THREE.CanvasTexture(c);
                const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                    map: tex, transparent: true,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false, opacity: 0.7,
                }));
                sprite.position.set(
                    n.x + (Math.random() - 0.5) * n.size * 0.5,
                    n.y + (Math.random() - 0.5) * n.size * 0.3,
                    n.z + (Math.random() - 0.5) * n.size * 0.5
                );
                const s = n.size * (0.6 + Math.random() * 0.8);
                sprite.scale.set(s, s * (0.5 + Math.random() * 0.5), 1);
                this.scene.add(sprite);
            }
        });
    },

    /* ═══════════ SUN (with flares & pulsing corona) ═══════════ */
    createSun() {
        const sunGroup = new THREE.Group();

        // Core sphere
        const sunGeo = new THREE.SphereGeometry(6, 48, 48);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xFDB813 });
        this.sun = new THREE.Mesh(sunGeo, sunMat);
        sunGroup.add(this.sun);

        // Surface detail — slightly larger wireframe
        const wireGeo = new THREE.SphereGeometry(6.1, 20, 20);
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0xFF8C00, wireframe: true, transparent: true, opacity: 0.15,
        });
        sunGroup.add(new THREE.Mesh(wireGeo, wireMat));

        // Point light
        const light = new THREE.PointLight(0xFFF5E0, 2.5, 600);
        sunGroup.add(light);

        // Inner corona
        const corona1 = this.makeGlow(253, 184, 19, 30, 0.9);
        sunGroup.add(corona1);

        // Mid corona
        const corona2 = this.makeGlow(255, 160, 50, 55, 0.4);
        sunGroup.add(corona2);

        // Outer corona (huge, faint)
        const corona3 = this.makeGlow(255, 120, 30, 90, 0.15);
        sunGroup.add(corona3);

        // Solar flares — elongated sprites
        this.solarFlares = [];
        for (let i = 0; i < 5; i++) {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 64;
            const ctx = c.getContext('2d');
            const g = ctx.createRadialGradient(30, 32, 0, 128, 32, 128);
            g.addColorStop(0, 'rgba(255,200,50,0.8)');
            g.addColorStop(0.3, 'rgba(255,140,30,0.3)');
            g.addColorStop(1, 'rgba(255,80,0,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 256, 64);
            const tex = new THREE.CanvasTexture(c);
            const flare = new THREE.Sprite(new THREE.SpriteMaterial({
                map: tex, transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false, opacity: 0,
            }));
            flare.scale.set(20, 3, 1);
            flare.userData = {
                angle: (i / 5) * Math.PI * 2,
                speed: 0.1 + Math.random() * 0.2,
                phase: Math.random() * Math.PI * 2,
                maxOpacity: 0.3 + Math.random() * 0.4,
            };
            sunGroup.add(flare);
            this.solarFlares.push(flare);
        }

        this.sunGroup = sunGroup;
        this.scene.add(sunGroup);
    },

    /* ═══════════ PLANETS ═══════════ */
    createPlanets() {
        const data = [
            { name:'Mercury', r:0.4,  orbit:14,  speed:4.15,  base:[140,130,120], detail:'rocky' },
            { name:'Venus',   r:0.85, orbit:19,  speed:1.62,  base:[230,190,100], detail:'cloudy' },
            { name:'Earth',   r:1.0,  orbit:26,  speed:1.0,   base:[60,120,200],  detail:'earth', moon:true },
            { name:'Mars',    r:0.6,  orbit:34,  speed:0.53,  base:[190,80,30],   detail:'rocky' },
            { name:'Jupiter', r:3.0,  orbit:52,  speed:0.084, base:[200,180,140], detail:'banded' },
            { name:'Saturn',  r:2.4,  orbit:70,  speed:0.034, base:[220,200,170], detail:'banded', rings:true },
            { name:'Uranus',  r:1.5,  orbit:88,  speed:0.012, base:[170,220,230], detail:'smooth' },
            { name:'Neptune', r:1.4,  orbit:105, speed:0.006, base:[60,70,220],   detail:'smooth' },
        ];

        data.forEach(p => {
            const group = new THREE.Group();

            // Generate planet texture
            const tex = this.generatePlanetTexture(p.base, p.detail);
            const geo = new THREE.SphereGeometry(p.r, 32, 32);
            const mat = new THREE.MeshStandardMaterial({
                map: tex, roughness: 0.7, metalness: 0.05,
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.castShadow = true;
            group.add(mesh);

            // Planet glow
            const glow = this.makeGlow(p.base[0], p.base[1], p.base[2], p.r * 5, 0.4);
            group.add(glow);

            // Atmosphere haze for Earth, Venus
            if (p.name === 'Earth' || p.name === 'Venus') {
                const atmoGeo = new THREE.SphereGeometry(p.r * 1.05, 32, 32);
                const atmoMat = new THREE.MeshBasicMaterial({
                    color: p.name === 'Earth' ? 0x6699FF : 0xFFCC66,
                    transparent: true, opacity: 0.12, side: THREE.FrontSide,
                });
                group.add(new THREE.Mesh(atmoGeo, atmoMat));
            }

            // Saturn rings
            if (p.rings) {
                const ringTex = this.generateRingTexture();
                const ringGeo = new THREE.RingGeometry(p.r * 1.4, p.r * 2.4, 64);
                // Fix ring UVs
                const ruv = ringGeo.attributes.uv;
                const rpos = ringGeo.attributes.position;
                for (let i = 0; i < ruv.count; i++) {
                    const x = rpos.getX(i), z = rpos.getZ(i);
                    const dist = Math.sqrt(x * x + z * z);
                    ruv.setXY(i, (dist - p.r * 1.4) / (p.r * 1.0), 0.5);
                }
                const ringMat = new THREE.MeshBasicMaterial({
                    map: ringTex, side: THREE.DoubleSide,
                    transparent: true, opacity: 0.75,
                });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.rotation.x = Math.PI * 0.42;
                group.add(ring);
            }

            // Earth's moon
            if (p.moon) {
                const moonTex = this.generatePlanetTexture([180, 180, 180], 'rocky');
                const moonGeo = new THREE.SphereGeometry(0.27, 16, 16);
                const moonMat = new THREE.MeshStandardMaterial({ map: moonTex, roughness: 0.95 });
                const moonMesh = new THREE.Mesh(moonGeo, moonMat);
                group.userData.moon = moonMesh;
                group.add(moonMesh);
            }

            // Orbit ring
            const orbitGeo = new THREE.RingGeometry(p.orbit - 0.04, p.orbit + 0.04, 180);
            const orbitMat = new THREE.MeshBasicMaterial({
                color: 0x334466, side: THREE.DoubleSide,
                transparent: true, opacity: 0.08,
            });
            const orbitRing = new THREE.Mesh(orbitGeo, orbitMat);
            orbitRing.rotation.x = -Math.PI / 2;
            this.scene.add(orbitRing);

            this.scene.add(group);
            this.planets.push({ group, data: p, angle: Math.random() * Math.PI * 2 });
        });
    },

    /* ── Generate planet surface texture ── */
    generatePlanetTexture(base, type) {
        const c = document.createElement('canvas');
        c.width = 256; c.height = 128;
        const ctx = c.getContext('2d');

        // Base color
        ctx.fillStyle = 'rgb(' + base[0] + ',' + base[1] + ',' + base[2] + ')';
        ctx.fillRect(0, 0, 256, 128);

        if (type === 'earth') {
            // Continents
            ctx.fillStyle = 'rgb(60,140,60)';
            for (let i = 0; i < 12; i++) {
                ctx.beginPath();
                ctx.ellipse(
                    Math.random() * 256, Math.random() * 128,
                    10 + Math.random() * 30, 5 + Math.random() * 20,
                    Math.random() * Math.PI, 0, Math.PI * 2
                );
                ctx.fill();
            }
            // Ice caps
            ctx.fillStyle = 'rgba(240,240,255,0.7)';
            ctx.fillRect(0, 0, 256, 8);
            ctx.fillRect(0, 120, 256, 8);
            // Clouds
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            for (let i = 0; i < 20; i++) {
                ctx.beginPath();
                ctx.ellipse(Math.random()*256, Math.random()*128, 15+Math.random()*25, 3+Math.random()*6, 0, 0, Math.PI*2);
                ctx.fill();
            }
        } else if (type === 'banded') {
            // Jupiter/Saturn bands
            for (let y = 0; y < 128; y += 6 + Math.random() * 8) {
                const variation = Math.floor((Math.random() - 0.5) * 40);
                ctx.fillStyle = 'rgb(' + (base[0]+variation) + ',' + (base[1]+variation-10) + ',' + (base[2]+variation-20) + ')';
                ctx.fillRect(0, y, 256, 4 + Math.random() * 6);
            }
            // Great spot (Jupiter)
            if (base[0] > 180) {
                ctx.fillStyle = 'rgba(200,100,60,0.5)';
                ctx.beginPath();
                ctx.ellipse(180, 55, 20, 12, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (type === 'rocky') {
            // Craters & surface variation
            for (let i = 0; i < 40; i++) {
                const v = Math.floor((Math.random() - 0.5) * 50);
                ctx.fillStyle = 'rgb(' + (base[0]+v) + ',' + (base[1]+v) + ',' + (base[2]+v) + ')';
                ctx.beginPath();
                ctx.arc(Math.random()*256, Math.random()*128, 2+Math.random()*8, 0, Math.PI*2);
                ctx.fill();
            }
        } else if (type === 'cloudy') {
            // Venus thick clouds
            ctx.fillStyle = 'rgba(255,220,150,0.3)';
            for (let i = 0; i < 30; i++) {
                ctx.beginPath();
                ctx.ellipse(Math.random()*256, Math.random()*128, 20+Math.random()*40, 5+Math.random()*10, Math.random()*Math.PI, 0, Math.PI*2);
                ctx.fill();
            }
        } else {
            // Smooth (Uranus, Neptune) — subtle swirls
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            for (let i = 0; i < 15; i++) {
                ctx.beginPath();
                ctx.ellipse(Math.random()*256, Math.random()*128, 30+Math.random()*50, 2+Math.random()*4, 0, 0, Math.PI*2);
                ctx.fill();
            }
        }

        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = THREE.RepeatWrapping;
        return tex;
    },

    /* ── Saturn ring texture ── */
    generateRingTexture() {
        const c = document.createElement('canvas');
        c.width = 256; c.height = 1;
        const ctx = c.getContext('2d');
        for (let x = 0; x < 256; x++) {
            const t = x / 256;
            const gap = Math.sin(t * 30) * 0.3 + 0.7;
            const bright = Math.floor(160 + Math.sin(t * 50) * 40);
            const alpha = gap * (0.4 + t * 0.3);
            ctx.fillStyle = 'rgba(' + bright + ',' + (bright-15) + ',' + (bright-30) + ',' + alpha + ')';
            ctx.fillRect(x, 0, 1, 1);
        }
        return new THREE.CanvasTexture(c);
    },

    /* ═══════════ ASTEROID BELT ═══════════ */
    createAsteroidBelt() {
        const count = 1500;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = 40 + Math.random() * 8; // Between Mars and Jupiter
            pos[i * 3] = Math.cos(angle) * r + (Math.random() - 0.5) * 3;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 3;
            pos[i * 3 + 2] = Math.sin(angle) * r + (Math.random() - 0.5) * 3;
            const b = 0.3 + Math.random() * 0.4;
            col[i * 3] = b + 0.05; col[i * 3 + 1] = b; col[i * 3 + 2] = b - 0.05;
        }
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
        this.asteroids = new THREE.Points(geo, new THREE.PointsMaterial({
            size: 0.4, vertexColors: true, transparent: true, opacity: 0.7,
        }));
        this.scene.add(this.asteroids);
    },

    /* ═══════════ COMET ═══════════ */
    createComet() {
        const cometGroup = new THREE.Group();

        // Comet head
        const headGeo = new THREE.SphereGeometry(0.6, 12, 12);
        const headMat = new THREE.MeshBasicMaterial({ color: 0xCCDDFF });
        cometGroup.add(new THREE.Mesh(headGeo, headMat));

        // Comet glow
        cometGroup.add(this.makeGlow(180, 200, 255, 5, 0.6));

        // Tail — series of fading sprites
        for (let i = 1; i <= 12; i++) {
            const tailSprite = this.makeGlow(150, 180, 255, 2 + i * 0.8, 0.3 - i * 0.02);
            tailSprite.position.set(-i * 2.5, i * 0.3, 0);
            cometGroup.add(tailSprite);
        }

        cometGroup.position.set(-200, 60, -100);
        this.comet = cometGroup;
        this.scene.add(cometGroup);
    },

    /* ═══════════ ANIMATE ═══════════ */
    animate() {
        if (document.getElementById('loader').classList.contains('done')) {
            this.cleanup();
            return;
        }
        requestAnimationFrame(() => this.animate());
        const t = performance.now() / 1000;

        // Rotate sun + surface shimmer
        if (this.sun) {
            this.sun.rotation.y = t * 0.15;
            // Pulsing corona — scale the glow sprites
            const pulse = 1 + Math.sin(t * 1.5) * 0.08;
            const s = this.sunGroup;
            if (s.children[3]) s.children[3].scale.setScalar(30 * pulse);
            if (s.children[4]) s.children[4].scale.setScalar(55 * (2 - pulse));
        }

        // Solar flares
        if (this.solarFlares) {
            this.solarFlares.forEach(f => {
                const d = f.userData;
                const anim = Math.sin(t * d.speed + d.phase);
                f.material.opacity = Math.max(0, anim * d.maxOpacity);
                const a = d.angle + t * 0.05;
                f.position.set(Math.cos(a) * 8, Math.sin(a) * 8, 0);
                f.material.rotation = a;
            });
        }

        // Orbit planets
        this.planets.forEach(p => {
            p.angle += p.data.speed * 0.006;
            const x = Math.cos(p.angle) * p.data.orbit;
            const z = Math.sin(p.angle) * p.data.orbit;
            p.group.position.set(x, 0, z);
            p.group.children[0].rotation.y += 0.008;

            if (p.group.userData.moon) {
                p.group.userData.moon.position.set(
                    Math.cos(t * 1.8) * 2.5,
                    0.2,
                    Math.sin(t * 1.8) * 2.5
                );
            }
        });

        // Asteroid belt slow rotation
        if (this.asteroids) this.asteroids.rotation.y += 0.0003;

        // Milky way very slow drift
        if (this.milkyWay) this.milkyWay.rotation.y += 0.00005;

        // Comet movement
        if (this.comet) {
            this.comet.position.x += 0.15;
            this.comet.position.y -= 0.02;
            this.comet.position.z += 0.05;
            if (this.comet.position.x > 250) {
                this.comet.position.set(-200, 60 + Math.random() * 40, -100 + Math.random() * 80);
            }
        }

        // Star twinkle — shift layer opacity
        if (this.starLayers) {
            this.starLayers.forEach((layer, i) => {
                layer.rotation.y += 0.00003 * (i + 1);
            });
        }

        // Cinematic camera orbit
        const camRadius = 100 + Math.sin(t * 0.04) * 50;
        const camAngle = t * 0.06;
        const camY = 30 + Math.sin(t * 0.1) * 25;
        this.camera.position.set(
            Math.sin(camAngle) * camRadius,
            camY,
            Math.cos(camAngle) * camRadius
        );
        this.camera.lookAt(0, 0, 0);

        this.renderer.render(this.scene, this.camera);
    },

    /* ═══════════ LOADING SIMULATION ═══════════ */
    simulateLoading() {
        const bar = document.getElementById('loaderBar');
        const status = document.getElementById('loaderStatus');
        const pct = document.getElementById('loaderPercent');
        const steps = [
            [8,  'SCANNING MERCURY ORBIT...'],
            [16, 'MAPPING VENUS ATMOSPHERE...'],
            [26, 'CALIBRATING EARTH SYSTEMS...'],
            [34, 'SURVEYING MARS TERRAIN...'],
            [42, 'NAVIGATING ASTEROID BELT...'],
            [52, 'ANALYZING JUPITER STORMS...'],
            [62, 'THREADING SATURN\'S RINGS...'],
            [72, 'REACHING URANUS...'],
            [80, 'SCANNING NEPTUNE\'S DEPTHS...'],
            [88, 'PHOTOGRAPHING MILKY WAY...'],
            [95, 'ENGAGING WARP DRIVE...'],
            [100, 'WELCOME HOME, EXPLORER'],
        ];

        let i = 0;
        const next = () => {
            if (i >= steps.length) {
                setTimeout(() => {
                    document.getElementById('loader').classList.add('done');
                    document.getElementById('hud').classList.remove('hidden');
                    document.getElementById('controlsHint').classList.remove('hidden');
                    if (typeof App !== 'undefined') App.start();
                }, 700);
                return;
            }
            const [p, s] = steps[i];
            bar.style.width = p + '%';
            status.textContent = s;
            pct.textContent = p + '%';
            i++;
            setTimeout(next, 350 + Math.random() * 450);
        };
        setTimeout(next, 600);
    },

    cleanup() {
        if (this.renderer) {
            this.renderer.dispose();
            this.scene = null;
            this.camera = null;
            this.planets = [];
            this.starLayers = [];
            this.solarFlares = [];
        }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    if (typeof THREE !== 'undefined') {
        Loader.init();
    } else {
        const check = setInterval(() => {
            if (typeof THREE !== 'undefined') { clearInterval(check); Loader.init(); }
        }, 100);
    }
});
