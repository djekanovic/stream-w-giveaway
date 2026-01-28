# Giveaway Extension - Architecture & Core Logic

## Overview
This Chrome extension captures chat messages from Kick, Twitch, and YouTube live streams to run fair giveaways. It ensures 100% accuracy by capturing every message from the moment START is pressed.

## Critical Design Principles

### 1. **IMMEDIATE PROCESSING - NO BUFFERING**
Messages are processed **immediately** when detected. There is NO buffering or batching.

**Why:** With high-volume chat (popular streamers), buffering causes missed messages. Every millisecond counts.

```javascript
// ❌ NEVER DO THIS - Buffering causes delays
state.messageBuffer.push(username);
setInterval(flushBuffer, 100);

// ✅ ALWAYS DO THIS - Immediate processing
state.participants.set(userKey, participant);
updateUI();
```

### 2. **CAPTURE ONLY NEW MESSAGES**
The extension must ONLY capture messages that arrive AFTER the START button is pressed. Historical/existing chat messages are ignored.

**Implementation:** Uses grace period + `data-gb-old` attribute marking + message ID tracking (YouTube)
- When `startObserving()` is called, ALL existing messages get marked with `data-gb-old` attribute
- **Grace period:** ALL messages detected during grace period are ignored and marked as old
  - All platforms: 200ms (prevents capturing historical messages from re-renders while minimizing delay)
- **YouTube-specific:** Message IDs are tracked in a Set to prevent re-rendered messages from being captured
- **Visibility check:** Only processes messages when tab/iframe is visible
- After grace period: MutationObserver processes elements WITHOUT the `data-gb-old` attribute
- New messages are marked immediately after detection to prevent duplicates

```javascript
// Mark existing messages as "old" when starting
container.querySelectorAll(messageSelector).forEach(el => {
  el.setAttribute('data-gb-old', markerId);
  // YouTube: also store message ID for extra protection
  if (platform === 'youtube') {
    const msgId = el.id;
    if (msgId) state.seenMessageIds.add(msgId);
  }
});

// Grace period check (200ms for all platforms)
const GRACE_PERIOD_MS = 200;
const timeSinceStart = Date.now() - state.observerStartTime;
if (timeSinceStart < GRACE_PERIOD_MS) {
  // Mark but don't process during grace period
  messagesToProcess.forEach(msg => {
    msg.setAttribute('data-gb-old', markerId);
    if (platform === 'youtube' && msg.id) {
      state.seenMessageIds.add(msg.id);
    }
  });
  return;
}

// Only process messages without the marker (after grace period)
if (!node.hasAttribute('data-gb-old')) {
  // YouTube: double-check message ID hasn't been seen
  if (platform === 'youtube') {
    const msgId = node.id;
    if (msgId && state.seenMessageIds.has(msgId)) return;
  }
  messagesToProcess.push(node);
  node.setAttribute('data-gb-old', markerId); // Mark immediately
}
```

**Why Grace Period?** Streaming platforms (especially YouTube) sometimes re-render the chat container, creating new DOM elements for old messages. The grace period ensures these re-rendered historical messages are ignored.

**Why YouTube Message IDs?** YouTube chat messages have unique IDs. By tracking these IDs, we can detect re-rendered old messages even if they appear as "new" DOM elements without the `data-gb-old` attribute. This provides double protection against the re-render bug.

### 3. **ONE USER = ONE ENTRY**
Each user can only participate once, even if they send multiple messages.

**Implementation:**
- `state.processedMessages` Set tracks lowercase usernames
- Check before adding to participants
- Log duplicate attempts for debugging
- **Bot filtering:** Common streaming bots are automatically excluded

```javascript
const userKey = username.toLowerCase();
// Filter out bots
if (BOT_BLACKLIST.includes(userKey)) return;
// Deduplicate users
if (state.processedMessages.has(userKey)) return;
state.processedMessages.add(userKey);
```

### 4. **BOT FILTERING**
Streaming platforms have numerous bots (StreamElements, Nightbot, etc.) that should never win giveaways.

**Implementation:**
- Comprehensive `BOT_BLACKLIST` array with common bot usernames
- Bots are filtered before deduplication check
- Filtered bots are logged for verification

```javascript
const BOT_BLACKLIST = [
  'streamelements', 'nightbot', 'moobot', 'streamlabs',
  'fossabot', 'wizebot', 'ohbot', // ... 20+ bots
];
```

## Architecture Components

### Cross-Frame Communication (YouTube)
YouTube's live chat runs in an iframe. The extension uses cross-frame messaging:

