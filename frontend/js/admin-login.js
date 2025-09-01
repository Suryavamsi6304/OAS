document.addEventListener('DOMContentLoaded', () => {
    // Handle logo image error
    const logoImg = document.getElementById('logoImg');
    if (logoImg) {
        logoImg.onerror = function() {
            this.style.display = 'none';
        };
    }

    if (Auth.isAuthenticated() && Auth.hasRole('admin')) {
        window.location.href = 'admin-dashboard.html';
        return;
    }

    const loginForm = document.getElementById('adminLoginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = loginForm.querySelector('button[type="submit"]');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        const originalBtnText = loginBtn.textContent;
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<div class="loading"></div> Logging in...';

        try {
            const response = await fetch(`http://${window.location.hostname}:3000/api/auth/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Admin login failed');
            }
            
            Auth.setToken(data.token);
            Auth.setUser(data.user);

            alert('Admin login successful!');
            window.location.href = 'admin-dashboard.html';

        } catch (error) {
            alert('Error: ' + (error.message || 'Admin login failed'));
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = originalBtnText;
        }
    });

    [emailInput, passwordInput].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loginForm.dispatchEvent(new Event('submit'));
            }
        });
    });
});