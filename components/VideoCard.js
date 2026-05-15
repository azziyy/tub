/**
 * VideoCard.js - Reusable card components
 */
import { escapeHTML, observeImage, placeholderImage } from '../utils/Helpers.js';

export class VideoCard {
    /**
     * Build card HTML based on type
     */
    static build(video, type = null) {
        const cardType = type || video.type || 'grid';
        
        switch (cardType) {
            case 'story': return this.story(video);
            case 'carousel': return this.carousel(video);
            case 'list': return this.list(video);
            case 'grid':
            default: return this.grid(video);
        }
    }

    static carousel(video) {
        const meta = [video.year, video.genre, video.country]
            .filter(Boolean)
            .map(escapeHTML);
        
        return `
            <div class="card-carousel stagger-item" data-video-id="${escapeHTML(video.id)}">
                <div class="card-thumb">
                    <img data-src="${escapeHTML(video.thumbnail)}" 
                         src="${placeholderImage()}" 
                         alt="${escapeHTML(video.title)}" 
                         loading="lazy">
                    <div class="card-play-overlay">
                        <div class="card-play-icon">
                            <span class="material-icons-round">play_arrow</span>
                        </div>
                    </div>
                </div>
                <div class="card-content">
                    <h3 class="card-title">${escapeHTML(video.title)}</h3>
                    <div class="card-meta">
                        ${meta.map((m, i) => 
                            `${i > 0 ? '<span class="card-meta-dot"></span>' : ''}<span>${m}</span>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    static grid(video) {
        return `
            <div class="card-grid stagger-item" data-video-id="${escapeHTML(video.id)}">
                <div class="card-thumb">
                    <img data-src="${escapeHTML(video.thumbnail)}" 
                         src="${placeholderImage()}" 
                         alt="${escapeHTML(video.title)}" 
                         loading="lazy">
                    <div class="card-play-overlay">
                        <div class="card-play-icon">
                            <span class="material-icons-round">play_arrow</span>
                        </div>
                    </div>
                </div>
                <div class="card-content">
                    <h3 class="card-title">${escapeHTML(video.title)}</h3>
                    <div class="card-meta">
                        ${video.year ? `<span>${escapeHTML(video.year)}</span>` : ''}
                        ${video.year && video.genre ? '<span class="card-meta-dot"></span>' : ''}
                        ${video.genre ? `<span>${escapeHTML(video.genre)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    static list(video) {
        return `
            <div class="card-list stagger-item" data-video-id="${escapeHTML(video.id)}">
                <div class="card-thumb">
                    <img data-src="${escapeHTML(video.thumbnail)}" 
                         src="${placeholderImage()}" 
                         alt="${escapeHTML(video.title)}" 
                         loading="lazy">
                </div>
                <div class="card-content">
                    <div>
                        <h3 class="card-title">${escapeHTML(video.title)}</h3>
                        <p class="card-description">${escapeHTML(video.description || '')}</p>
                    </div>
                    <div class="card-meta">
                        ${video.year ? `<span>${escapeHTML(video.year)}</span>` : ''}
                        ${video.country ? `<span class="card-meta-dot"></span><span>${escapeHTML(video.country)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    static story(video) {
        return `
            <div class="card-story stagger-item" data-video-id="${escapeHTML(video.id)}">
                <div class="story-ring">
                    <div class="story-thumb">
                        <img data-src="${escapeHTML(video.thumbnail)}" 
                             src="${placeholderImage()}" 
                             alt="${escapeHTML(video.title)}" 
                             loading="lazy">
                    </div>
                </div>
                <div class="story-name">${escapeHTML(video.title)}</div>
            </div>
        `;
    }

    /**
     * Build section container based on type
     */
    static buildSection(section) {
        const containerClass = {
            story: 'story-container',
            carousel: 'carousel-container',
            grid: 'grid-container',
            list: 'list-container'
        }[section.type] || 'grid-container';
        
        const cardsHTML = section.videos
            .map(v => this.build(v, section.type))
            .join('');
        
        return `
            <section class="section">
                <div class="section-header">
                    <h2 class="section-title">${escapeHTML(section.name)}</h2>
                    <button class="section-action" data-section="${escapeHTML(section.name)}">
                        Barchasi
                        <span class="material-icons-round" style="font-size:16px">chevron_right</span>
                    </button>
                </div>
                <div class="${containerClass}">
                    ${cardsHTML}
                </div>
            </section>
        `;
    }

    /**
     * Lazy load images after insert into DOM
     */
    static activateLazyLoad(rootElement = document) {
        const images = rootElement.querySelectorAll('img[data-src]');
        images.forEach(img => observeImage(img));
    }

    /**
     * Bind click events
     */
    static bindClicks(rootElement, onCardClick) {
        const cards = rootElement.querySelectorAll('[data-video-id]');
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                const id = card.dataset.videoId;
                onCardClick && onCardClick(id, e);
            });
        });
    }
}
