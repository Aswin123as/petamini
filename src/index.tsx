// Include Telegram UI styles first to allow our code override the package CSS.
import '@telegram-apps/telegram-ui/dist/styles.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { StrictMode } from 'react';
import { useLaunchParams } from '@telegram-apps/sdk-react';

import { Root } from '@/components/Root.tsx';
import { EnvUnsupported } from '@/components/EnvUnsupported.tsx';
import { init } from '@/init.ts';

import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);

// --- Create a wrapper component to safely get launch params ---
function AppBootstrap() {
  const launchParams = useLaunchParams() ?? {
    tgWebAppPlatform: 'web',
    tgWebAppVersion: 'mock-1.0',
    tgWebAppThemeParams: {},
    tgWebAppStartParam: 'mock_start',
  };

  const platform = launchParams.tgWebAppPlatform;
  const debug =
    (launchParams.tgWebAppStartParam || '').includes('platformer_debug') ||
    import.meta.env.DEV;

  React.useEffect(() => {
    (async () => {
      try {
        await init({
          debug,
          eruda: debug && ['ios', 'android'].includes(platform),
          mockForMacOS: platform === 'macos',
        });
      } catch (e) {
        console.error('[AppBootstrap] Init failed:', e);
      }
    })();
  }, []);

  return <Root />;
}

// --- Render App ---
try {
  root.render(
    <StrictMode>
      <AppBootstrap />
    </StrictMode>
  );
} catch (e) {
  console.error('[index.tsx] Failed to bootstrap app:', e);
  root.render(<EnvUnsupported />);
}
