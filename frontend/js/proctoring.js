class ProctoringSystem {
    constructor() {
        this.session = null;
        this.settings = null;
        this.mediaStream = null;
        this.mediaRecorder = null;
        this.violations = [];
        this.isActive = false;
        this.faceDetectionInterval = null;
        this.tabSwitchCount = 0;
        this.lastActiveTime = Date.now();
        this.faceDetector = new FaceDetection();
        this.videoElement = null;
        this.noFaceCount = 0;
        this.multipleFaceCount = 0;
        this.lastViolationTime = {}; // Track last violation time by type
        this.violationCooldown = 30000; // 30 seconds cooldown
    }

    async initialize(assessmentId) {
        try {
            this.settings = await this.getSettings(assessmentId);
            
            if (!this.settings.proctoring_enabled) {
                return { success: true, proctoring: false };
            }

            await this.requestPermissions();
            await this.startSession(assessmentId);
            this.setupSecurityMeasures();
            this.startMonitoring();
            
            return { success: true, proctoring: true, session: this.session };
        } catch (error) {
            console.error('Proctoring initialization failed:', error);
            return { success: false, error: error.message };
        }
    }

    async getSettings(assessmentId) {
        const response = await fetch(`http://${window.location.hostname}:3000/api/proctoring/settings/${assessmentId}`, {
            headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
        });
        return await response.json();
    }

    async requestPermissions() {
        if (this.settings.camera_required || this.settings.microphone_required) {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                video: this.settings.camera_required,
                audio: this.settings.microphone_required
            });
            
            // Monitor camera stream events
            if (this.mediaStream) {
                this.mediaStream.getVideoTracks().forEach(track => {
                    track.addEventListener('ended', () => {
                        this.logViolation('camera_disconnected', 'critical', 'Camera was disconnected or closed');
                    });
                    
                    track.addEventListener('mute', () => {
                        this.logViolation('camera_muted', 'high', 'Camera was muted or disabled');
                    });
                });
                
                this.mediaStream.getAudioTracks().forEach(track => {
                    track.addEventListener('ended', () => {
                        this.logViolation('microphone_disconnected', 'medium', 'Microphone was disconnected');
                    });
                });
            }
        }
    }

    async startSession(assessmentId) {
        const response = await fetch(`http://${window.location.hostname}:3000/api/proctoring/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.getToken()}`
            },
            body: JSON.stringify({ assessmentId })
        });
        
        const data = await response.json();
        this.session = data.session;
        this.isActive = true;
    }

    setupSecurityMeasures() {
        if (this.settings.fullscreen_required) {
            this.enterFullscreen();
        }

        if (this.settings.right_click_disabled) {
            document.addEventListener('contextmenu', e => e.preventDefault());
        }

        if (this.settings.copy_paste_prevention) {
            document.addEventListener('keydown', this.handleKeyDown.bind(this));
        }

        if (this.settings.tab_switching_detection) {
            document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
            window.addEventListener('blur', this.handleWindowBlur.bind(this));
        }

        // Prevent developer tools
        document.addEventListener('keydown', e => {
            if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
                e.preventDefault();
                this.logViolation('dev_tools_attempt', 'high', 'Attempted to open developer tools');
            }
        });
    }

    handleKeyDown(e) {
        // Prevent copy/paste
        if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
            e.preventDefault();
            this.logViolation('copy_paste_attempt', 'medium', `Attempted ${e.key === 'c' ? 'copy' : e.key === 'v' ? 'paste' : 'cut'}`);
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            this.tabSwitchCount++;
            this.logViolation('tab_switch', 'high', `Tab switched (count: ${this.tabSwitchCount})`);
        }
    }

    handleWindowBlur() {
        this.logViolation('window_blur', 'medium', 'Window lost focus');
    }

    enterFullscreen() {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        }
        
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                this.logViolation('fullscreen_exit', 'high', 'Exited fullscreen mode');
            }
        });
    }

    startMonitoring() {
        if (this.settings.face_detection && this.mediaStream) {
            this.startFaceDetection();
        }

        // Activity monitoring
        setInterval(() => {
            if (Date.now() - this.lastActiveTime > 30000) { // 30 seconds inactive
                this.logViolation('inactivity', 'low', 'Extended inactivity detected');
            }
        }, 30000);

        // Update last active time on user interaction
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => {
                this.lastActiveTime = Date.now();
            }, true);
        });
    }

    startFaceDetection() {
        // Create hidden video element for analysis
        this.videoElement = document.createElement('video');
        this.videoElement.srcObject = this.mediaStream;
        this.videoElement.autoplay = true;
        this.videoElement.muted = true;
        this.videoElement.style.display = 'none';
        document.body.appendChild(this.videoElement);
        
        this.faceDetectionInterval = setInterval(async () => {
            if (this.mediaStream && this.videoElement.readyState === 4) {
                this.checkCameraStatus();
                await this.performFaceAnalysis();
            }
        }, 5000); // Reduced frequency to 5 seconds
    }

    async performFaceAnalysis() {
        try {
            const analysis = await this.faceDetector.detectFaces(this.videoElement);
            
            // Check for face presence - only log after consistent absence
            if (!analysis.facePresent) {
                this.noFaceCount++;
                if (this.noFaceCount >= 6) { // 30 seconds without face
                    this.logViolation('no_face_detected', 'high', 'Student face not visible in camera');
                    this.noFaceCount = 0;
                }
            } else {
                this.noFaceCount = 0;
            }
            
            // Check for multiple faces - only log after consistent detection
            if (analysis.multipleFaces && analysis.faceCount > 1) {
                this.multipleFaceCount++;
                console.log(`Multiple faces detected: ${analysis.faceCount}, count: ${this.multipleFaceCount}`);
                if (this.multipleFaceCount >= 2) { // 10 seconds with multiple faces
                    this.logViolation('multiple_persons', 'critical', `Multiple persons detected (${analysis.faceCount} faces)`);
                    this.multipleFaceCount = 0;
                }
            } else {
                this.multipleFaceCount = Math.max(0, this.multipleFaceCount - 1); // Gradual decrease
            }
            
        } catch (error) {
            console.error('Face analysis error:', error);
        }
    }

    checkCameraStatus() {
        const videoTracks = this.mediaStream.getVideoTracks();
        if (videoTracks.length === 0 || !videoTracks[0].enabled) {
            this.logViolation('camera_disabled', 'critical', 'Camera was disabled or disconnected');
            return;
        }
        
        // Check if camera stream is active
        if (videoTracks[0].readyState !== 'live') {
            this.logViolation('camera_inactive', 'critical', 'Camera stream is not active');
        }
    }



    async logViolation(type, severity, description, metadata = {}) {
        if (!this.isActive) return;

        // Check cooldown to prevent spam
        const now = Date.now();
        if (this.lastViolationTime[type] && (now - this.lastViolationTime[type]) < this.violationCooldown) {
            return; // Skip if within cooldown period
        }

        this.lastViolationTime[type] = now;

        const violation = {
            sessionId: this.session.id,
            violationType: type,
            severity,
            description,
            metadata: {
                ...metadata,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            }
        };

        this.violations.push(violation);

        try {
            await fetch(`http://${window.location.hostname}:3000/api/proctoring/violation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getToken()}`
                },
                body: JSON.stringify(violation)
            });

            // Show warning to student
            this.showViolationWarning(description, severity);

            // Auto-submit if threshold reached
            if (this.violations.length >= this.settings.violation_threshold && this.settings.auto_submit_on_violation) {
                this.forceSubmitTest();
            }
        } catch (error) {
            console.error('Failed to log violation:', error);
        }
    }

    showViolationWarning(message, severity) {
        const warning = document.createElement('div');
        warning.className = `proctoring-warning ${severity}`;
        warning.innerHTML = `
            <div class="warning-content">
                <strong>⚠️ Proctoring Alert</strong>
                <p>${message}</p>
                <small>Violation logged. Total violations: ${this.violations.length}</small>
            </div>
        `;
        
        document.body.appendChild(warning);
        
        setTimeout(() => {
            warning.remove();
        }, 5000);
    }

    forceSubmitTest() {
        alert('Too many violations detected. Test will be submitted automatically.');
        if (window.endTest) {
            window.endTest();
        }
    }

    async endSession() {
        if (!this.isActive) return;

        this.isActive = false;
        
        if (this.faceDetectionInterval) {
            clearInterval(this.faceDetectionInterval);
        }

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }

        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        try {
            await fetch(`http://${window.location.hostname}:3000/api/proctoring/end`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getToken()}`
                },
                body: JSON.stringify({ sessionId: this.session.id })
            });
        } catch (error) {
            console.error('Failed to end proctoring session:', error);
        }
    }

    getViolationSummary() {
        return {
            total: this.violations.length,
            byType: this.violations.reduce((acc, v) => {
                acc[v.violationType] = (acc[v.violationType] || 0) + 1;
                return acc;
            }, {}),
            bySeverity: this.violations.reduce((acc, v) => {
                acc[v.severity] = (acc[v.severity] || 0) + 1;
                return acc;
            }, {})
        };
    }
}

// Global proctoring instance
window.ProctoringSystem = ProctoringSystem;