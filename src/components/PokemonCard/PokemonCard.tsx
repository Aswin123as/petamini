// telegram-mini-app\New folder\TMA\petamini\src\components\PokemonCard\PokemonCard.tsx

import React from "react";
import "./PokemonCard.css";
import { Pokemon } from "../../sData/PokemonData";

const PokemonCard: React.FC<Pokemon> = ({ name, image, types, height, weight }) => {
  return (
    <div className="mt-5 pt-5 col-lg-4 col-md-6 col-sm-12">
      <div className="pokemon-card">
        <div className="pokemon-image-container">
          <img 
            src={image} 
            alt={name} 
            className="pokemon-image" 
            loading="lazy"
            draggable="false"
          />
        </div>
        <div className="card-content">
          <h2 className="pokemon-name">{name}</h2>
          <div className="type-badges">
            {types.map((type) => (
              <span key={type} className={`type-badge type-${type.toLowerCase()}`}>
                {type}
              </span>
            ))}
          </div>
          <div className="d-flex align-items-center justify-content-between w-100 pt-3">
            <div className="d-flex flex-column align-items-center justify-content-center w-100">
              <span className="pokemon-stats">{height / 10} M</span>
              <p className="stats-label">Height</p>
            </div>
            <div className="d-flex flex-column align-items-center justify-content-center w-100">
              <span className="pokemon-stats">{weight / 10} Kg</span>
              <p className="stats-label">Weight</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PokemonCard;