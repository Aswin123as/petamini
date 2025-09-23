// Include Telegram UI styles first to allow our code override the package CSS.
import '@telegram-apps/telegram-ui/dist/styles.css';

import ReactDOM from 'react-dom/client';
import { StrictMode } from 'react';
import { retrieveLaunchParams, setMockLaunchParams } from '@telegram-apps/sdk-react';

import { Root } from '@/components/Root.tsx';
import { EnvUnsupported } from '@/components/EnvUnsupported.tsx';
import { init } from '@/init.ts';

import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);

// --- 🟢 Setup mock environment if running outside Telegram ---
if (typeof window !== 'undefined' && !window.Telegram) {
  console.warn('[index.tsx] Not running inside Telegram — using mock environment.');

  // Minimal mock for Telegram WebApp
  window.Telegram = {
    WebApp: {
      platform: 'web',
      initData: '',
      initDataUnsafe: {},
      ready: () => console.log('[Mock] WebApp.ready() called'),
      sendData: (data: string) => console.log('[Mock] sendData:', data),
      close: () => console.log('[Mock] close() called'),
    },
  } as any;

  // Provide mock launch params so retrieveLaunchParams() won't throw
  setMockLaunchParams({
    tgWebAppPlatform: 'web',
    tgWebAppVersion: 'mock-1.0',
    tgWebAppThemeParams: {},
    tgWebAppStartParam: 'mock_start',
  });
}

// --- 🟢 Main Application Bootstrapping ---
try {
  const launchParams = retrieveLaunchParams();
  console.log('[index.tsx] Launch params:', launchParams);

  const { tgWebAppPlatform: platform } = launchParams;
  const debug =
    (launchParams.tgWebAppStartParam || '').includes('platformer_debug') ||
    import.meta.env.DEV;

  await init({
    debug,
    eruda: debug && ['ios', 'android'].includes(platform),
    mockForMacOS: platform === 'macos',
  });

  root.render(
    <StrictMode>
      <Root />
    </StrictMode>
  );
} catch (e) {
  console.error('[index.tsx] Failed to load launch params:', e);
  root.render(<EnvUnsupported />);
}
