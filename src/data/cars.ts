// The Garage. Every car is an original design with a made-up name: no real
// brands, badges, or logos. Stats are fictional and just for fun.

export type CarInfo = { id: string; name: string; style: string; price: number; hp: number; top: number; zero: number; blurb: string; rarity: "common" | "rare" | "epic" | "legendary" };

export const CARS: CarInfo[] = [
  { id: "car_wedge", name: "Thunder Wedge V12", style: "Wedge supercar", price: 150, hp: 760, top: 217, zero: 2.8, blurb: "Sharp as a doorstop, loud as a storm.", rarity: "common" },
  { id: "car_rosso", name: "Rosso Rocket", style: "Mid-engine racer", price: 200, hp: 710, top: 211, zero: 2.9, blurb: "Bright red and born on a racetrack.", rarity: "common" },
  { id: "car_coupe", name: "Silver Bullet Coupe", style: "Classic rear-engine coupe", price: 180, hp: 500, top: 192, zero: 3.4, blurb: "Round headlights and a legendary shape.", rarity: "common" },
  { id: "car_muscle", name: "Hammerhead V8", style: "American muscle car", price: 260, hp: 800, top: 200, zero: 3.5, blurb: "Racing stripes and a rumble you can feel.", rarity: "rare" },
  { id: "car_rally", name: "Dust Devil Rally", style: "Rally racer", price: 280, hp: 400, top: 155, zero: 3.2, blurb: "Mud, gravel, snow: it does not care.", rarity: "rare" },
  { id: "car_midnight", name: "Midnight GT", style: "Grand tourer", price: 340, hp: 650, top: 205, zero: 3.3, blurb: "Black paint with gold wheels. Very fancy.", rarity: "rare" },
  { id: "car_tuner", name: "Neon Kite Tuner", style: "Street tuner", price: 320, hp: 540, top: 186, zero: 3.6, blurb: "Big wing, bright paint, drifts all day.", rarity: "rare" },
  { id: "car_volt", name: "Volt Phantom EV", style: "Electric hypercar", price: 520, hp: 1900, top: 256, zero: 1.9, blurb: "Totally silent. Totally fast.", rarity: "epic" },
  { id: "car_gt3", name: "Track Beast GT", style: "Race car", price: 600, hp: 560, top: 190, zero: 3.0, blurb: "A giant wing glues it to the track.", rarity: "epic" },
  { id: "car_arrow", name: "Hyper Arrow W16", style: "Hypercar", price: 800, hp: 1500, top: 273, zero: 2.4, blurb: "The fastest car in the land.", rarity: "epic" },
  { id: "car_crown", name: "Golden Crown", style: "Legendary hypercar", price: 1200, hp: 2000, top: 280, zero: 1.8, blurb: "Pure gold. Only true champions drive it.", rarity: "legendary" },
  { id: "car_comet", name: "Ice Comet", style: "Snow Festival special", price: 400, hp: 1000, top: 240, zero: 2.5, blurb: "Only shows up when snow falls. Grab it!", rarity: "epic" },
];

export const carById = (id?: string) => CARS.find((c) => c.id === id);
