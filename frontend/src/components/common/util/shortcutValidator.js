// utils/validators/shortcutValidator.jsx  
import { SHORTCUT_KEYS, DISALLOWED_SHORTCUTS } from './constants/shortcuts';

const KEY_MAPPINGS = {  
  control: SHORTCUT_KEYS.CTRL,  
  ctr: SHORTCUT_KEYS.CTRL,  
  command: SHORTCUT_KEYS.CMD,  
  option: SHORTCUT_KEYS.ALT,  
  leftarrow: SHORTCUT_KEYS.ARROWS.LEFT,  
  rightarrow: SHORTCUT_KEYS.ARROWS.RIGHT,  
  uparrow: SHORTCUT_KEYS.ARROWS.UP,  
  downarrow: SHORTCUT_KEYS.ARROWS.DOWN  
};

const MODIFIER_ORDER = {  
  [SHORTCUT_KEYS.CTRL]: 1,  
  [SHORTCUT_KEYS.CMD]: 1,  
  [SHORTCUT_KEYS.ALT]: 2,  
  [SHORTCUT_KEYS.SHIFT]: 3  
};

const normalizeShortcutPart = (part) => {  
  const normalizedPart = part.trim().toLowerCase();  
  return KEY_MAPPINGS[normalizedPart] || normalizedPart;  
};

const sortShortcutParts = (parts) => {  
  return parts.sort((a, b) => {  
    const aOrder = MODIFIER_ORDER[a] || 999;  
    const bOrder = MODIFIER_ORDER[b] || 999;  
    return aOrder - bOrder;  
  });  
};

const validateShortcutFormat = (normalizedShortcut) => {  
  const validPattern = /^(ctrl|cmd|alt|shift|\b\w+\b)(\+(ctrl|cmd|alt|shift|\b\w+\b))*$/;  
  if (!validPattern.test(normalizedShortcut)) {  
    console.error('Invalid shortcut format. Keys must be separated by \'+\' without spaces.');  
    return false;  
  }  
  return true;  
};

export const isShortcutAllowed = (shortcut) => {  
  if (!shortcut || typeof shortcut !== 'string') {  
    return false;  
  }

  // Split the shortcut into parts and normalize each part  
  const parts = shortcut  
    .trim()  
    .toLowerCase()  
    .split('+')  
    .map(normalizeShortcutPart);

  // Sort parts maintaining modifier order  
  const sortedParts = sortShortcutParts(parts);  
  const normalizedShortcut = sortedParts.join('+');

  // Add debugging logs  
  console.log('Input shortcut:', shortcut);  
  console.log('Normalized shortcut:', normalizedShortcut);  
  console.log('Is in disallowed set:', DISALLOWED_SHORTCUTS.has(normalizedShortcut));

  return validateShortcutFormat(normalizedShortcut) &&   
         !DISALLOWED_SHORTCUTS.has(normalizedShortcut);  
};

// Test function  
export const testShortcutValidator = () => {  
  const testCases = [  
    'Ctrl+C',  
    'ctrl+c',  
    'Control+c',  
    'CTRL+C',  
    'ctrl+v',  
    'alt+f4',  
    'shift+ctrl+t',  
    'cmd+shift+z'  
  ];

  console.log('Running shortcut validator tests:');  
  testCases.forEach(testCase => {  
    const result = isShortcutAllowed(testCase);  
    console.log(`Testing "${testCase}": ${result ? 'Allowed' : 'Blocked'}`);  
  });  
};  