/**
 * Player.js - Custom video player
 * Supports MP4, HLS (m3u8), custom controls, PiP, fullscreen
 */
import { formatTime, isM3U8, vibrate, share, escapeHTML } from '../utils/Helpers.js';
import Storage from '../utils/Storage.js';
import Toast from '../utils/Toast.js';
import { VideoCard } from './VideoCard.js';

class Player {
    constructor() {
        this.modal = null;
        this.video = null;
        this.hls = null;
        this.currentVideo = null;
        this.allVideos = [];
        this.controlsTimer = null;
        this.isDragging = false;
        this.nextVideoTimer = null;
        this.playbackSpeed = 1;
        this.qualityLevels = [];
        this.onClose = null;
    }

    init() {
        this.modal = document.getElementById('player-modal');
        this.video = document.getElementById('video-player');
        this._bindControls();
        this._bindVideoEvents();
    }

    open(video, allVideos = []) {
        if (!this.modal) this.init();
        
        this.currentVideo = video;
        this.allVideos = allVideos;
        
        // Update UI
        document.getElementById('player-title').textContent = video.title;
        document.getElementById('player-subtitle').textContent = 
            [video.genre, video.year, video.country].filter(Boolean).join(' • ');
        document.getElementById('player-description').textContent = video.description || '';
        
        // Meta tags
        const meta = document.getElementById('player-meta');
        const tags = [video.genre, video.language, video.country, video.year].filter(Boolean);
        meta.innerHTML = tags.map(t => `<span class="meta-tag">${escapeHTML(t)}</span>`).join('');
        
        // Favorite state
        this._updateFavoriteBtn();
        
        // Recommended
        this._renderRecommended();
        
        // Load video
        this._loadVideo(video.video);
        
        // Save to history
        Storage.addToHistory(video);
        
        // Show modal
        this.modal.classList.remove('hidden');
        document.body.classList.add('no-scroll');
        
        // Check video orientation
        this._detectOrientation();
        
        // Resume from saved position
        const savedTime = Storage.getProgress(video.id);
        if (savedTime > 10) {
            this.video.addEventListener('loadedmetadata', () => {
                this.video.currentTime = savedTime;
                Toast.info(`${formatTime(savedTime)}dan davom etmoqda`);
            }, { once: true });
        }
    }

    close() {
        if (!this.modal) return;
        
        // Save progress
        if (this.currentVideo && this.video.duration) {
            Storage.saveProgress(
                this.currentVideo, 
                this.video.currentTime, 
                this.video.duration
            );
        }
        
        this.video.pause();
        
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
        
        this.video.src = '';
        this.video.removeAttribute('src');
        this.video.load();
        
        this.modal.classList.add('hidden');
        document.body.classList.remove('no-scroll');
        
        clearTimeout(this.controlsTimer);
        clearInterval(this.nextVideoTimer);
        
        const nextCard = document.getElementById('next-video-card');
        if (nextCard) nextCard.classList.add('hidden');
        
        if (this.onClose) this.onClose();
    }

    _loadVideo(url) {
        if (!url) {
            Toast.error('Video manzili topilmadi');
            return;
        }
        
        const loading = document.getElementById('player-loading');
        loading.classList.remove('hidden');
        
        // Reset quality levels
        this.qualityLevels = [];
        
        // Destroy previous HLS
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
        
        if (isM3U8(url)) {
            this._loadHLS(url);
        } else {
            // Native MP4 / other
            this.video.src = url;
            this.video.load();
            this.video.play().catch(e => console.warn('Autoplay blocked:', e));
        }
    }

