import React,{useState} from "react";
import "./PokemonCard.css";
import { Pokemon } from "../../sData/PokemonData";

const PokemonCard: React.FC<Pokemon> = ({ name, image, types, height, weight }) => {
  const primaryType = types[0]?.toLowerCase() || 'normal';
  const [currentPage, setCurrentPage] = useState(0);
  
  return (
    <div className=" p-1">
      <div className={`pokemon-card type-${primaryType}-bg`}>
        {/* image area */}
        <div className="pokemon-image-container">
          <img 
            src={image} 
            alt={name} 
            className="pokemon-image" 
            loading="lazy"
            draggable="false"
          />
        </div>

        {/* name area */}
        <div className="card-content">
          <h2 className="pokemon-name">{name}</h2>
          <div className="type-badges">
            {types.map((type) => (
              <span key={type} className={`type-badge type-${type.toLowerCase()}`}>
                {type}
              </span>
            ))}
          </div>

          {/* stats Area */}
          <div className="pokemon-stats-container">
            <div className="stat-item">
              <span className="pokemon-stats">{height / 10}M</span>
              <p className="stats-label">Height</p>
            </div>
            <div className="stat-item">
              <span className="pokemon-stats">{weight / 10}Kg</span>
              <p className="stats-label">Weight</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PokemonCard;