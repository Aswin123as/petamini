import React, { useEffect, useState } from 'react';
// import { fetchPokemonPage, Pokemon } from '../../sData/pokemonData';
import { fetchPokemonPage, Pokemon } from '@/sData/PokemonData';
import PokemonCard from '../../components/PokemonCard/PokemonCard';
import SwipeableGrid from '@/components/swipeItems/swipeItems';
// import GlassTabs from '@/components/GlassTabs/GlassTabs';

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
  };

  useEffect(() => {
    loadNextPage(); // Load first page
  }, []);

  const tabs = [
    {
      label: 'Gallery',
      content: (
        <SwipeableGrid
          items={pokemons}
          renderItem={(poke) => <PokemonCard {...poke} id={String(poke.id)} />}
          keyExtractor={(poke) => poke.name}
          itemsPerPage={4}
          columns={2}
          gap={2}
        />
      ),
    },
    {
      label: 'About',
      content: (
        <div>
          <h2 className="text-xl font-bold mb-2">About Pokémon</h2>
          <p className="text-white/80">
            Pokémon are creatures of various shapes and sizes...
          </p>
        </div>
      ),
    },
  ];
  console.log(tabs);
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-purple-600 text-white">
      <header className="text-center py-1 px-6 sm:px-4 md:px-6 lg:px-10">
        <h6 className="text-4xl font-bold mb-2">Pokémon Gallery</h6>
      </header>

      <section>
        {/* className="px-4 sm:px-6 md:px-10 pb-10"> */}
        <SwipeableGrid
          items={pokemons}
          renderItem={(poke) => <PokemonCard {...poke} id={String(poke.id)} />}
          keyExtractor={(poke) => poke.name}
          itemsPerPage={2}
          columns={1}
          gap={2}
        />
      </section>
    </div>
  );
};

export default PokemonPage;
