// API utility class
class API {
    static BASE_URL = 'http://localhost:3000/api';

    static async request(endpoint, options = {}) {
        const url = `${this.BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...Auth.getAuthHeaders(),
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            
            // Handle authentication errors
            if (error.message.includes('token') || error.message.includes('Unauthorized')) {
                Auth.logout();
                return;
            }
            
            throw error;
        }
    }

    static async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    static async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    static async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // Authentication endpoints
    static async login(email, password) {
        return this.post('/auth/login', { email, password });
    }

    static async register(userData) {
        return this.post('/auth/register', userData);
    }

    static async logout() {
        return this.post('/auth/logout', {});
    }

    // User endpoints
    static async getDashboard() {
        return this.get('/users/dashboard');
    }

    // Assessment endpoints
    static async getAssessments() {
        return this.get('/assessments');
    }

    static async getAssessment(id) {
        return this.get(`/assessments/${id}`);
    }

    static async createAssessment(data) {
        return this.post('/assessments', data);
    }

    // Result endpoints
    static async submitAssessment(assessmentId, data) {
        return this.post(`/results/submit/${assessmentId}`, data);
    }

    static async getStudentResults(studentId) {
        return this.get(`/results/student/${studentId}`);
    }

    static async getAssessmentResults(assessmentId) {
        return this.get(`/results/assessment/${assessmentId}`);
    }

    // Practice endpoints
    static async getPracticeQuestions(level) {
        return this.get(`/practice/level/${level}`);
    }

    static async submitPractice(data) {
        return this.post('/practice/submit', data);
    }

    // Questions endpoints
    static async getAssessmentQuestions(assessmentId) {
        return this.get(`/questions/assessment/${assessmentId}`);
    }

    // Admin endpoints
    static async getAdminReports() {
        return this.get('/admin/reports');
    }

    static async getAuditLogs() {
        return this.get('/admin/audit-logs');
    }
}

// Utility functions
class Utils {
    static showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        // Insert at top of body or specific container
        const container = document.querySelector('.alert-container') || document.body;
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    static formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }

    static formatTimer(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    static showLoading(element) {
        element.innerHTML = '<div class="loading"></div>';
    }

    static hideLoading(element, originalContent = '') {
        element.innerHTML = originalContent;
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}