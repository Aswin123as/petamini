import React, { useState } from 'react';

interface Tab {
  label: string;
  content: React.ReactNode;
}

interface GlassTabsProps {
  tabs: Tab[];
  initialTab?: number;
}

const GlassTabs: React.FC<GlassTabsProps> = ({ tabs, initialTab = 0 }) => {
  const [active, setActive] = useState(initialTab);

  return (
    <div className="w-full max-w-2xl mx-auto my-6">
      <div className="flex bg-white/10 backdrop-blur-lg rounded-xl p-2 shadow-lg">
        {tabs.map((tab, idx) => (
          <button
            key={tab.label}
            className={`flex-1 px-4 py-2 rounded-lg transition-all font-semibold
              ${
                active === idx
                  ? 'bg-white/30 text-blue-900 shadow'
                  : 'bg-transparent text-white hover:bg-white/20'
              }
            `}
            onClick={() => setActive(idx)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4 bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg min-h-[200px]">
        {tabs[active].content}
      </div>
    </div>
  );
};

export default GlassTabs;