    _loadHLS(url) {
        if (window.Hls && window.Hls.isSupported()) {
            this.hls = new window.Hls({
                enableWorker: true,
                lowLatencyMode: false,
                backBufferLength: 90
            });
            
            this.hls.loadSource(url);
            this.hls.attachMedia(this.video);
            
            this.hls.on(window.Hls.Events.MANIFEST_PARSED, (event, data) => {
                this.qualityLevels = data.levels.map((level, idx) => ({
                    index: idx,
                    height: level.height,
                    bitrate: level.bitrate,
                    name: `${level.height}p`
                }));
                this.video.play().catch(e => console.warn('Autoplay blocked:', e));
            });
            
            this.hls.on(window.Hls.Events.ERROR, (event, data) => {
                console.error('HLS Error:', data);
                if (data.fatal) {
                    switch (data.type) {
                        case window.Hls.ErrorTypes.NETWORK_ERROR:
                            this.hls.startLoad();
                            break;
                        case window.Hls.ErrorTypes.MEDIA_ERROR:
                            this.hls.recoverMediaError();
                            break;
                        default:
                            Toast.error('Video yuklanmadi');
                            break;
                    }
                }
            });
        } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari native HLS
            this.video.src = url;
            this.video.play().catch(e => console.warn('Autoplay blocked:', e));
        } else {
            Toast.error('Brauzeringiz HLS ni qo\'llab-quvvatlamaydi');
        }
    }

    _detectOrientation() {
        const wrapper = document.getElementById('video-wrapper');
        this.video.addEventListener('loadedmetadata', () => {
            const isVertical = this.video.videoHeight > this.video.videoWidth;
            wrapper.classList.toggle('vertical', isVertical);
        }, { once: true });
    }

    _bindControls() {
        // Back button
        document.getElementById('player-back').addEventListener('click', () => this.close());
        
        // Play / pause
        document.getElementById('player-playpause').addEventListener('click', () => this.togglePlay());
        
        // Rewind / forward
        document.getElementById('player-rewind').addEventListener('click', () => {
            this.video.currentTime = Math.max(0, this.video.currentTime - 10);
            vibrate(10);
        });
        document.getElementById('player-forward').addEventListener('click', () => {
            this.video.currentTime = Math.min(this.video.duration, this.video.currentTime + 10);
            vibrate(10);
        });
        
        // Fullscreen
        document.getElementById('player-fullscreen').addEventListener('click', () => this.toggleFullscreen());
        
        // PiP
        document.getElementById('player-pip').addEventListener('click', () => this.togglePiP());
        
        // Speed
        document.getElementById('player-speed-btn').addEventListener('click', () => this._showSpeedMenu());
        
        // Quality
        document.getElementById('player-quality-btn').addEventListener('click', () => this._showQualityMenu());
        
        // Subtitles
        document.getElementById('player-subtitle-btn').addEventListener('click', () => this._toggleSubtitle());
        
        // Progress bar
        this._bindProgressBar();
        
        // Show / hide controls on tap
        const wrapper = document.getElementById('video-wrapper');
        wrapper.addEventListener('click', (e) => {
            if (e.target.closest('.control-btn, .control-mini-btn, .progress-container, .settings-menu, .next-video-card')) return;
            this._toggleControls();
        });
        
        // Actions
        document.getElementById('action-favorite').addEventListener('click', () => this._toggleFavorite());
        document.getElementById('action-share').addEventListener('click', () => this._share());
        document.getElementById('action-download').addEventListener('click', () => this._download());
        
        // Next video
        document.getElementById('next-play').addEventListener('click', () => this._playNext());
        document.getElementById('next-cancel').addEventListener('click', () => this._cancelNext());
        
        // ESC to close
        document.addEventListener('keydown', (e) => {
            if (this.modal.classList.contains('hidden')) return;
            if (e.key === 'Escape') this.close();
            if (e.key === ' ') { e.preventDefault(); this.togglePlay(); }
            if (e.key === 'ArrowLeft') this.video.currentTime -= 5;
            if (e.key === 'ArrowRight') this.video.currentTime += 5;
            if (e.key === 'f') this.toggleFullscreen();
        });
    }

    _bindProgressBar() {
        const container = document.getElementById('progress-container');
        const bar = document.getElementById('progress-bar');
        const thumb = document.getElementById('progress-thumb');
        
        const seek = (e) => {
            const rect = container.getBoundingClientRect();
            const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
            const percent = Math.max(0, Math.min(1, x / rect.width));
            
            if (this.video.duration) {
                this.video.currentTime = percent * this.video.duration;
                bar.style.width = `${percent * 100}%`;
                thumb.style.left = `${percent * 100}%`;
            }
        };
        
        const onStart = (e) => {
            this.isDragging = true;
            container.classList.add('dragging');
            seek(e);
        };
        const onMove = (e) => {
            if (this.isDragging) seek(e);
        };
        const onEnd = () => {
            this.isDragging = false;
            container.classList.remove('dragging');
        };
        
        container.addEventListener('mousedown', onStart);
        container.addEventListener('touchstart', onStart, { passive: true });
        document.addEventListener('mousemove', onMove);
        document.addEventListener('touchmove', onMove, { passive: true });
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchend', onEnd);
    }

    _bindVideoEvents() {
        this.video.addEventListener('play', () => {
            document.getElementById('playpause-icon').textContent = 'pause';
            this._scheduleHideControls();
        });
        
        this.video.addEventListener('pause', () => {
            document.getElementById('playpause-icon').textContent = 'play_arrow';
            this._showControls();
        });
        
        this.video.addEventListener('waiting', () => {
            document.getElementById('player-loading').classList.remove('hidden');
        });
        
        this.video.addEventListener('canplay', () => {
            document.getElementById('player-loading').classList.add('hidden');
        });
        
        this.video.addEventListener('timeupdate', () => {
            if (this.isDragging) return;
            const percent = (this.video.currentTime / this.video.duration) * 100 || 0;
            document.getElementById('progress-bar').style.width = `${percent}%`;
            document.getElementById('progress-thumb').style.left = `${percent}%`;
            document.getElementById('current-time').textContent = formatTime(this.video.currentTime);
            
            // Auto save progress every 5 seconds
            if (this.currentVideo && Math.floor(this.video.currentTime) % 5 === 0) {
                Storage.saveProgress(this.currentVideo, this.video.currentTime, this.video.duration);
            }
            
            // Show next video card at the last 15 seconds
            if (this.video.duration > 30 && 
                this.video.duration - this.video.currentTime < 15 && 
                this.video.duration - this.video.currentTime > 0) {
                this._showNextVideo();
            }
        });
        
        this.video.addEventListener('progress', () => {
            if (this.video.buffered.length > 0) {
                const buffered = this.video.buffered.end(this.video.buffered.length - 1);
                const percent = (buffered / this.video.duration) * 100 || 0;
                document.getElementById('progress-buffered').style.width = `${percent}%`;
            }
        });
        
        this.video.addEventListener('loadedmetadata', () => {
            document.getElementById('duration').textContent = formatTime(this.video.duration);
        });
        
        this.video.addEventListener('ended', () => {
            const settings = Storage.getSettings();
            if (settings.autoplay) this._playNext(true);
        });
        
        this.video.addEventListener('error', (e) => {
            document.getElementById('player-loading').classList.add('hidden');
            Toast.error('Video yuklashda xato yuz berdi');
        });
    }

    togglePlay() {
        if (this.video.paused) {
            this.video.play();
        } else {
            this.video.pause();
        }
        vibrate(10);
    }

    async toggleFullscreen() {
    const elem = document.documentElement;
    const fsIcon = document.getElementById('fullscreen-icon');

    if (!document.fullscreenElement) {
        // 1. To'liq ekran rejimiga kirish buyrug'ini yuboramiz
        try {
            const requestMethod = elem.requestFullscreen || elem.webkitRequestFullscreen || elem.msRequestFullscreen;
            if (requestMethod) {
                await requestMethod.call(elem);
            }

            // 2. Ekran orientatsiyasini qulflash (Yonga burish)
            // Bu qism aynan siz so'ragan muammoni hal qiladi
            if (screen.orientation && screen.orientation.lock) {
                // 'landscape' - ekranni gorizontal holatga majburan o'tkazadi
                await screen.orientation.lock('landscape').catch(err => {
                    console.log("Orientatsiya qulflashda xato:", err);
                });
            }
            
            fsIcon.textContent = 'fullscreen_exit';
        } catch (err) {
            console.error("Fullscreen xatosi:", err);
        }
    } else {
        // 3. To'liq ekrandan chiqish
        const exitMethod = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
        if (exitMethod) {
            await exitMethod.call(document);
        }

        // 4. Orientatsiyani yana bo'shatish (Portret rejimiga qaytishi uchun)
        if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
        }

        fsIcon.textContent = 'fullscreen';
    }
}


    async togglePiP() {
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else if (document.pictureInPictureEnabled) {
                await this.video.requestPictureInPicture();
            } else {
                Toast.warning('PiP rejimi qo\'llab-quvvatlanmaydi');
            }
        } catch (err) {
            Toast.error('PiP rejimi ochilmadi');
        }
    }

    _scheduleHideControls() {
        clearTimeout(this.controlsTimer);
        this.controlsTimer = setTimeout(() => {
            if (!this.video.paused) {
                document.getElementById('player-controls').classList.add('hidden-controls');
                document.querySelector('.player-header').classList.add('hidden-controls');
            }
        }, 3000);
    }

    _showControls() {
        document.getElementById('player-controls').classList.remove('hidden-controls');
        document.querySelector('.player-header').classList.remove('hidden-controls');
        this._scheduleHideControls();
    }

    _toggleControls() {
        const controls = document.getElementById('player-controls');
        if (controls.classList.contains('hidden-controls')) {
            this._showControls();
        } else {
            controls.classList.add('hidden-controls');
            document.querySelector('.player-header').classList.add('hidden-controls');
        }
    }

    _showSpeedMenu() {
        const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
        const menu = document.getElementById('settings-menu');
        const content = menu.querySelector('.settings-content');
        
        content.innerHTML = `
            <div class="settings-header">Tezlik</div>
            ${speeds.map(s => `
                <button class="settings-option ${s === this.playbackSpeed ? 'active' : ''}" data-speed="${s}">
                    ${s === 1 ? 'Oddiy (1x)' : `${s}x`}
                </button>
            `).join('')}
        `;
        
        content.querySelectorAll('[data-speed]').forEach(btn => {
            btn.addEventListener('click', () => {
                const speed = parseFloat(btn.dataset.speed);
                this.video.playbackRate = speed;
                this.playbackSpeed = speed;
                document.querySelector('#player-speed-btn .speed-text').textContent = `${speed}x`;
                menu.classList.add('hidden');
            });
        });
        
        menu.classList.remove('hidden');
        this._bindMenuClose(menu);
    }

    _showQualityMenu() {
        const menu = document.getElementById('settings-menu');
        const content = menu.querySelector('.settings-content');
        
        if (this.qualityLevels.length === 0) {
            content.innerHTML = `
                <div class="settings-header">Sifat</div>
                <button class="settings-option active">Avtomatik</button>
            `;
        } else {
            content.innerHTML = `
                <div class="settings-header">Sifat</div>
                <button class="settings-option ${this.hls?.currentLevel === -1 ? 'active' : ''}" data-quality="-1">
                    Avtomatik
                </button>
                ${this.qualityLevels.map(q => `
                    <button class="settings-option ${this.hls?.currentLevel === q.index ? 'active' : ''}" data-quality="${q.index}">
                        ${q.name}
                    </button>
                `).join('')}
            `;
            
            content.querySelectorAll('[data-quality]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const q = parseInt(btn.dataset.quality);
                    if (this.hls) this.hls.currentLevel = q;
                    menu.classList.add('hidden');
                });
            });
        }
        
        menu.classList.remove('hidden');
        this._bindMenuClose(menu);
    }

    _toggleSubtitle() {
        Toast.info('Subtitr fayli mavjud bo\'lsa qo\'shiladi');
    }

    _bindMenuClose(menu) {
        const closeHandler = (e) => {
            if (!menu.contains(e.target) && !e.target.closest('#player-speed-btn, #player-quality-btn')) {
                menu.classList.add('hidden');
                document.removeEventListener('click', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 50);
    }

    _toggleFavorite() {
        if (!this.currentVideo) return;
        const added = Storage.toggleFavorite(this.currentVideo);
        Toast[added ? 'success' : 'info'](
            added ? 'Sevimlilarga qo\'shildi' : 'Sevimlilardan o\'chirildi'
        );
        this._updateFavoriteBtn();
        vibrate(20);
    }

    _updateFavoriteBtn() {
        if (!this.currentVideo) return;
        const btn = document.getElementById('action-favorite');
        const isFav = Storage.isFavorite(this.currentVideo.id);
        btn.classList.toggle('active', isFav);
        btn.querySelector('.material-icons-round').textContent = isFav ? 'favorite' : 'favorite_border';
    }

    async _share() {
        if (!this.currentVideo) return;
        const result = await share({
            title: this.currentVideo.title,
            text: this.currentVideo.description || this.currentVideo.title,
            url: window.location.href
        });
        if (result === 'copied') {
            Toast.success('Havola ko\'chirildi');
        } else if (!result) {
            Toast.error('Ulashib bo\'lmadi');
        }
    }

    _download() {
        Toast.info('Yuklab olish boshlandi (Demo)');
        // Real download implementation would create blob & save
    }

    _renderRecommended() {
        const container = document.getElementById('recommended-list');
        const recommended = this.allVideos
            .filter(v => v.id !== this.currentVideo.id)
            .slice(0, 6);
        
        container.innerHTML = recommended.map(v => VideoCard.list(v)).join('');
        VideoCard.activateLazyLoad(container);
        VideoCard.bindClicks(container, (id) => {
            const video = this.allVideos.find(v => v.id === id);
            if (video) this.open(video, this.allVideos);
        });
    }

    _showNextVideo() {
        const card = document.getElementById('next-video-card');
        if (!card.classList.contains('hidden')) return;
        
        const next = this._getNextVideo();
        if (!next) return;
        
        document.getElementById('next-thumb').src = next.thumbnail;
        document.getElementById('next-title').textContent = next.title;
        card.classList.remove('hidden');
        card.dataset.nextId = next.id;
    }

    _getNextVideo() {
        if (!this.currentVideo || this.allVideos.length === 0) return null;
        const currentIdx = this.allVideos.findIndex(v => v.id === this.currentVideo.id);
        if (currentIdx === -1) return this.allVideos[0];
        return this.allVideos[(currentIdx + 1) % this.allVideos.length];
    }

    _playNext(immediate = false) {
        const next = this._getNextVideo();
        if (!next) return;
        document.getElementById('next-video-card').classList.add('hidden');
        this.open(next, this.allVideos);
    }

    _cancelNext() {
        document.getElementById('next-video-card').classList.add('hidden');
    }
}

export default new Player();
 