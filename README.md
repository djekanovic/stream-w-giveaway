<div align="center">
<p><img src="./stream-w-logo.png" alt="Stream W logo" width="140" /></p>

# 🎁 Stream W

### The Ultimate Open-Source Giveaway Tool for Live Streamers

**Fast • Accurate • Fair • Multi-Platform**

[![Version](https://img.shields.io/badge/version-1.3.0-brightgreen.svg)](https://github.com/yourusername/stream-w)
[![License](https://img.shields.io/badge/license-GPLv3-blue.svg)](LICENSE)
[![Chrome](https://img.shields.io/badge/Chrome-Extension-orange.svg)](https://chromewebstore.google.com/detail/stream-w-open-source-stre/fdgnplakigdlnhpompdbdfopppaplhbn?authuser=0&hl=en)

Run fair and transparent giveaways on **Kick**, **Twitch**, and **YouTube** with 100% accuracy.

[📥 Install](https://chromewebstore.google.com/detail/stream-w-open-source-stre/fdgnplakigdlnhpompdbdfopppaplhbn?authuser=0&hl=en) • [📖 Documentation](#-how-to-use)

---

</div>

## ✨ Why Stream W?

Stream W is designed for streamers who want to run **completely fair** giveaways. No manual work, no missed entries, no favoritism—just pure randomness backed by cryptographic security.

### 🎯 Key Features

| Feature | Description |
|---------|-------------|
| 🎯 **100% Accurate** | Captures every message from the moment you hit START |
| ⚡ **Zero Delays** | Immediate processing—no buffering, no missed entries |
| 🌐 **Multi-Platform** | Works seamlessly on Kick, Twitch, and YouTube |
| 🔒 **Fair Selection** | Cryptographically secure random winner selection |
| 👤 **One Entry Per User** | Automatic deduplication—spam won't help anyone |
| 🤖 **Bot Filtering** | Automatically excludes 20+ common streaming bots |
| 📋 **Logs Viewer** | View detailed logs of all participants and messages |
| 🌍 **Bilingual** | Full support for English and Serbian |
| 💾 **Saves Settings** | Remembers your preferences for quick setup |
| 🎨 **Draggable UI** | Move the panel anywhere on your screen |

---

## 📥 Installation

### Option 1: Chrome Web Store
**Easiest method** - One-click install directly from the Chrome Web Store.

<div align="center">

[![Available in the Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install-blue?style=for-the-badge&logo=googlechrome)](https://chromewebstore.google.com/detail/stream-w-open-source-stre/fdgnplakigdlnhpompdbdfopppaplhbn?authuser=0&hl=en)

</div>

### Option 2: Manual Installation (Available Now)

1. **Download the extension**
   - Click the green **Code** button above → **Download ZIP**
   - Or clone this repository: `git clone https://github.com/yourusername/stream-w.git`

2. **Extract the files**
   - Unzip the downloaded file
   - Locate the `stream-w-giveaway` folder

3. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right corner)
   - Click **Load unpacked**
   - Select the `stream-w-giveaway` folder
   - Done! 🎉

> **Works with:** Chrome, Brave, Edge, Opera, and other Chromium-based browsers

---

## 🚀 How to Use

### Quick Start (30 seconds)

1. **Open the panel**
   - Press **F4** on any live stream page
   - Or click the extension icon in your browser toolbar

2. **Configure your giveaway**
   - Enter a keyword (e.g., `!giveaway`) or leave empty to capture all messages
   - Add a prize description (optional but recommended)
   - Set duration in seconds (default: 15)

3. **Run the giveaway**
   - Click **START** when ready
   - Watch participants roll in automatically
   - Winner is selected when timer expires!

4. **View results**
   - Click **LOGS** to see complete audit trail
   - Share winner with your community

### 📖 Detailed Guide

#### Setting Up Your Giveaway

**Keyword Mode** (Recommended)
- Enter a keyword like `!enter`, `!giveaway`, or `win`
- Only users who type the keyword will be entered
- Case-insensitive matching (e.g., `!GIVEAWAY` = `!giveaway`)

**Capture All Mode**
- Leave the keyword field **empty**
- Captures every message in chat (except bots)
- Perfect for "first 10 people" style giveaways

**Duration Settings**
- Default: 15 seconds (perfect for quick giveaways)
- Range: 5 seconds to 10 minutes
- Timer shows countdown with visual warnings

#### During the Giveaway

- Real-time participant counter updates as people enter
- Scrollable list shows all entries in chronological order
- Press **STOP** to end early if needed
- Status messages keep you informed

#### After the Giveaway

- Winner displayed with confetti animation 🎊
- Click **LOGS** to review:
  - Giveaway summary (keyword, prize, duration, stats)
  - Complete participants list with timestamps
  - All captured messages
  - Duplicate attempts blocked
  - Bots filtered
- Click **RESET** to run another giveaway

### ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **F4** | Toggle giveaway panel |
| **Ctrl+Shift+G** | Alternative toggle (customizable) |

---

## 🌐 Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| **Kick** | ✅ Working | Updated for Jan 2026 structure |
| **Twitch** | ✅ Working | Direct chat access |
| **YouTube** | ✅ Working | Handles iframe chat automatically |

> **Last tested:** January 28, 2026
>
> All platforms verified and working perfectly!

---

## 🎓 How It Works

Stream W uses advanced browser technology to ensure 100% accuracy:

1. **Chat Detection** - Automatically finds the chat container on any platform
2. **Real-Time Monitoring** - Watches for new messages using MutationObserver
3. **Smart Filtering** - Excludes bots (StreamElements, Nightbot, etc.)
4. **Keyword Matching** - Case-insensitive partial matching or capture-all mode
5. **Deduplication** - Each user can only enter once, even if they spam
6. **Secure Random** - Uses `crypto.getRandomValues()` for cryptographic randomness
7. **Complete Logging** - Records everything for transparency

### 🔒 Privacy & Security

- ✅ **No data collection** - Everything runs locally in your browser
- ✅ **No external requests** - Pure client-side processing
- ✅ **No tracking** - Zero telemetry or analytics
- ✅ **Open source** - All code is public and auditable
- ✅ **No permissions abuse** - Only needs access to streaming sites

---

## ❓ Troubleshooting

<details>
<summary><b>"Chat not found" error</b></summary>

- Make sure you're on a **live stream** page (not VOD/replay)
- Ensure the chat is visible and loaded
- Try refreshing the page
- Check browser console (F12) for detailed errors
</details>

<details>
<summary><b>Messages not being captured</b></summary>

1. Verify your keyword matches messages (try empty keyword to test)
2. Check that chat is visible on the page
3. Click **LOGS** after giveaway to review captured messages
4. Look for `[GiveawayBot]` messages in browser console
5. Run `window.giveawayBotDebug.exportLog()` in console for detailed verification
</details>

<details>
<summary><b>Platform-specific issues</b></summary>

**Kick:**
- Refresh page and reload extension
- Ensure you're on a live stream with active chat
- Selectors updated for January 2026 structure

**Twitch:**
- Make sure chat panel is loaded and visible
- Try refreshing if chat appears but isn't detected

**YouTube:**
- Ensure live chat panel is visible (not hidden)
- YouTube uses iframe—extension handles this automatically
</details>

### 🐛 Advanced Debugging

Open browser console (F12) and use these commands:

```javascript
// View all captured messages and participants
window.giveawayBotDebug.exportLog()

// Get current participants list
window.giveawayBotDebug.getParticipants()

// Get raw message log
window.giveawayBotDebug.getMessageLog()
```

---

## 🛠️ Technical Details

<details>
<summary><b>For Developers</b></summary>

### Architecture

- **Manifest Version:** 3
- **Framework:** Vanilla JavaScript (zero dependencies)
- **Permissions:** `activeTab`, `scripting`
- **Supported Browsers:** All Chromium-based browsers

### Key Files

- `content.js` - Main extension logic (1000+ lines)
- `background.js` - Cross-frame message routing
- `styles.css` - UI styling
- `manifest.json` - Extension configuration

### Design Principles

1. **Immediate Processing** - No buffering to prevent missed messages
2. **Marker-Based Filtering** - Only captures NEW messages after START
3. **Cross-Frame Support** - Handles YouTube's iframe chat
4. **Complete Logging** - Full audit trail for verification

### Testing

Before deploying changes:
- ✅ Start giveaway mid-chat - verify NO historical messages captured
- ✅ Rapid messages (5+ per second) - verify NONE missed
- ✅ Same user multiple messages - verify counted ONCE
- ✅ Bot filtering - verify bots excluded
- ✅ Empty keyword - verify all messages captured

See [ARCHITECTURE.md](ARCHITECTURE.md) for complete technical documentation.

</details>

---

## 📝 Changelog

### v1.3.0 (2026-01-28) - Latest

- ✅ Added bilingual support (English and Serbian)
- ✅ Comprehensive bot blacklist (20+ common bots)
- ✅ Logs viewer with complete audit trail
- ✅ Statistics tracking (duplicates blocked, bots filtered)
- ✅ Empty keyword mode replaces debug toggle
- ✅ Language preference persistence
- ✅ Support link and creator credit footer
- ✅ UI improvements with gradient styling

<details>
<summary><b>Previous Versions</b></summary>

### v1.2.0 (2026-01-28)

- ✅ Fixed Kick.com support (updated selectors)
- ✅ LocalStorage for settings persistence
- ✅ Changed default duration to 15 seconds
- ✅ Verified all platforms working

### v1.1.0 (2026-01-27)

- ✅ Initial multi-platform release
- ✅ Draggable UI
- ✅ Resizable participant list

</details>

---

## 💖 Support the Project

Stream W is **100% free and open-source**. If you find it useful, consider supporting development:

<div align="center">

[![Ko-fi](https://img.shields.io/badge/Support%20on-Ko--fi-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/djekanovic)

**[☕ Buy me a coffee](https://ko-fi.com/djekanovic)**

</div>

Other ways to support:
- ⭐ Star this repository
- 🐛 Report bugs and suggest features
- 📢 Share with other streamers
- 📝 Contribute code improvements

---

## 👤 About

**Created by:** djekanovic

**Links:**
- 🌐 [Website/Portfolio](https://cv.djekanovic.com/)
- 📷 [Instagram](https://instagram.com/djekanovic)

---

## 📄 License

This project is licensed under the [GNU General Public License v3.0 (GPL-3.0)](LICENSE).

---

## 🤝 Contributing

Contributions are welcome! Whether it's:
- 🐛 Bug reports
- 💡 Feature requests
- 📝 Documentation improvements
- 🔧 Code contributions

Please open an issue or pull request on GitHub.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/djekanovic/stream-w-giveaway.git

# Navigate to extension folder
cd stream-w/stream-w-giveaway

# Load in Chrome (see Installation instructions above)
```

---

## ⚠️ Disclaimer

This extension is not affiliated with Kick, Twitch, YouTube, or any streaming platform. Use responsibly and in accordance with each platform's terms of service.

---

<div align="center">

**Made with ❤️ by [djekanovic](https://instagram.com/djekanovic)**

**Stream W v1.3.0** • Built for streamers who value fairness

[⬆ Back to Top](#-stream-w)

</div>
