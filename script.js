const STORAGE_KEY = 'premium-spin-wheel-state-v1';

const defaultRewards = [
  { label: '₹10', color: '#5ee7ff' },
  { label: '₹20', color: '#ff7ac6' },
  { label: '₹50', color: '#7c5cff' },
  { label: '₹100', color: '#ffd166' },
  { label: '₹500', color: '#1de9b6' },
  { label: 'Free Coffee', color: '#ff8f00' },
  { label: 'Better Luck', color: '#5d6cff' },
  { label: 'Jackpot', color: '#ff4d6d' },
  { label: 'Mystery Gift', color: '#00c2ff' },
  { label: 'Free Recharge', color: '#7b61ff' }
];

const state = {
  rewards: [],
  spinDuration: 6.5,
  soundEnabled: true,
  theme: 'dark',
  totalSpins: 0,
  totalWins: 0,
  lastReward: '—',
  history: [],
  rotation: 0,
  isSpinning: false,
  editingId: null
};

const elements = {
  wheelCanvas: document.getElementById('wheelCanvas'),
  pointer: document.getElementById('pointer'),
  spinBtn: document.getElementById('spinBtn'),
  soundToggle: document.getElementById('soundToggle'),
  themeToggle: document.getElementById('themeToggle'),
  fullscreenBtn: document.getElementById('fullscreenBtn'),
  resetBtn: document.getElementById('resetBtn'),
  resetStatsBtn: document.getElementById('resetStatsBtn'),
  exportHistoryBtn: document.getElementById('exportHistoryBtn'),
  randomColorsBtn: document.getElementById('randomColorsBtn'),
  importRewardsBtn: document.getElementById('importRewardsBtn'),
  importFile: document.getElementById('importFile'),
  rewardForm: document.getElementById('rewardForm'),
  rewardLabel: document.getElementById('rewardLabel'),
  rewardColor: document.getElementById('rewardColor'),
  spinDuration: document.getElementById('spinDuration'),
  spinDurationValue: document.getElementById('spinDurationValue'),
  cancelEditBtn: document.getElementById('cancelEditBtn'),
  rewardList: document.getElementById('rewardList'),
  historyList: document.getElementById('historyList'),
  totalSpins: document.getElementById('totalSpins'),
  totalWins: document.getElementById('totalWins'),
  lastReward: document.getElementById('lastReward'),
  mostFrequent: document.getElementById('mostFrequent'),
  currentRewardLabel: document.getElementById('currentRewardLabel'),
  statusPill: document.getElementById('statusPill'),
  winnerModal: document.getElementById('winnerModal'),
  winnerText: document.getElementById('winnerText'),
  winnerBadge: document.getElementById('winnerBadge'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  continueBtn: document.getElementById('continueBtn'),
  autoCloseBtn: document.getElementById('autoCloseBtn'),
  particles: document.getElementById('particles')
};

let audioContext;
let modalTimer;

function initialize() {
  loadState();
  setTheme(state.theme);
  setSoundEnabled(state.soundEnabled);
  elements.spinDuration.value = state.spinDuration;
  elements.spinDurationValue.textContent = `${state.spinDuration.toFixed(1)}s`;
  createParticles();
  attachEvents();
  renderRewards();
  renderStats();
  renderHistory();
  renderWheel();
  window.addEventListener('resize', handleResize);
  document.addEventListener('keydown', handleKeyboard);
}

function attachEvents() {
  elements.spinBtn.addEventListener('click', spinWheel);
  elements.wheelCanvas.addEventListener('click', spinWheel);
  elements.wheelCanvas.addEventListener('touchstart', handleCanvasTouch, { passive: true });
  elements.soundToggle.addEventListener('click', toggleSound);
  elements.themeToggle.addEventListener('click', toggleTheme);
  elements.fullscreenBtn.addEventListener('click', toggleFullscreen);
  elements.resetBtn.addEventListener('click', resetWheel);
  elements.resetStatsBtn.addEventListener('click', resetStats);
  elements.exportHistoryBtn.addEventListener('click', exportHistory);
  elements.randomColorsBtn.addEventListener('click', randomizeColors);
  elements.importRewardsBtn.addEventListener('click', () => elements.importFile.click());
  elements.importFile.addEventListener('change', importRewards);
  elements.rewardForm.addEventListener('submit', saveReward);
  elements.cancelEditBtn.addEventListener('click', cancelEdit);
  elements.spinDuration.addEventListener('input', updateSpinDuration);
  elements.closeModalBtn.addEventListener('click', closeModal);
  elements.continueBtn.addEventListener('click', closeModal);
  elements.autoCloseBtn.addEventListener('click', closeModal);
}

function handleCanvasTouch(event) {
  event.preventDefault();
  spinWheel();
}

function handleKeyboard(event) {
  if (event.code === 'Space' && !state.isSpinning) {
    event.preventDefault();
    spinWheel();
  }
}

function saveState() {
  const payload = {
    rewards: state.rewards,
    spinDuration: state.spinDuration,
    soundEnabled: state.soundEnabled,
    theme: state.theme,
    totalSpins: state.totalSpins,
    totalWins: state.totalWins,
    lastReward: state.lastReward,
    history: state.history
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored) {
      state.rewards = stored.rewards?.length ? stored.rewards : defaultRewards.map((reward) => ({ ...reward }));
      state.spinDuration = stored.spinDuration || 6.5;
      state.soundEnabled = stored.soundEnabled !== undefined ? stored.soundEnabled : true;
      state.theme = stored.theme || 'dark';
      state.totalSpins = stored.totalSpins || 0;
      state.totalWins = stored.totalWins || 0;
      state.lastReward = stored.lastReward || '—';
      state.history = stored.history || [];
    } else {
      state.rewards = defaultRewards.map((reward) => ({ ...reward }));
    }
  } catch (error) {
    state.rewards = defaultRewards.map((reward) => ({ ...reward }));
  }
}

