/**
 * Toast.js - Notification system
 */
const ICONS = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
    warning: 'warning'
};

class Toast {
    constructor() {
        this.container = null;
    }

    _ensureContainer() {
        if (!this.container) {
            this.container = document.getElementById('toast-container');
        }
        return this.container;
    }

    show(message, type = 'info', duration = 3000) {
        const container = this._ensureContainer();
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="material-icons-round">${ICONS[type] || 'info'}</span>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    success(msg, duration) { this.show(msg, 'success', duration); }
    error(msg, duration) { this.show(msg, 'error', duration); }
    info(msg, duration) { this.show(msg, 'info', duration); }
    warning(msg, duration) { this.show(msg, 'warning', duration); }
}

export default new Toast();
