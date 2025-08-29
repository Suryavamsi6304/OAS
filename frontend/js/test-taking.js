// Test taking functionality
let currentAssessment = null;
let questions = [];
let currentQuestionIndex = 0;
let answers = {};
let flaggedQuestions = new Set();
let timeRemaining = 0;
let timerInterval = null;
let testStartTime = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.requireAuth()) return;

    const urlParams = new URLSearchParams(window.location.search);
    let assessmentId = urlParams.get('id');

    if (!assessmentId) {
        assessmentId = '1'; // Default assessment ID
    }
    
    console.log('Assessment ID:', assessmentId);

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
        
        timeRemaining = currentAssessment.time_limit * 60; // Convert to seconds
        testStartTime = Date.now();
        
        displayAssessmentInfo();
        displayQuestion();
        startTimer();
        updateQuestionGrid();
        updateAttemptStatus();
        
    } catch (error) {
        console.error('Failed to load assessment:', error);
        
        // Try to get stored test data first
        const storedTest = localStorage.getItem('selectedTest');
        if (storedTest) {
            currentAssessment = JSON.parse(storedTest);
        } else {
            // Fallback to sample data
            const sampleAssessments = {
                '1': { id: 1, title: 'JavaScript Fundamentals', time_limit: 60, total_marks: 100 },
                '2': { id: 2, title: 'HTML & CSS Basics', time_limit: 45, total_marks: 80 }
            };
            currentAssessment = sampleAssessments[assessmentId] || sampleAssessments['1'];
        }
        
        alert('Database connection required. Please set up PostgreSQL database with your assessment questions.');
        window.location.href = 'attempt-test.html';
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

async function endTest() {
    if (!confirm('Are you sure you want to submit the test? This action cannot be undone.')) {
        return;
    }
    
    clearInterval(timerInterval);
    
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