// Real sentences for typing practice. Short, fun, and about things Dev
// likes: fast cars, Ellie the Sheepadoodle, block worlds, adventure games,
// school, and Dallas. Mixed in are essay sentences he'll need on test day.

export const FUN_SENTENCES = [
  // Cars
  "The red car zoomed past the finish line.",
  "My dream car is a blue Bugatti.",
  "A Corvette can go from zero to sixty in three seconds.",
  "The Lamborghini doors open up like wings.",
  "We washed the car until it sparkled in the sun.",
  "The race car needs new tires before the next lap.",
  "A Tesla is quiet because it runs on batteries.",
  "The Mustang has two white stripes on the hood.",
  "Dad says the Porsche has round headlights.",
  "The rally car jumped over a muddy hill.",
  "I would paint my car bright orange.",
  "Fast cars need strong brakes to stop quickly.",
  "The driver waved the checkered flag.",
  "The Jesko has a giant wing on the back.",
  "My garage has room for six fast cars.",
  "Buckle your seat belt before we drive.",
  // Ellie
  "Ellie the Sheepadoodle loves to chase her ball.",
  "Ellie has fluffy black and white fur.",
  "My dog Ellie jumped into the pool.",
  "Ellie barks when the mail truck comes.",
  "I gave Ellie a treat for sitting still.",
  "Ellie sleeps at the foot of my bed.",
  "Ellie can catch a frisbee in the air.",
  "We took Ellie for a long walk in the park.",
  "Ellie is the best dog in all of Texas.",
  "When it rains, Ellie hides under the table.",
  // Games and block worlds
  "I mined three diamonds deep in the cave.",
  "Build a house before the sun goes down.",
  "My sword is made of shiny iron.",
  "The hero found a secret door behind the waterfall.",
  "I crafted a golden pickaxe today.",
  "Jump across the lava to reach the treasure chest.",
  "Our castle has tall towers and a moat.",
  "The boss level was hard, but I beat it.",
  "I saved up coins to buy a new shield.",
  "We explored the jungle and found a temple.",
  "Torches keep the cave bright and safe.",
  "The dragon guarded a mountain of gold.",
  "Level five has a puzzle with moving blocks.",
  "My friend and I built a bridge over the river.",
  // Everyday fun
  "Pizza night is the best night of the week.",
  "We played tag until the streetlights came on.",
  "The quick brown fox jumps over the lazy dog.",
  "I can ride my bike without training wheels.",
  "Grandma makes the best mango lassi.",
  "The zoo has a baby giraffe named Zara.",
  "We went swimming at the lake on Saturday.",
  "My little brother built a fort out of pillows.",
  "The fireworks lit up the sky over Dallas.",
  "I read a book about sharks last night.",
  "The ice cream truck plays a happy song.",
  "Thunder boomed and the lights went out.",
  "My soccer team won the game six to four.",
  "We baked cookies and ate them warm.",
  "The museum has a real dinosaur skeleton.",
  "I found a smooth rock shaped like a heart.",
  "Astronauts float because there is no gravity.",
  "A cheetah is the fastest animal on land.",
  "Octopuses have three hearts and blue blood.",
  "Jupiter is the biggest planet in our solar system.",
  // Essay sentences
  "I believe kids should have longer recess.",
  "First, playing outside keeps us healthy.",
  "For example, my class runs races at recess.",
  "This shows that exercise helps kids focus.",
  "Another reason is that friends work together.",
  "Some people think homework is too much.",
  "However, practice helps us remember what we learn.",
  "In conclusion, every school needs a library.",
  "That is why I think pets make families happier.",
  "Most importantly, reading opens new worlds.",
];

/** Single words that are fun to type. */
export const FUN_WORDS =
  "zoom race car turbo engine wheel brake drift garage speed ellie puppy fluffy fetch treat bark diamond pickaxe sword shield castle dragon torch lava cave treasure quest jump coins level boss jungle temple pizza taco mango rocket planet comet shark tiger zebra giraffe octopus soccer bike swim park fort cookie thunder"
    .split(" ");

/** Pick sentences, favoring ones that use the given letters. */
export function pickSentences(n: number, letters: string[] = [], seed = Math.random): string[] {
  const score = (s: string) => letters.reduce((a, k) => a + (s.toLowerCase().split(k).length - 1), 0);
  const pool = [...FUN_SENTENCES].sort(() => seed() - 0.5);
  if (letters.length) pool.sort((a, b) => score(b) - score(a));
  const top = pool.slice(0, Math.max(n * 3, n));
  return top.sort(() => seed() - 0.5).slice(0, n);
}

/** Sentences and words that contain a letter. */
export const sentencesWith = (ch: string) => FUN_SENTENCES.filter((s) => s.toLowerCase().includes(ch.toLowerCase()));
export const wordsWith = (ch: string) => FUN_WORDS.filter((w) => w.includes(ch.toLowerCase()));
