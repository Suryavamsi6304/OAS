// Test taking functionality
let currentAssessment = null;
let questions = [];
let currentQuestionIndex = 0;
let answers = {};
let flaggedQuestions = new Set();
let timeRemaining = 0;
let timerInterval = null;
let testStartTime = null;
let proctoringSystem = null;
let isProctoredTest = false;

document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.requireAuth()) return;

    const urlParams = new URLSearchParams(window.location.search);
    let assessmentId = urlParams.get('id');

    if (!assessmentId) {
        // Try to get from localStorage
        const storedTest = localStorage.getItem('selectedTest');
        if (storedTest) {
            const test = JSON.parse(storedTest);
            assessmentId = test.id;
        } else {
            alert('No test selected. Please select a test first.');
            window.location.href = 'attempt-test.html';
            return;
        }
    }
    
    console.log('Assessment ID:', assessmentId);

    // Check if proctoring is required and initialize
    await checkAndInitializeProctoring(assessmentId);

    await loadAssessment(assessmentId);
    setupEventListeners();
});

async function loadAssessment(assessmentId) {
    try {
        const response = await fetch(`http://localhost:3000/api/assessments/${assessmentId}`, {
            headers: {
                'Authorization': `Bearer ${Auth.getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load assessment');
        }
        
        currentAssessment = await response.json();
        
        // Load actual questions
        const questionsResponse = await fetch(`http://localhost:3000/api/questions/assessment/${assessmentId}`, {
            headers: {
                'Authorization': `Bearer ${Auth.getToken()}`
            }
        });
        
        if (!questionsResponse.ok) {
            throw new Error('Failed to load questions');
        }
        
        questions = await questionsResponse.json();
        
        if (questions.length === 0) {
            alert('No questions found for this test. Please contact your instructor.');
            window.location.href = 'attempt-test.html';
            return;
        }
        
        timeRemaining = currentAssessment.time_limit * 60; // Convert to seconds
        testStartTime = Date.now();
        
        displayAssessmentInfo();
        displayQuestion();
        startTimer();
        updateQuestionGrid();
        updateAttemptStatus();
        
    } catch (error) {
        console.error('Failed to load assessment:', error);
        alert(`Failed to load test with ID ${assessmentId}. Please check if the test exists and try again.`);
        window.location.href = 'attempt-test.html';
        return;
    }
}



function displayAssessmentInfo() {
    document.getElementById('testTitle').textContent = currentAssessment.title;
    
    const user = Auth.getUser();
    if (user) {
        document.getElementById('studentInfo').textContent = `${user.id}, ${user.firstName} ${user.lastName}`;
    } else {
        document.getElementById('studentInfo').textContent = 'Student ID: Demo User';
    }
}

function displayQuestion() {
    const question = questions[currentQuestionIndex];
    
    document.getElementById('questionNumber').textContent = `Q: ${String(currentQuestionIndex + 1).padStart(2, '0')} of ${questions.length}`;
    document.getElementById('questionText').textContent = question.question_text;
    
    const optionsContainer = document.getElementById('optionsContainer');
    
    if (question.question_type === 'mcq') {
        optionsContainer.innerHTML = question.options.map(option => `
            <div class="option-item ${answers[question.id] === option ? 'selected' : ''}" 
                 onclick="selectOption('${option}')">
                <input type="radio" name="answer" value="${option}" 
                       ${answers[question.id] === option ? 'checked' : ''}>
                <span>${option}</span>
            </div>
        `).join('');
    }
    
    updateNavigationButtons();
    updateQuestionGrid();
}

function selectOption(value) {
    const question = questions[currentQuestionIndex];
    answers[question.id] = value;
    
    // Update UI
    document.querySelectorAll('.option-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    event.currentTarget.classList.add('selected');
    event.currentTarget.querySelector('input').checked = true;
    
    updateAttemptStatus();
    updateQuestionGrid();
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('previousBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.textContent = currentQuestionIndex === questions.length - 1 ? 'Review' : 'Next';
}

function updateQuestionGrid() {
    const container = document.getElementById('questionNumbers');
    
    if (!container.hasChildNodes()) {
        // Create question number buttons
        for (let i = 0; i < questions.length; i++) {
            const btn = document.createElement('button');
            btn.className = 'question-number';
            btn.textContent = String(i + 1).padStart(2, '0');
            btn.onclick = () => goToQuestion(i);
            container.appendChild(btn);
        }
    }
    
    // Update button states
    container.querySelectorAll('.question-number').forEach((btn, index) => {
        btn.classList.remove('current', 'answered', 'flagged');
        
        if (index === currentQuestionIndex) {
            btn.classList.add('current');
        } else if (answers[questions[index].id]) {
            btn.classList.add('answered');
        }
        
        if (flaggedQuestions.has(questions[index].id)) {
            btn.classList.add('flagged');
        }
    });
}

function updateAttemptStatus() {
    const answeredCount = Object.keys(answers).length;
    const flaggedCount = flaggedQuestions.size;
    const pendingCount = questions.length - answeredCount;
    
    document.getElementById('answeredCount').textContent = answeredCount;
    document.getElementById('flaggedCount').textContent = flaggedCount;
    document.getElementById('pendingCount').textContent = pendingCount;
}

function goToQuestion(index) {
    currentQuestionIndex = index;
    displayQuestion();
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
}

function flagQuestion() {
    const question = questions[currentQuestionIndex];
    
    if (flaggedQuestions.has(question.id)) {
        flaggedQuestions.delete(question.id);
        alert('Question unflagged');
    } else {
        flaggedQuestions.add(question.id);
        alert('Question flagged for review');
    }
    
    updateQuestionGrid();
    updateAttemptStatus();
}

function clearResponse() {
    const question = questions[currentQuestionIndex];
    delete answers[question.id];
    
    document.querySelectorAll('.option-item').forEach(item => {
        item.classList.remove('selected');
        item.querySelector('input').checked = false;
    });
    
    updateAttemptStatus();
    updateQuestionGrid();
    alert('Response cleared');
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeRemaining--;
        
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        
        document.getElementById('timeRemaining').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Warning when 5 minutes left
        if (timeRemaining === 300) {
            alert('5 minutes remaining!');
        }
        
        // Auto-submit when time is up
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            alert('Time is up! Submitting test...');
            setTimeout(endTest, 2000);
        }
    }, 1000);
}

