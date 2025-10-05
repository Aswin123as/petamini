import React from 'react';
import { pokemonData } from '../../sData/PokemonData'; // Sample data
import PokemonCard from './../../components/PokemonCard/PokemonCard'; // Card component
import SwipeableGrid from '@/components/swipeItems/swipeItems';

const PokemonPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-purple-600 text-white">
      {/* Header Section */}
      <header className="text-center py-10 px-4">
        <h1 className="text-4xl font-bold mb-4">Pokémon Gallery</h1>
        {/* Optional subtitle */}
        {/* <p className="text-white/80">Swipe through the Pokémon collection below!</p> */}
      </header>

      {/* Full-Width Swipeable Grid */}
      <div className="relative">
        <section className="px-4 sm:px-6 md:px-10 pb-10">
          <SwipeableGrid
            items={pokemonData}
            renderItem={(poke) => <PokemonCard {...poke} />}
            keyExtractor={(poke) => poke.name}
            itemsPerPage={1}
            columns={1}
            gap={1}
          />
        </section>
      </div>
    </div>
  );
};

export default PokemonPage;
