/**
 * Storage.js - LocalStorage wrapper
 * For favorites, history, settings
 */
class Storage {
    constructor() {
        this.KEYS = {
            FAVORITES: 'vf_favorites',
            HISTORY: 'vf_history',
            CONTINUE: 'vf_continue_watching',
            SETTINGS: 'vf_settings',
            CACHE: 'vf_cache'
        };
    }

    _get(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }

    _set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn('Storage quota exceeded');
            return false;
        }
    }

    // ============ FAVORITES ============
    getFavorites() {
        return this._get(this.KEYS.FAVORITES, []);
    }

    isFavorite(videoId) {
        return this.getFavorites().some(v => v.id === videoId);
    }

    addFavorite(video) {
        const favorites = this.getFavorites();
        if (!favorites.some(v => v.id === video.id)) {
            favorites.unshift({ ...video, addedAt: Date.now() });
            this._set(this.KEYS.FAVORITES, favorites);
        }
        return true;
    }

    removeFavorite(videoId) {
        const favorites = this.getFavorites().filter(v => v.id !== videoId);
        this._set(this.KEYS.FAVORITES, favorites);
        return true;
    }

    toggleFavorite(video) {
        if (this.isFavorite(video.id)) {
            this.removeFavorite(video.id);
            return false;
        } else {
            this.addFavorite(video);
            return true;
        }
    }

    // ============ HISTORY ============
    getHistory() {
        return this._get(this.KEYS.HISTORY, []);
    }

    addToHistory(video) {
        let history = this.getHistory().filter(v => v.id !== video.id);
        history.unshift({ ...video, watchedAt: Date.now() });
        history = history.slice(0, 50); // Keep last 50
        this._set(this.KEYS.HISTORY, history);
    }

    clearHistory() {
        this._set(this.KEYS.HISTORY, []);
    }

    // ============ CONTINUE WATCHING ============
    getContinueWatching() {
        return this._get(this.KEYS.CONTINUE, []);
    }

    saveProgress(video, currentTime, duration) {
        if (!video || !duration || currentTime < 10) return;
        
        // Don't save if almost complete (>95%)
        if (currentTime / duration > 0.95) {
            this.removeFromContinue(video.id);
            return;
        }
        
        let list = this.getContinueWatching().filter(v => v.id !== video.id);
        list.unshift({
            ...video,
            currentTime,
            duration,
            progress: (currentTime / duration) * 100,
            updatedAt: Date.now()
        });
        list = list.slice(0, 20);
        this._set(this.KEYS.CONTINUE, list);
    }

    getProgress(videoId) {
        const item = this.getContinueWatching().find(v => v.id === videoId);
        return item ? item.currentTime : 0;
    }

    removeFromContinue(videoId) {
        const list = this.getContinueWatching().filter(v => v.id !== videoId);
        this._set(this.KEYS.CONTINUE, list);
    }

    // ============ SETTINGS ============
    getSettings() {
        return this._get(this.KEYS.SETTINGS, {
            autoplay: true,
            notifications: true,
            quality: 'auto',
            playbackSpeed: 1,
            theme: 'amoled',
            language: 'uz',
            dataSaver: false,
            subtitlesEnabled: false
        });
    }

    setSetting(key, value) {
        const settings = this.getSettings();
        settings[key] = value;
        this._set(this.KEYS.SETTINGS, settings);
    }
}

export default new Storage();
