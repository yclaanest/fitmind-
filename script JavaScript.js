// script.js - Main JavaScript file for FitMind AI

// DOM Elements
const navLinks = document.querySelectorAll('.nav-link');
const mainContents = document.querySelectorAll('.main-content');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mainNav = document.getElementById('mainNav');
const startBtn = document.getElementById('startBtn');
const tryGamesBtn = document.getElementById('tryGamesBtn');
const analyzeMoodBtn = document.getElementById('analyzeMoodBtn');
const moodText = document.getElementById('moodText');
const analysisResult = document.getElementById('analysisResult');
const analysisContent = document.getElementById('analysisContent');
const emojiOptions = document.querySelectorAll('.emoji-option');
const chatInput = document.getElementById('chatInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const chatMessages = document.getElementById('chatMessages');
const habitInput = document.getElementById('habitInput');
const addHabitBtn = document.getElementById('addHabitBtn');
const habitList = document.getElementById('habitList');
const playMusicBtn = document.getElementById('playMusicBtn');
const musicProgress = document.getElementById('musicProgress');
const logoutBtn = document.getElementById('logoutBtn');
const gameButtons = document.querySelectorAll('[data-game]');

// State variables
let selectedEmoji = null;
let selectedMood = null;
let isMusicPlaying = false;
let musicProgressInterval;
let currentProgress = 0;
let habits = [
    { id: 1, text: "Meditasi pagi 10 menit", completed: true },
    { id: 2, text: "Minum 8 gelas air", completed: true },
    { id: 3, text: "Olahraga 30 menit", completed: false },
    { id: 4, text: "Membaca buku 20 menit", completed: false }
];

// Game state variables
let breathingSessions = 0;
let breathingDuration = 0;
let breathingInterval;
let breathingPhase = 0; // 0: idle, 1: inhale, 2: hold, 3: exhale
let breathingCount = 4;

let memoryCards = [];
let memoryFlippedCards = [];
let memoryMatchedPairs = 0;
let memoryScore = 0;
let memoryAttempts = 0;
let memoryGameActive = false;

let focusScore = 0;
let focusLevel = 1;
let focusTimer = 30;
let focusGameActive = false;
let focusInterval;
let targetInterval;

// Chart instances
let moodChartInstance = null;
let habitChartInstance = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Load saved data from localStorage
    loadUserData();
    
    // Initialize navigation
    initNavigation();
    
    // Initialize mood tracker
    initMoodTracker();
    
    // Initialize chat
    initChat();
    
    // Initialize habit planner
    initHabitPlanner();
    
    // Initialize games
    initGames();
    
    // Initialize music player
    initMusicPlayer();
    
    // Initialize event listeners
    initEventListeners();
    
    // Show welcome message
    showWelcomeMessage();
});

// Load user data from localStorage
function loadUserData() {
    try {
        const savedHabits = localStorage.getItem('fitmind_habits');
        if (savedHabits) {
            habits = JSON.parse(savedHabits);
        }
        
        const savedBreathing = localStorage.getItem('fitmind_breathing_sessions');
        if (savedBreathing) {
            breathingSessions = parseInt(savedBreathing) || 0;
        }
        
        const savedMemory = localStorage.getItem('fitmind_memory_score');
        if (savedMemory) {
            memoryScore = parseInt(savedMemory) || 0;
        }
        
        const savedFocus = localStorage.getItem('fitmind_focus_score');
        if (savedFocus) {
            focusScore = parseInt(savedFocus) || 0;
        }
        
        console.log('User data loaded successfully');
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Save user data to localStorage
function saveUserData() {
    try {
        localStorage.setItem('fitmind_habits', JSON.stringify(habits));
        localStorage.setItem('fitmind_breathing_sessions', breathingSessions.toString());
        localStorage.setItem('fitmind_memory_score', memoryScore.toString());
        localStorage.setItem('fitmind_focus_score', focusScore.toString());
        console.log('User data saved successfully');
    } catch (error) {
        console.error('Error saving user data:', error);
    }
}

// Initialize navigation
function initNavigation() {
    // Navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            
            // Update active nav link
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            link.classList.add('active');
            
            // Show selected page
            mainContents.forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(page).classList.add('active');
            
            // Close mobile menu if open
            if (window.innerWidth <= 768) {
                mainNav.classList.remove('active');
            }
            
            // Special actions for specific pages
            handlePageChange(page);
        });
    });
    
    // Mobile menu toggle
    mobileMenuBtn.addEventListener('click', () => {
        mainNav.classList.toggle('active');
    });
    
    // Start button - go to mood tracker
    startBtn.addEventListener('click', () => {
        document.querySelector('[data-page="mood"]').click();
    });
    
    // Try games button
    tryGamesBtn.addEventListener('click', () => {
        document.querySelector('[data-page="games"]').click();
    });
    
    // Logout button
    logoutBtn.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin keluar?')) {
            // Clear user data (optional)
            // localStorage.clear();
            alert('Anda telah keluar. Halaman akan dimuat ulang.');
            window.location.reload();
        }
    });
}

