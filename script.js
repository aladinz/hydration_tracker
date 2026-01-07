// ==================== Confetti Animation ====================
function createConfetti() {
    const confettiPieces = 50;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    
    for (let i = 0; i < confettiPieces; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            left: ${Math.random() * 100}%;
            top: -10px;
            width: 10px;
            height: 10px;
            background-color: ${colors[Math.floor(Math.random() * colors.length)]};
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            box-shadow: 0 0 10px currentColor;
            animation: confettiFall ${2 + Math.random() * 1}s ease-in forwards;
            --tx: ${(Math.random() - 0.5) * 200}px;
            --ty: ${window.innerHeight + 20}px;
            --rotate: ${Math.random() * 360}deg;
        `;
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 3000);
    }
}

// ==================== Water Droplet Animation ====================
function createWaterDroplet(x, y) {
    const droplet = document.createElement('div');
    droplet.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: 8px;
        height: 8px;
        background: radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.8), rgba(59, 130, 246, 0.2));
        border-radius: 50%;
        pointer-events: none;
        z-index: 999;
        animation: dropletFall ${1 + Math.random() * 0.5}s ease-in forwards;
        --tx: ${(Math.random() - 0.5) * 50}px;
        --ty: ${window.innerHeight}px;
    `;
    document.body.appendChild(droplet);
    
    setTimeout(() => droplet.remove(), 1500);
}

const confettiStyle = document.createElement('style');
confettiStyle.textContent = `
    @keyframes confettiFall {
        to {
            transform: translate(var(--tx), var(--ty)) rotate(var(--rotate));
            opacity: 0;
        }
    }
    
    @keyframes dropletFall {
        to {
            transform: translate(var(--tx), var(--ty));
            opacity: 0;
        }
    }
`;
document.head.appendChild(confettiStyle);
const tips = [
    "💡 Your kidneys love consistency — sip, don't chug!",
    "💡 Hydration supports healthy blood pressure.",
    "💡 Spread your water intake throughout the day for better absorption.",
    "💡 Water helps flush out waste and toxins naturally.",
    "💡 Stay hydrated to support kidney filtration and overall health.",
    "💡 Pale yellow urine is a sign you're well-hydrated!",
    "💡 Electrolytes matter — balance water with minerals.",
    "💡 Room temperature water is easier on your kidneys.",
    "💡 Consistent hydration beats occasional big gulps.",
    "💡 Your kidneys filter 150+ liters of fluid daily!",
    "💡 Morning hydration jumpstarts your metabolism.",
    "💡 Herbal teas count toward your daily hydration goal.",
    "💡 Limit caffeine to support kidney health.",
    "💡 Proper hydration improves concentration and energy.",
    "💡 Your kidneys are resilient when you stay hydrated!"
];

// ==================== Sound Effects ====================
function playSound(type) {
    if (!state.soundEnabled) return;
    
    // Create sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'drink') {
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } else if (type === 'goal') {
        oscillator.frequency.value = 1000;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }
}

// ==================== Notification Request ====================
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function sendNotification(title, options = {}) {
    if (state.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            icon: '💧',
            ...options
        });
    }
}

// ==================== State Management ====================
const state = {
    hydrationTotal: 0,
    streak: 0,
    goalMetToday: false,
    darkMode: false,
    dailyGoal: 2000,
    soundEnabled: true,
    notificationsEnabled: false,
    drinks: {
        water: 0,
        tea: 0,
        coffee: 0,
        juice: 0,
        cocoa: 0
    },
    drinkLog: [], // [{drink: 'water', ml: 250, time: '10:30 AM'}, ...]
    weeklyStats: {}, // {'Mon': 1800, 'Tue': 2000, ...}
    lastDayReset: new Date().toDateString(),
    lastDrinkAdded: null, // For undo feature
    dailyTipIndex: Math.floor(Math.random() * tips.length)
};

// ==================== Local Storage ====================
function saveToLocalStorage() {
    localStorage.setItem('hydrationTrackerState', JSON.stringify(state));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('hydrationTrackerState');
    if (saved) {
        const savedState = JSON.parse(saved);
        Object.assign(state, savedState);
        
        // Check if it's a new day
        const today = new Date().toDateString();
        if (state.lastDayReset !== today) {
            // Save yesterday's total to weekly stats
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const dayName = yesterday.toLocaleDateString('en-US', { weekday: 'short' });
            state.weeklyStats[dayName] = state.hydrationTotal;
            
            startNewDay();
        }
    }
}

// ==================== Hydration Factors ====================
const hydrationFactors = {
    water: 1.0,
    tea: 0.8,
    coffee: 0.5,
    juice: 0.9,
    cocoa: 0.6
};

const ML_PER_GLASS = 250;

