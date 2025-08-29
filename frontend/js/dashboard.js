// Dashboard functionality
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!Auth.requireAuth()) return;

    const user = Auth.getUser();
    
    // Redirect non-students to their dashboards
    if (user.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
        return;
    }
    if (user.role === 'teacher') {
        window.location.href = 'teacher-dashboard.html';
        return;
    }
    
    // Setup sidebar toggle
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
        document.getElementById('overlay').classList.toggle('active');
    });

    document.getElementById('overlay').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
    });

    // Setup logout functionality
    document.querySelector('.logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            Auth.logout();
        }
    });

    // Load dashboard data
    await loadDashboardData();
    await loadSystemBanner();
});

async function loadSystemBanner() {
    try {
        const response = await fetch('http://localhost:3000/api/admin/announcement');
        const announcement = await response.json();
        
        if (announcement && announcement.message) {
            const banner = document.getElementById('systemBanner');
            const message = document.getElementById('bannerMessage');
            
            message.textContent = announcement.message;
            message.className = 'banner-message';
            banner.className = `system-banner banner-${announcement.type || 'info'}`;
            banner.style.display = 'block';
            
            document.getElementById('closeBanner').onclick = () => {
                banner.style.display = 'none';
            };
        }
    } catch (error) {
        console.error('Failed to load system banner:', error);
    }
}

async function loadDashboardData() {
    try {
        console.log('Loading dashboard data...');
        console.log('Token:', Auth.getToken());
        
        const response = await fetch('http://localhost:3000/api/users/dashboard', {
            headers: {
                'Authorization': `Bearer ${Auth.getToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Dashboard data received:', data);
        console.log('Stats object:', data.stats);
        
        updateStatistics(data.stats || {});
        updateTodayTests(data.todayTests || []);
        updateRecentTests(data.recentTests || []);
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        Utils.showAlert('Failed to load dashboard data: ' + error.message, 'error');
    }
}

function updateStatistics(stats) {
    console.log('updateStatistics called with:', stats);
    
    const elements = {
        testsDesigned: document.getElementById('testsDesigned'),
        testsConducted: document.getElementById('testsConducted'),
        testTakers: document.getElementById('testTakers'),
        testDesigners: document.getElementById('testDesigners')
    };

    // Animate counters
    Object.keys(elements).forEach(key => {
        console.log(`Processing ${key}: ${stats[key]}`);
        if (elements[key] && stats[key] !== undefined) {
            animateCounter(elements[key], stats[key]);
        }
    });
}

function animateCounter(element, target) {
    const start = 0;
    const duration = 1000;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.floor(start + (target - start) * progress);
        
        element.textContent = current.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

function updateTodayTests(tests) {
    const container = document.getElementById('todayTests');
    
    if (tests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <p>No tests scheduled for today</p>
            </div>
        `;
        return;
    }

    container.innerHTML = tests.map(test => `
        <div class="test-item">
            <div class="test-info">
                <div class="test-name">${test.title}</div>
                <div class="test-meta">
                    ${test.course_code ? `Course: ${test.course_code} | ` : ''}
                    Time: ${test.time_limit} minutes | 
                    Marks: ${test.total_marks}
                </div>
            </div>
            <div class="test-actions">
                <button class="btn btn-primary btn-small" onclick="startTest(${test.id})">
                    Start Test
                </button>
            </div>
        </div>
    `).join('');
}

function updateRecentTests(tests) {
    const container = document.getElementById('recentTests');
    
    if (tests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✅</div>
                <p>No recent test attempts</p>
            </div>
        `;
        return;
    }

    container.innerHTML = tests.map(test => `
        <div class="test-item">
            <div class="test-info">
                <div class="test-name">${test.title}</div>
                <div class="test-meta">
                    Score: ${test.score}/${test.total_marks} (${test.percentage}%) | 
                    Attempted: ${Utils.formatDate(test.submitted_at)}
                </div>
            </div>
            <div class="test-actions">
                <button class="btn btn-secondary btn-small" onclick="viewResult(${test.id})">
                    View Result
                </button>
            </div>
        </div>
    `).join('');
}

// Global functions for button actions
window.startTest = function(testId) {
    window.location.href = `test-instructions.html?id=${testId}`;
};

window.viewResult = function(resultId) {
    window.location.href = `result-detail.html?id=${resultId}`;
};