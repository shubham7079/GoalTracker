
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return 'Never';
  
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 0) return 'Just now'; 
  if (diffInSeconds < 60) return 'Just now';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
}

export function formatLocalizedDate(
  date: string | Date | null | undefined, 
  options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString(undefined, options);
}

// Audio Utilities
const SUCCESS_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'; 
const LEVEL_UP_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'; 
const ALARM_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/1004/1004-preview.mp3'; 

export const playSuccessSound = () => {
  const audio = new Audio(SUCCESS_SOUND_URL);
  audio.volume = 0.4;
  audio.play().catch(e => console.log("Audio playback failed (interaction required):", e));
};

export const playLevelUpSound = () => {
  const audio = new Audio(LEVEL_UP_SOUND_URL);
  audio.volume = 0.5;
  audio.play().catch(e => console.log("Audio playback failed (interaction required):", e));
};

export const playAlarmSound = () => {
  const audio = new Audio(ALARM_SOUND_URL);
  audio.volume = 0.6;
  audio.play().catch(e => console.log("Alarm audio playback failed:", e));
};
