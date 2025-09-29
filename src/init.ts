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
  emitEvent,
  miniApp,
  isTMA,
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

  // 3. Mock environment BEFORE any mounting
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
      launchParams: {
        tgWebAppPlatform: options.mockForMacOS ? 'web' : 'unknown',
        tgWebAppThemeParams: mockTheme,
        tgWebAppVersion: '7.0',
        tgWebAppData: '',
        tgWebAppShowSettings: false,
      },
      onEvent(event, next) {
        // Handle theme request
        if (event[0] === 'web_app_request_theme') {
          return emitEvent('theme_changed', { theme_params: mockTheme });
        }

        // Handle safe area if needed
        if (event[0] === 'web_app_request_safe_area') {
          return emitEvent('safe_area_changed', {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
          });
        }

        // Pass through other events
        next();
      },
    });
  }

  // 4. Restore init data FIRST
  restoreInitData();

  // 5. Mount back button
  mountBackButton.ifAvailable();

  // 6. Mount miniApp / theme styling
  if (miniApp.mount.isAvailable()) {
    miniApp.mount();
    bindThemeParamsCssVars();
  }

  // 7. Viewport (synchronous mount)
  if (mountViewport.isAvailable()) {
    mountViewport();
    bindViewportCssVars();
  }
}