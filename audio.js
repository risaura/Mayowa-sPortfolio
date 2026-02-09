/* ═══════════════════════════════════════════
   AUDIO MANAGER — Jazz Music via Web Audio API
   ═══════════════════════════════════════════ */

const AudioManager = {
    ctx: null,
    masterGain: null,
    playing: false,
    volume: 0.4,
    intervalIds: [],

    init() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0;
        this.masterGain.connect(this.ctx.destination);
    },

    start() {
        if (!this.ctx) this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.playing = true;
        this.masterGain.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 0.5);
        this.playJazz();
    },

    stop() {
        this.playing = false;
        if (this.masterGain) {
            this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
        }
        this.intervalIds.forEach(id => clearInterval(id));
        this.intervalIds = [];
    },

    setVolume(v) {
        this.volume = v;
        if (this.masterGain && this.playing) {
            this.masterGain.gain.linearRampToValueAtTime(v, this.ctx.currentTime + 0.1);
        }
    },

    // Smooth jazz generator
    playJazz() {
        // Jazz chord progressions (ii-V-I-vi patterns in C)
        const chords = [
            [261.63, 311.13, 369.99, 440.00], // Cmaj7
            [293.66, 349.23, 415.30, 493.88], // Dm7
            [329.63, 392.00, 466.16, 554.37], // Em7
            [349.23, 415.30, 523.25, 622.25], // Fmaj7
            [392.00, 466.16, 554.37, 659.26], // G7
            [440.00, 523.25, 622.25, 739.99], // Am7
            [261.63, 329.63, 392.00, 466.16], // C6/9
            [293.66, 369.99, 440.00, 523.25], // Dm9
        ];

        let chordIndex = 0;

        // Play chords
        const chordLoop = () => {
            if (!this.playing) return;
            const chord = chords[chordIndex % chords.length];
            this.playChord(chord, 2.5);
            chordIndex++;
        };

        chordLoop();
        const chordId = setInterval(chordLoop, 3000);
        this.intervalIds.push(chordId);

        // Walking bass
        const bassNotes = [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 146.83, 164.81];
        let bassIndex = 0;
        const bassLoop = () => {
            if (!this.playing) return;
            this.playBass(bassNotes[bassIndex % bassNotes.length], 0.7);
            bassIndex++;
        };

        bassLoop();
        const bassId = setInterval(bassLoop, 750);
        this.intervalIds.push(bassId);

        // Gentle high notes (piano-like melody hints)
        const melodyNotes = [523.25, 587.33, 659.26, 698.46, 783.99, 659.26, 587.33, 523.25, 440, 493.88];
        let melodyIndex = 0;
        const melodyLoop = () => {
            if (!this.playing) return;
            if (Math.random() > 0.4) {
                this.playMelodyNote(melodyNotes[melodyIndex % melodyNotes.length], 0.4);
            }
            melodyIndex++;
        };
        const melodyId = setInterval(melodyLoop, 600);
        this.intervalIds.push(melodyId);
    },

    playChord(freqs, duration) {
        const now = this.ctx.currentTime;
        freqs.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.04, now + 0.15);
            gain.gain.linearRampToValueAtTime(0.025, now + duration * 0.6);
            gain.gain.linearRampToValueAtTime(0, now + duration);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now + i * 0.05);
            osc.stop(now + duration + 0.1);
        });
    },

    playBass(freq, duration) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
        gain.gain.linearRampToValueAtTime(0.04, now + duration * 0.5);
        gain.gain.linearRampToValueAtTime(0, now + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + duration + 0.1);
    },

    playMelodyNote(freq, duration) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.03, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + duration + 0.05);
    },

    // Sound effects
    playSfx(type) {
        if (!this.ctx) this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        gain.connect(this.masterGain);
        osc.connect(gain);

        if (type === 'click') {
            osc.frequency.value = 800;
            osc.type = 'square';
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'achievement') {
            osc.frequency.setValueAtTime(523, now);
            osc.frequency.setValueAtTime(659, now + 0.1);
            osc.frequency.setValueAtTime(784, now + 0.2);
            osc.type = 'square';
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc.start(now); osc.stop(now + 0.4);
        }
    }
};
