/**
 * Helpers.js - Utility functions
 */

export function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
        return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
}

export function debounce(fn, delay = 300) {
    let timer = null;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

export function throttle(fn, limit = 100) {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

export function isM3U8(url) {
    return url && (url.toLowerCase().includes('.m3u8') || url.toLowerCase().includes('m3u8?'));
}

export function isMP4(url) {
    return url && url.toLowerCase().includes('.mp4');
}

export function getVideoSource(url) {
    if (isM3U8(url)) return 'hls';
    if (isMP4(url)) return 'mp4';
    return 'unknown';
}

export function placeholderImage(text = '') {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="#1a1a1a"/></svg>`;
    return 'data:image/svg+xml;base64,' + btoa(svg);
}

export function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function lazyLoadImage(img, src) {
    if (!src) return;
    const tempImg = new Image();
    tempImg.onload = () => {
        img.src = src;
        img.classList.add('loaded');
    };
    tempImg.onerror = () => {
        img.src = placeholderImage();
        img.classList.add('error');
    };
    tempImg.src = src;
}

export function setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) return null;
    
    return new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.dataset.src;
                if (src) {
                    lazyLoadImage(img, src);
                    img.removeAttribute('data-src');
                }
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px 0px',
        threshold: 0.01
    });
}

let observer = null;
export function observeImage(img) {
    if (!observer) {
        observer = setupIntersectionObserver();
    }
    if (observer) {
        observer.observe(img);
    } else {
        // Fallback
        if (img.dataset.src) {
            img.src = img.dataset.src;
        }
    }
}

export function vibrate(pattern = 10) {
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

export async function share(data) {
    if (navigator.share) {
        try {
            await navigator.share(data);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    // Fallback - copy to clipboard
    if (navigator.clipboard) {
        try {
            await navigator.clipboard.writeText(data.url || data.text);
            return 'copied';
        } catch (e) {
            return false;
        }
    }
    return false;
}

export function isOnline() {
    return navigator.onLine;
}

export function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return String(num);
}

export function relativeTime(timestamp) {
    const diff = Date.now() - timestamp;
    const s = Math.floor(diff / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    
    if (s < 60) return 'hozir';
    if (m < 60) return `${m} daqiqa oldin`;
    if (h < 24) return `${h} soat oldin`;
    if (d < 7) return `${d} kun oldin`;
    return new Date(timestamp).toLocaleDateString('uz-UZ');
}
