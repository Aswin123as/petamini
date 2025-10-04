import React, { useRef } from 'react';
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

const MAX_TILT = 8; // degrees
const TRANSITION_SPEED = 200; // ms

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

  // Mouse move handler
  const handleMouseMove = (e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left; // cursor x in card
    const y = e.clientY - rect.top; // cursor y in card

    const halfWidth = rect.width / 2;
    const halfHeight = rect.height / 2;

    const rotateY = ((x - halfWidth) / halfWidth) * MAX_TILT;
    const rotateX = ((halfHeight - y) / halfHeight) * MAX_TILT;

    card.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg) scale(1.03)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'rotateY(0deg) rotateX(0deg) scale(1)';
  };

  return (
    <div
      ref={cardRef}
      className={`
        relative group p-[1px]
        rounded-2xl overflow-hidden
        bg-white/5 backdrop-blur-xl
        border border-white/20
        shadow-[0_8px_24px_rgba(0,0,0,0.1)]
        hover:shadow-[0_12px_32px_rgba(0,0,0,0.2)]
        transition-all duration-300 ease-out
        cursor-pointer
        animate-[fadeIn_0.6s_ease-out]
        [@keyframes_fadeIn]{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      `}
      style={{
        background: `linear-gradient(145deg, ${primaryColor}30, rgba(255,255,255,0.05) 70%)`,
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Floating glow */}
      <div
        className="absolute inset-0 blur-3xl opacity-40 group-hover:opacity-70 transition-opacity duration-700"
        style={{
          background: `radial-gradient(circle at 50% 20%, ${primaryColor}40, transparent 60%)`,
        }}
      />

      {/* Pokémon Image */}
      <div className="relative flex justify-center mt-4 z-10">
        <img
          src={image}
          alt={name}
          loading="lazy"
          draggable="false"
          className="
            w-28 h-28 object-contain
            transition-transform duration-500
            group-hover:scale-110 group-hover:-translate-y-1
            drop-shadow-[0_4px_10px_rgba(0,0,0,0.15)]
          "
        />
      </div>

      {/* Card Content */}
      <div className="p-4 text-center relative z-10">
        <h2
          className="
            text-lg font-semibold capitalize tracking-wide
            text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]
            group-hover:text-yellow-200 transition-colors duration-300
          "
        >
          {name}
        </h2>

        {/* Type badges */}
        <div className="flex justify-center gap-2 mt-3">
          {types.map((type) => {
            const color = typeColors[type.toLowerCase()] || '#A8A878';
            return (
              <span
                key={type}
                className="
                  text-xs font-medium px-2 py-1 rounded-full capitalize
                  text-white/90 shadow-[0_2px_6px_rgba(0,0,0,0.15)]
                  backdrop-blur-sm transition-all duration-300
                "
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

        {/* Stats */}
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

      {/* Soft reflective overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none" />
    </div>
  );
};

export default PokemonCard;