function resetWheel() {
  state.rotation = 0;
  state.isSpinning = false;
  renderWheel();
  elements.pointer.classList.remove('spinning');
  elements.statusPill.textContent = 'Ready to spin';
  elements.currentRewardLabel.textContent = '—';
  closeModal();
}

function resetStats() {
  state.totalSpins = 0;
  state.totalWins = 0;
  state.lastReward = '—';
  state.history = [];
  renderStats();
  renderHistory();
  saveState();
}

function updateSpinDuration(event) {
  state.spinDuration = Number(event.target.value);
  elements.spinDurationValue.textContent = `${state.spinDuration.toFixed(1)}s`;
  saveState();
}

function setTheme(theme) {
  state.theme = theme;
  document.body.classList.toggle('theme-light', theme === 'light');
  elements.themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
  saveState();
}

function toggleTheme() {
  const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
  setTheme(nextTheme);
}

function setSoundEnabled(enabled) {
  state.soundEnabled = enabled;
  elements.soundToggle.textContent = enabled ? '🔊' : '🔈';
  saveState();
}

function toggleSound() {
  setSoundEnabled(!state.soundEnabled);
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen();
  }
}

function createParticles() {
  elements.particles.innerHTML = '';
  const particleCount = 28;
  for (let index = 0; index < particleCount; index += 1) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * 7}s`;
    particle.style.animationDuration = `${10 + Math.random() * 8}s`;
    elements.particles.appendChild(particle);
  }
}

function handleResize() {
  renderWheel();
}

function renderWheel() {
  const context = elements.wheelCanvas.getContext('2d');
  const rect = elements.wheelCanvas.getBoundingClientRect();
  const size = Math.min(rect.width, rect.height) || 560;
  const dpr = window.devicePixelRatio || 1;

  elements.wheelCanvas.width = size * dpr;
  elements.wheelCanvas.height = size * dpr;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, size, size);

  if (!state.rewards.length) {
    context.fillStyle = 'rgba(255,255,255,0.1)';
    context.font = '600 22px Poppins';
    context.textAlign = 'center';
    context.fillText('Add rewards to begin', size / 2, size / 2);
    return;
  }

  const center = size / 2;
  const radius = size * 0.38;
  const segmentAngle = 360 / state.rewards.length;

  context.translate(center, center);
  context.rotate((state.rotation * Math.PI) / 180);
  state.rewards.forEach((reward, index) => {
    const start = index * segmentAngle;
    const end = (index + 1) * segmentAngle;
    context.beginPath();
    context.moveTo(0, 0);
    context.arc(0, 0, radius, (start * Math.PI) / 180, (end * Math.PI) / 180);
    context.closePath();
    context.fillStyle = reward.color;
    context.fill();
    context.strokeStyle = 'rgba(255,255,255,0.22)';
    context.lineWidth = 2;
    context.stroke();

    const labelAngle = start + segmentAngle / 2;
    const labelRadius = radius * 0.7;
    const x = Math.cos((labelAngle * Math.PI) / 180) * labelRadius;
    const y = Math.sin((labelAngle * Math.PI) / 180) * labelRadius;
    context.save();
    context.translate(x, y);
    context.rotate((labelAngle * Math.PI) / 180);
    context.fillStyle = '#fff';
    context.font = '600 16px Poppins';
    context.textAlign = 'center';
    context.fillText(reward.label, 0, 0);
    context.restore();
  });

  context.beginPath();
  context.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
  context.fillStyle = 'rgba(255,255,255,0.95)';
  context.fill();

  context.beginPath();
  context.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
  context.strokeStyle = 'rgba(255,255,255,0.35)';
  context.lineWidth = 4;
  context.stroke();

  context.beginPath();
  context.arc(0, 0, radius * 0.42, 0, Math.PI * 2);
  context.strokeStyle = 'rgba(94,231,255,0.32)';
  context.lineWidth = 10;
  context.stroke();

  context.setTransform(1, 0, 0, 1, 0, 0);
}

function renderRewards() {
  elements.rewardList.innerHTML = '';
  if (!state.rewards.length) {
    const empty = document.createElement('li');
    empty.className = 'reward-item';
    empty.textContent = 'No rewards yet. Add one to get started.';
    elements.rewardList.appendChild(empty);
    return;
  }

  state.rewards.forEach((reward, index) => {
    const item = document.createElement('li');
    item.className = 'reward-item';
    item.innerHTML = `
      <div class="reward-chip">
        <span class="color-dot" style="background:${reward.color}"></span>
        <span>${reward.label}</span>
      </div>
      <div class="reward-actions">
        <button class="reward-action-btn" data-action="edit" data-index="${index}">✎</button>
        <button class="reward-action-btn" data-action="delete" data-index="${index}">🗑</button>
      </div>
    `;
    item.querySelector('[data-action="edit"]').addEventListener('click', () => editReward(index));
    item.querySelector('[data-action="delete"]').addEventListener('click', () => deleteReward(index));
    elements.rewardList.appendChild(item);
  });
}

function renderStats() {
  elements.totalSpins.textContent = state.totalSpins;
  elements.totalWins.textContent = state.totalWins;
  elements.lastReward.textContent = state.lastReward;
  const counts = state.history.reduce((accumulator, entry) => {
    accumulator[entry.reward] = (accumulator[entry.reward] || 0) + 1;
    return accumulator;
  }, {});
  const most = Object.entries(counts).sort((left, right) => right[1] - left[1])[0];
  elements.mostFrequent.textContent = most ? most[0] : '—';
  elements.currentRewardLabel.textContent = state.lastReward === '—' ? '—' : state.lastReward;
}

function renderHistory() {
  elements.historyList.innerHTML = '';
  if (!state.history.length) {
    const empty = document.createElement('li');
    empty.className = 'history-item';
    empty.textContent = 'No spins yet';
    elements.historyList.appendChild(empty);
    return;
  }

  const recent = state.history.slice(0, 8);
  recent.forEach((entry) => {
    const item = document.createElement('li');
    item.className = 'history-item';
    item.innerHTML = `
      <div>
        <strong>${entry.reward}</strong>
        <div class="history-meta">${entry.timestamp}</div>
      </div>
      <span class="history-meta">#${entry.id}</span>
    `;
    elements.historyList.appendChild(item);
  });
}

function saveReward(event) {
  event.preventDefault();
  const rewardLabel = elements.rewardLabel.value.trim();
  const rewardColor = elements.rewardColor.value;
  if (!rewardLabel) {
    return;
  }

  if (state.editingId !== null) {
    state.rewards[state.editingId] = { ...state.rewards[state.editingId], label: rewardLabel, color: rewardColor };
    state.editingId = null;
  } else {
    state.rewards.push({ label: rewardLabel, color: rewardColor });
  }

  elements.rewardForm.reset();
  elements.rewardColor.value = '#5ee7ff';
  elements.rewardLabel.focus();
  renderRewards();
  renderWheel();
  saveState();
}

function editReward(index) {
  const reward = state.rewards[index];
  elements.rewardLabel.value = reward.label;
  elements.rewardColor.value = reward.color;
  state.editingId = index;
  elements.rewardLabel.focus();
}

function deleteReward(index) {
  state.rewards.splice(index, 1);
  if (state.editingId === index) {
    state.editingId = null;
  }
  if (state.editingId > index) {
    state.editingId -= 1;
  }
  renderRewards();
  renderWheel();
  saveState();
}

function cancelEdit() {
  state.editingId = null;
  elements.rewardForm.reset();
  elements.rewardColor.value = '#5ee7ff';
}

function randomizeColors() {
  state.rewards = state.rewards.map((reward) => ({
    ...reward,
    color: `hsl(${Math.floor(Math.random() * 360)} 80% 60%)`
  }));
  renderRewards();
  renderWheel();
  saveState();
}

function exportHistory() {
  const payload = JSON.stringify(state.history, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'spin-history.json';
  link.click();
  URL.revokeObjectURL(url);
}

function importRewards(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = function handleFileLoad() {
    try {
      const payload = JSON.parse(reader.result);
      if (Array.isArray(payload)) {
        state.rewards = payload.map((item) => ({
          label: item.label || 'Reward',
          color: item.color || '#5ee7ff'
        }));
        renderRewards();
        renderWheel();
        saveState();
      }
    } catch (error) {
      alert('Unable to import rewards from this file.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function spinWheel() {
  if (state.isSpinning || !state.rewards.length) {
    return;
  }

  state.isSpinning = true;
  elements.pointer.classList.add('spinning');
  elements.wheelCanvas.parentElement.classList.add('spinning');
  elements.statusPill.textContent = 'Spinning...';
  playSpinSound();
  state.totalSpins += 1;
  renderStats();

  const segmentAngle = 360 / state.rewards.length;
  const winnerIndex = Math.floor(Math.random() * state.rewards.length);
  const spins = 7 + Math.floor(Math.random() * 4);
  const targetRotation = state.rotation + spins * 360 + winnerIndex * segmentAngle;
  const startRotation = state.rotation;
  const duration = state.spinDuration * 1000;
  const startTime = performance.now();

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(1, elapsed / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    state.rotation = startRotation + (targetRotation - startRotation) * eased;
    renderWheel();

    if (progress < 1) {
      if (elapsed % 140 < 20) {
        playTickSound();
      }
      requestAnimationFrame(animate);
    } else {
      state.rotation = targetRotation;
      renderWheel();
      state.isSpinning = false;
      elements.pointer.classList.remove('spinning');
      elements.wheelCanvas.parentElement.classList.remove('spinning');
      const reward = state.rewards[winnerIndex];
      state.lastReward = reward.label;
      state.totalWins += 1;
      const entry = {
        id: state.history.length + 1,
        reward: reward.label,
        timestamp: new Date().toLocaleString()
      };
      state.history.unshift(entry);
      state.history = state.history.slice(0, 12);
      renderStats();
      renderHistory();
      saveState();
      showWinnerModal(reward);
    }
  }

  requestAnimationFrame(animate);
}

function showWinnerModal(reward) {
  clearTimeout(modalTimer);
  elements.winnerText.textContent = `The wheel landed on ${reward.label}.`;
  elements.winnerBadge.textContent = reward.label;
  elements.winnerBadge.style.background = reward.color;
  elements.winnerModal.classList.remove('hidden');
  playWinnerSound();
  createConfetti();
  createFireworks();
  modalTimer = setTimeout(() => closeModal(), 6000);
}

function closeModal() {
  clearTimeout(modalTimer);
  elements.winnerModal.classList.add('hidden');
  document.querySelectorAll('.confetti-piece, .firework-piece').forEach((el) => el.remove());
}

function createConfetti() {
  const count = 48;
  for (let index = 0; index < count; index += 1) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${50 + Math.random() * 20 - 10}%`;
    piece.style.top = '10%';
    piece.style.background = state.rewards[Math.floor(Math.random() * state.rewards.length)]?.color || '#5ee7ff';
    piece.style.setProperty('--x', `${(Math.random() - 0.5) * 400}px`);
    piece.style.setProperty('--y', `${160 + Math.random() * 260}px`);
    piece.style.animationDelay = `${Math.random() * 0.2}s`;
    elements.winnerModal.appendChild(piece);
  }
}

