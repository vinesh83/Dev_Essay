// Practice prompts. The real Sudie TAG prompts are secret. The school says they
// test expression, not facts, and the essay is argumentative/opinion, aligned
// to STAAR grades 3-5. So we practice two shapes:
//   1. "open" opinion prompts (no reading) - most likely format
//   2. "passage" prompts with a short original article (STAAR-style, needs
//      text evidence)
// All passages below are original, written for this app.

export type Prompt = {
  id: string;
  kind: "open" | "passage";
  title: string;
  question: string;
  passage?: { title: string; paragraphs: string[] };
  sides: [string, string];
};

export const PROMPTS: Prompt[] = [
  {
    id: "homework",
    kind: "open",
    title: "Homework on weekends",
    question: "Should students get homework on the weekend? Write an essay that states your opinion and supports it with reasons and examples.",
    sides: ["Yes, weekend homework helps", "No, weekends should be free"],
  },
  {
    id: "pet",
    kind: "open",
    title: "Best class pet",
    question: "Your class can adopt one pet. Which pet should it be? Convince your teacher with strong reasons.",
    sides: ["A fish / small pet", "A furry pet like a hamster or rabbit"],
  },
  {
    id: "recess",
    kind: "open",
    title: "Longer recess",
    question: "Should recess be longer, even if the school day has to be longer too? State your opinion and support it.",
    sides: ["Yes, longer recess", "No, keep it the same"],
  },
  {
    id: "superpower",
    kind: "open",
    title: "The most useful superpower",
    question: "If you could have one superpower to help your community, which would you choose? Explain why it is the best choice.",
    sides: ["A power that helps people (healing, flying to rescue)", "A power that helps the planet (controlling weather, growing plants)"],
  },
  {
    id: "screens",
    kind: "open",
    title: "Screen time limits",
    question: "Should kids your age have a daily limit on screen time? Write an essay giving your opinion.",
    sides: ["Yes, limits are good", "No, kids can decide"],
  },
  {
    id: "uniforms",
    kind: "open",
    title: "School uniforms",
    question: "Should all students wear school uniforms? Take a side and support it with reasons.",
    sides: ["Yes, uniforms", "No uniforms"],
  },
  {
    id: "fieldtrip",
    kind: "open",
    title: "Field trip pick",
    question: "Your class gets one field trip: a science museum or a nature park. Which is the better choice? Persuade your principal.",
    sides: ["Science museum", "Nature park"],
  },
  {
    id: "leader",
    kind: "open",
    title: "What makes a great leader",
    question: "What is the most important quality a leader should have? Explain your opinion with examples from your life, books, or history.",
    sides: ["Kindness / caring", "Courage / honesty"],
  },
  {
    id: "invention",
    kind: "open",
    title: "Greatest invention",
    question: "What invention has made the biggest difference in people's lives? Convince the reader that your choice is the most important.",
    sides: ["Something old (the wheel, the printing press)", "Something new (the internet, phones)"],
  },
  {
    id: "chores",
    kind: "open",
    title: "Paid for chores",
    question: "Should kids get paid for doing chores at home? Write an essay that states and supports your opinion.",
    sides: ["Yes, pay for chores", "No, chores are part of family"],
  },
  {
    id: "fourday",
    kind: "open",
    title: "Four-day school week",
    question: "Some schools have a four-day week with longer days. Is this a good idea? Give your opinion and reasons.",
    sides: ["Yes, four days", "No, keep five days"],
  },
  {
    id: "books_movies",
    kind: "open",
    title: "Book or movie",
    question: "Is it better to read a story as a book or watch it as a movie? Support your opinion.",
    sides: ["Book", "Movie"],
  },
  {
    id: "zoo",
    kind: "open",
    title: "Are zoos good for animals",
    question: "Are zoos a good thing for animals? State your opinion and support it with reasons and examples.",
    sides: ["Yes, zoos help animals", "No, animals belong in the wild"],
  },
  {
    id: "mistake",
    kind: "open",
    title: "Learning from mistakes",
    question: "Some people say making mistakes is the best way to learn. Do you agree? Explain with examples from your own life.",
    sides: ["Agree", "Disagree"],
  },
  {
    id: "space",
    kind: "open",
    title: "Explore space or ocean",
    question: "Should people spend more money exploring space or exploring the ocean? Convince your reader.",
    sides: ["Space", "Ocean"],
  },
  {
    id: "team_solo",
    kind: "open",
    title: "Team or solo",
    question: "Is it better to work on a school project alone or with a team? Take a side and defend it.",
    sides: ["Team", "Alone"],
  },
  {
    id: "garden",
    kind: "passage",
    title: "A school garden",
    question: "Read the article \"Should Our School Grow a Garden?\" Should every school have a garden? Write an argumentative essay that uses evidence from the article to support your opinion.",
    passage: {
      title: "Should Our School Grow a Garden?",
      paragraphs: [
        "At Maple Creek Elementary, a patch of dirt behind the gym became a garden last spring. Students planted tomatoes, carrots, beans, and sunflowers.",
        "Teachers say the garden turned into an outdoor classroom. Third graders measured how fast bean plants grew. Fourth graders learned how worms make soil healthy. \"Kids who usually sit quietly started asking questions,\" said Ms. Ortiz, a science teacher.",
        "The garden also changed lunch. When students tasted carrots they grew themselves, many asked for more vegetables in the cafeteria.",
        "Not everyone agrees gardens are easy. Gardens need water every day, even in summer when school is closed. Tools and seeds cost money. One parent worried that time in the garden means less time for reading and math.",
        "Maple Creek solved some problems with help. Families signed up to water the garden in summer, and a local store donated seeds. Now other schools are asking: should we grow one too?",
      ],
    },
    sides: ["Yes, every school should have a garden", "No, gardens are too much work"],
  },
  {
    id: "phones",
    kind: "passage",
    title: "Phones at school",
    question: "Read the article \"Ring, Ring! Phones at School.\" Should students be allowed to bring phones to school? Use evidence from the article to support your opinion.",
    passage: {
      title: "Ring, Ring! Phones at School",
      paragraphs: [
        "Many families give children phones so they can stay in touch. Parents like knowing they can reach their child if plans change or there is an emergency.",
        "But phones can also cause trouble at school. A teacher in Ohio counted how often phones buzzed in her class. In one week, she counted more than 60 buzzes. \"Every buzz pulls attention away from learning,\" she said.",
        "Some schools found a middle path. Students bring phones but lock them in a pouch until the last bell. Students can still call home after school, but phones stay quiet in class.",
        "Other people point out that phones can be learning tools. Students can look up facts, take photos of science experiments, or use a calculator.",
        "Schools across the country are still deciding which rule works best.",
      ],
    },
    sides: ["Yes, allow phones", "No, keep phones out of school"],
  },
  {
    id: "library",
    kind: "passage",
    title: "Libraries in a digital world",
    question: "Read the article \"Do We Still Need Libraries?\" Are public libraries still important today? Write an argumentative essay using evidence from the article.",
    passage: {
      title: "Do We Still Need Libraries?",
      paragraphs: [
        "Today, many people read on tablets and search for answers online. Some wonder if libraries are still needed.",
        "Libraries offer more than books. Many have free computers and internet for families who do not have them at home. Others host coding clubs, story times, and homework help.",
        "Librarians also teach people how to find good information. \"Anyone can post something online,\" said librarian Mr. Chen. \"We help kids tell the difference between facts and rumors.\"",
        "Still, libraries cost cities money for buildings, staff, and books. Some cities have cut library hours to save money.",
        "In one town, visits to the library went up after it added a maker space with 3-D printers and robot kits.",
      ],
    },
    sides: ["Yes, libraries matter", "No, we can use the internet"],
  },
  {
    id: "bikes",
    kind: "passage",
    title: "Biking to school",
    question: "Read the article \"Pedal Power.\" Should more kids bike or walk to school? Use evidence from the article to support your opinion.",
    passage: {
      title: "Pedal Power",
      paragraphs: [
        "Fifty years ago, about half of American kids walked or biked to school. Today, far fewer do. Most ride in cars or buses.",
        "Doctors say kids need about an hour of activity every day. A bike ride to school can be a big part of that.",
        "Biking also helps the air. Fewer cars at drop-off means less smoke from tailpipes and shorter traffic lines.",
        "But many parents worry about safety. Some roads have no sidewalks or bike lanes, and drivers can be in a hurry.",
        "One city painted bright bike lanes and added crossing guards. After a year, twice as many students were biking to school.",
      ],
    },
    sides: ["Yes, more kids should bike or walk", "No, cars and buses are better"],
  },
  {
    id: "games",
    kind: "passage",
    title: "Video games and learning",
    question: "Read the article \"Game On?\" Can video games be good for kids? Write an argumentative essay using evidence from the article.",
    passage: {
      title: "Game On?",
      paragraphs: [
        "Video games are one of the most popular hobbies for kids. Some adults think games waste time. Others think games can teach.",
        "Some games ask players to solve puzzles, plan ahead, and work as a team. A study found that kids who played building games got better at picturing shapes in their minds.",
        "Games can also bring friends together, even when they live far apart.",
        "However, sitting for hours is not healthy. Doctors warn that too much screen time can hurt sleep, especially right before bed.",
        "Many families set rules, like playing only after homework or only on weekends.",
      ],
    },
    sides: ["Yes, games can be good", "No, games do more harm"],
  },
];

export function promptById(id: string): Prompt | undefined {
  return PROMPTS.find((p) => p.id === id);
}
