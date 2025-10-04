import {
  setDebug,
  mountBackButton,
  restoreInitData,
  init as initSDK,
  bindThemeParamsCssVars,
  mountViewport,
  bindViewportCssVars,
  mockTelegramEnv,
  type ThemeParams,
  themeParamsState,
  // retrieveLaunchParams,
  emitEvent,
  miniApp,
  isTMA,                // detect if running in Telegram Mini App
} from '@telegram-apps/sdk-react';

interface InitOptions {
  debug: boolean;
  eruda: boolean;
  mockForMacOS: boolean;
}

export async function init(options: InitOptions): Promise<void> {
  // 1. Debug / SDK init
  setDebug(options.debug);
  initSDK();

  // 2. Add Eruda (for mobile/dev debugging)
  if (options.eruda) {
    const { default: eruda } = await import('eruda');
    eruda.init();
    eruda.position({ x: window.innerWidth - 50, y: 0 });
  }
  // 3. Mock environment if needed
  //    We mock only when not in real Telegram, or when forced (e.g. macOS bugs)
  if (!isTMA() || options.mockForMacOS) {
      const mockTheme: ThemeParams = {
      bg_color: '#ffffff',
      text_color: '#000000',
      hint_color: '#999999',
      link_color: '#007aff',
      button_color: '#007aff',
      button_text_color: '#ffffff',
      secondary_bg_color: '#f0f0f0',
    };
    mockTelegramEnv({
      // You can provide launch param overrides if needed
      // For example, mock theme params or start params
     launchParams: {
        tgWebAppPlatform: options.mockForMacOS ? 'web' : 'unknown',
        tgWebAppThemeParams: mockTheme,
        tgWebAppVersion: '7.0',
        tgWebAppData: '',
        tgWebAppShowSettings: false,
      },
      onEvent(event, next) {
        // handle theme request
        if (event[0] === 'web_app_request_theme') {
          const tp: ThemeParams = themeParamsState() || {};
          return emitEvent('theme_changed', { theme_params: tp });
        }

        // handle safe area if needed
        if (event[0] === 'web_app_request_safe_area') {
          return emitEvent('safe_area_changed', {
            left: 0, top: 0, right: 0, bottom: 0,
          });
        }

        // pass through other events
        next();
      },
    });
  }

  // 4. Mount / restore essential UI and state
  mountBackButton.ifAvailable();
  restoreInitData();

  // 5. Mount miniApp / theme styling
  if (miniApp.mountSync.isAvailable()) {
    miniApp.mountSync();
    bindThemeParamsCssVars();
  }

  // 6. Viewport and CSS Vars binding
  if (mountViewport.isAvailable()) {
    await mountViewport();
    bindViewportCssVars();
  }
}