// Handle page change events
function handlePageChange(page) {
    switch(page) {
        case 'dashboard':
            setTimeout(updateCharts, 100);
            updateGameStatsDashboard();
            break;
        case 'games':
            setTimeout(initGames, 100);
            break;
        case 'mood':
            if (selectedMood) {
                updateVideoRecommendation(selectedMood);
            }
            break;
    }
}

// Initialize mood tracker
function initMoodTracker() {
    // Emoji selection for mood tracker
    emojiOptions.forEach(emoji => {
        emoji.addEventListener('click', () => {
            // Remove selected class from all emojis
            emojiOptions.forEach(e => e.classList.remove('selected'));
            
            // Add selected class to clicked emoji
            emoji.classList.add('selected');
            
            // Store selected emoji and mood
            selectedEmoji = emoji.getAttribute('data-emoji');
            selectedMood = emoji.getAttribute('data-mood');
            
            // Update mood text placeholder with selected emoji
            moodText.placeholder = `${selectedEmoji} Tuliskan perasaan Anda hari ini...`;
        });
    });
    
    // Analyze mood button
    analyzeMoodBtn.addEventListener('click', analyzeMood);
    
    // Allow Enter key in mood textarea (but not submit)
    moodText.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            analyzeMood();
        }
    });
}

// Analyze mood function
function analyzeMood() {
    const moodTextValue = moodText.value.trim();
    
    if (!moodTextValue && !selectedEmoji) {
        alert("Silakan tulis perasaan Anda atau pilih emoji terlebih dahulu.");
        return;
    }
    
    // Show analysis result
    analysisResult.style.display = 'block';
    
    // Determine mood based on text or selected emoji
    let detectedMood = selectedMood || 'neutral';
    let moodDescription = '';
    let recommendations = '';
    
    // Simple sentiment analysis based on keywords (in a real app, this would be done by AI)
    const text = moodTextValue.toLowerCase();
    
    if (text.includes('senang') || text.includes('bahagia') || text.includes('baik') || text.includes('positif')) {
        detectedMood = 'happy';
        moodDescription = 'Analisis AI mendeteksi suasana hati positif. Bagus!';
        recommendations = 'Pertahankan energi positif ini dengan berbagi kebahagiaan kepada orang lain atau melanjutkan aktivitas yang membuat Anda senang.';
    } else if (text.includes('sedih') || text.includes('kecewa') || text.includes('buruk') || text.includes('lemah')) {
        detectedMood = 'sad';
        moodDescription = 'Analisis AI mendeteksi suasana hati sedang menurun. Tidak apa-apa merasa sedih, itu manusiawi.';
        recommendations = 'Cobalah mendengarkan musik yang menenangkan, hubungi teman untuk berbicara, atau lakukan aktivitas yang biasanya membuat Anda merasa lebih baik.';
    } else if (text.includes('cemas') || text.includes('khawatir') || text.includes('stres') || text.includes('tekanan')) {
        detectedMood = 'anxious';
        moodDescription = 'Analisis AI mendeteksi tingkat kecemasan yang meningkat. Mari kita coba tenangkan pikiran.';
        recommendations = 'Coba teknik pernapasan 4-7-8: tarik napas 4 detik, tahan 7 detik, buang napas 8 detik. Ulangi 4 kali.';
    } else if (text.includes('lelah') || text.includes('capek') || text.includes('penat') || text.includes('lesu')) {
        detectedMood = 'tired';
        moodDescription = 'Analisis AI mendeteksi tingkat energi yang rendah. Tubuh Anda mungkin butuh istirahat.';
        recommendations = 'Pertimbangkan untuk tidur lebih awal hari ini, kurangi kafein, dan luangkan waktu untuk relaksasi.';
    } else {
        moodDescription = 'Analisis AI mendeteksi suasana hati yang netral.';
        recommendations = 'Coba lakukan sesuatu yang baru hari ini untuk menambah semangat!';
    }
    
    // Update analysis content
    analysisContent.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
            <div style="font-size: 2.5rem;">${selectedEmoji || '😐'}</div>
            <div>
                <h4 style="color: var(--primary-dark);">Suasana Hati: ${getMoodLabel(detectedMood)}</h4>
                <p>${moodDescription}</p>
            </div>
        </div>
        <div style="background-color: white; padding: 1rem; border-radius: 8px;">
            <h5 style="color: var(--primary-dark); margin-bottom: 0.5rem;">Rekomendasi AI:</h5>
            <p>${recommendations}</p>
        </div>
    `;
    
    // Save mood to localStorage (simulating database storage)
    saveMoodToHistory(detectedMood, moodTextValue);
    
    // Show breathing exercise suggestion if anxious
    if (detectedMood === 'anxious') {
        setTimeout(() => {
            if (confirm("Berdasarkan mood Anda, apakah Anda ingin mencoba latihan pernapasan untuk mengurangi kecemasan?")) {
                document.querySelector('[data-page="games"]').click();
            }
        }, 1000);
    }
}

// Function to get mood label in Indonesian
function getMoodLabel(mood) {
    switch(mood) {
        case 'happy': return 'Bahagia';
        case 'sad': return 'Sedih';
        case 'anxious': return 'Cemas';
        case 'tired': return 'Lelah';
        case 'angry': return 'Marah';
        default: return 'Netral';
    }
}

// Function to update video recommendation based on mood
function updateVideoRecommendation(mood) {
    let videoTitle = "Teknik Pernapasan 4-7-8";
    
    if (mood === 'sad') {
        videoTitle = "Membangun Resilience dan Optimisme";
    } else if (mood === 'anxious') {
        videoTitle = "Meditasi untuk Meredakan Kecemasan";
    } else if (mood === 'tired') {
        videoTitle = "Energizing Morning Routine";
    } else if (mood === 'happy') {
        videoTitle = "Mempertahankan Energi Positif";
    }
    
    return videoTitle;
}

// Function to save mood to history
function saveMoodToHistory(mood, text) {
    try {
        const moodHistory = JSON.parse(localStorage.getItem('fitmind_mood_history') || '[]');
        const moodEntry = {
            mood: mood,
            text: text,
            date: new Date().toISOString(),
            timestamp: Date.now()
        };
        
        moodHistory.push(moodEntry);
        
        // Keep only last 30 entries
        if (moodHistory.length > 30) {
            moodHistory.splice(0, moodHistory.length - 30);
        }
        
        localStorage.setItem('fitmind_mood_history', JSON.stringify(moodHistory));
        console.log("Mood saved to history:", moodEntry);
    } catch (error) {
        console.error('Error saving mood history:', error);
    }
}

// Initialize chat
function initChat() {
    sendMessageBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Add initial AI message
    addMessageToChat("Halo! Saya FitMind AI, asisten kesehatan mental Anda. Bagaimana perasaan Anda hari ini? Saya di sini untuk mendengarkan dan memberikan dukungan.", 'ai');
}

// Send message function
function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    chatInput.value = '';
    
    // Show typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message ai-message';
    typingIndicator.id = 'typingIndicator';
    typingIndicator.innerHTML = '<i>AI sedang mengetik...</i>';
    chatMessages.appendChild(typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Simulate AI response after delay
    setTimeout(() => {
        // Remove typing indicator
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.remove();
        
        const aiResponse = generateAIResponse(message);
        addMessageToChat(aiResponse, 'ai');
    }, 1500 + Math.random() * 1000);
}

// Add message to chat
function addMessageToChat(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.textContent = message;
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Generate AI response
function generateAIResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Simple response logic (in a real app, this would use AI API)
    if (lowerMessage.includes('stres') || lowerMessage.includes('tekanan')) {
        return "Saya mengerti bahwa Anda merasa stres. Cobalah untuk mengambil napas dalam-dalam. Apakah ada satu hal kecil yang bisa Anda kendalikan saat ini? Fokus pada hal itu bisa membantu mengurangi perasaan terbebani.";
    } else if (lowerMessage.includes('cemas') || lowerMessage.includes('khawatir')) {
        return "Kecemasan tentang masa depan itu wajar. Coba tanyakan pada diri sendiri: 'Apa hal terburuk yang mungkin terjadi, dan seberapa besar kemungkinannya?' Seringkali, ketakutan kita lebih besar dari kenyataan.";
    } else if (lowerMessage.includes('tidur') || lowerMessage.includes('insomnia')) {
        return "Sulit tidur bisa sangat melelahkan. Coba buat rutinitas sebelum tidur: matikan layar 1 jam sebelumnya, baca buku, atau coba meditasi singkat. Apakah Anda sudah mencoba teknik pernapasan 4-7-8?";
    } else if (lowerMessage.includes('fokus') || lowerMessage.includes('konsentrasi')) {
        return "Sulit fokus adalah masalah umum. Coba teknik Pomodoro: kerja fokus 25 menit, istirahat 5 menit. Juga, pastikan Anda cukup minum air dan istirahat mata dari layar secara berkala.";
    } else if (lowerMessage.includes('kesepian') || lowerMessage.includes('sendiri')) {
        return "Perasaan kesepian itu wajar. Coba hubungi teman atau keluarga, atau ikut komunitas dengan minat yang sama. Bahkan interaksi kecil bisa membuat perbedaan.";
    } else if (lowerMessage.includes('terima kasih') || lowerMessage.includes('thanks')) {
        return "Sama-sama! Saya senang bisa membantu. Jangan ragu untuk berbicara kapan saja Anda butuh.";
    } else {
        const responses = [
            "Terima kasih telah berbagi perasaan Anda. Bagaimana perasaan Anda setelah mengungkapkannya?",
            "Saya mendengarkan. Apakah ada hal spesifik yang membuat Anda merasa seperti itu?",
            "Terima kasih sudah membuka diri. Ingat, tidak apa-apa merasakan emosi apapun yang Anda rasakan saat ini.",
            "Saya di sini untuk mendukung Anda. Apa yang menurut Anda bisa membantu Anda merasa sedikit lebih baik sekarang?",
            "Emosi yang Anda rasakan valid. Mari kita cari cara untuk mengelolanya bersama.",
            "Saya mengerti. Kadang kita semua merasa seperti itu. Bagaimana biasanya Anda mengatasi perasaan seperti ini?",
            "Terima kasih sudah mempercayai saya. Mari kita coba pahami perasaan Anda lebih dalam."
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
}

// Initialize habit planner
function initHabitPlanner() {
    renderHabits();
    
    // Add habit button
    addHabitBtn.addEventListener('click', () => {
        const text = habitInput.value.trim();
        const priority = document.getElementById('habitPriority').value;
        
        if (!text) {
            alert("Silakan masukkan kebiasaan yang ingin ditambahkan.");
            return;
        }
        
        const newHabit = {
            id: habits.length > 0 ? Math.max(...habits.map(h => h.id)) + 1 : 1,
            text: text,
            completed: false,
            priority: priority,
            createdAt: new Date().toISOString()
        };
        
        habits.push(newHabit);
        renderHabits();
        habitInput.value = '';
        
        // Save to localStorage
        saveUserData();
    });
    
    // Allow Enter key to add habit
    habitInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addHabitBtn.click();
        }
    });
}

// Render habits
function renderHabits() {
    habitList.innerHTML = '';
    
    if (habits.length === 0) {
        habitList.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 2rem;">Belum ada kebiasaan. Tambahkan kebiasaan pertama Anda!</p>';
        return;
    }
    
    // Sort habits: completed last, then by priority
    const sortedHabits = [...habits].sort((a, b) => {
        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;
        
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    sortedHabits.forEach(habit => {
        const habitItem = document.createElement('div');
        habitItem.className = 'habit-item';
        habitItem.innerHTML = `
            <div class="habit-info">
                <input type="checkbox" class="habit-checkbox" ${habit.completed ? 'checked' : ''} data-id="${habit.id}">
                <span class="${habit.completed ? 'habit-completed' : ''}">${habit.text}</span>
                <span class="habit-priority" style="font-size: 0.8rem; padding: 0.2rem 0.5rem; border-radius: 4px; background-color: ${getPriorityColor(habit.priority)}; color: white;">
                    ${habit.priority === 'high' ? 'Tinggi' : habit.priority === 'medium' ? 'Menengah' : 'Rendah'}
                </span>
            </div>
            <button class="btn" style="background-color: transparent; color: var(--danger); padding: 0.3rem 0.6rem;" data-id="${habit.id}">
                <i class="fas fa-trash"></i>
            </button>
        `;
        habitList.appendChild(habitItem);
    });
    
    // Add event listeners for checkboxes
    document.querySelectorAll('.habit-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const id = parseInt(this.getAttribute('data-id'));
            const habit = habits.find(h => h.id === id);
            if (habit) {
                habit.completed = this.checked;
                renderHabits();
                saveUserData();
            }
        });
    });
    
    // Add event listeners for delete buttons
    document.querySelectorAll('.habit-item button').forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            if (confirm('Hapus kebiasaan ini?')) {
                habits = habits.filter(h => h.id !== id);
                renderHabits();
                saveUserData();
            }
        });
    });
}

// Get priority color
function getPriorityColor(priority) {
    switch(priority) {
        case 'high': return '#dc3545';
        case 'medium': return '#ffc107';
        case 'low': return '#28a745';
        default: return '#6c757d';
    }
}

// Initialize games
function initGames() {
    initBreathingGame();
    initMemoryGame();
    initFocusGame();
    
    // Game buttons on home page
    gameButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const game = e.target.closest('button').getAttribute('data-game');
            document.querySelector('[data-page="games"]').click();
            
            // Scroll to specific game
            setTimeout(() => {
                const gameCard = document.querySelector(`.game-${game === 'breathing' ? 1 : game === 'memory' ? 2 : 3}`);
                if (gameCard) {
                    gameCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 300);
        });
    });
}

// 1. BREATHING GAME
function initBreathingGame() {
    const startBtn = document.getElementById('startBreathingBtn');
    const resetBtn = document.getElementById('resetBreathingBtn');
    const breathingCircle = document.getElementById('breathingCircle');
    const breathingText = document.getElementById('breathingText');
    const breathingTimer = document.getElementById('breathingTimer');
    
    // Update stats display
    document.getElementById('breathingSessions').textContent = breathingSessions;
    document.getElementById('breathingDuration').textContent = breathingDuration;
    
    startBtn.addEventListener('click', startBreathingExercise);
    resetBtn.addEventListener('click', resetBreathingExercise);
    
    function startBreathingExercise() {
        if (breathingPhase !== 0) return; // Already running
        
        breathingPhase = 1;
        startBtn.disabled = true;
        breathingText.style.display = 'none';
        breathingTimer.style.display = 'block';
        breathingCount = 4;
        
        breathingInterval = setInterval(updateBreathing, 1000);
        updateBreathing();
    }
    
    function updateBreathing() {
        const circle = breathingCircle;
        const timer = breathingTimer;
        
        if (breathingPhase === 1) { // Inhale
            timer.textContent = breathingCount;
            circle.style.transform = 'scale(1.5)';
            circle.style.backgroundColor = '#36D1DC';
            circle.style.transition = 'all 4s ease-in-out';
            
            if (breathingCount <= 0) {
                breathingPhase = 2;
                breathingCount = 7;
            }
        } else if (breathingPhase === 2) { // Hold
            timer.textContent = breathingCount;
            circle.style.transform = 'scale(1.5)';
            circle.style.backgroundColor = '#5B86E5';
            
            if (breathingCount <= 0) {
                breathingPhase = 3;
                breathingCount = 8;
            }
        } else if (breathingPhase === 3) { // Exhale
            timer.textContent = breathingCount;
            circle.style.transform = 'scale(1)';
            circle.style.backgroundColor = '#6C63FF';
            circle.style.transition = 'all 8s ease-in-out';
            
            if (breathingCount <= 0) {
                // Cycle completed
                breathingSessions++;
                breathingDuration += 19; // 4+7+8 = 19 seconds per cycle
                
                document.getElementById('breathingSessions').textContent = breathingSessions;
                document.getElementById('breathingDuration').textContent = breathingDuration;
                
                // Save to localStorage
                saveUserData();
                
                // Check if we've done 4 cycles
                if (breathingSessions % 4 === 0) {
                    clearInterval(breathingInterval);
                    breathingPhase = 0;
                    startBtn.disabled = false;
                    timer.style.display = 'none';
                    breathingText.style.display = 'block';
                    breathingText.textContent = "Selesai! Bagus!";
                    circle.style.backgroundColor = '#36D1DC';
                    circle.style.transform = 'scale(1)';
                    
                    // Update dashboard stats
                    updateGameStatsDashboard();
                    
                    // Show congratulation
                    setTimeout(() => {
                        alert(`Selamat! Anda telah menyelesaikan 4 siklus pernapasan 4-7-8. Anda telah berlatih selama ${breathingDuration} detik.`);
                    }, 500);
                } else {
                    // Start next cycle
                    breathingPhase = 1;
                    breathingCount = 4;
                }
            }
        }
        
        breathingCount--;
    }
    
    function resetBreathingExercise() {
        clearInterval(breathingInterval);
        breathingPhase = 0;
        startBtn.disabled = false;
        
        const circle = breathingCircle;
        const timer = breathingTimer;
        const text = breathingText;
        
        circle.style.transform = 'scale(1)';
        circle.style.backgroundColor = '#36D1DC';
        timer.style.display = 'none';
        text.style.display = 'block';
        text.textContent = "Siap? Mulai!";
    }
}

// 2. MEMORY GAME
function initMemoryGame() {
    const memoryGrid = document.getElementById('memoryGrid');
    const startBtn = document.getElementById('startMemoryBtn');
    const resetBtn = document.getElementById('resetMemoryBtn');
    
    // Update stats display
    document.getElementById('memoryScore').textContent = memoryScore;
    document.getElementById('memoryAttempts').textContent = memoryAttempts;
    
    // Symbols for memory cards
    const symbols = ['😊', '🧠', '💡', '🎵', '🌈', '🌟', '🎯', '🕊️'];
    
    startBtn.addEventListener('click', startMemoryGame);
    resetBtn.addEventListener('click', resetMemoryGame);
    
    function startMemoryGame() {
        if (memoryGameActive) return;
        
        memoryGameActive = true;
        memoryMatchedPairs = 0;
        memoryScore = 0;
        memoryAttempts = 0;
        memoryFlippedCards = [];
        
        // Update UI
        document.getElementById('memoryScore').textContent = memoryScore;
        document.getElementById('memoryAttempts').textContent = memoryAttempts;
        
        // Create cards (pairs of each symbol)
        memoryCards = [];
        symbols.forEach(symbol => {
            memoryCards.push(symbol);
            memoryCards.push(symbol);
        });
        
        // Shuffle cards
        memoryCards.sort(() => Math.random() - 0.5);
        
        // Render cards
        memoryGrid.innerHTML = '';
        memoryCards.forEach((symbol, index) => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.index = index;
            card.dataset.symbol = symbol;
            card.textContent = '?';
            card.setAttribute('aria-label', `Kartu ${index + 1}`);
            
            card.addEventListener('click', flipCard);
            memoryGrid.appendChild(card);
        });
        
        startBtn.disabled = true;
        setTimeout(() => {
            startBtn.disabled = false;
            startBtn.textContent = "Permainan Berjalan";
        }, 100);
    }
    
    function flipCard() {
        if (!memoryGameActive) return;
        
        const card = this;
        
        // Don't flip if already flipped or matched
        if (card.classList.contains('flipped') || card.classList.contains('matched')) {
            return;
        }
        
        // Don't flip if already 2 cards are flipped
        if (memoryFlippedCards.length >= 2) {
            return;
        }
        
        // Flip the card
        card.classList.add('flipped');
        card.textContent = card.dataset.symbol;
        memoryFlippedCards.push(card);
        
        // Check for match if 2 cards are flipped
        if (memoryFlippedCards.length === 2) {
            memoryAttempts++;
            document.getElementById('memoryAttempts').textContent = memoryAttempts;
            
            const card1 = memoryFlippedCards[0];
            const card2 = memoryFlippedCards[1];
            
            if (card1.dataset.symbol === card2.dataset.symbol) {
                // Match found
                card1.classList.add('matched');
                card2.classList.add('matched');
                memoryMatchedPairs++;
                memoryScore += 10;
                document.getElementById('memoryScore').textContent = memoryScore;
                
                // Play match sound (if available)
                playSound('match');
                
                // Clear flipped cards
                memoryFlippedCards = [];
                
                // Check if game is complete
                if (memoryMatchedPairs === symbols.length) {
                    memoryGameActive = false;
                    startBtn.textContent = "Mulai Permainan";
                    
                    // Save high score
                    if (memoryScore > parseInt(localStorage.getItem('fitmind_memory_score') || 0)) {
                        localStorage.setItem('fitmind_memory_score', memoryScore.toString());
                    }
                    
                    // Update dashboard stats
                    updateGameStatsDashboard();
                    
                    // Show congratulation
                    setTimeout(() => {
                        alert(`Selamat! Anda menemukan semua pasangan dengan ${memoryAttempts} percobaan. Skor: ${memoryScore}`);
                    }, 500);
                }
            } else {
                // No match, flip back after delay
                setTimeout(() => {
                    card1.classList.remove('flipped');
                    card2.classList.remove('flipped');
                    card1.textContent = '?';
                    card2.textContent = '?';
                    memoryFlippedCards = [];
                }, 1000);
            }
        }
    }
    
    function resetMemoryGame() {
        memoryGameActive = false;
        startBtn.textContent = "Mulai Permainan";
        memoryGrid.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--gray);">Klik "Mulai Permainan" untuk memulai</p>';
    }
}

// 3. FOCUS GAME
function initFocusGame() {
    const gameArea = document.getElementById('focusGameArea');
    const startBtn = document.getElementById('startFocusBtn');
    const timerDisplay = document.getElementById('focusTimer');
    const scoreDisplay = document.getElementById('focusGameScore');
    
    // Update stats display
    document.getElementById('focusScore').textContent = focusScore;
    document.getElementById('focusLevel').textContent = focusLevel;
    
    startBtn.addEventListener('click', startFocusGame);
    
    function startFocusGame() {
        if (focusGameActive) return;
        
        focusGameActive = true;
        focusScore = 0;
        focusLevel = 1;
        focusTimer = 30;
        
        // Update UI
        document.getElementById('focusScore').textContent = focusScore;
        document.getElementById('focusLevel').textContent = focusLevel;
        scoreDisplay.textContent = focusScore;
        timerDisplay.textContent = focusTimer;
        startBtn.disabled = true;
        startBtn.textContent = "Sedang Berjalan";
        
        // Clear game area
        gameArea.innerHTML = '';
        
        // Create first target
        createTarget();
        
        // Start timer
        focusInterval = setInterval(updateFocusTimer, 1000);
        
        // Start target spawner
        targetInterval = setInterval(spawnTarget, 1500 - (focusLevel * 100));
    }
    
    function createTarget() {
        const target = document.createElement('div');
        target.className = 'focus-target';
        target.setAttribute('aria-label', 'Target fokus');
        
        // Random position
        const maxX = gameArea.clientWidth - 40;
        const maxY = gameArea.clientHeight - 40;
        const x = Math.floor(Math.random() * maxX);
        const y = Math.floor(Math.random() * maxY);
        
        target.style.left = `${x}px`;
        target.style.top = `${y}px`;
        
        // Add click event
        target.addEventListener('click', () => {
            if (!focusGameActive) return;
            
            // Increase score
            focusScore += focusLevel;
            scoreDisplay.textContent = focusScore;
            document.getElementById('focusScore').textContent = focusScore;
            
            // Play click sound (if available)
            playSound('click');
            
            // Remove target
            target.remove();
            
            // Increase level every 10 points
            if (focusScore > 0 && focusScore % 10 === 0) {
                focusLevel++;
                document.getElementById('focusLevel').textContent = focusLevel;
                
                // Increase difficulty
                clearInterval(targetInterval);
                targetInterval = setInterval(spawnTarget, Math.max(500, 1500 - (focusLevel * 100)));
            }
        });
        
        // Remove target after 2 seconds
        setTimeout(() => {
            if (target.parentNode) {
                target.remove();
            }
        }, 2000);
        
        gameArea.appendChild(target);
    }
    
    function spawnTarget() {
        if (!focusGameActive) return;
        createTarget();
    }
    
    function updateFocusTimer() {
        focusTimer--;
        timerDisplay.textContent = focusTimer;
        
        if (focusTimer <= 0) {
            endFocusGame();
        }
    }
    
    function endFocusGame() {
        focusGameActive = false;
        clearInterval(focusInterval);
        clearInterval(targetInterval);
        
        startBtn.disabled = false;
        startBtn.textContent = "Mulai";
        
        // Save high score
        if (focusScore > parseInt(localStorage.getItem('fitmind_focus_score') || 0)) {
            localStorage.setItem('fitmind_focus_score', focusScore.toString());
        }
        
        // Update dashboard stats
        updateGameStatsDashboard();
        
        // Show results
        setTimeout(() => {
            alert(`Waktu habis! Skor akhir: ${focusScore}. Level tertinggi: ${focusLevel}.`);
        }, 500);
    }
}

// Play sound function
function playSound(type) {
    // In a real app, you would play actual audio files
    console.log(`Playing ${type} sound`);
}

// Initialize music player
function initMusicPlayer() {
    playMusicBtn.addEventListener('click', () => {
        isMusicPlaying = !isMusicPlaying;
        
        if (isMusicPlaying) {
            playMusicBtn.innerHTML = '<i class="fas fa-pause"></i>';
            // Simulate progress
            currentProgress = 0;
            musicProgressInterval = setInterval(() => {
                currentProgress += 0.33; // 5 minutes total = 300 seconds
                if (currentProgress >= 100) {
                    currentProgress = 100;
                    clearInterval(musicProgressInterval);
                    isMusicPlaying = false;
                    playMusicBtn.innerHTML = '<i class="fas fa-play"></i>';
                }
                musicProgress.style.width = `${currentProgress}%`;
            }, 1000);
        } else {
            playMusicBtn.innerHTML = '<i class="fas fa-play"></i>';
            clearInterval(musicProgressInterval);
        }
    });
    
    // Previous and next track buttons
    document.getElementById('prevTrackBtn').addEventListener('click', () => {
        alert("Memutar track sebelumnya: 'Morning Calm'");
    });
    
    document.getElementById('nextTrackBtn').addEventListener('click', () => {
        alert("Memutar track berikutnya: 'Forest Meditation'");
    });
    
    // Play video button
    document.getElementById('playVideoBtn').addEventListener('click', () => {
        alert("Video meditasi akan diputar di jendela baru. (Simulasi)");
    });
}

// Update game stats on dashboard
function updateGameStatsDashboard() {
    document.getElementById('dashboardBreathing').textContent = breathingSessions;
    document.getElementById('dashboardMemory').textContent = memoryScore;
    document.getElementById('dashboardFocus').textContent = focusScore;
}

// Charts for dashboard
function updateCharts() {
    // Mood chart
    const moodCtx = document.getElementById('moodChart');
    if (!moodCtx) return;
    
    // Destroy existing chart if it exists
    if (moodChartInstance) {
        moodChartInstance.destroy();
    }
    
    // Get mood history
    const moodHistory = JSON.parse(localStorage.getItem('fitmind_mood_history') || '[]');
    
    // Prepare data for last 7 days
    const last7Days = getLast7Days();
    const moodData = last7Days.map(day => {
        const dayMoods = moodHistory.filter(entry => {
            const entryDate = new Date(entry.date).toDateString();
            return entryDate === day.date.toDateString();
        });
        
        if (dayMoods.length === 0) return null;
        
        // Average mood score (simplified)
        const moodScores = dayMoods.map(entry => {
            switch(entry.mood) {
                case 'happy': return 9;
                case 'neutral': return 6;
                case 'sad': return 3;
                case 'anxious': return 4;
                case 'tired': return 5;
                case 'angry': return 2;
                default: return 5;
            }
        });
        
        return moodScores.reduce((a, b) => a + b, 0) / moodScores.length;
    });
    
    // Fill missing data with average
    const filledMoodData = moodData.map(score => score === null ? 6 : score);
    
    moodChartInstance = new Chart(moodCtx.getContext('2d'), {
        type: 'line',
        data: {
            labels: last7Days.map(day => day.label),
            datasets: [{
                label: 'Tingkat Mood (1-10)',
                data: filledMoodData,
                borderColor: 'rgba(93, 95, 239, 1)',
                backgroundColor: 'rgba(93, 95, 239, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 0,
                    max: 10,
                    ticks: {
                        stepSize: 2
                    }
                }
            }
        }
    });
    
    // Habit chart
    const habitCtx = document.getElementById('habitChart');
    if (!habitCtx) return;
    
    // Destroy existing chart if it exists
    if (habitChartInstance) {
        habitChartInstance.destroy();
    }
    
    const completedHabits = habits.filter(h => h.completed).length;
    const pendingHabits = habits.length - completedHabits;
    
    habitChartInstance = new Chart(habitCtx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Selesai', 'Belum Selesai'],
            datasets: [{
                data: [completedHabits, pendingHabits],
                backgroundColor: [
                    'rgba(107, 207, 127, 0.8)',
                    'rgba(255, 107, 139, 0.8)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Get last 7 days for chart
function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const label = dayNames[date.getDay()];
        
        days.push({
            date: date,
            label: label
        });
    }
    return days;
}

// Initialize event listeners
function initEventListeners() {
    // Handle window resize
    window.addEventListener('resize', () => {
        // Close mobile menu on resize to desktop
        if (window.innerWidth > 768) {
            mainNav.classList.remove('active');
        }
        
        // Update charts if on dashboard
        if (document.getElementById('dashboard').classList.contains('active')) {
            setTimeout(updateCharts, 100);
        }
    });
    
    // Handle beforeunload to save data
    window.addEventListener('beforeunload', () => {
        saveUserData();
    });
    
    // Handle visibility change (tab switch)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            saveUserData();
        }
    });
}

// Show welcome message
function showWelcomeMessage() {
    // Check if first visit
    const firstVisit = !localStorage.getItem('fitmind_first_visit');
    
    if (firstVisit) {
        setTimeout(() => {
            alert("Selamat datang di FitMind AI! 💫\n\nFitMind AI adalah asisten kesehatan mental dan produktivitas berbasis AI yang akan membantu Anda:\n\n1. Melacak mood dan emosi harian\n2. Chat dengan AI therapist untuk dukungan emosional\n3. Membuat dan melacak kebiasaan positif\n4. Bermain mini games untuk relaksasi\n5. Mendengarkan musik meditasi\n\nSelamat menjelajahi! 🧠✨");
            localStorage.setItem('fitmind_first_visit', 'true');
        }, 1000);
    }
}

// Export functions for global access (if needed)
window.FitMindAI = {
    saveUserData,
    loadUserData,
    analyzeMood,
    updateCharts
};