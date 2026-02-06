/* ═══════════════════════════════════════════
   GAMES — All 6 Mini-Games
   ═══════════════════════════════════════════ */

const Games = {
    active: null,
    loop: null,
    canvas: null,
    ctx: null,
    _cleanup: null,

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    },

    launch(id) {
        this.stop();
        this.canvas = document.getElementById('miniGameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.active = id;
        Achievements.unlock('first_game');

        const titles = {
            flappy: '🐦 Flappy Bird', snake: '🍎 Snake', pong: '🏓 Pong',
            slither: '🐍 Slither Python', breakout: '🧱 Brick Breaker', invaders: '👾 Space Invaders'
        };
        document.getElementById('gamePlayTitle').textContent = titles[id] || '';
        document.getElementById('gamePlayScore').textContent = 'Score: 0';

        switch(id) {
            case 'flappy':   this.startFlappy(); break;
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
        this._cleanup = null;
        this.active = null;
    },

    _score(s) {
        document.getElementById('gamePlayScore').textContent = 'Score: ' + s;
    },

    /* ═════════════════════════════
       1. FLAPPY BIRD
       ═════════════════════════════ */
    startFlappy() {
        const W = 480, H = 400;
        const ctx = this.ctx;
        let bird = { x: 80, y: H/2, vel: 0, r: 13 };
        let pipes = [], score = 0, frame = 0, dead = false;
        const gap = 125, pipeW = 48, grav = 0.38, jump = -6.5, speed = 2.5;

        const spawn = () => pipes.push({ x: W, top: 50 + Math.random()*(H-gap-100), hit: false });
        spawn();

        const handle = (e) => {
            if (e.code === 'Space' || e.type === 'click') {
                e.preventDefault();
                if (dead) { bird = {x:80,y:H/2,vel:0,r:13}; pipes=[]; score=0; frame=0; dead=false; spawn(); this._score(0); }
                else bird.vel = jump;
            }
        };
        this.canvas.addEventListener('click', handle);
        document.addEventListener('keydown', handle);

        const tick = () => {
            ctx.fillStyle = '#0a0a1e'; ctx.fillRect(0,0,W,H);

            // Stars
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            for (let i=0; i<30; i++) {
                ctx.beginPath(); ctx.arc((i*97+frame*0.15)%W, (i*53)%H, 1, 0, Math.PI*2); ctx.fill();
            }

            if (!dead) {
                bird.vel += grav; bird.y += bird.vel; frame++;
                if (frame % 90 === 0) spawn();
                pipes.forEach(p => {
                    p.x -= speed;
                    if (!p.hit && p.x + pipeW < bird.x) { score++; p.hit = true; this._score(score); }
                    if (bird.x + bird.r > p.x && bird.x - bird.r < p.x + pipeW)
                        if (bird.y - bird.r < p.top || bird.y + bird.r > p.top + gap) dead = true;
                });
                pipes = pipes.filter(p => p.x > -pipeW);
                if (bird.y > H || bird.y < 0) dead = true;
                if (dead) {
                    Achievements.check('flappy_10', score >= 10);
                    Achievements.check('flappy_25', score >= 25);
                }
            }

            // Pipes
            pipes.forEach(p => {
                const g = ctx.createLinearGradient(p.x, 0, p.x+pipeW, 0);
                g.addColorStop(0, '#00897B'); g.addColorStop(0.5, '#26A69A'); g.addColorStop(1, '#00695C');
                ctx.fillStyle = g;
                ctx.fillRect(p.x, 0, pipeW, p.top);
                ctx.fillRect(p.x, p.top+gap, pipeW, H-p.top-gap);
                ctx.fillStyle = '#004D40';
                ctx.fillRect(p.x-3, p.top-14, pipeW+6, 14);
                ctx.fillRect(p.x-3, p.top+gap, pipeW+6, 14);
            });

            // Bird
            ctx.save(); ctx.translate(bird.x, bird.y);
            ctx.rotate(Math.min(Math.max(bird.vel*3,-30),60)*Math.PI/180);
            ctx.fillStyle = '#FFD54F';
            ctx.beginPath(); ctx.ellipse(0,0,bird.r+2,bird.r,0,0,Math.PI*2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(5,-4,4.5,0,Math.PI*2); ctx.fill();
            ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(6,-4,2.2,0,Math.PI*2); ctx.fill();
            ctx.fillStyle = '#FF7043';
            ctx.beginPath(); ctx.moveTo(12,-2); ctx.lineTo(20,2); ctx.lineTo(12,5); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#FFC107';
            ctx.beginPath(); ctx.ellipse(-3,3,7,4,Math.sin(frame*0.3)*0.3,0,Math.PI*2); ctx.fill();
            ctx.restore();

            ctx.fillStyle = '#fff'; ctx.font = 'bold 24px "Press Start 2P"'; ctx.textAlign = 'center';
            ctx.fillText(score, W/2, 36);

            if (dead) {
                ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0,0,W,H);
                ctx.fillStyle = '#FF5252'; ctx.font = 'bold 20px "Press Start 2P"';
                ctx.fillText('GAME OVER', W/2, H/2-15);
                ctx.fillStyle = '#FFD54F'; ctx.font = '12px "Press Start 2P"';
                ctx.fillText('Score: '+score, W/2, H/2+15);
                ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '9px "Press Start 2P"';
                ctx.fillText('Click/Space to restart', W/2, H/2+45);
            }

            this.loop = requestAnimationFrame(tick);
        };
        tick();
        this._cleanup = () => { this.canvas.removeEventListener('click',handle); document.removeEventListener('keydown',handle); };
    },

    /* ═════════════════════════════
       2. SNAKE
       ═════════════════════════════ */
    startSnake() {
        const W = 480, H = 400, grid = 20;
        const cols = W/grid, rows = H/grid;
        const ctx = this.ctx;
        let snake = [{x:10,y:10}], dir = {x:1,y:0}, next = {x:1,y:0};
        let apple, score = 0, dead = false, last = 0;

        const spawnApple = () => {
            let a; do { a = {x:Math.floor(Math.random()*cols), y:Math.floor(Math.random()*rows)};
            } while (snake.some(s => s.x===a.x && s.y===a.y)); return a;
        };
        apple = spawnApple();

        const handle = (e) => {
            if (dead && e.code === 'Space') { snake=[{x:10,y:10}]; dir={x:1,y:0}; next={x:1,y:0}; apple=spawnApple(); score=0; dead=false; this._score(0); return; }
            switch(e.code) {
                case 'ArrowUp': case 'KeyW': if(!dir.y) next={x:0,y:-1}; e.preventDefault(); break;
                case 'ArrowDown': case 'KeyS': if(!dir.y) next={x:0,y:1}; e.preventDefault(); break;
                case 'ArrowLeft': case 'KeyA': if(!dir.x) next={x:-1,y:0}; e.preventDefault(); break;
                case 'ArrowRight': case 'KeyD': if(!dir.x) next={x:1,y:0}; e.preventDefault(); break;
            }
        };
        document.addEventListener('keydown', handle);

        const tick = (now) => {
            if (!dead && now - last > 100) {
                last = now; dir = next;
                const head = {x:snake[0].x+dir.x, y:snake[0].y+dir.y};
                if (head.x<0||head.x>=cols||head.y<0||head.y>=rows||snake.some(s=>s.x===head.x&&s.y===head.y)) {
                    dead = true;
                    Achievements.check('snake_50', score>=50);
                    Achievements.check('snake_100', score>=100);
                } else {
                    snake.unshift(head);
                    if (head.x===apple.x&&head.y===apple.y) { score++; this._score(score); apple=spawnApple(); }
                    else snake.pop();
                }
            }

            ctx.fillStyle = '#060612'; ctx.fillRect(0,0,W,H);
            ctx.strokeStyle = 'rgba(255,255,255,0.03)';
            for(let x=0;x<cols;x++){ctx.beginPath();ctx.moveTo(x*grid,0);ctx.lineTo(x*grid,H);ctx.stroke();}
            for(let y=0;y<rows;y++){ctx.beginPath();ctx.moveTo(0,y*grid);ctx.lineTo(W,y*grid);ctx.stroke();}

            ctx.fillStyle = '#FF5252'; ctx.shadowColor='#FF5252'; ctx.shadowBlur=10;
            ctx.beginPath(); ctx.arc(apple.x*grid+grid/2,apple.y*grid+grid/2,grid/2-2,0,Math.PI*2); ctx.fill();
            ctx.shadowBlur=0;

            snake.forEach((s,i) => {
                const r = 1 - i/snake.length;
                ctx.fillStyle = `hsl(${150+r*40},75%,${35+r*25}%)`;
                ctx.beginPath(); ctx.roundRect(s.x*grid+1,s.y*grid+1,grid-2,grid-2,3); ctx.fill();
            });

            if (dead) {
                ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,W,H);
                ctx.fillStyle='#FF5252'; ctx.font='bold 20px "Press Start 2P"'; ctx.textAlign='center';
                ctx.fillText('GAME OVER',W/2,H/2-15);
                ctx.fillStyle='#4DB6AC'; ctx.font='12px "Press Start 2P"'; ctx.fillText('Score: '+score,W/2,H/2+15);
                ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='9px "Press Start 2P"'; ctx.fillText('Space to restart',W/2,H/2+45);
            }
            this.loop = requestAnimationFrame(tick);
        };
        tick(performance.now());
        this._cleanup = () => document.removeEventListener('keydown', handle);
    },

    /* ═════════════════════════════
       3. PONG
       ═════════════════════════════ */
    startPong() {
        const W=480, H=400, padH=80, padW=12, ballR=7;
        const ctx = this.ctx;
        let p = {y:H/2-padH/2, score:0};
        let ai = {y:H/2-padH/2, score:0, speed:3.2};
        let ball = {x:W/2, y:H/2, vx:4, vy:2};
        let dead=false, winner='';
        const keys = {};

        const resetBall = (d) => { ball={x:W/2,y:H/2,vx:4*d,vy:(Math.random()-0.5)*4}; };
        const kd = (e) => { keys[e.code]=true; if(dead&&e.code==='Space'){p.score=0;ai.score=0;dead=false;winner='';resetBall(1);this._score(0);} if(['ArrowUp','ArrowDown'].includes(e.code))e.preventDefault(); };
        const ku = (e) => { keys[e.code]=false; };
        document.addEventListener('keydown',kd);
        document.addEventListener('keyup',ku);

        const tick = () => {
            if (!dead) {
                if(keys.ArrowUp||keys.KeyW) p.y-=5;
                if(keys.ArrowDown||keys.KeyS) p.y+=5;
                p.y=Math.max(0,Math.min(H-padH,p.y));

                const ac=ai.y+padH/2;
                if(ball.y<ac-10)ai.y-=ai.speed; if(ball.y>ac+10)ai.y+=ai.speed;
                ai.y=Math.max(0,Math.min(H-padH,ai.y));

                ball.x+=ball.vx; ball.y+=ball.vy;
                if(ball.y-ballR<0||ball.y+ballR>H)ball.vy*=-1;
                if(ball.x-ballR<20+padW&&ball.y>p.y&&ball.y<p.y+padH&&ball.vx<0){ball.vx*=-1.05;ball.vy+=(ball.y-(p.y+padH/2))*0.08;}
                if(ball.x+ballR>W-20-padW&&ball.y>ai.y&&ball.y<ai.y+padH&&ball.vx>0){ball.vx*=-1.05;ball.vy+=(ball.y-(ai.y+padH/2))*0.08;}

                if(ball.x<0){ai.score++;this._score(p.score+' - '+ai.score);resetBall(1);}
                if(ball.x>W){p.score++;this._score(p.score+' - '+ai.score);resetBall(-1);}
                if(p.score>=5){dead=true;winner='YOU WIN!';Achievements.unlock('pong_win');}
                if(ai.score>=5){dead=true;winner='AI WINS!';}
            }

            ctx.fillStyle='#060612'; ctx.fillRect(0,0,W,H);
            ctx.setLineDash([6,6]); ctx.strokeStyle='rgba(255,255,255,0.08)';
            ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke(); ctx.setLineDash([]);

            ctx.shadowColor='#00E5FF'; ctx.shadowBlur=12; ctx.fillStyle='#00E5FF';
            ctx.fillRect(20,p.y,padW,padH);
            ctx.shadowColor='#D500F9'; ctx.fillStyle='#D500F9';
            ctx.fillRect(W-20-padW,ai.y,padW,padH); ctx.shadowBlur=0;

            ctx.fillStyle='#fff'; ctx.shadowColor='#fff'; ctx.shadowBlur=15;
            ctx.beginPath(); ctx.arc(ball.x,ball.y,ballR,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;

            ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.font='bold 36px "Press Start 2P"'; ctx.textAlign='center';
            ctx.fillText(p.score,W/4,55); ctx.fillText(ai.score,3*W/4,55);

            if (dead) {
                ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,W,H);
                ctx.fillStyle=winner==='YOU WIN!'?'#4DB6AC':'#FF5252'; ctx.font='bold 18px "Press Start 2P"';
                ctx.fillText(winner,W/2,H/2-8);
                ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='9px "Press Start 2P"';
                ctx.fillText('Space to restart',W/2,H/2+30);
            }
            this.loop = requestAnimationFrame(tick);
        };
        tick();
        this._cleanup = () => { document.removeEventListener('keydown',kd); document.removeEventListener('keyup',ku); };
    },

    /* ═════════════════════════════
       4. SLITHER PYTHON
       ═════════════════════════════ */
    startSlither() {
        const W=480, H=400;
        const ctx = this.ctx;

        // Python segments
        let segments = [];
        for (let i=0; i<20; i++) segments.push({x:W/2-i*3, y:H/2});
        let angle = 0, speed = 2.5, score = 0, dead = false;

        // Orbs
        let orbs = [];
        const spawnOrbs = (n) => { for(let i=0;i<n;i++) orbs.push({x:30+Math.random()*(W-60),y:30+Math.random()*(H-60),r:4+Math.random()*4,hue:Math.random()*360}); };
        spawnOrbs(20);

        const keys = {};
        const kd = (e) => { keys[e.code]=true; if(dead&&e.code==='Space'){
            segments=[];for(let i=0;i<20;i++)segments.push({x:W/2-i*3,y:H/2});
            angle=0;score=0;dead=false;orbs=[];spawnOrbs(20);this._score(0);
        } if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault(); };
        const ku = (e) => { keys[e.code]=false; };
        document.addEventListener('keydown',kd);
        document.addEventListener('keyup',ku);

        const tick = () => {
            if (!dead) {
                if(keys.ArrowLeft) angle -= 0.06;
                if(keys.ArrowRight) angle += 0.06;

                const head = segments[0];
                const nx = head.x + Math.cos(angle)*speed;
                const ny = head.y + Math.sin(angle)*speed;

                // Wall wrap
                const hx = ((nx % W) + W) % W;
                const hy = ((ny % H) + H) % H;
                segments.unshift({x:hx, y:hy});
                segments.pop();

                // Eat orbs
                orbs = orbs.filter(o => {
                    const dx = hx-o.x, dy = hy-o.y;
                    if (Math.sqrt(dx*dx+dy*dy) < o.r + 8) {
                        score += Math.round(o.r * 5);
                        this._score(score);
                        // Grow
                        for(let i=0;i<3;i++) segments.push({...segments[segments.length-1]});
                        Achievements.check('slither_500', score>=500);
                        return false;
                    }
                    return true;
                });
                if (orbs.length < 8) spawnOrbs(5);
            }

            // Draw
            ctx.fillStyle = '#060610'; ctx.fillRect(0,0,W,H);

            // Grid
            ctx.strokeStyle = 'rgba(255,255,255,0.02)';
            for(let x=0;x<W;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
            for(let y=0;y<H;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

            // Orbs
            orbs.forEach(o => {
                ctx.fillStyle = `hsla(${o.hue},80%,60%,0.8)`;
                ctx.shadowColor = `hsla(${o.hue},80%,60%,0.6)`; ctx.shadowBlur=8;
                ctx.beginPath(); ctx.arc(o.x,o.y,o.r,0,Math.PI*2); ctx.fill();
            });
            ctx.shadowBlur=0;

            // Python body
            segments.forEach((s,i) => {
                const ratio = 1 - i/segments.length;
                const size = 5 + ratio * 6;
                // Python pattern: alternating dark/light
                const dark = i % 4 < 2;
                ctx.fillStyle = dark
                    ? `hsl(40,${30+ratio*20}%,${20+ratio*15}%)`
                    : `hsl(45,${40+ratio*20}%,${35+ratio*20}%)`;
                ctx.beginPath(); ctx.arc(s.x,s.y,size,0,Math.PI*2); ctx.fill();
            });

            // Python head
            if (segments.length > 0) {
                const h = segments[0];
                ctx.fillStyle = '#5D4037'; ctx.beginPath(); ctx.arc(h.x,h.y,10,0,Math.PI*2); ctx.fill();
                // Eyes
                const ex1 = h.x + Math.cos(angle-0.5)*7;
                const ey1 = h.y + Math.sin(angle-0.5)*7;
                const ex2 = h.x + Math.cos(angle+0.5)*7;
                const ey2 = h.y + Math.sin(angle+0.5)*7;
                ctx.fillStyle='#FFD54F'; ctx.beginPath(); ctx.arc(ex1,ey1,3,0,Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(ex2,ey2,3,0,Math.PI*2); ctx.fill();
                ctx.fillStyle='#111';
                ctx.beginPath(); ctx.arc(ex1+Math.cos(angle)*1.2,ey1+Math.sin(angle)*1.2,1.5,0,Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(ex2+Math.cos(angle)*1.2,ey2+Math.sin(angle)*1.2,1.5,0,Math.PI*2); ctx.fill();
                // Tongue
                const tx = h.x+Math.cos(angle)*14, ty = h.y+Math.sin(angle)*14;
                ctx.strokeStyle='#FF5252'; ctx.lineWidth=1.5;
                ctx.beginPath(); ctx.moveTo(h.x+Math.cos(angle)*10,h.y+Math.sin(angle)*10);
                ctx.lineTo(tx,ty); ctx.stroke();
            }

            // Score display
            ctx.fillStyle='#fff'; ctx.font='bold 10px "Press Start 2P"'; ctx.textAlign='left';
            ctx.fillText('Score: '+score, 10, 22);
            ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font='8px "Press Start 2P"';
            ctx.fillText('Length: '+segments.length, 10, 38);

            this.loop = requestAnimationFrame(tick);
        };
        tick();
        this._cleanup = () => { document.removeEventListener('keydown',kd); document.removeEventListener('keyup',ku); };
    },

    /* ═════════════════════════════
       5. BRICK BREAKER
       ═════════════════════════════ */
    startBreakout() {
        const W=480, H=400;
        const ctx = this.ctx;
        const padW=80, padH=10, ballR=6;
        let padX = W/2-padW/2;
        let ball = {x:W/2, y:H-40, vx:3, vy:-3};
        let score=0, dead=false, cleared=false;

        // Bricks
        const brickR=6, brickC=10, brickW=44, brickH=16, brickP=2;
        let bricks = [];
        const colors = ['#FF5252','#FF7043','#FFC107','#66BB6A','#42A5F5','#AB47BC'];
        for (let r=0;r<brickR;r++) for(let c=0;c<brickC;c++) {
            bricks.push({x:c*(brickW+brickP)+4, y:r*(brickH+brickP)+40, w:brickW, h:brickH, color:colors[r], alive:true});
        }

        let mouseX = padX + padW/2;
        const keys = {};
        const mm = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            mouseX = (e.clientX - rect.left) / rect.width * W;
        };
        const kd = (e) => {
            keys[e.code]=true;
            if((dead||cleared)&&e.code==='Space'){
                padX=W/2-padW/2; ball={x:W/2,y:H-40,vx:3,vy:-3}; score=0; dead=false; cleared=false;
                bricks.forEach(b=>b.alive=true); this._score(0);
            }
            if(['ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
        };
        const ku = (e) => { keys[e.code]=false; };
        this.canvas.addEventListener('mousemove',mm);
        document.addEventListener('keydown',kd);
        document.addEventListener('keyup',ku);

        const tick = () => {
            if (!dead && !cleared) {
                // Paddle movement
                if(keys.ArrowLeft) padX -= 6;
                if(keys.ArrowRight) padX += 6;
                padX = mouseX - padW/2;
                padX = Math.max(0, Math.min(W-padW, padX));

                // Ball
                ball.x+=ball.vx; ball.y+=ball.vy;
                if(ball.x-ballR<0||ball.x+ballR>W) ball.vx*=-1;
                if(ball.y-ballR<0) ball.vy*=-1;
                if(ball.y+ballR>H) dead=true;

                // Paddle collision
                if(ball.vy>0 && ball.y+ballR>=H-25 && ball.x>padX && ball.x<padX+padW) {
                    ball.vy = -Math.abs(ball.vy);
                    ball.vx += (ball.x-(padX+padW/2))*0.08;
                }

                // Brick collision
                bricks.forEach(b => {
                    if(!b.alive) return;
                    if(ball.x+ballR>b.x && ball.x-ballR<b.x+b.w && ball.y+ballR>b.y && ball.y-ballR<b.y+b.h) {
                        b.alive = false; score += 10; this._score(score);
                        ball.vy *= -1;
                    }
                });

                if(bricks.every(b=>!b.alive)) { cleared=true; Achievements.unlock('breakout_clr'); }
            }

            ctx.fillStyle='#060612'; ctx.fillRect(0,0,W,H);

            // Bricks
            bricks.forEach(b => {
                if(!b.alive) return;
                ctx.fillStyle = b.color; ctx.fillRect(b.x, b.y, b.w, b.h);
                ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(b.x, b.y, b.w, 3);
            });

            // Paddle
            ctx.fillStyle='#fff'; ctx.shadowColor='#00E5FF'; ctx.shadowBlur=10;
            ctx.fillRect(padX, H-25, padW, padH); ctx.shadowBlur=0;

            // Ball
            ctx.fillStyle='#FFD54F'; ctx.shadowColor='#FFD54F'; ctx.shadowBlur=12;
            ctx.beginPath(); ctx.arc(ball.x,ball.y,ballR,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;

            if (dead) {
                ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,W,H);
                ctx.fillStyle='#FF5252'; ctx.font='bold 18px "Press Start 2P"'; ctx.textAlign='center';
                ctx.fillText('GAME OVER',W/2,H/2-10);
                ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='9px "Press Start 2P"';
                ctx.fillText('Space to restart',W/2,H/2+25);
            }
            if (cleared) {
                ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,W,H);
                ctx.fillStyle='#4DB6AC'; ctx.font='bold 16px "Press Start 2P"'; ctx.textAlign='center';
                ctx.fillText('ALL CLEARED!',W/2,H/2-10);
                ctx.fillStyle='#FFD54F'; ctx.font='10px "Press Start 2P"';
                ctx.fillText('Score: '+score,W/2,H/2+15);
                ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='9px "Press Start 2P"';
                ctx.fillText('Space to restart',W/2,H/2+40);
            }

            this.loop = requestAnimationFrame(tick);
        };
        tick();
        this._cleanup = () => { this.canvas.removeEventListener('mousemove',mm); document.removeEventListener('keydown',kd); document.removeEventListener('keyup',ku); };
    },

    /* ═════════════════════════════
       6. SPACE INVADERS
       ═════════════════════════════ */
    startInvaders() {
        const W=480, H=400;
        const ctx = this.ctx;

        // Player
        let player = {x:W/2, y:H-30, w:30, h:16, speed:4};
        let bullets = [];
        let score = 0, dead = false, won = false;

        // Invaders grid
        let invaders = [];
        const cols=8, rows=4, invW=28, invH=20, invPad=6;
        for (let r=0;r<rows;r++) for (let c=0;c<cols;c++) {
            invaders.push({
                x: c*(invW+invPad)+60,
                y: r*(invH+invPad)+40,
                w:invW, h:invH,
                alive:true,
                type: r < 2 ? 'hard' : 'easy'
            });
        }
        let invDir = 1, invSpeed = 0.6, invDrop = false;
        let enemyBullets = [];
        let lastShot = 0;

        const keys = {};
        const kd = (e) => {
            keys[e.code]=true;
            if((dead||won)&&e.code==='Space'){
                player.x=W/2; bullets=[]; enemyBullets=[]; score=0; dead=false; won=false;
                invaders.forEach(inv=>{inv.alive=true; inv.x=((invaders.indexOf(inv))%cols)*(invW+invPad)+60; inv.y=Math.floor(invaders.indexOf(inv)/cols)*(invH+invPad)+40;});
                invDir=1; invSpeed=0.6; this._score(0);
                return;
            }
            if(e.code==='Space'&&!dead&&!won) { bullets.push({x:player.x, y:player.y-8, vy:-6}); e.preventDefault(); }
            if(['ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
        };
        const ku = (e) => { keys[e.code]=false; };
        document.addEventListener('keydown',kd);
        document.addEventListener('keyup',ku);

        const tick = (now) => {
            if (!dead && !won) {
                // Player move
                if(keys.ArrowLeft) player.x -= player.speed;
                if(keys.ArrowRight) player.x += player.speed;
                player.x = Math.max(player.w/2, Math.min(W-player.w/2, player.x));

                // Bullets
                bullets.forEach(b => b.y += b.vy);
                bullets = bullets.filter(b => b.y > -10);

                // Move invaders
                let hitEdge = false;
                invaders.forEach(inv => { if(inv.alive) { inv.x += invSpeed*invDir; if(inv.x<10||inv.x+inv.w>W-10)hitEdge=true; } });
                if (hitEdge) { invDir *= -1; invaders.forEach(inv => { if(inv.alive) inv.y += 12; }); invSpeed += 0.05; }

                // Collision: bullet -> invader
                bullets.forEach(b => {
                    invaders.forEach(inv => {
                        if(!inv.alive) return;
                        if(b.x>inv.x&&b.x<inv.x+inv.w&&b.y>inv.y&&b.y<inv.y+inv.h) {
                            inv.alive=false; b.y=-100;
                            score += inv.type==='hard' ? 20 : 10;
                            this._score(score);
                        }
                    });
                });

                // Enemy shooting
                if (now - lastShot > 1200) {
                    lastShot = now;
                    const alive = invaders.filter(i=>i.alive);
                    if (alive.length) {
                        const shooter = alive[Math.floor(Math.random()*alive.length)];
                        enemyBullets.push({x:shooter.x+shooter.w/2, y:shooter.y+shooter.h, vy:3});
                    }
                }
                enemyBullets.forEach(b=>b.y+=b.vy);
                enemyBullets = enemyBullets.filter(b=>b.y<H+10);

                // Enemy bullet hits player
                enemyBullets.forEach(b => {
                    if(b.x>player.x-player.w/2&&b.x<player.x+player.w/2&&b.y>player.y-player.h/2&&b.y<player.y+player.h/2) dead=true;
                });

                // Invaders reach bottom
                invaders.forEach(inv => { if(inv.alive && inv.y+inv.h > player.y-10) dead=true; });

                // Win check
                if (invaders.every(i=>!i.alive)) { won=true; Achievements.unlock('invaders_win'); }
            }

            // Draw
            ctx.fillStyle='#020208'; ctx.fillRect(0,0,W,H);

            // Stars
            ctx.fillStyle='rgba(255,255,255,0.12)';
            for(let i=0;i<25;i++){ctx.beginPath();ctx.arc((i*73)%W,(i*47+now*0.01)%H,0.8,0,Math.PI*2);ctx.fill();}

            // Invaders
            invaders.forEach(inv => {
                if(!inv.alive) return;
                ctx.fillStyle = inv.type==='hard' ? '#FF5252' : '#66BB6A';
                ctx.fillRect(inv.x, inv.y, inv.w, inv.h);
                // Pixel eyes
                ctx.fillStyle='#fff';
                ctx.fillRect(inv.x+6,inv.y+6,4,4);
                ctx.fillRect(inv.x+inv.w-10,inv.y+6,4,4);
                // Pixel mouth
                ctx.fillRect(inv.x+8,inv.y+14,inv.w-16,3);
            });

            // Player ship
            ctx.fillStyle='#00E5FF';
            ctx.beginPath();
            ctx.moveTo(player.x, player.y-player.h);
            ctx.lineTo(player.x-player.w/2, player.y);
            ctx.lineTo(player.x+player.w/2, player.y);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle='#fff'; ctx.fillRect(player.x-2,player.y-player.h-4,4,4);

            // Bullets
            ctx.fillStyle='#FFD54F';
            bullets.forEach(b=>{ctx.fillRect(b.x-1.5,b.y,3,8);});

            ctx.fillStyle='#FF5252';
            enemyBullets.forEach(b=>{ctx.fillRect(b.x-1.5,b.y,3,8);});

            if (dead) {
                ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,W,H);
                ctx.fillStyle='#FF5252'; ctx.font='bold 18px "Press Start 2P"'; ctx.textAlign='center';
                ctx.fillText('GAME OVER',W/2,H/2-10);
                ctx.fillStyle='#FFD54F'; ctx.font='10px "Press Start 2P"'; ctx.fillText('Score: '+score,W/2,H/2+15);
                ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='9px "Press Start 2P"'; ctx.fillText('Space to restart',W/2,H/2+40);
            }
            if (won) {
                ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,W,H);
                ctx.fillStyle='#4DB6AC'; ctx.font='bold 16px "Press Start 2P"'; ctx.textAlign='center';
                ctx.fillText('EARTH SAVED!',W/2,H/2-10);
                ctx.fillStyle='#FFD54F'; ctx.font='10px "Press Start 2P"'; ctx.fillText('Score: '+score,W/2,H/2+15);
                ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='9px "Press Start 2P"'; ctx.fillText('Space to restart',W/2,H/2+40);
            }

            this.loop = requestAnimationFrame(tick);
        };
        tick(performance.now());
        this._cleanup = () => { document.removeEventListener('keydown',kd); document.removeEventListener('keyup',ku); };
    }
};
