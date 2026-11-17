// The Garage. Real sports cars Dev will recognize, by name only. Most 3D
// models are credited CC BY models from Sketchfab (see `credit` and
// public/models/LICENSE.txt); the rest are shaped in code from each car's
// real proportions. Badges and logos are blacked out in code.
// Stats are approximate published figures, rounded.

export type CarInfo = { id: string; name: string; style: string; price: number; hp: number; top: number; zero: number; blurb: string; rarity: "common" | "rare" | "epic" | "legendary"; credit?: string };

export const CARS: CarInfo[] = [
  { id: "car_vette", name: "Chevrolet Corvette Stingray", style: "Mid-engine American sports car", price: 150, hp: 495, top: 194, zero: 2.9, blurb: "America's sports car, with the engine behind the seats.", rarity: "common", credit: "2019 Chevrolet Corvette C8 Stingray by Hari Prasath R (Haris3D) on Sketchfab, CC BY 4.0" },
  { id: "car_coupe", name: "Porsche 911 GT3 RS", style: "Rear-engine German race car for the road", price: 180, hp: 518, top: 184, zero: 3.0, blurb: "Round headlights, a giant wing, and a shape that's been famous for 60 years.", rarity: "common", credit: "Porsche 911 GT3 RS (992) by Mona x Supercars (Car2022) on Sketchfab, CC BY 4.0" },
  { id: "car_wedge", name: "Lamborghini Aventador", style: "Italian V12 supercar", price: 220, hp: 769, top: 217, zero: 2.8, blurb: "Sharp as a wedge and loud as thunder.", rarity: "common", credit: "Lamborghini Aventador LP750-4 SV by Hari Prasath R (Haris3D) on Sketchfab, CC BY 4.0" },
  { id: "car_rosso", name: "Ferrari 458 Spider", style: "Italian mid-engine supercar", price: 260, hp: 562, top: 199, zero: 3.0, blurb: "Bright red, roof down, and born on the racetrack. A detailed 3D model.", rarity: "rare", credit: "Ferrari 458 by vicent091036, via the three.js examples" },
  { id: "car_muscle", name: "Ford Mustang Shelby GT500", style: "American muscle car", price: 260, hp: 760, top: 180, zero: 3.3, blurb: "Racing stripes and a rumble you can feel.", rarity: "rare", credit: "2020 Ford Shelby GT500 by Galaxy Car Showroom (adrianaflak09) on Sketchfab, CC BY 4.0" },
  { id: "car_rally", name: "Subaru WRX STI", style: "Rally car", price: 280, hp: 310, top: 159, zero: 4.9, blurb: "Mud, gravel, snow: it does not care.", rarity: "rare", credit: "Subaru Impreza WRX STi 2004 Custom by MAC ULT ARTS (MACULTARTS) on Sketchfab, CC BY 4.0" },
  { id: "car_midnight", name: "Maserati GranTurismo", style: "Italian grand tourer", price: 340, hp: 542, top: 199, zero: 3.5, blurb: "Fast, comfy, and very fancy.", rarity: "rare", credit: "Maserati GranTurismo S Stradale by Mona x Supercars (Car2022) on Sketchfab, CC BY 4.0" },
  { id: "car_tuner", name: "Toyota GR Supra", style: "Japanese sports car", price: 320, hp: 382, top: 155, zero: 3.9, blurb: "A legend of street racing, now with a big wing.", rarity: "rare", credit: "GR Supra 2020 by CARS2024 on Sketchfab, CC BY 4.0" },
  { id: "car_roadster", name: "Tesla Roadster (new)", style: "Electric supercar", price: 300, hp: 1000, top: 250, zero: 1.9, blurb: "Tesla's newest Roadster. Stats are the announced targets.", rarity: "epic", credit: "Tesla Roadster by Mona x Supercars (Car2022) on Sketchfab, CC BY 4.0" },
  { id: "car_models", name: "Tesla Model S Plaid", style: "Electric super-sedan", price: 360, hp: 1020, top: 200, zero: 2.0, blurb: "A family car that beats supercars off the line.", rarity: "rare", credit: "Tesla Model S Plaid by Valentun (Lals) on Sketchfab, CC BY 4.0" },
  { id: "car_volt", name: "Rimac Nevera", style: "Electric hypercar", price: 520, hp: 1914, top: 258, zero: 1.9, blurb: "Totally silent. One of the quickest cars ever made.", rarity: "epic", credit: "Rimac Nevera by 3dblender_1 on Sketchfab, CC BY 4.0" },
  { id: "car_gt3", name: "Corvette C8.R", style: "Race car", price: 600, hp: 500, top: 190, zero: 3.0, blurb: "Yellow, loud, and built to win endurance races.", rarity: "epic", credit: "2020 Chevrolet Corvette C8.R by Ddiaz Design (ddiaz-design) on Sketchfab, CC BY 4.0" },
  { id: "car_arrow", name: "Bugatti Chiron", style: "Hypercar", price: 800, hp: 1500, top: 261, zero: 2.4, blurb: "Sixteen cylinders and two-tone blue paint.", rarity: "epic", credit: "2023 Bugatti Chiron Profilee by DisneyCars (supercarmodels) on Sketchfab, CC BY 4.0" },
  { id: "car_crown", name: "Koenigsegg Jesko", style: "Swedish hypercar", price: 1200, hp: 1600, top: 300, zero: 2.5, blurb: "Built to chase 300 miles per hour. Gold for champions.", rarity: "legendary", credit: "2020 Koenigsegg Jesko by Ddiaz Design (ddiaz-design) on Sketchfab, CC BY 4.0" },
  { id: "car_comet", name: "Audi R8 (Snow Edition)", style: "Snow Festival special", price: 400, hp: 602, top: 205, zero: 3.1, blurb: "Ice-blue paint. Only shows up when snow falls!", rarity: "epic", credit: "2021 Audi R8 V10 Performance Quattro by DisneyCars (supercarmodels) on Sketchfab, CC BY 4.0" },
];

export const carById = (id?: string) => CARS.find((c) => c.id === id);
