/**
 * HomePage.js - Home page with hero, trending, sections
 */
import SheetsAPI from '../api/SheetsAPI.js';
import Storage from '../utils/Storage.js';
import { VideoCard } from '../components/VideoCard.js';
import { Skeleton } from '../components/Skeleton.js';
import { escapeHTML, placeholderImage } from '../utils/Helpers.js';
import Player from '../components/Player.js';
import Toast from '../utils/Toast.js';

class HomePage {
    constructor() {
        this.videos = [];
        this.heroIndex = 0;
        this.heroTimer = null;
        this.activeGenre = 'all';
    }

    async render(container, params = {}) {
        // Show skeleton
        container.innerHTML = Skeleton.homePage();

        try {
            this.videos = await SheetsAPI.fetchVideos();
            
            if (this.videos.length === 0) {
                container.innerHTML = this._emptyState();
                return;
            }
            
            container.innerHTML = this._buildHTML();
            this._afterRender(container);
        } catch (err) {
            console.error('[HomePage]', err);
            container.innerHTML = this._errorState(err.message);
            container.querySelector('#retry-load')?.addEventListener('click', () => this.render(container));
        }
    }

    _buildHTML() {
    const featured = SheetsAPI.getFeatured(this.videos, 5);
    const continueWatching = Storage.getContinueWatching().slice(0, 10);
    const sections = SheetsAPI.groupBySection(this.videos);
    const genres = SheetsAPI.getGenres(this.videos);

    // 1. Google Sheets-dan "Top Reyting" bo'limini qidirib topamiz
    const topRatingSection = sections.find(s => s.name === "Top Reyting");

    return `
        ${topRatingSection ? VideoCard.buildSection({...topRatingSection, type: 'story'}) : ''}

        ${this._buildHero(featured)}
        
        ${this._buildCategoryChips(genres)}
        
        ${continueWatching.length > 0 ? this._buildContinueWatching(continueWatching) : ''}
        
        ${this._buildTrending(SheetsAPI.getTrending(this.videos, 10))}
        
        ${sections.map(s => {
            // "Top Reyting" tepada chiqqani uchun bu yerda qayta chiqarmaymiz
            if (s.name === "Top Reyting") return '';
            return VideoCard.buildSection(s);
        }).join('')}
        
        <div style="height: 24px"></div>
    `;
}



