import React from "react";
import { pokemonData } from "../../sData/PokemonData"; // Sample data
import PokemonCard from "./../../components/PokemonCard/PokemonCard"; // Card component
import { Pokemon } from "../../types/pokemonty";


const PokemonPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-purple-600 text-white p-10">
      <h1 className="text-4xl font-bold text-center mb-8 p-10">Pokémon Gallery</h1> 
      <div className="max-w-3xl mx-auto mb-10 p-6 bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Welcome to the Pokémon Gallery!</h2>
          <p className="mb-4">
            Explore a collection of your favorite Pokémon. Click on any card to see more details about each Pokémon.
          </p>
          <p className="italic text-sm">Note: This is a demo page showcasing Pokémon cards.</p>
        </div>
      </div>



{/* Cards Grid - Fixed 4x4 */}
<div className="">
  <div className="grid grid-cols-3 gap-2">
    {pokemonData.slice(0, 16).map((poke: Pokemon) => (
      <PokemonCard key={poke.name} {...poke} />
    ))}
  </div>
</div>
    </div>
  );
};
export default PokemonPage;