// ==================== DOM Elements ====================
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const goalSubtext = document.getElementById('goalSubtext');
const streakCount = document.getElementById('streakCount');
const tipText = document.getElementById('tipText');
const themeToggle = document.getElementById('themeToggle');
const drinkButtons = document.querySelectorAll('.drink-btn');
const startNewDayBtn = document.getElementById('startNewDayBtn');
const resetBtn = document.getElementById('resetBtn');
const undoBtn = document.getElementById('undoBtn');
const waterCount = document.getElementById('waterCount');
const teaCount = document.getElementById('teaCount');
const coffeeCount = document.getElementById('coffeeCount');
const juiceCount = document.getElementById('juiceCount');
const cocoaCount = document.getElementById('cocoaCount');
const totalCount = document.getElementById('totalCount');
const statusEmoji = document.getElementById('statusEmoji');
const statusText = document.getElementById('statusText');
const drinkLog = document.getElementById('drinkLog');
const weeklyGrid = document.getElementById('weeklyGrid');
const goalInput = document.getElementById('goalInput');
const notificationsToggle = document.getElementById('notificationsToggle');
const soundToggle = document.getElementById('soundToggle');
const expandLogBtn = document.getElementById('expandLogBtn');
const exportBtn = document.getElementById('exportBtn');

// Calculator Elements
const calcGender = document.getElementById('calcGender');
const calcAge = document.getElementById('calcAge');
const calcWeight = document.getElementById('calcWeight');
const calcHeightFt = document.getElementById('calcHeightFt');
const calcHeightIn = document.getElementById('calcHeightIn');
const calculateBtn = document.getElementById('calculateBtn');
const calcResult = document.getElementById('calcResult');
const recommendedGoal = document.getElementById('recommendedGoal');
const recommendedGlasses = document.getElementById('recommendedGlasses');
const applyGoalBtn = document.getElementById('applyGoalBtn');

// ==================== Theme Management ====================
function initializeTheme() {
    const saved = localStorage.getItem('hydrationTrackerTheme');
    
    if (saved) {
        state.darkMode = saved === 'dark';
    } else {
        // Prefer system theme
        state.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    applyTheme();
}

function applyTheme() {
    if (state.darkMode) {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.textContent = '🌙';
    }
    
    localStorage.setItem('hydrationTrackerTheme', state.darkMode ? 'dark' : 'light');
}

function toggleTheme() {
    state.darkMode = !state.darkMode;
    applyTheme();
}

// ==================== Update Progress ====================
function updateProgress() {
    const percentage = Math.min((state.hydrationTotal / state.dailyGoal) * 100, 100);
    progressFill.style.width = percentage + '%';
    progressText.textContent = `${state.hydrationTotal} / ${state.dailyGoal} ml`;
    
    const glasses = Math.round(state.dailyGoal / ML_PER_GLASS);
    goalSubtext.textContent = `Daily goal: ${glasses} glasses (${state.dailyGoal} ml)`;
    
    updateHydrationStatus();
    
    // Goal reached celebration
    if (state.hydrationTotal >= state.dailyGoal && !state.goalMetToday) {
        achieveGoal();
    }
}

// ==================== Achieve Goal ====================
function achieveGoal() {
    state.streak++;
    state.goalMetToday = true;
    
    playSound('goal');
    saveToLocalStorage();
    renderUI();
    
    // Create magical confetti effect
    createConfetti();
    
    // Visual celebration
    const container = document.querySelector('.container');
    container.classList.add('goal-reached');
    setTimeout(() => container.classList.remove('goal-reached'), 1800);
    
    // Show encouraging message
    showNotification('🎉 Daily goal reached! Streak +1');
    sendNotification('Goal Reached! 🎉', { body: 'You\'ve reached your daily hydration goal!' });
}

// ==================== Add Drink ====================
function addDrink(drinkType, factor) {
    const ml = ML_PER_GLASS * factor;
    
    state.drinks[drinkType]++;
    state.hydrationTotal += ml;
    
    // Store for undo
    state.lastDrinkAdded = { drinkType, factor, ml };
    
    // Add to log
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    state.drinkLog.push({
        drink: drinkType,
        ml: Math.round(ml),
        time: time
    });
    
    // Create water droplet animation
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            createWaterDroplet(Math.random() * window.innerWidth, Math.random() * window.innerHeight * 0.5);
        }, i * 100);
    }
    
    playSound('drink');
    saveToLocalStorage();
    renderUI();
}