    _buildHero(featured) {
        if (featured.length === 0) return '';
        
        return `
            <section class="hero-banner">
                <div class="hero-slides" id="hero-slides">
                    ${featured.map((v, idx) => `
                        <div class="hero-slide ${idx === 0 ? 'active' : ''}" data-video-id="${escapeHTML(v.id)}">
                            <img class="hero-image" 
                                 src="${escapeHTML(v.thumbnail) || placeholderImage()}" 
                                 alt="${escapeHTML(v.title)}">
                            <div class="hero-overlay"></div>
                            <div class="hero-content">
                                <div class="hero-badge">
                                    <span class="material-icons-round" style="font-size:14px">trending_up</span>
                                    Premyera
                                </div>
                                <h1 class="hero-title">${escapeHTML(v.title)}</h1>
                                <div class="hero-meta">
                                    ${v.year ? `<span class="hero-meta-item"><span class="material-icons-round" style="font-size:14px">calendar_today</span>${escapeHTML(v.year)}</span>` : ''}
                                    ${v.genre ? `<span class="hero-meta-item"><span class="material-icons-round" style="font-size:14px">label</span>${escapeHTML(v.genre)}</span>` : ''}
                                    ${v.country ? `<span class="hero-meta-item"><span class="material-icons-round" style="font-size:14px">public</span>${escapeHTML(v.country)}</span>` : ''}
                                </div>
                                <p class="hero-description">${escapeHTML(v.description || '')}</p>
                                <div class="hero-actions">
                                    <button class="btn btn-primary btn-lg" data-play="${escapeHTML(v.id)}">
                                        <span class="material-icons-round">play_arrow</span>
                                        Tomosha qilish
                                    </button>
                                    <button class="btn btn-secondary btn-lg" data-info="${escapeHTML(v.id)}">
                                        <span class="material-icons-round">add</span>
                                        Ro'yxatga
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="hero-indicators">
                    ${featured.map((_, idx) => `
                        <span class="hero-indicator ${idx === 0 ? 'active' : ''}" data-idx="${idx}"></span>
                    `).join('')}
                </div>
            </section>
        `;
    }

    _buildCategoryChips(genres) {
        return `
            <div class="category-chips hide-scrollbar" style="margin-top: 24px">
                <button class="chip active" data-genre="all">Barchasi</button>
                ${genres.map(g => `<button class="chip" data-genre="${escapeHTML(g)}">${escapeHTML(g)}</button>`).join('')}
            </div>
        `;
    }

    _buildContinueWatching(videos) {
        const cards = videos.map(v => `
            <div class="card-carousel stagger-item" data-video-id="${escapeHTML(v.id)}">
                <div class="card-thumb">
                    <img data-src="${escapeHTML(v.thumbnail)}" src="${placeholderImage()}" alt="${escapeHTML(v.title)}">
                    <div class="card-play-overlay" style="opacity:1;background:linear-gradient(180deg,transparent 60%,rgba(0,0,0,0.85) 100%)">
                        <div class="card-play-icon">
                            <span class="material-icons-round">play_arrow</span>
                        </div>
                    </div>
                    <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:rgba(255,255,255,0.2)">
                        <div style="height:100%;background:var(--gradient-primary);width:${v.progress || 0}%"></div>
                    </div>
                </div>
                <div class="card-content">
                    <h3 class="card-title">${escapeHTML(v.title)}</h3>
                    <div class="card-meta"><span>Davom etish</span></div>
                </div>
            </div>
        `).join('');
        
        return `
            <section class="section">
                <div class="section-header">
                    <h2 class="section-title">
                        <span class="material-icons-round">history</span>
                        Davom etayotgan
                    </h2>
                </div>
                <div class="carousel-container">${cards}</div>
            </section>
        `;
    }

    _buildTrending(videos) {
        const cards = videos.map(v => VideoCard.carousel(v)).join('');
        return `
            <section class="section">
                <div class="section-header">
                    <h2 class="section-title">
                        <span class="badge-trending">🔥</span>
                        Trending
                    </h2>
                    <button class="section-action">
                        Barchasi
                        <span class="material-icons-round" style="font-size:16px">chevron_right</span>
                    </button>
                </div>
                <div class="carousel-container">${cards}</div>
            </section>
        `;
    }

    _afterRender(container) {
        // Lazy load images
        VideoCard.activateLazyLoad(container);
        
        // Card click handler
        VideoCard.bindClicks(container, (id) => this._openVideo(id));
        
        // Hero auto-slider
        this._startHeroSlider();
        
        // Hero indicators
        container.querySelectorAll('.hero-indicator').forEach(ind => {
            ind.addEventListener('click', () => {
                const idx = parseInt(ind.dataset.idx);
                this._goToHero(idx);
            });
        });
        
        // Hero play buttons
        container.querySelectorAll('[data-play]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._openVideo(btn.dataset.play);
            });
        });
        
        // Hero info buttons
        container.querySelectorAll('[data-info]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const video = this.videos.find(v => v.id === btn.dataset.info);
                if (video) {
                    Storage.toggleFavorite(video);
                    Toast.success('Sevimlilarga qo\'shildi');
                }
            });
        });
        
        // Category chips
        container.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.activeGenre = chip.dataset.genre;
                this._filterByGenre(container);
            });
        });
    }

    _filterByGenre(container) {
        const filtered = this.activeGenre === 'all' 
            ? this.videos 
            : SheetsAPI.filterByGenre(this.videos, this.activeGenre);
        
        // Re-render sections only
        const existingSections = container.querySelectorAll('.section');
        existingSections.forEach(s => {
            if (!s.querySelector('[data-section-keep]')) {
                // Keep hero, continue, trending sections
            }
        });
        
        Toast.info(`Filtr: ${this.activeGenre === 'all' ? 'Barchasi' : this.activeGenre} (${filtered.length} video)`);
    }

    _startHeroSlider() {
        clearInterval(this.heroTimer);
        const slides = document.querySelectorAll('.hero-slide');
        if (slides.length <= 1) return;
        
        this.heroTimer = setInterval(() => {
            this._goToHero((this.heroIndex + 1) % slides.length);
        }, 5000);
    }

    _goToHero(idx) {
        const slides = document.querySelectorAll('.hero-slide');
        const indicators = document.querySelectorAll('.hero-indicator');
        
        slides.forEach((s, i) => s.classList.toggle('active', i === idx));
        indicators.forEach((ind, i) => ind.classList.toggle('active', i === idx));
        
        this.heroIndex = idx;
    }

    _openVideo(id) {
        const video = this.videos.find(v => v.id === id);
        if (video) {
            Player.open(video, this.videos);
        }
    }

    _emptyState() {
        return `
            <div class="empty-state" style="margin-top:80px">
                <span class="material-icons-round">video_library</span>
                <h3>Hozircha videolar yo'q</h3>
                <p>Google Sheets'ga yangi videolar qo'shing</p>
            </div>
        `;
    }

    _errorState(message) {
        return `
            <div class="empty-state" style="margin-top:80px">
                <span class="material-icons-round" style="color:var(--neon-primary)">error</span>
                <h3>Xato yuz berdi</h3>
                <p>${escapeHTML(message || 'Ma\'lumotlarni yuklab bo\'lmadi')}</p>
                <button class="btn btn-primary" id="retry-load" style="margin-top:16px">
                    <span class="material-icons-round">refresh</span>
                    Qayta urinish
                </button>
            </div>
        `;
    }

    destroy() {
        clearInterval(this.heroTimer);
    }
}

export default new HomePage();
