/* ═══════════════════════════════════════════
   ACHIEVEMENTS SYSTEM
   ═══════════════════════════════════════════ */

const Achievements = {
    list: [
        { id: 'first_click',  icon: '🎯', name: 'Hello World',       desc: 'Click on the character',         unlocked: false },
        { id: 'first_game',   icon: '🎮', name: 'Gamer',             desc: 'Play your first game',           unlocked: false },
        { id: 'flappy_10',    icon: '🐦', name: 'Flappy Novice',     desc: 'Score 10 in Flappy Bird',        unlocked: false },
        { id: 'flappy_25',    icon: '🦅', name: 'Flappy Master',     desc: 'Score 25 in Flappy Bird',        unlocked: false },
        { id: 'snake_50',     icon: '🍎', name: 'Snake Charmer',     desc: 'Score 50 in Snake',              unlocked: false },
        { id: 'snake_100',    icon: '🐍', name: 'Snake King',        desc: 'Score 100 in Snake',             unlocked: false },
        { id: 'pong_win',     icon: '🏓', name: 'Pong Champion',     desc: 'Win a game of Pong',             unlocked: false },
        { id: 'slither_500',  icon: '🐍', name: 'Python Pro',        desc: 'Score 500 in Slither Python',    unlocked: false },
        { id: 'breakout_clr', icon: '🧱', name: 'Demolition Expert', desc: 'Clear all bricks in Breakout',   unlocked: false },
        { id: 'invaders_win', icon: '👾', name: 'Space Defender',    desc: 'Beat the invaders',              unlocked: false },
        { id: 'music_lover',  icon: '🎵', name: 'Jazz Enthusiast',   desc: 'Turn on the music',              unlocked: false },
        { id: 'explorer',     icon: '🗺️', name: 'Explorer',          desc: 'Visit About Me & Games sections', unlocked: false },
        { id: 'night_owl',    icon: '🌙', name: 'Night Owl',         desc: 'Experience nighttime',           unlocked: false },
        { id: 'walker',       icon: '🚶', name: 'World Walker',      desc: 'Walk 1000 pixels total',         unlocked: false },
    ],

    visited: new Set(),
    totalWalked: 0,

    init() {
        this.load();
        this.render();
    },

    load() {
        try {
            const saved = localStorage.getItem('mayowa_achievements');
            if (saved) {
                const data = JSON.parse(saved);
                data.forEach(id => {
                    const a = this.list.find(a => a.id === id);
                    if (a) a.unlocked = true;
                });
            }
            const walked = localStorage.getItem('mayowa_walked');
            if (walked) this.totalWalked = parseInt(walked) || 0;
        } catch(e) {}
    },

    save() {
        try {
            const unlocked = this.list.filter(a => a.unlocked).map(a => a.id);
            localStorage.setItem('mayowa_achievements', JSON.stringify(unlocked));
            localStorage.setItem('mayowa_walked', String(this.totalWalked));
        } catch(e) {}
    },

    unlock(id) {
        const a = this.list.find(a => a.id === id);
        if (!a || a.unlocked) return;
        a.unlocked = true;
        this.save();
        this.showToast(a);
        this.render();
        AudioManager.playSfx('achievement');
    },

    check(id, condition) {
        if (condition) this.unlock(id);
    },

    addWalk(px) {
        this.totalWalked += Math.abs(px);
        if (this.totalWalked >= 1000) this.unlock('walker');
    },

    visitSection(name) {
        this.visited.add(name);
        if (this.visited.has('about') && this.visited.has('games')) {
            this.unlock('explorer');
        }
    },

    showToast(achievement) {
        const toast = document.getElementById('achievementToast');
        document.getElementById('achievementName').textContent = achievement.icon + ' ' + achievement.name;
        toast.classList.remove('hidden');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => toast.classList.add('hidden'), 3500);
    },

    render() {
        const container = document.getElementById('achievementsList');
        if (!container) return;
        container.innerHTML = '';
        this.list.forEach(a => {
            const div = document.createElement('div');
            div.className = 'ach-item ' + (a.unlocked ? 'unlocked' : 'locked');
            div.innerHTML = `
                <div class="ach-emoji">${a.unlocked ? a.icon : '🔒'}</div>
                <div class="ach-info">
                    <div class="ach-title">${a.unlocked ? a.name : '???'}</div>
                    <div class="ach-desc">${a.desc}</div>
                </div>
            `;
            container.appendChild(div);
        });
    }
};
