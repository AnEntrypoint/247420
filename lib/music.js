// Site background music: one <audio> loop, user-toggleable, muted while the
// TV page's own video is playing (avoids stacking two audio sources).
const VOLUME = 0.35;
const STORAGE_KEY = '247420-music-on';

class Music {
    constructor() {
        this.el = new Audio('/public/247420.mp3');
        this.el.loop = true;
        this.el.volume = VOLUME;
        this.tvActive = false;
        this.enabled = localStorage.getItem(STORAGE_KEY) === '1';
        window.__debug.music = { enabled: () => this.enabled, tvActive: () => this.tvActive };
    }

    _sync() {
        if (this.enabled && !this.tvActive) this.el.play().catch(() => {});
        else this.el.pause();
    }

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem(STORAGE_KEY, this.enabled ? '1' : '0');
        this._sync();
        return this.enabled;
    }

    setTvActive(active) {
        this.tvActive = active;
        this._sync();
    }
}

export default Music;
