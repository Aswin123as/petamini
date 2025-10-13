import React, { useEffect, useState } from 'react';
// import { fetchPokemonPage, Pokemon } from '../../sData/pokemonData';
import { fetchPokemonPage, Pokemon } from '@/sData/PokemonData';
import PokemonCard from '../../components/PokemonCard/PokemonCard';
import SwipeableGrid from '@/components/swipeItems/swipeItems';

const PokemonPage: React.FC = () => {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  // const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  // const [hasMore, setHasMore] = useState(true);

  const loadNextPage = async () => {
    // setLoading(true);
    const newPokemons = await fetchPokemonPage(page);
    setPokemons((prev) => [...prev, ...newPokemons]);
    setPage((prev) => prev + 1);
    // setLoading(false);

    // Check if we reached total Pokémon
    // if (newPokemons.length < 20) setHasMore(false);
  };

  useEffect(() => {
    loadNextPage(); // Load first page
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-purple-600 text-white">
      <header className="text-center py-1 px-6 sm:px-4 md:px-6 lg:px-10">
        <h6 className="text-4xl font-bold mb-2">Pokémon Gallery</h6>
      </header>

      <section>
        {/* className="px-4 sm:px-6 md:px-10 pb-10"> */}
        <SwipeableGrid
          items={pokemons}
          renderItem={(poke) => <PokemonCard {...poke} />}
          keyExtractor={(poke) => poke.name}
          itemsPerPage={4}
          columns={2}
          gap={2}
        />

        {/* {hasMore && (
          <div className="flex justify-center mt-6">
            <button
              onClick={loadNextPage}
              className="px-6 py-2 bg-white/20 backdrop-blur-md rounded-lg hover:bg-white/30 transition"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )} */}
      </section>
    </div>
  );
};

export default PokemonPage;
