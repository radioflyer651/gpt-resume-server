

/** Toast message levels that control the style of the message's appearance. */
export type ToastMessageLevels = 'info' | 'error' | 'warn';

/** "Toast" messages that show as popups in the UI. */
export type ToastMessage = { title?: string, level: ToastMessageLevels, content: string; };