// ==================== Undo Last Drink ====================
function undoLastDrink() {
    if (!state.lastDrinkAdded) {
        showNotification('❌ Nothing to undo');
        return;
    }
    
    const { drinkType, ml } = state.lastDrinkAdded;
    
    state.drinks[drinkType]--;
    state.hydrationTotal -= ml;
    state.drinkLog.pop();
    
    // Reset goal if we're now below it
    if (state.hydrationTotal < state.dailyGoal) {
        state.goalMetToday = false;
    }
    
    state.lastDrinkAdded = null;
    
    saveToLocalStorage();
    renderUI();
    
    showNotification('↶ Drink removed');
}

// ==================== Start New Day ====================
function startNewDay() {
    const today = new Date().toDateString();
    
    state.hydrationTotal = 0;
    state.goalMetToday = false;
    state.drinks = {
        water: 0,
        tea: 0,
        coffee: 0,
        juice: 0,
        cocoa: 0
    };
    state.drinkLog = [];
    state.lastDrinkAdded = null;
    state.lastDayReset = today;
    state.dailyTipIndex = Math.floor(Math.random() * tips.length);
    
    saveToLocalStorage();
    renderUI();
    
    showNotification('🌅 New day started! Stay hydrated!');
}

// ==================== Reset Today ====================
function resetToday() {
    state.hydrationTotal = 0;
    state.goalMetToday = false;
    state.drinks = {
        water: 0,
        tea: 0,
        coffee: 0,
        juice: 0,
        cocoa: 0
    };
    state.drinkLog = [];
    state.lastDrinkAdded = null;
    
    saveToLocalStorage();
    renderUI();
    
    showNotification('🔄 Today\'s progress reset');
}

// ==================== Render UI ====================
function renderUI() {
    updateProgress();
    updateStreakDisplay();
    updateDrinkCounts();
    updateTip();
    renderDrinkLog();
    renderWeeklyStats();
}

function updateStreakDisplay() {
    streakCount.textContent = state.streak;
}

function updateDrinkCounts() {
    waterCount.textContent = state.drinks.water;
    teaCount.textContent = state.drinks.tea;
    coffeeCount.textContent = state.drinks.coffee;
    juiceCount.textContent = state.drinks.juice;
    cocoaCount.textContent = state.drinks.cocoa;
    
    const total = Object.values(state.drinks).reduce((a, b) => a + b, 0);
    totalCount.textContent = total;
}

function updateTip() {
    tipText.textContent = tips[state.dailyTipIndex];
}

// ==================== Hydration Status ====================
function updateHydrationStatus() {
    const percentage = (state.hydrationTotal / state.dailyGoal) * 100;
    
    let status = '';
    if (percentage < 25) {
        status = { emoji: '🔴', text: 'Dehydrated' };
    } else if (percentage < 50) {
        status = { emoji: '🟠', text: 'Low' };
    } else if (percentage < 75) {
        status = { emoji: '🟡', text: 'Hydrating' };
    } else if (percentage < 100) {
        status = { emoji: '🟢', text: 'Great' };
    } else {
        status = { emoji: '💙', text: 'Excellent' };
    }
    
    statusEmoji.textContent = status.emoji;
    statusText.textContent = status.text;
}

function renderDrinkLog() {
    if (state.drinkLog.length === 0) {
        drinkLog.innerHTML = '<p class="log-empty">No drinks logged yet</p>';
        return;
    }
    
    drinkLog.innerHTML = state.drinkLog.map((log, idx) => `
        <div class="log-item">
            <span class="log-item-time">${log.time}</span>
            <span class="log-item-drink">${getDrinkEmoji(log.drink)} ${log.ml}ml</span>
        </div>
    `).join('');
}

function renderWeeklyStats() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    
    weeklyGrid.innerHTML = days.map(day => {
        const value = state.weeklyStats[day] || 0;
        const achieved = value >= state.dailyGoal;
        
        return `
            <div class="day-cell ${achieved ? 'achieved' : ''}">
                <div class="day-cell-label">${day}</div>
                <div class="day-cell-value">${value ? Math.round(value / 100) / 10 : 0}L</div>
            </div>
        `;
    }).join('');
}

function getDrinkEmoji(drinkType) {
    const emojis = {
        water: '💧',
        tea: '🍵',
        coffee: '☕',
        juice: '🍊',
        cocoa: '🍫'
    };
    return emojis[drinkType] || '💧';
}

// ==================== Export Stats ====================
function exportStats() {
    const csvData = [];
    
    // Header
    csvData.push(['Date', 'Total ML', 'Goal Met', 'Streak']);
    
    // Current day
    const today = new Date().toLocaleDateString();
    csvData.push([today, state.hydrationTotal, state.goalMetToday ? 'Yes' : 'No', state.streak]);
    
    // Convert to CSV
    const csv = csvData.map(row => row.join(',')).join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hydration-stats-${today}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showNotification('📊 Stats exported!');
}