function createFireworks() {
  const burstCount = 4;
  for (let index = 0; index < burstCount; index += 1) {
    const originX = 32 + Math.random() * 36;
    const originY = 24 + Math.random() * 28;
    for (let dot = 0; dot < 12; dot += 1) {
      const piece = document.createElement('div');
      piece.className = 'firework-piece';
      piece.style.left = `${originX}%`;
      piece.style.top = `${originY}%`;
      piece.style.background = state.rewards[Math.floor(Math.random() * state.rewards.length)]?.color || '#ffd166';
      const angle = (dot / 12) * 2 * Math.PI;
      const distance = 70 + Math.random() * 40;
      piece.style.setProperty('--x', `${Math.cos(angle) * distance}px`);
      piece.style.setProperty('--y', `${Math.sin(angle) * distance}px`);
      elements.winnerModal.appendChild(piece);
    }
  }
}

function playSpinSound() {
  if (!state.soundEnabled) {
    return;
  }
  setupAudio();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(420, audioContext.currentTime + 0.3);
  gain.gain.setValueAtTime(0.03, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.3);
}

function playTickSound() {
  if (!state.soundEnabled) {
    return;
  }
  setupAudio();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(720, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 0.08);
  gain.gain.setValueAtTime(0.008, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.08);
}

function playWinnerSound() {
  if (!state.soundEnabled) {
    return;
  }
  setupAudio();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(530, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(860, audioContext.currentTime + 0.2);
  oscillator.frequency.exponentialRampToValueAtTime(640, audioContext.currentTime + 0.5);
  gain.gain.setValueAtTime(0.03, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.6);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.6);
}

function setupAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

initialize();
