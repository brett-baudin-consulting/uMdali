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
  const standardizedShortcut = shortcut.trim().toLowerCase().replace(/\s+/g, '+');
  const normalizedShortcut = standardizedShortcut
    .replace(/(control|ctrl|ctr)|(command|cmd)|(option|alt)/gi, (match, p1, p2, p3) => {
      if (p1) return 'ctrl'; // Replace variations of 'control' with 'ctrl'
      if (p2) return 'cmd';  // Replace variations of 'command' with 'cmd'
      if (p3) return 'alt';  // Replace variations of 'option' with 'alt'
    })
    .replace(/arrow/gi, ''); // Simplify arrow key names

  return !disallowedShortcuts.has(normalizedShortcut);
};