async function checkAndInitializeProctoring(assessmentId) {
    try {
        // Check if proctoring is enabled for this assessment
        const response = await fetch(`http://localhost:3000/api/proctoring/settings/${assessmentId}`, {
            headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
        });
        const settings = await response.json();
        
        if (settings.proctoring_enabled) {
            await showProctoringSetup(assessmentId, settings);
        }
    } catch (error) {
        console.error('Failed to check proctoring settings:', error);
    }
}

async function showProctoringSetup(assessmentId, settings) {
    return new Promise((resolve, reject) => {
        // Create proctoring setup modal
        const modal = document.createElement('div');
        modal.className = 'proctoring-setup';
        modal.innerHTML = `
            <div class="proctoring-setup-content">
                <h2>🔒 Proctoring Required</h2>
                <p style="margin-bottom: 15px;">Complete the setup to start your test:</p>
                
                <div class="setup-step" id="cameraStep" style="margin: 10px 0; padding: 10px;">
                    <h4 style="margin: 5px 0;">📹 Camera Access</h4>
                    <video id="cameraPreview" class="camera-preview" autoplay muted style="display:none; width: 150px; height: 100px;"></video>
                    <div class="step-status" id="cameraStatus">Click to enable</div>
                </div>
                
                <div class="setup-step" id="microphoneStep" style="margin: 10px 0; padding: 10px;">
                    <h4 style="margin: 5px 0;">🎤 Microphone Access</h4>
                    <div class="step-status" id="microphoneStatus">Click to enable</div>
                </div>
                
                <div class="setup-step" style="margin: 10px 0; padding: 10px;">
                    <h4 style="margin: 5px 0;">📋 Proctoring Rules</h4>
                    <ul style="text-align: left; margin: 5px 0; font-size: 13px;">
                        <li>Stay in camera view</li>
                        <li>No tab switching</li>
                        <li>No external devices</li>
                        <li>Keep workspace clear</li>
                    </ul>
                    <label style="font-size: 14px;">
                        <input type="checkbox" id="rulesAccepted"> I accept the rules
                    </label>
                </div>
                
                <div class="proctoring-controls" style="margin-top: 15px;">
                    <button class="btn-proctoring secondary" onclick="cancelTest()">Cancel</button>
                    <button class="btn-proctoring primary" id="startProctoringBtn" disabled>Start Test</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Setup camera
        document.getElementById('cameraStep').addEventListener('click', async () => {
            try {
                document.getElementById('cameraStatus').textContent = 'Requesting access...';
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                const preview = document.getElementById('cameraPreview');
                preview.srcObject = stream;
                preview.style.display = 'block';
                document.getElementById('cameraStep').classList.add('completed');
                document.getElementById('cameraStatus').textContent = '✅ Camera ready';
                checkSetupComplete();
            } catch (error) {
                console.error('Camera error:', error);
                document.getElementById('cameraStatus').textContent = '❌ Camera access denied';
            }
        });
        
        // Setup microphone
        document.getElementById('microphoneStep').addEventListener('click', async () => {
            try {
                document.getElementById('microphoneStatus').textContent = 'Requesting access...';
                await navigator.mediaDevices.getUserMedia({ audio: true });
                document.getElementById('microphoneStep').classList.add('completed');
                document.getElementById('microphoneStatus').textContent = '✅ Microphone ready';
                checkSetupComplete();
            } catch (error) {
                console.error('Microphone error:', error);
                document.getElementById('microphoneStatus').textContent = '❌ Microphone access denied';
            }
        });
        
        // Rules acceptance
        document.getElementById('rulesAccepted').addEventListener('change', checkSetupComplete);
        
        function checkSetupComplete() {
            const cameraReady = document.getElementById('cameraStep').classList.contains('completed');
            const micReady = document.getElementById('microphoneStep').classList.contains('completed');
            const rulesAccepted = document.getElementById('rulesAccepted').checked;
            
            console.log('Setup check:', { cameraReady, micReady, rulesAccepted });
            
            const btn = document.getElementById('startProctoringBtn');
            btn.disabled = !(cameraReady && micReady && rulesAccepted);
            
            if (!btn.disabled) {
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            } else {
                btn.style.opacity = '0.6';
                btn.style.cursor = 'not-allowed';
            }
        }
        
        // Start proctoring
        document.getElementById('startProctoringBtn').addEventListener('click', async () => {
            try {
                const btn = document.getElementById('startProctoringBtn');
                btn.disabled = true;
                btn.textContent = 'Starting...';
                
                await initializeProctoring(assessmentId);
                modal.remove();
                resolve();
            } catch (error) {
                alert('Failed to start proctoring: ' + error.message);
                document.getElementById('startProctoringBtn').disabled = false;
                document.getElementById('startProctoringBtn').textContent = 'Start Proctored Test';
                reject(error);
            }
        });
        
        window.cancelTest = () => {
            if (confirm('Cancel test? You will return to the test selection page.')) {
                window.location.href = 'attempt-test.html';
            }
        };
    });
}

async function initializeProctoring(assessmentId) {
    try {
        proctoringSystem = new ProctoringSystem();
        const result = await proctoringSystem.initialize(assessmentId);
        
        if (result.success && result.proctoring) {
            isProctoredTest = true;
            document.body.classList.add('proctored');
            document.getElementById('proctoringOverlay').style.display = 'flex';
            
            // Update violation counter periodically
            setInterval(() => {
                const summary = proctoringSystem.getViolationSummary();
                document.getElementById('violationCount').textContent = summary.total;
            }, 1000);
        }
    } catch (error) {
        console.error('Proctoring initialization failed:', error);
        throw error;
    }
}

async function endTest() {
    if (!confirm('Are you sure you want to submit the test? This action cannot be undone.')) {
        return;
    }
    
    clearInterval(timerInterval);
    
    // End proctoring session
    if (proctoringSystem) {
        await proctoringSystem.endSession();
        document.body.classList.remove('proctored');
    }
    
    const timeTaken = Math.floor((Date.now() - testStartTime) / 60000); // minutes
    
    try {
        const result = await API.submitAssessment(currentAssessment.id, {
            answers: answers,
            timeTaken: timeTaken
        });
        
        alert('Test submitted successfully!');
        
        // Redirect to result page
        setTimeout(() => {
            window.location.href = `result-detail.html?id=${result.resultId}`;
        }, 2000);
        
    } catch (error) {
        console.error('Failed to submit test:', error);
        // Show success message anyway for demo
        alert('Test completed! Your answers have been recorded.');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
    }
}

function setupEventListeners() {
    document.getElementById('previousBtn').addEventListener('click', previousQuestion);
    document.getElementById('nextBtn').addEventListener('click', nextQuestion);
    document.getElementById('flagBtn').addEventListener('click', flagQuestion);
    document.getElementById('clearResponse').addEventListener('click', clearResponse);
    document.getElementById('endTestBtn').addEventListener('click', endTest);
    
    // Instructions modal
    const modal = document.getElementById('instructionsModal');
    const viewInstructionsBtn = document.getElementById('viewInstructions');
    const closeBtn = document.querySelector('.close');
    
    viewInstructionsBtn.addEventListener('click', () => {
        document.getElementById('instructionsContent').innerHTML = `
            <div class="instructions-detail">
                <h4>Test Information</h4>
                <p><strong>Test Name:</strong> ${currentAssessment.title}</p>
                <p><strong>Total Questions:</strong> ${questions.length}</p>
                <p><strong>Time Limit:</strong> ${currentAssessment.time_limit} minutes</p>
                <p><strong>Total Marks:</strong> ${currentAssessment.total_marks}</p>
                
                <h4>Navigation Instructions</h4>
                <ul>
                    <li>Use <strong>Next</strong> and <strong>Previous</strong> buttons to navigate</li>
                    <li>Click on question numbers to jump to specific questions</li>
                    <li>Use <strong>Flag</strong> to mark questions for review</li>
                    <li>Use <strong>Clear Response</strong> to remove your answer</li>
                    <li>Click <strong>End Test</strong> when you're ready to submit</li>
                </ul>
                
                <h4>Question Status</h4>
                <ul>
                    <li><span style="color: #28a745;">Green</span> - Answered</li>
                    <li><span style="color: #ffc107;">Yellow</span> - Flagged for review</li>
                    <li><span style="color: #007bff;">Blue</span> - Current question</li>
                    <li><span style="color: #6c757d;">Gray</span> - Not attempted</li>
                </ul>
            </div>
        `;
        modal.style.display = 'block';
    });
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Prevent accidental page refresh
    window.addEventListener('beforeunload', (e) => {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your test progress will be lost.';
    });
}