import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  forceSeason?: string;
}

export default function SeasonalWrapper({ children }: Props) {
  // Seasonal visuals removed — passthrough component to avoid changing layout
  return <>{children}</>;
}
