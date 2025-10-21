// Get Telegram user data with development fallback
export const getTelegramUser = () => {
  // Check for development mode
  const isDevelopment = import.meta.env.DEV;

  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const user = window.Telegram.WebApp.initDataUnsafe?.user;
    if (user) {
      return {
        id: user.id,
        username: user.username || user.first_name || 'User',
      };
    }
  }

  // Fallback for development/testing
  if (isDevelopment) {
    console.log('⚠️ Development mode: Using mock Telegram user');
    return {
      id: 123456789,
      username: 'DevUser',
    };
  }

  return null;
};