1. **Top Frame:** Shows the UI panel, aggregates participants
2. **Chat Iframe:** Observes messages, sends participants to top frame
3. **Background Script:** Broadcasts messages between frames

```javascript
// Content script (iframe) → Background → Content script (top frame)
chrome.runtime.sendMessage({
  action: 'BROADCAST_TO_FRAMES',
  payload: {
    action: 'ADD_PARTICIPANTS',
    participants: [participant]
  }
});
```

**CRITICAL:** `isTopFrame` checks prevent duplicate UI and ensure proper routing.

### Platform Detection & Selectors

Each platform has different HTML structures. Selectors MUST be kept up-to-date:

```javascript
const PLATFORM_SELECTORS = {
  kick: {
    container: '#chatroom-messages, [data-chat-entry], ...',
    message: '[data-chat-entry], ...',
    username: '[data-chat-entry-user-id], ...',
    text: '[data-chat-entry-content], ...'
  },
  // Similar for twitch, youtube
};
```

**Fallback detection:** If specific selectors fail, broader search for scrollable containers with children.

### Message Processing Flow

```
1. MutationObserver detects new DOM node
2. Check if node (or children) match message selectors
3. Skip if has 'data-gb-old' attribute (existing message)
4. Mark with 'data-gb-old' immediately
5. Extract username and message text
6. Log to allMessagesLog (for verification)
7. Check keyword match (empty keyword = match all)
8. Filter out bots from BOT_BLACKLIST
9. Check if user already entered (deduplication)
10. Add to participants Map IMMEDIATELY
11. Update UI IMMEDIATELY
12. Send to top frame if in iframe
```

## State Management

```javascript
const state = {
  isRunning: boolean,           // Is giveaway active
  debugMode: boolean,           // Legacy - always false (use empty keyword instead)
  participants: Map,            // Map<lowercase_username, {username, timestamp}>
  keyword: string,              // Entry keyword (empty = capture all messages)
  prize: string,                // Prize description
  duration: number,             // Giveaway duration in seconds (default: 15)
  processedMessages: Set,       // Set<lowercase_username> for deduplication
  allMessagesLog: Array,        // [{username, message, timestamp, time}] for verification
  observer: MutationObserver,   // DOM observer
  language: string,             // Current UI language ('en' or 'sr')
  // ... other state
};
```

**IMPORTANT:**
- `participants` Map uses lowercase username as key but stores original case in value
- Empty `keyword` string captures ALL messages (excluding bots)
- `language` preference is persisted in localStorage

## UI Updates

Always update immediately, never batch:
```javascript
updateCount();  // Updates participant count display
updateList();   // Updates scrollable participant list
```

Participants list shows ALL participants in chronological order (first to last).

## Debugging & Verification

### Logs Viewer (Built-in UI)
After a giveaway completes, users can click the **LOGS** button to view:
- Giveaway summary (keyword, prize, duration, participant count, winner)
- Complete participants list with timestamps
- All captured messages during the giveaway

This provides transparency and allows verification without opening the console.

### Console Debug Function
```javascript
// In browser console after giveaway:
window.giveawayBotDebug.exportLog()
// Shows: all messages captured, total count, participants list
```

This allows verifying 100% accuracy by comparing captured messages to actual chat.

## Internationalization (i18n)

The extension supports multiple languages:
- **English (en)** - Default language
- **Serbian (sr)** - Full translation

**Implementation:**
```javascript
const translations = {
  en: { keyword: 'Keyword:', /* ... */ },
  sr: { keyword: 'Ključna reč:', /* ... */ }
};

function t(key, params = {}) {
  let text = translations[state.language][key] || key;
  // Replace {param} placeholders
  return text;
}
```

**Language Switching:**
- Flag buttons (🇺🇸/🇷🇸) in header
- Selection saved to localStorage
- All UI text updates dynamically using `data-i18n` attributes

## Common Pitfalls to Avoid

### ❌ DON'T: Add delays or buffering
```javascript
// BAD - Causes missed messages
setTimeout(() => processMessage(msg), 100);
```

### ❌ DON'T: Process historical messages
```javascript
// BAD - Captures old chat
container.querySelectorAll(selector).forEach(processElement);
```

### ❌ DON'T: Use requestAnimationFrame for critical processing
```javascript
// BAD - Introduces delays
requestAnimationFrame(() => processMessage(msg));
```

### ❌ DON'T: Modify participant ordering
Participants MUST be shown in chronological order (Map preserves insertion order).

