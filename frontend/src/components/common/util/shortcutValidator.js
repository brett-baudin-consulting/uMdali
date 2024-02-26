// utils/shortcutValidator.js or a suitable place in your project structure

const disallowedShortcuts = new Set([
  // General System Operations
  "ctrl+c", // Copy
  "ctrl+v", // Paste
  "ctrl+x", // Cut
  "ctrl+z", // Undo
  "ctrl+y", // Redo
  "cmd+shift+z", // Redo (macOS alternative)
  "ctrl+a", // Select all
  "ctrl+f", // Find
  "ctrl+s", // Save
  "ctrl+o", // Open
  "ctrl+p", // Print
  "ctrl+n", // New (window or document)
  "ctrl+w", // Close (window or tab)
  "alt+f4", // Quit application (Windows)
  "cmd+q", // Quit application (macOS)
  "ctrl+shift+n", // New incognito window/private window
  "ctrl+t", // Open new tab
  "ctrl+shift+t", // Reopen last closed tab
  "ctrl+tab", // Switch to the next tab
  "cmd+option+rightarrow", // Switch to the next tab (macOS)
  "ctrl+shift+tab", // Switch to the previous tab
  "cmd+option+leftarrow", // Switch to the previous tab (macOS)

  // Navigation
  "alt+leftarrow", // Back
  "cmd+[", // Back (macOS)
  "alt+rightarrow", // Forward
  "cmd+]", // Forward (macOS)
  "home", // Scroll to top of the page
  "cmd+uparrow", // Scroll to top of the page (macOS)
  "end", // Scroll to bottom of the page
  "cmd+downarrow", // Scroll to bottom of the page (macOS)
  "pageup", // Scroll up
  "pagedown", // Scroll down

  // System Control
  "ctrl+alt+del", // Task Manager / Force quit applications (Windows)
  "cmd+option+esc", // Force quit applications (macOS)
  "printscreen", // Take a screenshot
  "alt+tab", // Switch between applications
  "ctrl+shift+esc", // Open Task Manager (Windows)
  "cmd+space", // Spotlight Search (macOS)

  // Accessibility
  "ctrl+plus", // Zoom in
  "cmd+plus", // Zoom in (macOS)
  "ctrl+minus", // Zoom out
  "cmd+minus", // Zoom out (macOS)
  "ctrl+0", // Reset zoom level
  "cmd+0", // Reset zoom level (macOS)
  // Add more shortcuts as needed
]);

export const isShortcutAllowed = (shortcut) => {
  // Trim and convert to lower case to standardize input
  const standardizedShortcut = shortcut.trim().toLowerCase();

  // Validate the format to ensure keys are only separated by '+'
  // This regex checks for a valid pattern of keys separated by '+'
  if (!/^(ctrl|cmd|alt|\b\w\b)(\+(ctrl|cmd|alt|\b\w\b))*$/.test(standardizedShortcut)) {
    console.error('Invalid shortcut format. Keys must be separated by \'+\' without spaces.');
    return false;
  }

  // Normalize the shortcut by replacing variations of key names
  const normalizedShortcut = standardizedShortcut
    .replace(/\b(control|ctrl|ctr)\b/g, 'ctrl')
    .replace(/\b(command|cmd)\b/g, 'cmd')
    .replace(/\b(option|alt)\b/g, 'alt')
    .replace(/\b(arrow)?(left|right|up|down)\b/g, (match, p1, direction) => direction)
    // Any additional normalization rules can be added here
    ;

  return !disallowedShortcuts.has(normalizedShortcut);
};