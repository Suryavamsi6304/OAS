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
    
    // Setup logout functionality
    document.querySelector('.logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            Auth.logout();
        }
    });

    // Load dashboard data
    await loadDashboardData();
});

async function loadDashboardData() {
    try {
        const data = await API.getDashboard();
        updateStatistics(data.stats || {});
        updateTodayTests(data.todayTests || []);
        updateRecentTests(data.recentTests || []);
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        Utils.showAlert('Failed to load dashboard data', 'error');
    }
}

function updateStatistics(stats) {
    const elements = {
        testsDesigned: document.getElementById('testsDesigned'),
        testsConducted: document.getElementById('testsConducted'),
        testTakers: document.getElementById('testTakers'),
        testDesigners: document.getElementById('testDesigners')
    };

    // Animate counters
    Object.keys(elements).forEach(key => {
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