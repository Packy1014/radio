const audio = document.getElementById('audioPlayer');
const playButton = document.getElementById('playButton');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const statusDiv = document.getElementById('status');
const timeDisplay = document.getElementById('timeDisplay');
const albumArt = document.getElementById('albumArt');
const trackArtist = document.getElementById('trackArtist');
const trackTitle = document.getElementById('trackTitle');
const trackAlbum = document.getElementById('trackAlbum');
const trackDescription = document.getElementById('trackDescription');
const trackDate = document.getElementById('trackDate');
const trackQuality = document.getElementById('trackQuality');
const thumbsUpBtn = document.getElementById('thumbsUpBtn');
const thumbsDownBtn = document.getElementById('thumbsDownBtn');
const thumbsUpCount = document.getElementById('thumbsUpCount');
const thumbsDownCount = document.getElementById('thumbsDownCount');
const recentlyPlayedContent = document.getElementById('recentlyPlayedContent');
const starRatingContainer = document.getElementById('starRating');
const streamUrl = 'https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8';
const metadataUrl = 'https://d3d4yli4hf5bmh.cloudfront.net/metadatav2.json';
const coverArtUrl = 'https://d3d4yli4hf5bmh.cloudfront.net/cover.jpg';

let isPlaying = false;
let hls = null;
let startTime = 0;
let metadataInterval = null;
let currentSongId = null;

// Set initial volume
audio.volume = 0.7;

// Format time as MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Update elapsed time
function updateTime() {
    if (isPlaying && !audio.paused) {
        const elapsed = Date.now() / 1000 - startTime;
        timeDisplay.textContent = formatTime(elapsed);
        requestAnimationFrame(updateTime);
    }
}

// Fetch and update metadata
async function fetchMetadata() {
    try {
        const response = await fetch(metadataUrl + '?t=' + Date.now());
        const data = await response.json();
        updateNowPlaying(data);
        updateRecentlyPlayed(data);
    } catch (error) {
        console.error('Error fetching metadata:', error);
    }
}

// Update Now Playing widget
function updateNowPlaying(data) {
    const cacheBuster = Date.now();
    const songId = `${data.artist || 'Unknown'}_${data.title || 'Unknown'}`;
    currentSongId = songId;

    // Update album art
    albumArt.src = `${coverArtUrl}?t=${cacheBuster}`;

    // Update track info
    trackArtist.textContent = data.artist || 'Unknown Artist';
    trackTitle.textContent = data.title || 'Unknown Track';
    trackAlbum.textContent = data.album || 'Album information unavailable';

    // Update description (could be album info or other metadata)
    if (data.album) {
        trackDescription.textContent = `From the album: ${data.album}`;
    } else {
        trackDescription.textContent = 'Crystal-clear audio quality, ad-free listening experience.';
    }

    // Update metadata
    trackDate.textContent = data.date || 'Unknown';
    if (data.bit_depth && data.sample_rate) {
        trackQuality.textContent = `${data.bit_depth}-bit / ${(data.sample_rate / 1000).toFixed(1)}kHz`;
    } else {
        trackQuality.textContent = '24-bit / 48kHz';
    }

    // Load existing ratings
    loadRatings(songId);
    loadStarRatings(songId);
}

// Update Recently Played widget
function updateRecentlyPlayed(data) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        const artist = data[`prev_artist_${i}`];
        const title = data[`prev_title_${i}`];
        if (artist && title) {
            html += `
                <div class="history-item">
                    <div class="history-track">${escapeHtml(title)}</div>
                    <div class="history-artist">${escapeHtml(artist)}</div>
                </div>
            `;
        }
    }
    recentlyPlayedContent.innerHTML = html || '<div class="loading-text">No history available</div>';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Get or create user ID
function getUserId() {
    let userId = localStorage.getItem('radioUserId');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('radioUserId', userId);
    }
    return userId;
}

// Load ratings for a song
async function loadRatings(songId) {
    try {
        const userId = getUserId();
        const response = await fetch(`/api/ratings/${encodeURIComponent(songId)}?userId=${encodeURIComponent(userId)}`);
        const data = await response.json();

        if (data.success) {
            // Update counts
            thumbsUpCount.textContent = data.data.thumbs_up;
            thumbsDownCount.textContent = data.data.thumbs_down;

            // Highlight user's rating
            thumbsUpBtn.classList.remove('active');
            thumbsDownBtn.classList.remove('active');

            if (data.data.userRating === 1) {
                thumbsUpBtn.classList.add('active');
            } else if (data.data.userRating === -1) {
                thumbsDownBtn.classList.add('active');
            }
        }
    } catch (error) {
        console.error('Error loading ratings:', error);
    }
}

// Submit rating
async function submitRatingRequest(songId, rating) {
    try {
        const userId = getUserId();
        const response = await fetch('/api/ratings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ songId, userId, rating })
        });

        const data = await response.json();

        if (data.success) {
            // Reload ratings to update counts and highlight
            loadRatings(songId);
        }
    } catch (error) {
        console.error('Error submitting rating:', error);
    }
}

// Load star ratings for a song
async function loadStarRatings(songId) {
    try {
        const userId = getUserId();
        const response = await fetch(`/api/star-ratings/${encodeURIComponent(songId)}?userId=${encodeURIComponent(userId)}`);
        const data = await response.json();

        if (data.success) {
            updateStarDisplay(data.data.userRating || 0);
        }
    } catch (error) {
        console.error('Error loading star ratings:', error);
    }
}

