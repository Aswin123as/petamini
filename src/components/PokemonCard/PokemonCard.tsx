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

const MAX_TILT = 6;
const SCALE_HOVER = 1.03;

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

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    let rect: DOMRect;

    const handleTouchStart = () => {
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
      className="group relative w-full max-w-[250px] aspect-[4/5] rounded-2xl overflow-hidden shadow-lg border border-white/20 cursor-pointer transition-all duration-300 ease-out"
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
        background: `linear-gradient(145deg, ${primaryColor}30, rgba(255,255,255,0.05) 70%)`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
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
      <div className="relative flex justify-center mt-2 z-10 flex-shrink-0">
        <img
          src={image}
          alt={name}
          loading="lazy"
          draggable="false"
          className="w-24 h-24 md:w-28 md:h-28 object-contain transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-1 drop-shadow-[0_4px_10px_rgba(0,0,0,0.15)]"
        />
      </div>

      {/* Info */}
      <div className="p-3 text-center relative z-10 overflow-hidden flex-shrink-0">
        <h2 className="text-lg md:text-xl font-semibold capitalize truncate text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
          {name}
        </h2>

        <div className="flex justify-center gap-1 mt-2 flex-wrap">
          {types.map((type) => {
            const color = typeColors[type.toLowerCase()] || '#A8A878';
            return (
              <span
                key={type}
                className="text-xs md:text-sm font-medium px-2 py-1 rounded-full capitalize text-white/90 shadow-md backdrop-blur-sm truncate"
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

        <div className="mt-3 flex justify-center gap-4 md:gap-6 text-sm md:text-base text-white/90 flex-wrap">
          <div className="flex flex-col items-center overflow-hidden">
            <span className="font-semibold truncate">
              {(height / 10).toFixed(1)}m
            </span>
            <p className="opacity-70 text-xs md:text-sm tracking-wide truncate">
              Height
            </p>
          </div>
          <div className="flex flex-col items-center overflow-hidden">
            <span className="font-semibold truncate">
              {(weight / 10).toFixed(1)}kg
            </span>
            <p className="opacity-70 text-xs md:text-sm tracking-wide truncate">
              Weight
            </p>
          </div>
        </div>
      </div>

      {/* Soft overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none" />
    </div>
  );
};

export default PokemonCard;
