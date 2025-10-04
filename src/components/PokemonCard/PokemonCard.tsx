import React from 'react';
import { Pokemon } from '../../sData/PokemonData';

const PokemonCard: React.FC<Pokemon> = ({
  name,
  image,
  types,
  height,
  weight,
}) => {
  const primaryType = types[0]?.toLowerCase() || 'normal';

  return (
    <div
      className={`
        relative group p-[1px]
        rounded-2xl overflow-hidden
        bg-gradient-to-br from-white/10 to-white/5
        backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.1)]
        hover:shadow-[0_12px_32px_rgba(0,0,0,0.2)]
        transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
        border border-white/20
        cursor-pointer
      `}
    >
      {/* Image */}
      <div className="relative flex justify-center mt-4">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 rounded-t-2xl" />
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

      {/* Content */}
      <div className="p-4 text-center">
        <h2
          className="
            text-lg font-semibold capitalize tracking-wide
            text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]
            group-hover:text-yellow-200 transition-colors duration-300
          "
        >
          {name}
        </h2>

        {/* Types */}
        <div className="flex justify-center gap-2 mt-2">
          {types.map((type) => (
            <span
              key={type}
              className={`
                text-xs font-medium px-2 py-1 rounded-full capitalize
                bg-gradient-to-r from-${type.toLowerCase()}-500/70 to-${type.toLowerCase()}-400/70
                text-white/90 shadow-[0_2px_6px_rgba(0,0,0,0.15)]
                backdrop-blur-sm
              `}
            >
              {type}
            </span>
          ))}
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

      {/* Subtle floating glow */}
      <div
        className={`
          absolute inset-0 pointer-events-none opacity-0
          group-hover:opacity-100
          transition-opacity duration-700
          bg-gradient-to-t from-${primaryType}-500/30 via-transparent to-transparent
          blur-3xl
        `}
      />
    </div>
  );
};

export default PokemonCard;
