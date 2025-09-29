// --- PokemonPage.tsx ---
import React from "react";
import  "../../css/PokemonPage.css"; // Page-specific styles
import { pokemonData } from "../../sData/PokemonData"; // Sample data
import PokemonCard from "./../../components/PokemonCard/PokemonCard"; // Card component
import { Pokemon } from "../../types/pokemonty";


const PokemonPage: React.FC = () => {
return (
<div className="pokemon-page">
<h1 className="title">Pokémon Cards</h1>
<div className="card-grid">
{pokemonData.map((poke: Pokemon) => (
<PokemonCard key={poke.name} {...poke} />
))}
</div>
</div>
);
};


export default PokemonPage;