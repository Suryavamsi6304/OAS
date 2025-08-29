// Login page functionality
document.addEventListener('DOMContentLoaded', () => {
    // Redirect if already logged in
    if (Auth.isAuthenticated()) {
        const user = Auth.getUser();
        if (user.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else if (user.role === 'teacher') {
            window.location.href = 'teacher-dashboard.html';
        } else {
            window.location.href = 'dashboard.html';
        }
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = loginForm.querySelector('button[type="submit"]');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Basic validation
        if (!email || !password) {
            Utils.showAlert('Please fill in all fields', 'error');
            return;
        }

        // Show loading state
        const originalBtnText = loginBtn.textContent;
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<div class="loading"></div> Logging in...';

        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }
            
            // Store authentication data
            Auth.setToken(data.token);
            Auth.setUser(data.user);

            alert('Login successful!');
            
            // Redirect based on role
            if (data.user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else if (data.user.role === 'teacher') {
                window.location.href = 'teacher-dashboard.html';
            } else {
                window.location.href = 'dashboard.html';
            }

        } catch (error) {
            alert('Error: ' + (error.message || 'Login failed'));
        } finally {
            // Reset button state
            loginBtn.disabled = false;
            loginBtn.textContent = originalBtnText;
        }
    });

    // Enter key support
    [emailInput, passwordInput].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loginForm.dispatchEvent(new Event('submit'));
            }
        });
    });
});