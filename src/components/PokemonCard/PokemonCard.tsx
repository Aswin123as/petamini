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
  const [gradientPos, setGradientPos] = useState(45);

  const primaryType = types?.[0]?.toLowerCase() || 'normal';
  const primaryColor = typeColors[primaryType] || '#A8A878';
  const secondaryColor = types?.[1]
    ? typeColors[types[1].toLowerCase()]
    : primaryColor;

  // Floating animation
  useEffect(() => {
    if (!styleRef.current) {
      styleRef.current = document.createElement('style');
      styleRef.current.textContent = `
        @keyframes float-pokemon {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .animate-float-pokemon {
          animation: float-pokemon 3s ease-in-out infinite;
        }
      `;
      document.head.appendChild(styleRef.current);
    }
    return () => {
      styleRef.current?.remove();
      styleRef.current = null;
    };
  }, []);

  // Gradient animation (optimized)
  useEffect(() => {
    const interval = setInterval(() => {
      setGradientPos((prev) => (prev + 1) % 360);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // Tap feedback
  const handleTap = () => {
    setIsPulsing(true);
    if ('vibrate' in navigator) navigator.vibrate(10);
    setTimeout(() => setIsPulsing(false), 300);
  };

  const rarityGlow = {
    common: 'drop-shadow-[0_0_6px_rgba(255,255,255,0.25)]',
    rare: 'drop-shadow-[0_0_12px_rgba(147,51,234,0.5)]',
    legendary: 'drop-shadow-[0_0_20px_rgba(234,179,8,0.7)]',
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
      hover:scale-[1.03] active:scale-[0.98]
      ${isPulsing ? 'scale-[0.98]' : ''}
      ${rarityGlow[rarity]}`}
    >
      {/* Animated overlay */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
        style={{
          background: `linear-gradient(${gradientPos}deg, ${primaryColor}40 0%, transparent 40%, ${secondaryColor}40 80%, transparent 100%)`,
        }}
      />

      {/* Border shimmer */}
      <div
        className={`absolute inset-0 rounded-2xl border-2 ${rarityBorder[rarity]} pointer-events-none`}
        style={{
          background: `linear-gradient(${
            gradientPos * 1.5
          }deg, rgba(255,255,255,0.1), transparent 40%, rgba(255,255,255,0.2) 80%, transparent)`,
        }}
      />

      {/* Glass layer */}
      <div className="absolute inset-0 backdrop-blur-sm bg-white/5" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full justify-between p-3">
        {/* Image */}
        <div className="flex justify-center items-center flex-1">
          <img
            src={image}
            alt={name}
            loading="lazy"
            className="w-36 h-36 object-contain animate-float-pokemon transition-transform duration-700 drop-shadow-2xl"
          />
        </div>

        {/* Info */}
        <div className="space-y-2 mt-2">
          {/* Name */}
          <h2
            className="text-xl font-bold text-center text-white leading-tight break-words
            px-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
          >
            {name}
          </h2>

          {/* Types (scrollable if many) */}
          <div className="flex justify-center gap-2 flex-wrap max-h-16 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
            {types.map((type) => {
              const color = typeColors[type.toLowerCase()] || '#A8A878';
              return (
                <span
                  key={type}
                  className="text-sm font-bold px-3 py-1 rounded-full capitalize text-white shadow-lg backdrop-blur-md"
                  style={{
                    background: `linear-gradient(135deg, ${color}95, ${color}70)`,
                  }}
                >
                  {type}
                </span>
              );
            })}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-4 text-white/90 pt-1">
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
    </div>
  );
};

export default PokemonCard;
