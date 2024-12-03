export const SHORTCUT_KEYS = {
    CTRL: 'ctrl',
    CMD: 'cmd',
    ALT: 'alt',
    SHIFT: 'shift',
    ARROWS: {
        LEFT: 'left',
        RIGHT: 'right',
        UP: 'up',
        DOWN: 'down'
    }
};

export const DISALLOWED_SHORTCUTS = new Set([
    // Text Editing  
    `${SHORTCUT_KEYS.CTRL}+c`, // Copy  
    `${SHORTCUT_KEYS.CTRL}+v`, // Paste  
    `${SHORTCUT_KEYS.CTRL}+x`, // Cut  
    `${SHORTCUT_KEYS.CTRL}+z`, // Undo  
    `${SHORTCUT_KEYS.CTRL}+y`, // Redo  
    `${SHORTCUT_KEYS.CMD}+shift+z`, // Redo (macOS)  
    `${SHORTCUT_KEYS.CTRL}+a`, // Select all  
    `${SHORTCUT_KEYS.CTRL}+f`, // Find  
    `${SHORTCUT_KEYS.CTRL}+h`, // Replace  
    `${SHORTCUT_KEYS.CTRL}+d`, // Delete  
    `${SHORTCUT_KEYS.CTRL}+b`, // Bold  
    `${SHORTCUT_KEYS.CTRL}+i`, // Italic  
    `${SHORTCUT_KEYS.CTRL}+u`, // Underline

    // File Operations  
    `${SHORTCUT_KEYS.CTRL}+s`, // Save  
    `${SHORTCUT_KEYS.CTRL}+o`, // Open  
    `${SHORTCUT_KEYS.CTRL}+p`, // Print  
    `${SHORTCUT_KEYS.CTRL}+n`, // New  
    `${SHORTCUT_KEYS.CTRL}+w`, // Close  
    `${SHORTCUT_KEYS.CMD}+w`, // Close (macOS)  
    `${SHORTCUT_KEYS.ALT}+f4`, // Close application  
    `${SHORTCUT_KEYS.CMD}+q`, // Quit (macOS)

    // Browser Navigation  
    `${SHORTCUT_KEYS.CTRL}+t`, // New tab  
    `${SHORTCUT_KEYS.CTRL}+shift+t`, // Reopen closed tab  
    `${SHORTCUT_KEYS.CTRL}+tab`, // Next tab  
    `${SHORTCUT_KEYS.CTRL}+shift+tab`, // Previous tab  
    `${SHORTCUT_KEYS.CMD}+option+${SHORTCUT_KEYS.ARROWS.RIGHT}`, // Next tab (macOS)  
    `${SHORTCUT_KEYS.CMD}+option+${SHORTCUT_KEYS.ARROWS.LEFT}`, // Previous tab (macOS)  
    `${SHORTCUT_KEYS.ALT}+${SHORTCUT_KEYS.ARROWS.LEFT}`, // Back  
    `${SHORTCUT_KEYS.ALT}+${SHORTCUT_KEYS.ARROWS.RIGHT}`, // Forward  
    `${SHORTCUT_KEYS.CMD}+[`, // Back (macOS)  
    `${SHORTCUT_KEYS.CMD}+]`, // Forward (macOS)

    // Window Management  
    `${SHORTCUT_KEYS.ALT}+tab`, // Switch windows  
    `${SHORTCUT_KEYS.CTRL}+shift+n`, // New incognito window  
    `${SHORTCUT_KEYS.CMD}+n`, // New window (macOS)  
    `${SHORTCUT_KEYS.CMD}+m`, // Minimize (macOS)  
    `${SHORTCUT_KEYS.CMD}+h`, // Hide (macOS)

    // Page Navigation  
    'home', // Top of page  
    'end', // Bottom of page  
    'pageup', // Page up  
    'pagedown', // Page down  
    `${SHORTCUT_KEYS.CMD}+${SHORTCUT_KEYS.ARROWS.UP}`, // Top of page (macOS)  
    `${SHORTCUT_KEYS.CMD}+${SHORTCUT_KEYS.ARROWS.DOWN}`, // Bottom of page (macOS)

    // System Controls  
    `${SHORTCUT_KEYS.CTRL}+alt+delete`, // Task manager  
    `${SHORTCUT_KEYS.CMD}+option+esc`, // Force quit (macOS)  
    `${SHORTCUT_KEYS.CTRL}+shift+esc`, // Task manager direct  
    `${SHORTCUT_KEYS.CMD}+space`, // Spotlight (macOS)  
    'printscreen', // Screenshot  
    `${SHORTCUT_KEYS.CMD}+shift+3`, // Screenshot (macOS)  
    `${SHORTCUT_KEYS.CMD}+shift+4`, // Screenshot selection (macOS)

    // Zoom Controls  
    `${SHORTCUT_KEYS.CTRL}+plus`, // Zoom in  
    `${SHORTCUT_KEYS.CTRL}+minus`, // Zoom out  
    `${SHORTCUT_KEYS.CTRL}+0`, // Reset zoom  
    `${SHORTCUT_KEYS.CMD}+plus`, // Zoom in (macOS)  
    `${SHORTCUT_KEYS.CMD}+minus`, // Zoom out (macOS)  
    `${SHORTCUT_KEYS.CMD}+0`, // Reset zoom (macOS)

    // Developer Tools  
    `${SHORTCUT_KEYS.CTRL}+shift+i`, // Developer tools  
    `${SHORTCUT_KEYS.CTRL}+shift+j`, // Developer tools console  
    `${SHORTCUT_KEYS.CMD}+option+i`, // Developer tools (macOS)  
    `${SHORTCUT_KEYS.CMD}+option+j`, // Developer tools console (macOS)  
    'f12', // Developer tools

    // Media Controls  
    'volumeup',
    'volumedown',
    'volumemute',
    'mediaplaypause',
    'medianexttrack',
    'mediaprevioustrack',

    // Function Keys  
    'f1', // Help  
    'f3', // Find  
    'f5', // Refresh  
    'f11', // Full screen

    // Additional Browser Functions  
    `${SHORTCUT_KEYS.CTRL}+l`, // Focus address bar  
    `${SHORTCUT_KEYS.CTRL}+k`, // Focus search bar  
    `${SHORTCUT_KEYS.CTRL}+j`, // Downloads  
    `${SHORTCUT_KEYS.CTRL}+shift+b`, // Toggle bookmarks bar  
    `${SHORTCUT_KEYS.CTRL}+d`, // Add bookmark  
    `${SHORTCUT_KEYS.CTRL}+shift+delete`, // Clear browsing data

    // Accessibility  
    `${SHORTCUT_KEYS.ALT}+shift`, // Toggle screen reader  
    `${SHORTCUT_KEYS.CTRL}+alt+${SHORTCUT_KEYS.ARROWS.UP}`, // Increase speech rate  
    `${SHORTCUT_KEYS.CTRL}+alt+${SHORTCUT_KEYS.ARROWS.DOWN}`, // Decrease speech rate  
]);

// Export categories for potential filtering or grouping  
export const SHORTCUT_CATEGORIES = {
    TEXT_EDITING: 'Text Editing',
    FILE_OPERATIONS: 'File Operations',
    BROWSER_NAVIGATION: 'Browser Navigation',
    WINDOW_MANAGEMENT: 'Window Management',
    PAGE_NAVIGATION: 'Page Navigation',
    SYSTEM_CONTROLS: 'System Controls',
    ZOOM_CONTROLS: 'Zoom Controls',
    DEVELOPER_TOOLS: 'Developer Tools',
    MEDIA_CONTROLS: 'Media Controls',
    FUNCTION_KEYS: 'Function Keys',
    BROWSER_FUNCTIONS: 'Browser Functions',
    ACCESSIBILITY: 'Accessibility'
};  