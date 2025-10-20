// src/sData/pokemonData.ts
export interface Pokemon {
  id: number;
  name: string;
  image: string;
  types: string[];
  height: number;
  weight: number;
  // optional extras if you later fetch them
  abilities?: string[];
  moves?: string[];
  evolution?: string[];
  // Purchase-related properties
  totalUnits?: number;
  availableUnits?: number;
  pricePerUnit?: number; // Telegram Stars per unit
  rarity?: 'common' | 'rare' | 'legendary';
}

const TOTAL_POKEMONS = 151;
export const PAGE_SIZE = 160;

// In-memory cache for the session
let cachedPokemons: Pokemon[] = [];

/**
 * Fetch single pokemon by id.
 * Returns Pokemon or null on error.
 */
export const fetchPokemonData = async (id: number): Promise<Pokemon | null> => {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!res.ok)
      throw new Error(`Failed to fetch Pokémon id=${id} status=${res.status}`);
    const data = await res.json();

    const image =
      data.sprites?.other?.['official-artwork']?.front_default ||
      data.sprites?.front_default ||
      '';

    // Determine rarity based on Pokemon ID
    const getRarity = (id: number): 'common' | 'rare' | 'legendary' => {
      if (id >= 144 && id <= 151) return 'legendary'; // Legendary birds + Mew
      if (id >= 130 && id <= 143) return 'rare'; // Pseudo-legendaries and rare Pokemon
      return 'common';
    };

    const rarity = getRarity(data.id);
    const basePriceByRarity = { common: 5, rare: 15, legendary: 50 };

    const p: Pokemon = {
      id: data.id,
      name: data.name,
      image,
      types: Array.isArray(data.types)
        ? data.types.map((t: any) => t.type.name)
        : [],
      height: data.height ?? 0,
      weight: data.weight ?? 0,
      rarity,
      totalUnits: rarity === 'legendary' ? 10 : rarity === 'rare' ? 50 : 100,
      availableUnits:
        rarity === 'legendary'
          ? Math.floor(Math.random() * 5) + 3
          : rarity === 'rare'
          ? Math.floor(Math.random() * 20) + 15
          : Math.floor(Math.random() * 50) + 25,
      pricePerUnit: basePriceByRarity[rarity],
    };

    return p;
  } catch (err) {
    // keep failures silent for the UI, but log for debugging
    console.error(`fetchPokemonData error id=${id}:`, err);
    return null;
  }
};

/**
 * Fetch a page of pokemons (page index starting from 0).
 * Returns successful results only and appends to cache.
 */
export const fetchPokemonPage = async (page: number): Promise<Pokemon[]> => {
  const startId = page * PAGE_SIZE + 1;
  const endId = Math.min(startId + PAGE_SIZE - 1, TOTAL_POKEMONS);
  const jobs: Promise<Pokemon | null>[] = [];

  for (let id = startId; id <= endId; id++) {
    const cached = cachedPokemons.find((p) => p.id === id);
    if (cached) {
      jobs.push(Promise.resolve(cached));
    } else {
      jobs.push(fetchPokemonData(id));
    }
  }

  const results = await Promise.all(jobs);
  // Filter out failed fetches
  const successful = results.filter((r): r is Pokemon => r !== null);

  // Merge only new items (avoid duplicates)
  const newItems = successful.filter(
    (s) => !cachedPokemons.some((c) => c.id === s.id)
  );
  if (newItems.length) cachedPokemons = [...cachedPokemons, ...newItems];

  return successful;
};

/**
 * Optional helper: return cached items (if any)
 */
export const getCachedPokemons = (): Pokemon[] => [...cachedPokemons];

/**
 * Optional helper: reset cache (useful for dev)
 */
export const resetCache = (): void => {
  cachedPokemons = [];
};
