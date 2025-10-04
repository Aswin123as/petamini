import React, { useRef, useEffect } from 'react';
import { Pokemon } from '../../sData/PokemonData';

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

const MAX_TILT = 6; // degrees
const SCALE_HOVER = 1.02;

const PokemonCard: React.FC<Pokemon> = ({
  name,
  image,
  types,
  height,
  weight,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const primaryType = types[0]?.toLowerCase() || 'normal';
  const primaryColor = typeColors[primaryType] || '#A8A878';

  const resetTransform = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'rotateY(0deg) rotateX(0deg) scale(1)';
    card.style.zIndex = '0';
  };

  // Mouse tilt
  const handleMouseMove = (e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateY = (x / rect.width - 0.5) * 2 * MAX_TILT;
    const rotateX = (0.5 - y / rect.height) * 2 * MAX_TILT;

    card.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg) scale(${SCALE_HOVER})`;
    card.style.zIndex = '10';
  };

  // Touch tilt
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    let rect: DOMRect;

    const handleTouchStart = (e: TouchEvent) => {
      rect = card.getBoundingClientRect();
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const deltaX = touch.clientX - rect.left;
      const deltaY = touch.clientY - rect.top;

      const rotateY = (deltaX / rect.width - 0.5) * 2 * MAX_TILT;
      const rotateX = (0.5 - deltaY / rect.height) * 2 * MAX_TILT;

      card.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg) scale(${SCALE_HOVER})`;
      card.style.zIndex = '10';
    };

    const handleTouchEnd = () => resetTransform();

    card.addEventListener('touchstart', handleTouchStart, { passive: true });
    card.addEventListener('touchmove', handleTouchMove, { passive: true });
    card.addEventListener('touchend', handleTouchEnd);
    card.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      card.removeEventListener('touchstart', handleTouchStart);
      card.removeEventListener('touchmove', handleTouchMove);
      card.removeEventListener('touchend', handleTouchEnd);
      card.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className={`
        relative p-[1px]
        rounded-2xl overflow-visible
        bg-white/5 backdrop-blur-xl
        border border-white/20
        shadow-[0_8px_24px_rgba(0,0,0,0.1)]
        hover:shadow-[0_12px_32px_rgba(0,0,0,0.2)]
        transition-all duration-300 ease-out
        cursor-pointer
      `}
      style={{
        background: `linear-gradient(145deg, ${primaryColor}30, rgba(255,255,255,0.05) 70%)`,
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTransform}
    >
      {/* Glow */}
      <div
        className="absolute inset-0 blur-3xl opacity-40 group-hover:opacity-70 transition-opacity duration-700"
        style={{
          background: `radial-gradient(circle at 50% 20%, ${primaryColor}40, transparent 60%)`,
        }}
      />

      {/* Image */}
      <div className="relative flex justify-center mt-4 z-10">
        <img
          src={image}
          alt={name}
          loading="lazy"
          draggable="false"
          className="
            w-28 h-28 object-contain
            transition-transform duration-500
            group-hover:scale-105 group-hover:-translate-y-1
            drop-shadow-[0_4px_10px_rgba(0,0,0,0.15)]
          "
        />
      </div>

      {/* Info */}
      <div className="p-4 text-center relative z-10">
        <h2 className="text-lg font-semibold capitalize tracking-wide text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
          {name}
        </h2>

        <div className="flex justify-center gap-2 mt-3">
          {types.map((type) => {
            const color = typeColors[type.toLowerCase()] || '#A8A878';
            return (
              <span
                key={type}
                className="text-xs font-medium px-2 py-1 rounded-full capitalize text-white/90 shadow-[0_2px_6px_rgba(0,0,0,0.15)] backdrop-blur-sm transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, ${color}90, ${color}60)`,
                  boxShadow: `0 0 10px ${color}40`,
                }}
              >
                {type}
              </span>
            );
          })}
        </div>

        <div className="mt-4 flex justify-center gap-6 text-sm text-white/90">
          <div className="flex flex-col items-center">
            <span className="font-semibold text-base">
              {(height / 10).toFixed(1)}m
            </span>
            <p className="opacity-70 text-xs tracking-wide">Height</p>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-semibold text-base">
              {(weight / 10).toFixed(1)}kg
            </span>
            <p className="opacity-70 text-xs tracking-wide">Weight</p>
          </div>
        </div>
      </div>

      {/* Soft overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none" />
    </div>
  );
};

export default PokemonCard;
