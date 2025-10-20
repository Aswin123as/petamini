import React, { useRef, useEffect, useState } from 'react';

interface Pokemon {
  name: string;
  image: string;
  types: string[];
  height: number;
  weight: number;
  rarity?: 'common' | 'rare' | 'legendary';
  // Add purchase-related properties
  totalUnits?: number;
  availableUnits?: number;
  pricePerUnit?: number; // Telegram Stars per unit
  id: string;
}

interface PokemonCardProps extends Pokemon {
  onPurchase?: (pokemonId: string, units: number) => void;
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

const PokemonCard: React.FC<PokemonCardProps> = ({
  name,
  image,
  types,
  height,
  weight,
  rarity = 'common',
  totalUnits = 100,
  availableUnits = 100,
  pricePerUnit = 1,
  id,
  onPurchase,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const [isPulsing, setIsPulsing] = useState(false);
  const [gradientPos, setGradientPos] = useState(45);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedUnits, setSelectedUnits] = useState(1);

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

  const handlePurchase = () => {
    if (availableUnits > 0) {
      setShowPurchaseModal(true);
    }
  };

  const confirmPurchase = () => {
    onPurchase?.(id, selectedUnits);
    setShowPurchaseModal(false);
    setSelectedUnits(1);
  };

  const unitProgress = ((totalUnits - availableUnits) / totalUnits) * 100;

  return (
    <>
      <div
        ref={cardRef}
        onClick={handleTap}
        className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 select-none
        hover:scale-[1.03] active:scale-[0.98]
        ${isPulsing ? 'scale-[0.98]' : ''}
        ${rarityGlow[rarity]}`}
        style={{
          background: `linear-gradient(145deg, ${primaryColor}25, ${secondaryColor}15)`,
          width: '280px',
          height: '340px',
          minHeight: '340px',
          maxHeight: '340px',
        }}
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
        <div className="relative z-10 flex flex-col h-full justify-between p-2">
          {/* Availability Badge */}
          <div className="absolute top-1 right-1 z-20">
            <div className="bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-xs text-white font-medium">
              {availableUnits}/{totalUnits}
            </div>
          </div>

          {/* Image */}
          <div className="flex justify-center items-center flex-1">
            <img
              src={image}
              alt={name}
              loading="lazy"
              className="w-24 h-24 object-contain animate-float-pokemon transition-transform duration-700 drop-shadow-2xl"
            />
          </div>

          {/* Info */}
          <div className="space-y-1 mt-1">
            {/* Name */}
            <h2 className="text-base font-bold text-center text-white leading-tight break-words px-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
              {name}
            </h2>

            {/* Types */}
            <div className="flex justify-center gap-1 flex-wrap">
              {types.map((type) => {
                const color = typeColors[type.toLowerCase()] || '#A8A878';
                return (
                  <span
                    key={type}
                    className="text-xs font-bold px-2 py-0.5 rounded-full capitalize text-white shadow-lg backdrop-blur-md"
                    style={{
                      background: `linear-gradient(135deg, ${color}95, ${color}70)`,
                    }}
                  >
                    {type}
                  </span>
                );
              })}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-500"
                style={{ width: `${unitProgress}%` }}
              />
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-2 text-white/90 pt-0.5">
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold">
                  {(height / 10).toFixed(1)}m
                </span>
                <p className="text-xs opacity-60 tracking-wider uppercase">
                  Height
                </p>
              </div>
              <div className="w-px bg-white/20" />
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold">
                  {(weight / 10).toFixed(1)}kg
                </span>
                <p className="text-xs opacity-60 tracking-wider uppercase">
                  Weight
                </p>
              </div>
            </div>

            {/* Purchase Button */}
            <button
              onClick={handlePurchase}
              disabled={availableUnits === 0}
              className={`w-full py-1.5 px-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 text-sm
                ${
                  availableUnits > 0
                    ? 'bg-yellow-500/90 hover:bg-yellow-400/90 text-black'
                    : 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
                }`}
            >
              <span className="text-xs">⭐</span>
              {availableUnits > 0 ? `${pricePerUnit} Stars/unit` : 'Sold Out'}
            </button>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 w-full max-w-xs border border-white/20">
            <h3 className="text-lg font-bold text-white mb-3 text-center">
              Purchase {name}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-white/80 text-sm block text-center">
                  Select Units
                </label>
                <div className="flex items-center justify-center gap-3 mt-2">
                  <button
                    onClick={() =>
                      setSelectedUnits(Math.max(1, selectedUnits - 1))
                    }
                    className="bg-white/20 hover:bg-white/30 rounded-lg w-10 h-10 flex items-center justify-center text-white font-bold"
                  >
                    −
                  </button>
                  <span className="text-white font-bold text-xl min-w-[3rem] text-center">
                    {selectedUnits}
                  </span>
                  <button
                    onClick={() =>
                      setSelectedUnits(
                        Math.min(availableUnits, selectedUnits + 1)
                      )
                    }
                    className="bg-white/20 hover:bg-white/30 rounded-lg w-10 h-10 flex items-center justify-center text-white font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="text-center text-white/90 py-2 bg-white/5 rounded-lg">
                Total:{' '}
                <span className="text-yellow-400 font-bold text-lg">
                  ⭐ {selectedUnits * pricePerUnit}
                </span>{' '}
                Stars
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-white/20 hover:bg-white/30 text-white font-semibold transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPurchase}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-yellow-500/90 hover:bg-yellow-400/90 text-black font-semibold transition-all text-sm"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PokemonCard;