### ✅ DO: Process synchronously and immediately
```javascript
// GOOD
messagesToProcess.forEach(msg => {
  msg.setAttribute('data-gb-old', markerId);
  processElement(msg, selectors);
});
```

### ✅ DO: Mark messages before processing
This prevents race conditions where the same message could be processed twice.

### ✅ DO: Log everything for verification
```javascript
state.allMessagesLog.push({
  username, message, timestamp, time: new Date().toISOString()
});
```

## Performance Considerations

- **MutationObserver** runs synchronously (no requestAnimationFrame delay)
- **WeakSet avoided** - caused timing issues, use data attributes instead
- **Immediate Map operations** - O(1) lookups, no arrays for deduplication
- **Direct DOM updates** - no virtual DOM or batching needed

## Security Notes

- All usernames are HTML-escaped before display
- No eval() or innerHTML with user content
- Content Security Policy compliant

## Testing Checklist

Before any changes:
1. ✅ Start giveaway mid-chat - verify NO historical messages captured
2. ✅ Rapid messages (5+ per second) - verify NONE missed
3. ✅ Same user multiple messages - verify counted ONCE
4. ✅ YouTube in iframe - verify participants appear in main panel
5. ✅ Keyword matching - case-insensitive, partial match
6. ✅ Empty keyword - captures ALL messages (excluding bots)
7. ✅ Bot filtering - bots like StreamElements, Nightbot excluded
8. ✅ Run `window.giveawayBotDebug.exportLog()` - verify counts match
9. ✅ Click LOGS button - verify all participants and messages shown
10. ✅ Language switching - verify UI updates correctly (EN/SR)
11. ✅ Settings persistence - verify keyword, prize, duration, language saved

## File Structure

```
stream-w-giveaway/
├── manifest.json          # Extension config, permissions, content scripts
├── content.js            # Main logic (CRITICAL - all core functionality)
├── background.js         # Cross-frame message routing
├── styles.css           # UI styling
└── ARCHITECTURE.md      # This file
```

## Key Version Info

- Manifest V3
- Chrome Extension
- Supports: Kick, Twitch, YouTube
- Zero dependencies (vanilla JavaScript)

## Future Modifications

When updating:
1. **Never** add buffering/delays to message processing
2. **Never** process existing messages on start
3. **Always** maintain chronological participant order
4. **Always** test with rapid chat messages
5. **Always** verify with exportLog() debug function

## Support & Debugging

If messages are missed:
1. Check console for `[GiveawayBot]` logs
2. Run `window.giveawayBotDebug.exportLog()`
3. Verify `data-gb-old` attributes are being set
4. Check platform selectors (sites change HTML frequently)
5. Confirm MutationObserver is connected

If too many messages captured:
1. Verify grace period is active (200ms delay after start)
2. Check console for "[GiveawayBot] Grace period active" and "[GiveawayBot] Marked X existing YouTube messages" messages
3. For YouTube: Check `state.seenMessageIds.size` in console to see how many message IDs are tracked
4. Verify `data-gb-old` marking happens BEFORE processing
5. Check that observer starts AFTER marking existing messages
6. Ensure `state.isRunning` is checked in processElement
7. Verify tab/iframe is visible (document.hidden should be false)
8. If platforms re-render frequently, consider increasing grace period (currently 200ms for all platforms)

---

**Version:** 1.3.1
**Last Updated:** 2026-01-28
**Core Principle:** Capture every NEW message from START to FINISH (after 200ms grace period).

## Recent Changes (v1.3.1)

- **Grace Period Fix:** Added 200ms grace period after START to prevent capturing historical messages during platform re-renders
  - Minimal delay ensures fast capture while preventing re-render bug
- **YouTube Message ID Tracking:** Track unique YouTube message IDs to prevent duplicate captures during re-renders
- **Visibility Check:** Only process messages when tab/iframe is visible (prevents capturing messages from inactive tabs)
- **Platform-Specific Handling:** Enhanced YouTube support with double protection against re-render bug

## Changes (v1.3.0)

- **Bot Blacklist:** Automatically filters out 20+ common streaming bots
- **Empty Keyword Mode:** Leave keyword empty to capture all messages (replaces debug mode toggle)
- **Logs Viewer:** Built-in UI to view participants, messages, and giveaway summary
- **Bilingual Support:** English and Serbian with flag switcher
- **Improved Persistence:** Language preference saved alongside other settings
- **UI Enhancements:** Gradient styling, footer credit, improved button organization
