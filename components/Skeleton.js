/**
 * Skeleton.js - Loading skeleton components
 */
export class Skeleton {
    static row(count = 4) {
        const cards = Array(count).fill(0).map(() => `
            <div class="skeleton-card">
                <div class="skeleton skeleton-thumb"></div>
                <div class="skeleton skeleton-line medium"></div>
                <div class="skeleton skeleton-line short"></div>
            </div>
        `).join('');
        
        return `<div class="skeleton-row hide-scrollbar">${cards}</div>`;
    }

    static hero() {
        return `
            <div class="skeleton" style="width:100%;height:70vh;min-height:480px;max-height:640px;border-radius:0"></div>
        `;
    }

    static homePage() {
        return `
            <div style="margin-top: calc(-1 * var(--header-height) - var(--safe-area-top))">
                ${this.hero()}
                <div style="padding: 24px 16px 16px">
                    <div class="skeleton skeleton-line" style="width:140px;height:20px"></div>
                </div>
                ${this.row()}
                <div style="padding: 24px 16px 16px">
                    <div class="skeleton skeleton-line" style="width:140px;height:20px"></div>
                </div>
                ${this.row()}
                <div style="padding: 24px 16px 16px">
                    <div class="skeleton skeleton-line" style="width:140px;height:20px"></div>
                </div>
                ${this.row()}
            </div>
        `;
    }

    static grid(count = 6) {
        const cards = Array(count).fill(0).map(() => `
            <div>
                <div class="skeleton skeleton-thumb"></div>
                <div class="skeleton skeleton-line medium" style="margin-top:8px"></div>
                <div class="skeleton skeleton-line short"></div>
            </div>
        `).join('');
        
        return `<div class="grid-container">${cards}</div>`;
    }
}
