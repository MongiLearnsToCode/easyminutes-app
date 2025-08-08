// User-friendly messages for the app
export const USER_MESSAGES = {
  // Authentication messages
  AUTH: {
    NOT_AUTHENTICATED: "You'll need to sign in to save your work. For now, you can still generate and edit meeting minutes!",
    SIGN_IN_TO_SAVE: "Sign in to save and access your meeting minutes later",
    SESSION_EXPIRED: "Your session has expired. Please sign in again to continue saving your work.",
  },

  // File upload messages
  FILE: {
    TYPE_NOT_SUPPORTED: (fileType: string, allowedTypes: string[]) => 
      `We can't process ${fileType} files yet. Try uploading: ${allowedTypes.map(type => {
        switch(type) {
          case 'txt': return 'Text files (.txt)';
          case 'docx': return 'Word documents (.docx)';
          case 'mp3': return 'MP3 audio (.mp3)';
          case 'wav': return 'WAV audio (.wav)';
          case 'm4a': return 'M4A audio (.m4a)';
          default: return `.${type}`;
        }
      }).join(', ')}`,
    
    TOO_LARGE: (maxSizeMB: number) => 
      `This file is too large. Please use files smaller than ${maxSizeMB}MB.`,
    
    UPLOAD_SUCCESS: "File uploaded successfully!",
    PROCESSING: "Processing your file...",
  },

  // Feature access messages
  FEATURES: {
    AUDIO_PRO_ONLY: "Audio transcription is a Pro feature. Upgrade to transcribe meetings from audio files!",
    SAVE_SIGN_IN: "Sign in to save your meeting minutes and access them anytime",
    EXPORT_PRO_ONLY: "Export to PDF/Word is a Pro feature. Upgrade to export your minutes!",
    SHARE_PRO_ONLY: "Sharing is a Pro feature. Upgrade to share your minutes with others!",
    AUTO_SAVE_PRO_ONLY: "Your work isn't being saved automatically. Upgrade to Pro for auto-save!",
  },

  // Usage limit messages
  LIMITS: {
    APPROACHING_LIMIT: (remaining: number) => 
      `You have ${remaining} AI generation${remaining === 1 ? '' : 's'} left in this session`,
    
    LIMIT_REACHED: "You've reached your free session limit. Sign up for Pro to continue generating meeting minutes!",
    
    MONTHLY_LIMIT_APPROACHING: (used: number, total: number) => 
      `You've used ${used} of your ${total} monthly meetings. ${total - used} remaining.`,
  },

  // Success messages
  SUCCESS: {
    MINUTE_SAVED: "Meeting minutes saved successfully!",
    MINUTE_UPDATED: "Meeting minutes updated!",
    MINUTE_DELETED: "Meeting minutes deleted",
    MINUTE_EXPORTED: "Meeting minutes exported successfully!",
    MINUTE_SHARED: "Meeting minutes shared!",
  },

  // Error messages
  ERRORS: {
    GENERIC: "Something went wrong. Please try again.",
    NETWORK: "Check your internet connection and try again",
    SAVE_FAILED: "Couldn't save your meeting minutes. Please try again.",
    LOAD_FAILED: "Couldn't load your meeting minutes. Please refresh and try again.",
    AI_GENERATION_FAILED: "The AI couldn't process this content. Try a different format or smaller file.",
  },

  // Onboarding messages
  ONBOARDING: {
    WELCOME: "Welcome! Generate AI-powered meeting minutes instantly",
    TRY_NOW: "Try it now - no sign-up required!",
    PASTE_OR_UPLOAD: "Paste your meeting notes or upload a file to get started",
  },
};

// Helper function to get user-friendly file type names
export const getFileTypeName = (extension: string): string => {
  const typeNames: Record<string, string> = {
    'txt': 'Text file',
    'docx': 'Word document',
    'mp3': 'MP3 audio',
    'wav': 'WAV audio',
    'm4a': 'M4A audio',
    'md': 'Markdown file',
  };
  return typeNames[extension] || `${extension.toUpperCase()} file`;
};
