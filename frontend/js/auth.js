// Authentication utilities
class Auth {
    static TOKEN_KEY = 'assessment_token';
    static USER_KEY = 'assessment_user';

    static setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    static getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    static setUser(user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    static getUser() {
        const user = localStorage.getItem(this.USER_KEY);
        return user ? JSON.parse(user) : null;
    }

    static isAuthenticated() {
        return !!this.getToken();
    }

    static logout() {
        const user = this.getUser();
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        
        if (user && user.role === 'admin') {
            window.location.href = '/admin';
        } else {
            window.location.href = 'index.html';
        }
    }

    static requireAuth() {
        const currentPage = window.location.pathname.split('/').pop();
        const currentPath = window.location.pathname;
        
        if (!this.isAuthenticated() && currentPage !== 'register.html') {
            if (currentPath === '/admin' || currentPage === 'admin-login.html') {
                window.location.href = '/admin';
            } else {
                window.location.href = 'index.html';
            }
            return false;
        }
        return true;
    }

    static getAuthHeaders() {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    static hasRole(role) {
        const user = this.getUser();
        return user && user.role === role;
    }

    static redirectBasedOnRole() {
        const user = this.getUser();
        if (!user) return;

        switch (user.role) {
            case 'admin':
                window.location.href = 'admin-dashboard.html';
                break;
            case 'teacher':
                window.location.href = 'teacher-dashboard.html';
                break;
            case 'student':
                window.location.href = 'dashboard.html';
                break;
            default:
                window.location.href = 'dashboard.html';
        }
    }
}

// Auto-logout on token expiration
window.addEventListener('storage', (e) => {
    if (e.key === Auth.TOKEN_KEY && !e.newValue) {
        Auth.logout();
    }
});

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    // Skip auth check for login and register pages
    const publicPages = ['index.html', 'register.html', 'admin-login.html', '', '/', '/admin'];
    const currentPage = window.location.pathname.split('/').pop() || window.location.pathname;
    
    if (!publicPages.includes(currentPage) && !publicPages.includes(window.location.pathname) && !currentPage.includes('register')) {
        Auth.requireAuth();
    }
});