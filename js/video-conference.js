// Video Conference JavaScript
class VideoConference {
    constructor() {
        this.localStream = null;
        this.remoteStream = null;
        this.peerConnection = null;
        this.socket = null;
        this.roomId = null;
        this.isHost = false;
        this.participants = new Map();
        this.isCallActive = false;
        this.isMuted = false;
        this.isVideoOff = false;
        this.isScreenSharing = false;
        
        this.init();
    }

    init() {
        console.log('Video Conference initializing...');
        
        // Parse URL parameters
        this.parseUrlParams();
        
        // Update UI with room info
        this.updateRoomInfo();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start the conference
        this.startConference();
    }

    parseUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        this.roomId = urlParams.get('room') || 'default-room';
        this.isHost = urlParams.get('host') === 'true';
        
        console.log('Room ID:', this.roomId);
        console.log('Is Host:', this.isHost);
    }

    updateRoomInfo() {
        document.getElementById('roomId').textContent = `Room: ${this.roomId}`;
        
        // Set up share link
        const shareUrl = `${window.location.origin}/video-conference.html?room=${this.roomId}`;
        document.getElementById('shareLinkInput').value = shareUrl;
    }

    setupEventListeners() {
        // Control buttons
        document.getElementById('micBtn').addEventListener('click', () => this.toggleMicrophone());
        document.getElementById('cameraBtn').addEventListener('click', () => this.toggleCamera());
        document.getElementById('screenShareBtn').addEventListener('click', () => this.toggleScreenShare());
        document.getElementById('endCallBtn').addEventListener('click', () => this.endCall());
        
        // Share functionality
        document.getElementById('shareBtn').addEventListener('click', () => this.showShareModal());
        document.getElementById('copyLinkBtn').addEventListener('click', () => this.copyShareLink());
        document.getElementById('copyAndCloseBtn').addEventListener('click', () => {
            this.copyShareLink();
            this.hideShareModal();
        });
        document.getElementById('closeShareBtn').addEventListener('click', () => this.hideShareModal());
        
        // Local video controls
        document.getElementById('localMuteBtn').addEventListener('click', () => this.toggleMicrophone());
        document.getElementById('localVideoBtn').addEventListener('click', () => this.toggleCamera());
        
        // Close modal on outside click
        document.getElementById('shareModal').addEventListener('click', (e) => {
            if (e.target.id === 'shareModal') {
                this.hideShareModal();
            }
        });
    }

    async startConference() {
        try {
            console.log('Starting video conference...');
            
            // Initialize Socket.io connection
            this.initializeSocket();
            
            // Get user media
            await this.getUserMedia();
            
            // Set up WebRTC
            this.setupPeerConnection();
            
            // Hide loading overlay
            document.getElementById('loadingOverlay').style.display = 'none';
            
            // Update status
            this.updateStatus('Ready', true);
            
        } catch (error) {
            console.error('Error starting conference:', error);
            this.showError('Failed to start video conference: ' + error.message);
            this.updateStatus('Error', false);
        }
    }

    initializeSocket() {
        console.log('Connecting to signaling server...');
        
        this.socket = io('http://localhost:5000');
        
        this.socket.on('connect', () => {
            console.log('Connected to signaling server');
            this.socket.emit('join-room', this.roomId);
            this.updateStatus('Connected', true);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from signaling server');
            this.updateStatus('Disconnected', false);
        });

        this.socket.on('user-joined', (userId) => {
            console.log('User joined:', userId);
            this.onUserJoined(userId);
        });

        this.socket.on('user-left', (userId) => {
            console.log('User left:', userId);
            this.onUserLeft(userId);
        });

        this.socket.on('offer', async (offer) => {
            console.log('Received offer');
            await this.handleOffer(offer);
        });

        this.socket.on('answer', async (answer) => {
            console.log('Received answer');
            await this.handleAnswer(answer);
        });

        this.socket.on('ice-candidate', async (candidate) => {
            console.log('Received ICE candidate');
            await this.handleIceCandidate(candidate);
        });
    }

    async getUserMedia() {
        console.log('Getting user media...');
        
        try {
            const constraints = {
                video: {
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 },
                    frameRate: { ideal: 30, max: 60 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            };

            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Display local video
            document.getElementById('localVideo').srcObject = this.localStream;
            
            console.log('Local stream obtained');
            
        } catch (error) {
            console.error('Error accessing media devices:', error);
            throw new Error('Could not access camera/microphone. Please check permissions.');
        }
    }

    setupPeerConnection() {
        console.log('Setting up peer connection...');
        
        const configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        };

        this.peerConnection = new RTCPeerConnection(configuration);

        // Add local stream
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.localStream);
            });
        }

        // Handle remote stream
        this.peerConnection.ontrack = (event) => {
            console.log('Received remote stream');
            this.remoteStream = event.streams[0];
            document.getElementById('remoteVideo').srcObject = this.remoteStream;
            
            // Hide waiting message
            document.getElementById('waitingMessage').style.display = 'none';
            
            // Update participant info
            this.updateParticipantInfo('Participant', 'Connected');
        };

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('Sending ICE candidate');
                this.socket.emit('ice-candidate', {
                    roomId: this.roomId,
                    candidate: event.candidate
                });
            }
        };

        // Handle connection state
        this.peerConnection.onconnectionstatechange = () => {
            console.log('Connection state:', this.peerConnection.connectionState);
            
            switch (this.peerConnection.connectionState) {
                case 'connected':
                    this.isCallActive = true;
                    this.updateStatus('Connected', true);
                    this.updateParticipantCount(2);
                    break;
                case 'disconnected':
                case 'failed':
                    this.updateStatus('Disconnected', false);
                    this.updateParticipantCount(1);
                    break;
            }
        };
    }

    async onUserJoined(userId) {
        this.participants.set(userId, { id: userId, connected: true });
        this.updateParticipantCount(this.participants.size + 1);
        
        if (this.isHost) {
            // Host creates offer
            await this.createOffer();
        }
    }

    onUserLeft(userId) {
        this.participants.delete(userId);
        this.updateParticipantCount(this.participants.size + 1);
        
        // Show waiting message if no participants
        if (this.participants.size === 0) {
            document.getElementById('waitingMessage').style.display = 'block';
            document.getElementById('remoteVideo').srcObject = null;
        }
    }

    async createOffer() {
        console.log('Creating offer...');
        
        try {
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            
            this.socket.emit('offer', {
                roomId: this.roomId,
                offer: offer
            });
            
        } catch (error) {
            console.error('Error creating offer:', error);
        }
    }

    async handleOffer(offer) {
        console.log('Handling offer...');
        
        try {
            await this.peerConnection.setRemoteDescription(offer);
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            
            this.socket.emit('answer', {
                roomId: this.roomId,
                answer: answer
            });
            
        } catch (error) {
            console.error('Error handling offer:', error);
        }
    }

    async handleAnswer(answer) {
        console.log('Handling answer...');
        
        try {
            await this.peerConnection.setRemoteDescription(answer);
        } catch (error) {
            console.error('Error handling answer:', error);
        }
    }

    async handleIceCandidate(candidate) {
        console.log('Handling ICE candidate...');
        
        try {
            await this.peerConnection.addIceCandidate(candidate);
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    }

    toggleMicrophone() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                this.isMuted = !audioTrack.enabled;
                
                // Update UI
                this.updateMicrophoneUI();
                
                console.log('Microphone:', this.isMuted ? 'muted' : 'unmuted');
            }
        }
    }

    toggleCamera() {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                this.isVideoOff = !videoTrack.enabled;
                
                // Update UI
                this.updateCameraUI();
                
                console.log('Camera:', this.isVideoOff ? 'off' : 'on');
            }
        }
    }

    async toggleScreenShare() {
        try {
            if (!this.isScreenSharing) {
                // Start screen sharing
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true
                });
                
                // Replace video track
                const videoTrack = screenStream.getVideoTracks()[0];
                const sender = this.peerConnection.getSenders().find(s => 
                    s.track && s.track.kind === 'video'
                );
                
                if (sender) {
                    await sender.replaceTrack(videoTrack);
                }
                
                this.isScreenSharing = true;
                this.updateScreenShareUI();
                
                // Handle screen share end
                videoTrack.onended = () => {
                    this.stopScreenShare();
                };
                
            } else {
                this.stopScreenShare();
            }
        } catch (error) {
            console.error('Error toggling screen share:', error);
            this.showError('Failed to share screen: ' + error.message);
        }
    }

    async stopScreenShare() {
        try {
            // Get camera stream back
            const cameraStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });
            
            // Replace screen track with camera track
            const videoTrack = cameraStream.getVideoTracks()[0];
            const sender = this.peerConnection.getSenders().find(s => 
                s.track && s.track.kind === 'video'
            );
            
            if (sender) {
                await sender.replaceTrack(videoTrack);
            }
            
            // Update local video
            const localVideo = document.getElementById('localVideo');
            const newStream = new MediaStream([
                videoTrack,
                ...this.localStream.getAudioTracks()
            ]);
            localVideo.srcObject = newStream;
            this.localStream = newStream;
            
            this.isScreenSharing = false;
            this.updateScreenShareUI();
            
        } catch (error) {
            console.error('Error stopping screen share:', error);
        }
    }

    endCall() {
        console.log('Ending call...');
        
        // Stop all tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }

        // Close peer connection
        if (this.peerConnection) {
            this.peerConnection.close();
        }

        // Disconnect socket
        if (this.socket) {
            this.socket.disconnect();
        }

        // Close window
        window.close();
    }

    showShareModal() {
        document.getElementById('shareModal').style.display = 'flex';
    }

    hideShareModal() {
        document.getElementById('shareModal').style.display = 'none';
    }

    copyShareLink() {
        const linkInput = document.getElementById('shareLinkInput');
        linkInput.select();
        linkInput.setSelectionRange(0, 99999);
        
        try {
            document.execCommand('copy');
            this.showSuccess('Meeting link copied to clipboard!');
            
            // Update button temporarily
            const copyBtn = document.getElementById('copyLinkBtn');
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
            }, 2000);
            
        } catch (error) {
            console.error('Failed to copy link:', error);
            this.showError('Failed to copy link. Please copy manually.');
        }
    }

    updateMicrophoneUI() {
        const micBtn = document.getElementById('micBtn');
        const localMuteBtn = document.getElementById('localMuteBtn');
        const localVideoStatus = document.getElementById('localVideoStatus');
        
        if (this.isMuted) {
            micBtn.classList.add('muted');
            localMuteBtn.classList.add('muted');
            micBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
            localMuteBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
            localVideoStatus.textContent = 'Camera: On, Mic: Muted';
        } else {
            micBtn.classList.remove('muted');
            localMuteBtn.classList.remove('muted');
            micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            localMuteBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            localVideoStatus.textContent = 'Camera: On, Mic: On';
        }
    }

    updateCameraUI() {
        const cameraBtn = document.getElementById('cameraBtn');
        const localVideoBtn = document.getElementById('localVideoBtn');
        const localVideoStatus = document.getElementById('localVideoStatus');
        
        if (this.isVideoOff) {
            cameraBtn.classList.add('muted');
            localVideoBtn.classList.add('muted');
            cameraBtn.innerHTML = '<i class="fas fa-video-slash"></i>';
            localVideoBtn.innerHTML = '<i class="fas fa-video-slash"></i>';
            localVideoStatus.textContent = 'Camera: Off, Mic: ' + (this.isMuted ? 'Muted' : 'On');
        } else {
            cameraBtn.classList.remove('muted');
            localVideoBtn.classList.remove('muted');
            cameraBtn.innerHTML = '<i class="fas fa-video"></i>';
            localVideoBtn.innerHTML = '<i class="fas fa-video"></i>';
            localVideoStatus.textContent = 'Camera: On, Mic: ' + (this.isMuted ? 'Muted' : 'On');
        }
    }

    updateScreenShareUI() {
        const screenShareBtn = document.getElementById('screenShareBtn');
        
        if (this.isScreenSharing) {
            screenShareBtn.classList.add('active');
            screenShareBtn.innerHTML = '<i class="fas fa-stop"></i>';
            screenShareBtn.title = 'Stop Screen Share';
        } else {
            screenShareBtn.classList.remove('active');
            screenShareBtn.innerHTML = '<i class="fas fa-desktop"></i>';
            screenShareBtn.title = 'Screen Share';
        }
    }

    updateStatus(text, connected) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        
        statusText.textContent = text;
        
        if (connected) {
            statusDot.classList.add('connected');
        } else {
            statusDot.classList.remove('connected');
        }
    }

    updateParticipantCount(count) {
        document.getElementById('participantNumber').textContent = count;
    }

    updateParticipantInfo(name, status) {
        document.getElementById('remoteVideoLabel').textContent = name;
        document.getElementById('remoteVideoStatus').textContent = status;
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Video Conference...');
    window.videoConference = new VideoConference();
});
