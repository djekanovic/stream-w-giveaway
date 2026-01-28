// Giveaway Bot - Content Script
// Injects draggable panel and reads chat

(function() {
  'use strict';

  // Prevent multiple injections
  if (window.__giveawayBotLoaded) return;
  window.__giveawayBotLoaded = true;

  // Only show panel in top frame to prevent duplicates
  const isTopFrame = window === window.top;

  // ============================================
  // STATE
  // ============================================
  const state = {
    isRunning: false,
    debugMode: false,
    participants: new Map(),
    keyword: '',
    prize: '',
    duration: 15,
    timeRemaining: 0,
    winner: null,
    timerInterval: null,
    observer: null,
    processedMessages: new Set(),
    panelVisible: false,
    allMessagesLog: [], // Log all messages for accuracy verification
    language: 'en', // Current language
    duplicateAttempts: 0, // Count of duplicate message attempts
    botsFiltered: 0 // Count of bots filtered out
  };

  // ============================================
  // TRANSLATIONS
  // ============================================
  const translations = {
    en: {
      instructions: 'Enter keyword from chat to participate:',
      keyword: 'Keyword:',
      keywordPlaceholder: '!giveaway (Leave empty for all messages)',
      prize: 'Prize:',
      prizePlaceholder: '50€',
      duration: 'Duration (seconds):',
      debugMode: '🔧 Debug Mode',
      debugHint: 'Capture ALL messages',
      participants: 'Participants',
      participantsLabel: 'Participants:',
      winner: '🏆 WINNER 🏆',
      prizeLabel: 'Prize:',
      btnStart: 'START',
      btnStop: 'STOP',
      btnReset: 'RESET',
      btnLogs: 'LOGS',
      statusReady: 'Ready',
      statusRunning: 'Giveaway running...',
      statusNoParticipants: 'No participants found',
      statusNoKeyword: 'Please enter a keyword',
      statusWinner: 'Winner from {count} participants!',
      statusPlatform: 'Platform: {platform}',
      statusChatConnected: 'Chat connected! ({platform})',
      statusChatNotFound: 'Chat not found, retrying...',
      processing: 'Processing participants...'
    },
    sr: {
      instructions: 'Unesite ključnu reč iz chata za učešće:',
      keyword: 'Ključna reč:',
      keywordPlaceholder: '!nagrada (Ostavite prazno za sve poruke)',
      prize: 'Nagrada:',
      prizePlaceholder: '50€',
      duration: 'Trajanje (sekunde):',
      debugMode: '🔧 Debug Mod',
      debugHint: 'Uhvati SVE poruke',
      participants: 'Učesnici',
      participantsLabel: 'Učesnici:',
      winner: '🏆 POBEDNIK 🏆',
      prizeLabel: 'Nagrada:',
      btnStart: 'POKRENI',
      btnStop: 'ZAUSTAVI',
      btnReset: 'RESETUJ',
      btnLogs: 'LOGOVI',
      statusReady: 'Spreman',
      statusRunning: 'Nagradna igra u toku...',
      statusNoParticipants: 'Nema učesnika',
      statusNoKeyword: 'Molimo unesite ključnu reč',
      statusWinner: 'Pobednik od {count} učesnika!',
      statusPlatform: 'Platforma: {platform}',
      statusChatConnected: 'Chat povezan! ({platform})',
      statusChatNotFound: 'Chat nije pronađen, pokušavam ponovo...',
      processing: 'Obrađujem učesnike...'
    }
  };

  function t(key, params = {}) {
    let text = translations[state.language][key] || key;
    // Replace placeholders
    Object.keys(params).forEach(param => {
      text = text.replace(`{${param}}`, params[param]);
    });
    return text;
  }

  // ============================================
  // PLATFORM DETECTION
  // ============================================
  const PLATFORM_SELECTORS = {
    kick: {
      container: '#chatroom-messages',
      message: 'div[data-index]',
      username: 'button[data-prevent-expand="true"], button.inline.font-bold[title]',
      text: 'span.font-normal, span[class*="leading-"]'
    },
    twitch: {
      container: '.chat-scrollable-area__message-container, [data-test-selector="chat-scrollable-area__message-container"], .chat-list--default, .chat-list',
      message: '.chat-line__message, [data-a-target="chat-line-message"]',
      username: '.chat-author__display-name, [data-a-target="chat-message-username"]',
      text: '[data-a-target="chat-message-text"], .message, .text-fragment'
    },
    youtube: {
      container: 'yt-live-chat-item-list-renderer #items, #items.yt-live-chat-item-list-renderer, #item-list #items, #chat #items',
      message: 'yt-live-chat-text-message-renderer',
      username: '#author-name, yt-live-chat-author-chip #author-name',
      text: '#message, yt-formatted-string#message'
    }
  };

  // ============================================
  // BOT BLACKLIST
  // ============================================
  // Common bot usernames to exclude from giveaways
  const BOT_BLACKLIST = [
    'streamelements',
    'nightbot',
    'moobot',
    'streamlabs',
    'fossabot',
    'wizebot',
    'ohbot',
    'deepbot',
    'ankhbot',
    'coebot',
    'xanbot',
    'botisimo',
    'cloudbot',
    'twitchbot',
    'phantombot',
    'vivbot',
    'supibot',
    'stay_hydrated_bot',
    'commanderroot',
    'soundalerts',
    'pokemoncommunitygame',
    'pretzelrocks',
    'sery_bot'
  ];

  function detectPlatform() {
    const url = window.location.href;
    const hostname = window.location.hostname;
    if (hostname.includes('kick.com')) return 'kick';
    if (hostname.includes('twitch.tv')) return 'twitch';
    if (hostname.includes('youtube.com') || url.includes('live_chat')) return 'youtube';
    return null;
  }

  // ============================================
  // UI CREATION
  // ============================================
  function createPanel() {
    // Remove existing panel if any
    const existing = document.getElementById('giveaway-bot-panel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = 'giveaway-bot-panel';
    panel.innerHTML = `
      <div class="gb-header">
        <div class="gb-header-title">
          <img class="gb-logo" src="${chrome.runtime.getURL('logo.png')}" alt="Stream W logo" />
          <div class="gb-title-group">
            <h1>Stream W</h1>
            <p class="gb-subtitle">Open Source Stream Giveaway</p>
          </div>
        </div>
        <div class="gb-header-actions">
          <div class="gb-lang-switcher">
            <button class="gb-lang-btn ${state.language === 'en' ? 'active' : ''}" data-lang="en" title="English">🇺🇸</button>
            <button class="gb-lang-btn ${state.language === 'sr' ? 'active' : ''}" data-lang="sr" title="Српски">🇷🇸</button>
          </div>
          <button class="gb-close-btn" id="gb-close">&times;</button>
        </div>
      </div>
      <div class="gb-content">
        <p class="gb-instructions" data-i18n="instructions">${t('instructions')}</p>

        <div class="gb-input-group">
          <label data-i18n="keyword">${t('keyword')}</label>
          <input type="text" id="gb-keyword" placeholder="${t('keywordPlaceholder')}" autocomplete="off" data-i18n-placeholder="keywordPlaceholder">
        </div>

        <div class="gb-input-group">
          <label data-i18n="prize">${t('prize')}</label>
          <input type="text" id="gb-prize" placeholder="${t('prizePlaceholder')}" autocomplete="off" data-i18n-placeholder="prizePlaceholder">
        </div>

        <div class="gb-input-group">
          <label data-i18n="duration">${t('duration')}</label>
          <input type="number" id="gb-duration" placeholder="15" min="5" max="600" value="15">
        </div>

        <!-- DEBUG MODE - Commented out but kept for potential future use
        <div class="gb-toggle-group">
          <div>
            <div class="gb-toggle-label" data-i18n="debugMode">${t('debugMode')}</div>
            <div class="gb-toggle-hint" data-i18n="debugHint">${t('debugHint')}</div>
          </div>
          <label class="gb-toggle">
            <input type="checkbox" id="gb-debug">
            <span class="gb-toggle-slider"></span>
          </label>
        </div>
        -->

        <div class="gb-stats">
          <div class="gb-count" id="gb-count">0</div>
          <p class="gb-stats-label" data-i18n="participants">${t('participants')}</p>
          <div class="gb-timer" id="gb-timer"></div>
        </div>

        <div class="gb-participants" id="gb-participants">
          <div class="gb-list-header" data-i18n="participantsLabel">${t('participantsLabel')}</div>
          <ul id="gb-list"></ul>
        </div>

        <div class="gb-winner" id="gb-winner">
          <div class="gb-winner-label" data-i18n="winner">${t('winner')}</div>
          <div class="gb-winner-name" id="gb-winner-name"></div>
          <div class="gb-winner-prize" id="gb-winner-prize"></div>
        </div>

        <button class="gb-btn gb-btn-start" id="gb-start">
          <span class="gb-btn-icon">▶</span> <span data-i18n="btnStart">${t('btnStart')}</span>
        </button>

        <button class="gb-btn gb-btn-stop hidden" id="gb-stop">
          <span class="gb-btn-icon">■</span> <span data-i18n="btnStop">${t('btnStop')}</span>
        </button>

        <button class="gb-btn gb-btn-reset hidden" id="gb-reset">
          <span class="gb-btn-icon">↺</span> <span data-i18n="btnReset">${t('btnReset')}</span>
        </button>

        <button class="gb-btn gb-btn-logs hidden" id="gb-logs">
          <span class="gb-btn-icon">📋</span> <span data-i18n="btnLogs">${t('btnLogs')}</span>
        </button>

        <div class="gb-status" id="gb-status"></div>

        <div class="gb-footer">
          Made by: <a href="https://www.instagram.com/djekanovic/" target="_blank" rel="noopener noreferrer">djekanovic</a> • <a href="https://ko-fi.com/djekanovic" target="_blank" rel="noopener noreferrer">Support 🤍</a>
        </div>
      </div>

      <div class="gb-processing" id="gb-processing">
        <div class="gb-spinner"></div>
        <div class="gb-processing-text" data-i18n="processing">${t('processing')}</div>
      </div>

      <div class="gb-logs-modal" id="gb-logs-modal">
        <div class="gb-logs-content">
          <div class="gb-logs-header">
            <h2>Giveaway Logs</h2>
            <button class="gb-logs-close" id="gb-logs-close">&times;</button>
          </div>
          <div class="gb-logs-body" id="gb-logs-body"></div>
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    // Create confetti canvas
    let confettiCanvas = document.getElementById('giveaway-confetti-canvas');
    if (!confettiCanvas) {
      confettiCanvas = document.createElement('canvas');
      confettiCanvas.id = 'giveaway-confetti-canvas';
      document.body.appendChild(confettiCanvas);
    }

    setupEventListeners();
    setupDragging();

    return panel;
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================
  function setupEventListeners() {
    const $ = id => document.getElementById(id);

    $('gb-close').addEventListener('click', hidePanel);
    $('gb-start').addEventListener('click', startGiveaway);
    $('gb-stop').addEventListener('click', stopGiveaway);
    $('gb-reset').addEventListener('click', resetGiveaway);
    $('gb-logs').addEventListener('click', showLogs);
    $('gb-logs-close').addEventListener('click', hideLogs);

    // DEBUG MODE - Commented out but kept for potential future use
    /*
    $('gb-debug').addEventListener('change', (e) => {
      state.debugMode = e.target.checked;
      const keywordInput = $('gb-keyword');
      if (state.debugMode) {
        keywordInput.placeholder = 'Any message (debug)';
        keywordInput.disabled = true;
      } else {
        keywordInput.placeholder = t('keywordPlaceholder');
        keywordInput.disabled = false;
      }
    });
    */

    // Language switcher
    document.querySelectorAll('.gb-lang-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lang = e.target.getAttribute('data-lang');
        switchLanguage(lang);
      });
    });
  }

  function switchLanguage(lang) {
    state.language = lang;
    localStorage.setItem('giveaway-bot-language', lang);

    // Update all text elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = t(key);
    });

    // Update active language button
    document.querySelectorAll('.gb-lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    // Update prize label if winner is shown
    const winnerPrize = document.getElementById('gb-winner-prize');
    if (winnerPrize && state.prize && document.getElementById('gb-winner').classList.contains('show')) {
      winnerPrize.textContent = `${t('prizeLabel')} ${state.prize}`;
    }

    // Update status message if exists
    const platform = detectPlatform();
    if (platform && !state.isRunning) {
      setStatus(t('statusPlatform', { platform }), 'success');
    }
  }

  // ============================================
  // DRAGGING
  // ============================================
  function setupDragging() {
    const panel = document.getElementById('giveaway-bot-panel');
    const header = panel.querySelector('.gb-header');

    let isDragging = false;
    let startX, startY, initialX, initialY;

    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('.gb-close-btn')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = panel.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      panel.style.transition = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      panel.style.left = `${initialX + dx}px`;
      panel.style.top = `${initialY + dy}px`;
      panel.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      panel.style.transition = '';
    });
  }

  // ============================================
  // LOCAL STORAGE
  // ============================================
  function loadSettings() {
    try {
      // Load language preference
      const savedLang = localStorage.getItem('giveaway-bot-language');
      if (savedLang && translations[savedLang]) {
        state.language = savedLang;
      }

      // Load giveaway settings
      const saved = localStorage.getItem('giveaway-bot-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings.keyword !== undefined) document.getElementById('gb-keyword').value = settings.keyword;
        if (settings.prize !== undefined) document.getElementById('gb-prize').value = settings.prize;
        if (settings.duration !== undefined) document.getElementById('gb-duration').value = settings.duration;
      }
    } catch (e) {
      console.error('[GiveawayBot] Failed to load settings:', e);
    }
  }

  function saveSettings(keyword, prize, duration) {
    try {
      const settings = { keyword, prize, duration };
      localStorage.setItem('giveaway-bot-settings', JSON.stringify(settings));
    } catch (e) {
      console.error('[GiveawayBot] Failed to save settings:', e);
    }
  }

  // ============================================
  // PANEL VISIBILITY
  // ============================================
  function showPanel() {
    if (!isTopFrame) return; // Only show in top frame

    // Load language preference BEFORE creating panel
    const savedLang = localStorage.getItem('giveaway-bot-language');
    if (savedLang && translations[savedLang]) {
      state.language = savedLang;
    }

    let panel = document.getElementById('giveaway-bot-panel');
    if (!panel) panel = createPanel();
    panel.classList.add('visible');
    state.panelVisible = true;
    loadSettings(); // Load saved settings when panel is shown
    const platform = detectPlatform() || 'unknown';
    setStatus(t('statusPlatform', { platform }), 'success');
  }

  function hidePanel() {
    const panel = document.getElementById('giveaway-bot-panel');
    if (panel) panel.classList.remove('visible');
    state.panelVisible = false;
  }

  function togglePanel() {
    if (!isTopFrame) return; // Only toggle in top frame
    if (state.panelVisible) {
      hidePanel();
    } else {
      showPanel();
    }
  }

  // ============================================
  // GIVEAWAY LOGIC
  // ============================================
  function setStatus(msg, type = '') {
    const el = document.getElementById('gb-status');
    if (el) {
      el.textContent = msg;
      el.className = 'gb-status ' + type;
    }
  }

  function startGiveaway() {
    const keyword = document.getElementById('gb-keyword').value.trim();
    const prize = document.getElementById('gb-prize').value.trim();
    const duration = parseInt(document.getElementById('gb-duration').value) || 15;

    // Allow empty keyword to capture all messages (replaces debug mode)
    // No validation needed - empty keyword is valid

    // Save settings to localStorage
    saveSettings(keyword, prize, duration);

    state.keyword = keyword;
    state.prize = prize;
    state.duration = duration;
    state.timeRemaining = duration;
    state.isRunning = true;
    state.participants.clear();
    state.processedMessages.clear();
    state.allMessagesLog = [];
    state.duplicateAttempts = 0;
    state.botsFiltered = 0;

    // Update UI
    document.getElementById('gb-start').classList.add('hidden');
    document.getElementById('gb-stop').classList.remove('hidden');
    document.getElementById('gb-winner').classList.remove('show');
    document.getElementById('gb-keyword').disabled = true;
    document.getElementById('gb-prize').disabled = true;
    document.getElementById('gb-duration').disabled = true;
    // document.getElementById('gb-debug').disabled = true; // Debug mode commented out

    updateCount();
    setStatus(t('statusRunning'), 'success');

    // Start observing chat in this frame
    startObserving();

    // Broadcast to all frames (for iframes with chat)
    chrome.runtime.sendMessage({
      action: 'BROADCAST_TO_FRAMES',
      payload: {
        action: 'START_OBSERVING',
        keyword: state.keyword,
        debugMode: state.debugMode
      }
    });

    // Start timer
    startTimer();
  }

  function stopGiveaway() {
    endGiveaway(true);
  }

  async function endGiveaway(manual = false) {
    clearInterval(state.timerInterval);
    state.isRunning = false;

    stopObserving();

    // Broadcast stop to all frames
    chrome.runtime.sendMessage({
      action: 'BROADCAST_TO_FRAMES',
      payload: { action: 'STOP_OBSERVING' }
    });

    document.getElementById('gb-stop').classList.add('hidden');

    if (state.participants.size === 0) {
      setStatus(t('statusNoParticipants'), 'error');
      document.getElementById('gb-start').classList.remove('hidden');
      enableInputs();
      return;
    }

    // Show processing
    document.getElementById('gb-processing').classList.add('show');
    await new Promise(r => setTimeout(r, 500 + Math.min(state.participants.size, 1000)));
    document.getElementById('gb-processing').classList.remove('show');

    pickWinner();
  }

  function pickWinner() {
    const participants = Array.from(state.participants.values());

    if (participants.length === 0) {
      setStatus(t('statusNoParticipants'), 'error');
      return;
    }

    // Cryptographically secure random
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const winnerIndex = randomBuffer[0] % participants.length;
    const winner = participants[winnerIndex];

    state.winner = winner;

    // Show winner
    document.getElementById('gb-winner-name').textContent = winner.username;
    document.getElementById('gb-winner-prize').textContent = state.prize ? `${t('prizeLabel')} ${state.prize}` : '';
    document.getElementById('gb-winner').classList.add('show');

    document.getElementById('gb-reset').classList.remove('hidden');
    document.getElementById('gb-logs').classList.remove('hidden');
    setStatus(t('statusWinner', { count: participants.length }), 'success');

    // Confetti!
    startConfetti();
  }

  function resetGiveaway() {
    clearInterval(state.timerInterval);
    state.isRunning = false;
    state.participants.clear();
    state.winner = null;
    state.processedMessages.clear();

    // Don't clear the values, just keep the last used settings
    document.getElementById('gb-count').textContent = '0';
    document.getElementById('gb-list').innerHTML = '';
    document.getElementById('gb-timer').textContent = '';
    document.getElementById('gb-timer').classList.remove('warning');
    document.getElementById('gb-winner').classList.remove('show');
    document.getElementById('gb-start').classList.remove('hidden');
    document.getElementById('gb-stop').classList.add('hidden');
    document.getElementById('gb-reset').classList.add('hidden');
    document.getElementById('gb-logs').classList.add('hidden');

    enableInputs();

    // Clear confetti
    const canvas = document.getElementById('giveaway-confetti-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    setStatus(t('statusReady'), '');
  }

  function showLogs() {
    const modal = document.getElementById('gb-logs-modal');
    const logsBody = document.getElementById('gb-logs-body');

    // Build logs HTML
    let logsHTML = '<div class="gb-logs-section">';
    logsHTML += '<h3>📊 Giveaway Summary</h3>';
    logsHTML += `<p><strong>Keyword:</strong> ${state.keyword || '(All messages)'}</p>`;
    logsHTML += `<p><strong>Prize:</strong> ${state.prize || 'N/A'}</p>`;
    logsHTML += `<p><strong>Duration:</strong> ${state.duration} seconds</p>`;
    logsHTML += `<p><strong>Total Participants:</strong> ${state.participants.size}</p>`;
    logsHTML += `<p><strong>Total Messages:</strong> ${state.allMessagesLog.length}</p>`;
    logsHTML += `<p><strong>Duplicate Messages Blocked:</strong> ${state.duplicateAttempts}</p>`;
    logsHTML += `<p><strong>Bots Filtered:</strong> ${state.botsFiltered}</p>`;
    if (state.winner) {
      logsHTML += `<p><strong>Winner:</strong> ${state.winner.username}</p>`;
    }
    logsHTML += '</div>';

    // Participants list
    logsHTML += '<div class="gb-logs-section">';
    logsHTML += '<h3>👥 Participants</h3>';
    if (state.participants.size > 0) {
      logsHTML += '<ul class="gb-logs-list">';
      const participants = Array.from(state.participants.values());
      participants.forEach((p, i) => {
        const time = new Date(p.timestamp).toLocaleTimeString();
        logsHTML += `<li><span class="num">${i + 1}.</span> <span class="user">${p.username}</span> <span class="time">${time}</span></li>`;
      });
      logsHTML += '</ul>';
    } else {
      logsHTML += '<p class="gb-logs-empty">No participants</p>';
    }
    logsHTML += '</div>';

    // All messages log
    logsHTML += '<div class="gb-logs-section">';
    logsHTML += '<h3>💬 All Messages</h3>';
    if (state.allMessagesLog.length > 0) {
      logsHTML += '<ul class="gb-logs-list">';
      state.allMessagesLog.forEach((msg, i) => {
        const time = new Date(msg.timestamp).toLocaleTimeString();
        logsHTML += `<li><span class="time">${time}</span> <span class="user">${msg.username}:</span> ${msg.message}</li>`;
      });
      logsHTML += '</ul>';
    } else {
      logsHTML += '<p class="gb-logs-empty">No messages captured</p>';
    }
    logsHTML += '</div>';

    logsBody.innerHTML = logsHTML;
    modal.classList.add('show');
  }

  function hideLogs() {
    const modal = document.getElementById('gb-logs-modal');
    modal.classList.remove('show');
  }

  function enableInputs() {
    document.getElementById('gb-keyword').disabled = false;
    document.getElementById('gb-prize').disabled = false;
    document.getElementById('gb-duration').disabled = false;
    // document.getElementById('gb-debug').disabled = false; // Debug mode commented out
  }

  function startTimer() {
    updateTimerDisplay();
    state.timerInterval = setInterval(() => {
      state.timeRemaining--;
      updateTimerDisplay();
      if (state.timeRemaining <= 0) {
        endGiveaway();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const timer = document.getElementById('gb-timer');
    const mins = Math.floor(state.timeRemaining / 60);
    const secs = state.timeRemaining % 60;
    timer.textContent = `⏱️ ${mins}:${secs.toString().padStart(2, '0')}`;
    if (state.timeRemaining <= 10) {
      timer.classList.add('warning');
    } else {
      timer.classList.remove('warning');
    }
  }

  function updateCount() {
    document.getElementById('gb-count').textContent = state.participants.size;
  }

  function updateList() {
    const list = document.getElementById('gb-list');
    const participants = Array.from(state.participants.values());
    list.innerHTML = participants.map((p, i) => {
      return `<li><span class="num">${i + 1}.</span><span class="user">${escapeHtml(p.username)}</span></li>`;
    }).join('');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================
  // CHAT OBSERVER
  // ============================================
  function startObserving() {
    const platform = detectPlatform();
    if (!platform) {
      setStatus('Unknown platform', 'error');
      return;
    }

    const selectors = PLATFORM_SELECTORS[platform];

    // Find chat container
    let container = null;
    const containerSelectors = selectors.container.split(', ');

    for (const sel of containerSelectors) {
      container = document.querySelector(sel);
      if (container) break;
    }

    if (!container) {
      // Try broader search for Kick and other platforms
      const possibleContainers = document.querySelectorAll('[class*="chat"], [id*="chat"], [class*="Chat"], [id*="Chat"], [class*="chatroom"], [class*="messages"]');
      for (const el of possibleContainers) {
        // Look for scrollable containers with multiple children (likely chat messages)
        const style = window.getComputedStyle(el);
        const isScrollable = style.overflowY === 'auto' || style.overflowY === 'scroll';
        if (el.children.length > 3 || isScrollable) {
          container = el;
          console.log('[GiveawayBot] Found chat via fallback:', el.className || el.id);
          break;
        }
      }
    }

    if (!container) {
      setStatus(t('statusChatNotFound'), 'error');
      setTimeout(startObserving, 1000);
      return;
    }

    console.log('[GiveawayBot] Found chat container:', container);
    setStatus(t('statusChatConnected', { platform }), 'success');

    // Mark all existing messages as "old" so we only capture NEW messages
    const markerId = `gb-seen-${Date.now()}`;
    const msgSelectors = selectors.message.split(', ');
    for (const sel of msgSelectors) {
      container.querySelectorAll(sel).forEach(el => {
        el.setAttribute('data-gb-old', markerId);
      });
    }

    // Create observer - only process messages without the marker
    state.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Process immediately, don't wait for requestAnimationFrame
            // Check if this element or its children match message selectors
            const messagesToProcess = [];

            // Check if the node itself is a message
            for (const sel of msgSelectors) {
              if (node.matches && node.matches(sel)) {
                if (!node.hasAttribute('data-gb-old')) {
                  messagesToProcess.push(node);
                }
                break;
              }
            }

            // Check children for messages
            for (const sel of msgSelectors) {
              const childMessages = node.querySelectorAll ? node.querySelectorAll(sel) : [];
              childMessages.forEach(msg => {
                if (!msg.hasAttribute('data-gb-old')) {
                  messagesToProcess.push(msg);
                }
              });
            }

            // Process all new messages found
            messagesToProcess.forEach(msg => {
              msg.setAttribute('data-gb-old', markerId); // Mark as processed
              processElement(msg, selectors);
            });
          }
        }
      }
    });

    state.observer.observe(container, {
      childList: true,
      subtree: true
    });

    console.log('[GiveawayBot] Started observing');
  }

  function stopObserving() {
    if (state.observer) {
      state.observer.disconnect();
      state.observer = null;
    }

    // Log summary
    console.log('[GiveawayBot] Giveaway ended. Total messages logged:', state.allMessagesLog.length);
    console.log('[GiveawayBot] Total unique participants:', state.participants.size);
  }

  function processElement(element, selectors) {
    if (!state.isRunning) return;

    // Extract username
    let username = '';
    const usernameSelectors = selectors.username.split(', ');
    for (const sel of usernameSelectors) {
      const el = element.matches(sel) ? element : element.querySelector(sel);
      if (el) {
        username = el.textContent?.trim() ||
                   el.getAttribute('data-username') ||
                   el.getAttribute('data-chat-entry-user-id') ||
                   el.getAttribute('title') ||
                   '';
        if (username) break;
      }
    }

    // Kick fallback: look for any link/button in the message that looks like a username
    if (!username && detectPlatform() === 'kick') {
      const usernameEl = element.querySelector('a[href*="/"], button') ||
                         element.querySelector('[class*="username"], [class*="author"]');
      if (usernameEl) {
        username = usernameEl.textContent?.trim() || '';
      }
    }

    // Extract message text
    let messageText = '';
    const textSelectors = selectors.text.split(', ');
    for (const sel of textSelectors) {
      const el = element.matches(sel) ? element : element.querySelector(sel);
      if (el) {
        messageText = el.textContent?.trim() || '';
        if (messageText) break;
      }
    }

    // Fallback: get all text content
    if (!messageText) {
      messageText = element.textContent?.trim() || '';
    }

    if (!username) return;

    // Log all messages for verification (with timestamp)
    const logEntry = {
      username: username,
      message: messageText,
      timestamp: Date.now(),
      time: new Date().toISOString()
    };
    state.allMessagesLog.push(logEntry);

    // Check keyword (or debug mode)
    // Match keyword (or all messages if keyword is empty)
    const matchesKeyword = !state.keyword ||
      messageText.toLowerCase().includes(state.keyword.toLowerCase());

    if (!matchesKeyword) {
      return;
    }

    // Filter out bots from the blacklist
    const userKey = username.toLowerCase();
    if (BOT_BLACKLIST.includes(userKey)) {
      state.botsFiltered++;
      console.log('[GiveawayBot] Bot filtered out:', username);
      return;
    }

    // Deduplicate by username (each user can only enter once)
    if (state.processedMessages.has(userKey)) {
      state.duplicateAttempts++;
      console.log('[GiveawayBot] Duplicate entry attempt:', username);
      return;
    }

    state.processedMessages.add(userKey);

    // Add participant IMMEDIATELY (no buffering)
    const participant = {
      username: username,
      timestamp: Date.now()
    };

    state.participants.set(userKey, participant);
    console.log('[GiveawayBot] New participant:', username, '(Total:', state.participants.size + ')');

    // If in iframe, send to top frame immediately
    if (!isTopFrame) {
      chrome.runtime.sendMessage({
        action: 'BROADCAST_TO_FRAMES',
        payload: {
          action: 'ADD_PARTICIPANTS',
          participants: [participant]
        }
      });
    }

    // Update UI immediately
    if (isTopFrame) {
      updateCount();
      updateList();
    }
  }

  // ============================================
  // CONFETTI
  // ============================================
  function startConfetti() {
    const canvas = document.getElementById('giveaway-confetti-canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const confetti = [];
    const colors = ['#00ff88', '#00ccff', '#ffd700', '#ff6b6b', '#6c5ce7', '#fd79a8'];

    for (let i = 0; i < 150; i++) {
      confetti.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: Math.random() * 10 + 5,
        h: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 3 + 2,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2,
        drift: (Math.random() - 0.5) * 2
      });
    }

    let frameCount = 0;
    const maxFrames = 300;

    function animate() {
      if (frameCount >= maxFrames) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      confetti.forEach(p => {
        p.y += p.speed;
        p.x += p.drift;
        p.angle += p.spin;

        ctx.save();
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();

        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
      });

      frameCount++;
      requestAnimationFrame(animate);
    }

    animate();
  }

  // ============================================
  // MESSAGE LISTENER
  // ============================================
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'TOGGLE_PANEL' && isTopFrame) {
      togglePanel();
      sendResponse({ success: true });
    }
    // Cross-frame giveaway control
    if (message.action === 'START_OBSERVING') {
      state.keyword = message.keyword;
      state.debugMode = message.debugMode;
      state.isRunning = true;
      state.processedMessages.clear();
      startObserving();
      sendResponse({ success: true });
    }
    if (message.action === 'STOP_OBSERVING') {
      state.isRunning = false;
      stopObserving();
      sendResponse({ success: true });
    }
    // Receive participants from iframes (top frame only)
    if (message.action === 'ADD_PARTICIPANTS' && isTopFrame) {
      for (const p of message.participants) {
        const key = p.username.toLowerCase();
        if (!state.participants.has(key)) {
          state.participants.set(key, p);
        }
      }
      updateCount();
      updateList();
      sendResponse({ success: true });
    }
    return true;
  });

  // ============================================
  // KEYBOARD SHORTCUT (backup for F4)
  // ============================================
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F4' && isTopFrame) {
      e.preventDefault();
      togglePanel();
    }
  });

  // ============================================
  // INIT
  // ============================================
  console.log('[GiveawayBot] Content script loaded');

  // Expose state for debugging
  if (isTopFrame) {
    window.giveawayBotDebug = {
      getParticipants: () => Array.from(state.participants.values()),
      getMessageLog: () => state.allMessagesLog,
      exportLog: () => {
        console.table(state.allMessagesLog);
        console.log('Total messages:', state.allMessagesLog.length);
        console.log('Unique participants:', state.participants.size);
        return {
          messages: state.allMessagesLog,
          participants: Array.from(state.participants.values())
        };
      }
    };
    console.log('[GiveawayBot] Debug commands available: window.giveawayBotDebug.exportLog()');
  }

})();
