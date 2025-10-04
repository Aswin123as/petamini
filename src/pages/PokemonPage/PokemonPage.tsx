import React from "react";
import { pokemonData } from "../../sData/PokemonData"; // Sample data
import PokemonCard from "./../../components/PokemonCard/PokemonCard"; // Card component
import { Pokemon } from "../../types/pokemonty";


const PokemonPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      {/* Header with Glassmorphism Effect */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/20">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center drop-shadow-lg">
            Pokémon Cards
          </h1>
          <p className="text-white/80 text-center mt-2 font-medium">
            Discover your favorite Pokémon
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-0">
          {pokemonData.map((poke: Pokemon) => (
            <PokemonCard key={poke.name} {...poke} />
          ))}
        </div>
      </div>
    </div>
  );
};
export default PokemonPage;
