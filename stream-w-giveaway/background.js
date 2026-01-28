// Background service worker

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.url && (tab.url.includes('kick.com') || tab.url.includes('twitch.tv') || tab.url.includes('youtube.com'))) {
    chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_PANEL' });
  }
});

// Handle keyboard shortcut (F4)
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'toggle-giveaway' && tab) {
    if (tab.url && (tab.url.includes('kick.com') || tab.url.includes('twitch.tv') || tab.url.includes('youtube.com'))) {
      chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_PANEL' });
    }
  }
});

// Handle cross-frame communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'BROADCAST_TO_FRAMES' && sender.tab) {
    // Send payload to all frames in the same tab
    chrome.tabs.sendMessage(sender.tab.id, message.payload);
    sendResponse({ success: true });
  }
  return true;
});
