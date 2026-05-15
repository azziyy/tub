/**
 * Router.js - SPA Router
 * Simple hash-based router for single-page application
 */
class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.container = null;
        this.beforeChange = null;
    }

    init(container) {
        this.container = container;
        window.addEventListener('hashchange', () => this._handleRoute());
        window.addEventListener('popstate', () => this._handleRoute());
        this._handleRoute();
    }

    register(name, handler) {
        this.routes[name] = handler;
        return this;
    }

    navigate(name, params = {}) {
        const hash = `#/${name}${Object.keys(params).length ? '?' + new URLSearchParams(params) : ''}`;
        if (window.location.hash !== hash) {
            window.location.hash = hash;
        } else {
            this._handleRoute();
        }
    }

    _handleRoute() {
        const hash = window.location.hash.slice(1) || '/home';
        const [path, queryStr] = hash.split('?');
        const name = path.replace(/^\//, '') || 'home';
        const params = {};
        if (queryStr) {
            new URLSearchParams(queryStr).forEach((v, k) => params[k] = v);
        }

        if (this.beforeChange) {
            this.beforeChange(name, this.currentRoute);
        }

        this.currentRoute = name;

        // Update bottom nav active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.route === name);
        });

        // Render route
        const handler = this.routes[name];
        if (handler) {
            this.container.scrollTop = 0;
            handler(this.container, params);
        } else {
            console.warn(`[Router] Route not found: ${name}`);
            if (this.routes.home) this.routes.home(this.container, {});
        }
    }
}

export default new Router();
