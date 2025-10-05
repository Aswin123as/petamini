import React, { useRef, useEffect, useState } from 'react';

interface Pokemon {
  name: string;
  image: string;
  types: string[];
  height: number;
  weight: number;
  rarity?: 'common' | 'rare' | 'legendary';
}

const typeColors: Record<string, string> = {
  grass: '#78C850',
  poison: '#A040A0',
  fire: '#F08030',
  water: '#6890F0',
  bug: '#A8B820',
  normal: '#A8A878',
  electric: '#F8D030',
  ground: '#E0C068',
  fairy: '#EE99AC',
  fighting: '#C03028',
  psychic: '#F85888',
  rock: '#B8A038',
  ghost: '#705898',
  ice: '#98D8D8',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  flying: '#A890F0',
};

const PokemonCard: React.FC<Pokemon> = ({
  name,
  image,
  types,
  height,
  weight,
  rarity = 'common',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const [isPulsing, setIsPulsing] = useState(false);
  const [gradientPos, setGradientPos] = useState(50);

  const primaryType = types?.[0]?.toLowerCase() || 'normal';
  const primaryColor = typeColors[primaryType] || '#A8A878';
  const secondaryColor = types?.[1]
    ? typeColors[types[1].toLowerCase()]
    : primaryColor;

  // Add floating animation styles
  useEffect(() => {
    if (!styleRef.current) {
      styleRef.current = document.createElement('style');
      styleRef.current.textContent = `
        @keyframes float-pokemon {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-float-pokemon {
          animation: float-pokemon 3s ease-in-out infinite;
        }
      `;
      document.head.appendChild(styleRef.current);
    }

    return () => {
      if (styleRef.current && styleRef.current.parentNode) {
        styleRef.current.parentNode.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };
  }, []);

  // Holographic gradient animation
  useEffect(() => {
    const interval = setInterval(() => {
      setGradientPos((prev) => (prev + 1) % 200);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Tap feedback with haptics
  const handleTap = () => {
    setIsPulsing(true);

    // Haptic feedback if supported
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    setTimeout(() => setIsPulsing(false), 300);
  };

  const rarityGlow = {
    common: 'drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]',
    rare: 'drop-shadow-[0_0_15px_rgba(147,51,234,0.6)]',
    legendary: 'drop-shadow-[0_0_25px_rgba(234,179,8,0.8)]',
  };

  const rarityBorder = {
    common: 'border-white/20',
    rare: 'border-purple-400/40',
    legendary: 'border-yellow-400/50',
  };

  return (
    <div
      ref={cardRef}
      onClick={handleTap}
      className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 select-none
        ${isPulsing ? 'scale-[0.98]' : 'scale-100 active:scale-[0.98]'}
        ${rarityGlow[rarity]}`}
      style={{
        background: `linear-gradient(145deg, ${primaryColor}25, ${secondaryColor}15)`,
        minHeight: '280px',
      }}
    >
      {/* Holographic animated gradient overlay */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
        style={{
          background: `linear-gradient(${gradientPos}deg, 
            ${primaryColor}40 0%, 
            transparent 30%, 
            ${secondaryColor}40 60%, 
            transparent 100%)`,
        }}
      />

      {/* Iridescent border shimmer */}
      <div
        className={`absolute inset-0 rounded-2xl border-2 ${rarityBorder[rarity]} pointer-events-none`}
        style={{
          background: `linear-gradient(${gradientPos * 1.5}deg, 
            rgba(255,255,255,0.1), 
            transparent 40%, 
            rgba(255,255,255,0.2) 80%, 
            transparent)`,
          WebkitMaskImage: 'linear-gradient(transparent, transparent)',
          maskImage: 'linear-gradient(transparent, transparent)',
        }}
      />

      {/* Glassmorphism backdrop */}
      <div className="absolute inset-0 backdrop-blur-sm bg-white/5" />

      {/* Noise texture for depth */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Dynamic glow effect */}
      <div
        className="absolute inset-0 opacity-30 group-active:opacity-50 transition-opacity duration-300 blur-2xl pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${primaryColor}60, transparent 65%)`,
        }}
      />

      {/* Legendary sparkles */}
      {rarity === 'legendary' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-pulse"
              style={{
                left: `${20 + i * 15}%`,
                top: `${10 + (i % 3) * 30}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: '2s',
                opacity: 0.6,
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-4">
        {/* Pokemon Image - HERO */}
        <div className="flex justify-center items-center flex-1 -mt-2">
          <img
            src={image}
            alt={name}
            loading="lazy"
            draggable="false"
            className="w-40 h-40 object-contain transition-all duration-700 ease-out
              group-active:scale-95 animate-float-pokemon drop-shadow-2xl"
            style={{
              filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))',
            }}
          />
        </div>

        {/* Info Section */}
        <div className="space-y-3">
          {/* Name */}
          <h2
            className="text-xl font-bold capitalize tracking-wide text-white text-center
            drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
          >
            {name}
          </h2>

          {/* Type Badges - More Prominent */}
          <div className="flex justify-center gap-2 flex-wrap">
            {types?.map((type) => {
              const color = typeColors[type.toLowerCase()] || '#A8A878';
              return (
                <span
                  key={type}
                  className="text-sm font-bold px-3 py-1.5 rounded-full capitalize text-white
                    shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${color}95, ${color}70)`,
                    boxShadow: `0 4px 12px ${color}50, inset 0 1px 0 rgba(255,255,255,0.3)`,
                  }}
                >
                  {type}
                </span>
              );
            })}
          </div>

          {/* Stats - Simplified */}
          <div className="flex justify-center gap-8 text-white/90 pt-1">
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold">
                {(height / 10).toFixed(1)}m
              </span>
              <p className="text-xs opacity-60 tracking-wider uppercase">
                Height
              </p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold">
                {(weight / 10).toFixed(1)}kg
              </span>
              <p className="text-xs opacity-60 tracking-wider uppercase">
                Weight
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle highlight overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent 
        opacity-0 group-active:opacity-100 transition-opacity duration-200 pointer-events-none rounded-2xl"
      />
    </div>
  );
};

export default PokemonCard;