// ==================== Reminder Schedule ====================
function startReminderSchedule() {
    if (!state.notificationsEnabled) return;
    
    // Check every 30 minutes
    setInterval(() => {
        const hour = new Date().getHours();
        const percentage = (state.hydrationTotal / state.dailyGoal) * 100;
        
        // Remind between 7 AM and 9 PM if below 50%
        if (hour >= 7 && hour < 21 && percentage < 50) {
            sendNotification('Hydration Reminder 💧', { 
                body: `You've had ${state.hydrationTotal}ml so far. Keep sipping!` 
            });
        }
    }, 30 * 60 * 1000);
}

// ==================== Notification System ====================
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: var(--primary-color);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideDown 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 2700);
}

// ==================== Event Listeners ====================
function attachEventListeners() {
    // Drink buttons with ripple effect
    drinkButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const drinkType = button.dataset.drink;
            const factor = parseFloat(button.dataset.factor);
            addDrink(drinkType, factor);
            
            // Create ripple effect
            createRipple(e, button);
            
            // Button press animation
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = '';
            }, 100);
        });
    });
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Action buttons
    startNewDayBtn.addEventListener('click', startNewDay);
    resetBtn.addEventListener('click', resetToday);
    undoBtn.addEventListener('click', undoLastDrink);
    expandLogBtn.addEventListener('click', () => {
        drinkLog.style.maxHeight = drinkLog.style.maxHeight === 'none' ? '200px' : 'none';
    });
    exportBtn.addEventListener('click', exportStats);
    
    // Settings
    goalInput.addEventListener('change', (e) => {
        state.dailyGoal = parseInt(e.target.value);
        saveToLocalStorage();
        renderUI();
    });
    
    notificationsToggle.addEventListener('change', (e) => {
        state.notificationsEnabled = e.target.checked;
        if (state.notificationsEnabled) {
            requestNotificationPermission();
        }
        saveToLocalStorage();
    });
    
    soundToggle.addEventListener('change', (e) => {
        state.soundEnabled = e.target.checked;
        saveToLocalStorage();
    });
    
    // Keyboard support for drink shortcuts
    document.addEventListener('keydown', (e) => {
        const shortcuts = {
            'w': 'water',
            't': 'tea',
            'c': 'coffee',
            'j': 'juice',
            'h': 'cocoa'
        };
        
        if (shortcuts[e.key.toLowerCase()]) {
            const drinkType = shortcuts[e.key.toLowerCase()];
            addDrink(drinkType, hydrationFactors[drinkType]);
        }
    });

    // Calculator
    calculateBtn.addEventListener('click', () => {
        const gender = calcGender.value;
        const age = parseInt(calcAge.value);
        const weightLbs = parseFloat(calcWeight.value);
        const heightFt = parseInt(calcHeightFt.value);
        const heightIn = parseInt(calcHeightIn.value) || 0;

        if (!age || !weightLbs || !heightFt) {
            showNotification('⚠️ Please fill all fields');
            return;
        }

        // Convert lbs to kg for the formula
        const weightKg = weightLbs * 0.453592;

        // Formula: (WeightKg * AgeFactor) + GenderBonus
        let ageFactor = 35;
        if (age < 30) ageFactor = 40;
        else if (age > 55) ageFactor = 30;

        let goal = weightKg * ageFactor;
        if (gender === 'male') goal += 300;

        // Round to nearest 100
        goal = Math.round(goal / 100) * 100;

        recommendedGoal.textContent = goal;
        recommendedGlasses.textContent = Math.round(goal / ML_PER_GLASS);
        calcResult.classList.remove('hidden');
        
        // Scroll to result
        calcResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    applyGoalBtn.addEventListener('click', () => {
        const goal = parseInt(recommendedGoal.textContent);
        state.dailyGoal = goal;
        goalInput.value = goal;
        
        saveToLocalStorage();
        renderUI();
        
        showNotification(`✅ Goal updated to ${goal}ml`);
        calcResult.classList.add('hidden');
    });
}

// ==================== Ripple Effect ====================
function createRipple(e, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ripple.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.5), transparent);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        animation: rippleEffect 0.6s ease-out forwards;
    `;
    
    element.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
}

// ==================== Animation Styles ====================
const animationStyle = document.createElement('style');
animationStyle.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
    
    @keyframes rippleEffect {
        from {
            width: 20px;
            height: 20px;
            opacity: 1;
        }
        to {
            width: 300px;
            height: 300px;
            opacity: 0;
        }
    }
`;
document.head.appendChild(animationStyle);

// ==================== Initialization ====================
function init() {
    loadFromLocalStorage();
    initializeTheme();
    attachEventListeners();
    renderUI();
    startReminderSchedule();
}

// Start the app
init();
