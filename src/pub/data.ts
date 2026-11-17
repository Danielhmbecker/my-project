export type Shape = 'standard' | 'round' | 'square' | 'slim';

export interface Product {
  id: string;
  name: string;
  sizeMl: number;
  shelf: number; // 1..4
  cost: number; // £ per bottle
  shape: Shape;
  glass: string;
  liquid: string;
  label: string;
  labelInk: string;
  cap: string;
  foil?: string;
  mark: string; // short text printed on the label
}

const p = (
  id: string,
  name: string,
  sizeMl: number,
  shelf: number,
  cost: number,
  shape: Shape,
  glass: string,
  liquid: string,
  label: string,
  labelInk: string,
  cap: string,
  mark: string,
  foil?: string,
): Product => ({ id, name, sizeMl, shelf, cost, shape, glass, liquid, label, labelInk, cap, mark, foil });

export const LOCATION = 'BACK BAR';
export const PER_SHELF = 8;

/** 32 bottles, 8 per shelf. Pimm's is #14 (shelf 2) to match the design. */
export const PRODUCTS: Product[] = [
  // Shelf 1
  p('smirnoff', 'Smirnoff Red Label', 700, 1, 14.5, 'standard', '#dfe9ee', '#e8f0f3', '#b3262d', '#fff', '#b3262d', 'SMIRNOFF'),
  p('absolut', 'Absolut Vodka', 700, 1, 17, 'slim', '#e3ecf2', '#eef4f8', '#eef3f7', '#1d4f9c', '#d9dde0', 'ABSOLUT'),
  p('gordons', "Gordon's London Dry", 700, 1, 15, 'standard', '#1f6b45', '#dbe9e1', '#f3efe0', '#1b5a39', '#c9a24a', "GORDON'S"),
  p('tanqueray', 'Tanqueray London Dry', 700, 1, 20, 'square', '#1f6b45', '#dbe9e1', '#1d5a38', '#f1ece0', '#1d5a38', 'TANQUERAY'),
  p('hendricks', "Hendrick's Gin", 700, 1, 27, 'round', '#14181a', '#cfd8d4', '#e9e3d2', '#202427', '#b88c3c', "HENDRICK'S"),
  p('bombay', 'Bombay Sapphire', 700, 1, 21, 'square', '#2a6fb0', '#cfe3f2', '#2a6fb0', '#f2f6fa', '#2a6fb0', 'BOMBAY'),
  p('bacardi', 'Bacardi Carta Blanca', 700, 1, 16, 'standard', '#dfe9e6', '#eaf1ef', '#f1f1f1', '#b3262d', '#222', 'BACARDÍ'),
  p('captain', 'Captain Morgan Spiced', 700, 1, 18, 'standard', '#5a2e13', '#7a3d14', '#c68a2c', '#2a1608', '#2a1608', 'CAPTAIN'),
  // Shelf 2
  p('jackd', "Jack Daniel's Old No.7", 700, 2, 22, 'square', '#2d1a0d', '#7b3f12', '#161412', '#ece5d4', '#161412', "JACK DANIEL'S"),
  p('jameson', 'Jameson Irish Whiskey', 700, 2, 21, 'standard', '#1e5a37', '#9a5a1a', '#f1ecdc', '#1e5a37', '#1e5a37', 'JAMESON'),
  p('bells', "Bell's Original", 700, 2, 14, 'standard', '#6d3d14', '#8b4a14', '#a9262d', '#f4ead2', '#a9262d', "BELL'S"),
  p('grouse', 'Famous Grouse', 700, 2, 16, 'standard', '#5b2d0f', '#8f4a14', '#c4372c', '#f4ead2', '#c4372c', 'GROUSE'),
  p('baileys', 'Baileys Irish Cream', 700, 2, 18, 'round', '#3b2a1d', '#c8a98a', '#e6d9bf', '#4a2e1a', '#4a2e1a', 'BAILEYS'),
  p('pimms', "Pimm's No.1 Cup", 750, 2, 17, 'standard', '#21140c', '#8a3a12', '#f3ecdd', '#a6232a', '#cfd5d8', "PIMM'S", '#c9ccce'),
  p('archers', 'Archers Peach Schnapps', 700, 2, 12, 'standard', '#dcebe8', '#e8c68a', '#e2a04b', '#4a2410', '#cf5a3b', 'ARCHERS'),
  p('disaronno', 'Disaronno Amaretto', 700, 2, 19, 'square', '#6b3a14', '#7d3a0f', '#cfa24a', '#2a1608', '#a8191e', 'DISARONNO'),
  // Shelf 3
  p('soco', 'Southern Comfort', 700, 3, 17, 'standard', '#6d3d14', '#9b5a1f', '#f1e5c4', '#8a1f1f', '#2a2a2a', 'SOCO'),
  p('jager', 'Jägermeister', 700, 3, 19, 'round', '#17301f', '#2a1a0c', '#e8741f', '#1a1a1a', '#e8741f', 'JÄGER'),
  p('aperol', 'Aperol', 700, 3, 14, 'standard', '#e8561a', '#e8561a', '#f06a22', '#fff', '#f06a22', 'APEROL'),
  p('campari', 'Campari Bitter', 700, 3, 18, 'standard', '#a1141c', '#b0141e', '#d4202c', '#fff', '#d4202c', 'CAMPARI'),
  p('martinir', 'Martini Rosso', 750, 3, 9, 'standard', '#6a1a1a', '#7a1717', '#f3ecdd', '#a8191e', '#a8191e', 'MARTINI'),
  p('martinid', 'Martini Extra Dry', 750, 3, 9, 'standard', '#dfe9d6', '#e9efc7', '#f3ecdd', '#2a5b9c', '#2a5b9c', 'MARTINI'),
  p('tiamaria', 'Tia Maria', 700, 3, 15, 'square', '#1a0e08', '#2a160a', '#e8e0cf', '#2a1608', '#2a1608', 'TIA MARIA'),
  p('cointreau', 'Cointreau', 700, 3, 22, 'square', '#e5ecea', '#eef2f1', '#e2701c', '#fff', '#e2701c', 'COINTREAU'),
  // Shelf 4
  p('malibu', 'Malibu Coconut', 700, 4, 14, 'standard', '#e6eef0', '#eef3f4', '#f3f3f1', '#1d7aa8', '#1d7aa8', 'MALIBU'),
  p('kraken', 'Kraken Black Spiced', 700, 4, 21, 'round', '#14181a', '#1a1208', '#22272a', '#c8a03c', '#14181a', 'KRAKEN'),
  p('havana', 'Havana Club 3 Años', 700, 4, 17, 'standard', '#d8e6dc', '#e9d6a4', '#efe6cf', '#2f6a3c', '#2f6a3c', 'HAVANA'),
  p('glenfid', 'Glenfiddich 12', 700, 4, 30, 'round', '#2d5b3a', '#c88b2a', '#e8dcb8', '#1f4a2e', '#c0a050', 'GLENFIDDICH'),
  p('courv', 'Courvoisier VS', 700, 4, 26, 'standard', '#2f2112', '#8a4a14', '#1a1a1a', '#d9b867', '#d9b867', 'COURVOISIER'),
  p('hennessy', 'Hennessy VS', 700, 4, 28, 'standard', '#3a2512', '#8b4a14', '#e6d7ac', '#2a1608', '#2a1608', 'HENNESSY'),
  p('gordpink', "Gordon's Pink", 700, 4, 15, 'standard', '#f1d7dc', '#f2c4cd', '#eab0bd', '#8a1f3f', '#cfa24a', "GORDON'S"),
  p('cuervo', 'Jose Cuervo Gold', 700, 4, 19, 'standard', '#8a5a1a', '#b9812a', '#1a1a1a', '#e8c15a', '#1a1a1a', 'CUERVO'),
];

export const SHELF_COUNT = 4;

export const WASTE_REASONS = ['Spillage', 'Breakage', 'Over-pour', 'Out of date', 'Staff / comp'] as const;
export type WasteReason = (typeof WASTE_REASONS)[number];
export const WASTE_AMOUNTS = [25, 50, 100, 250] as const;