// Submit star rating
async function submitStarRating(songId, rating) {
    try {
        const userId = getUserId();
        const response = await fetch('/api/star-ratings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ songId, userId, rating })
        });

        const data = await response.json();

        if (data.success) {
            updateStarDisplay(rating);
        }
    } catch (error) {
        console.error('Error submitting star rating:', error);
    }
}

// Update star display based on rating
function updateStarDisplay(rating) {
    const stars = starRatingContainer.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.remove('empty');
        } else {
            star.classList.add('empty');
        }
    });
}

// Setup star rating listeners (called once on init)
function setupStarRatingListeners() {
    const stars = starRatingContainer.querySelectorAll('.star');

    // Hover effect - preview rating
    stars.forEach((star, index) => {
        star.addEventListener('mouseenter', function() {
            stars.forEach((s, i) => {
                if (i <= index) {
                    s.classList.remove('empty');
                } else {
                    s.classList.add('empty');
                }
            });
        });
    });

    // Reset on mouse leave
    starRatingContainer.addEventListener('mouseleave', function() {
        if (currentSongId) {
            // Reload current rating
            loadStarRatings(currentSongId);
        }
    });

    // Click to set rating
    stars.forEach((star, index) => {
        star.addEventListener('click', function() {
            if (currentSongId) {
                const rating = index + 1;
                submitStarRating(currentSongId, rating);
            }
        });
    });
}

// Setup rating button listeners (called once on init)
thumbsUpBtn.addEventListener('click', function() {
    if (currentSongId) {
        submitRatingRequest(currentSongId, 1);
    }
});

thumbsDownBtn.addEventListener('click', function() {
    if (currentSongId) {
        submitRatingRequest(currentSongId, -1);
    }
});

// Start metadata updates
function startMetadataUpdates() {
    fetchMetadata(); // Fetch immediately
    metadataInterval = setInterval(fetchMetadata, 10000); // Update every 10 seconds
}

// Stop metadata updates
function stopMetadataUpdates() {
    if (metadataInterval) {
        clearInterval(metadataInterval);
        metadataInterval = null;
    }
}

// Initialize HLS player
function initPlayer() {
    if (Hls.isSupported()) {
        hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
        });

        hls.loadSource(streamUrl);
        hls.attachMedia(audio);

        hls.on(Hls.Events.MANIFEST_PARSED, function() {
            console.log('HLS manifest loaded');
            updateStatus('ready', 'Ready to play');
        });

        hls.on(Hls.Events.ERROR, function(event, data) {
            console.error('HLS error:', data);
            if (data.fatal) {
                switch(data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        updateStatus('error', 'Network error - trying to recover');
                        hls.startLoad();
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        updateStatus('error', 'Media error - trying to recover');
                        hls.recoverMediaError();
                        break;
                    default:
                        updateStatus('error', 'Fatal error - cannot play stream');
                        destroyPlayer();
                        break;
                }
            }
        });
    } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        audio.src = streamUrl;
        updateStatus('ready', 'Ready to play');
    } else {
        updateStatus('error', 'HLS is not supported in this browser');
    }
}

function destroyPlayer() {
    if (hls) {
        hls.destroy();
        hls = null;
    }
}

function updateStatus(state, message) {
    statusDiv.className = `status ${state}`;
    // Make status messages more subtle
    const statusMessages = {
        'loading': 'Buffering...',
        'playing': 'Now streaming',
        'stopped': 'Paused',
        'ready': 'Ready',
        'error': 'Connection error'
    };
    statusDiv.textContent = statusMessages[state] || message;
}

// Play/Pause functionality
playButton.addEventListener('click', function() {
    if (!isPlaying) {
        updateStatus('loading', 'Loading');
        playButton.disabled = true;

        audio.play().then(() => {
            isPlaying = true;
            playButton.textContent = '⏸';
            playButton.disabled = false;
            updateStatus('playing', 'Now Playing');
            startTime = Date.now() / 1000;
            updateTime();
        }).catch(error => {
            console.error('Play error:', error);
            updateStatus('error', 'Failed to play - ' + error.message);
            playButton.disabled = false;
        });
    } else {
        audio.pause();
        isPlaying = false;
        playButton.textContent = '▶';
        updateStatus('stopped', 'Stopped');
    }
});

// Volume control
volumeSlider.addEventListener('input', function() {
    const volume = this.value;
    audio.volume = volume / 100;
    volumeValue.textContent = volume + '%';
});

// Audio event listeners
audio.addEventListener('waiting', function() {
    if (isPlaying) {
        updateStatus('loading', 'Buffering');
    }
});

audio.addEventListener('playing', function() {
    updateStatus('playing', 'Now Playing');
});

audio.addEventListener('pause', function() {
    if (!isPlaying) {
        updateStatus('stopped', 'Stopped');
    }
});

audio.addEventListener('ended', function() {
    isPlaying = false;
    playButton.textContent = '▶';
    updateStatus('stopped', 'Stopped');
    timeDisplay.textContent = '00:00';
});

audio.addEventListener('error', function(e) {
    console.error('Audio error:', e);
    updateStatus('error', 'Playback error');
    isPlaying = false;
    playButton.textContent = '▶';
    playButton.disabled = false;
    timeDisplay.textContent = '00:00';
});

// Initialize player on page load
initPlayer();
startMetadataUpdates();
setupStarRatingListeners();

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (isPlaying) {
        audio.pause();
    }
    destroyPlayer();
    stopMetadataUpdates();
});
