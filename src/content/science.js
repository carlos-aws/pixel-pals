// Science: a fact card is shown first, then a question about it.
// Levels: 1 = very simple, 2 = simple, 3 = a bit more thinking.

import { pick, shuffle, sample, makeOptions } from '../util.js';

export const FACTS = [
  // Animals
  { id: 'bees', cat: 'animals', lvl: 1, e: '🐝', fact: 'Bees make honey from flowers.', q: 'What do bees make?', a: 'Honey', d: ['Milk', 'Bread'] },
  { id: 'tadpole', cat: 'animals', lvl: 2, e: '🐸', fact: 'A baby frog is called a tadpole. It lives in water.', q: 'What is a baby frog called?', a: 'Tadpole', d: ['Puppy', 'Kitten'] },
  { id: 'giraffe', cat: 'animals', lvl: 1, e: '🦒', fact: 'The giraffe is the tallest animal on land.', q: 'Which animal is the tallest?', a: 'Giraffe', d: ['Cat', 'Pig'] },
  { id: 'trunk', cat: 'animals', lvl: 1, e: '🐘', fact: 'An elephant uses its long trunk to drink and grab food.', q: 'What does an elephant use to drink?', a: 'Its trunk', d: ['Its tail', 'Its ear'] },
  { id: 'penguin', cat: 'animals', lvl: 2, e: '🐧', fact: 'Penguins are birds, but they cannot fly. They are great swimmers!', q: 'Can penguins fly?', a: 'No', d: ['Yes'] },
  { id: 'butterfly', cat: 'animals', lvl: 1, e: '🦋', fact: 'A caterpillar grows up to become a butterfly.', q: 'What does a caterpillar become?', a: 'Butterfly', d: ['Bee', 'Bird'] },
  { id: 'turtle', cat: 'animals', lvl: 1, e: '🐢', fact: 'A turtle carries its home on its back. It is called a shell.', q: 'What is on a turtle\'s back?', a: 'A shell', d: ['A hat', 'A wing'] },
  { id: 'gills', cat: 'animals', lvl: 2, e: '🐟', fact: 'Fish breathe under water with gills.', q: 'What do fish use to breathe?', a: 'Gills', d: ['Lungs', 'Ears'] },
  { id: 'bat', cat: 'animals', lvl: 3, e: '🦇', fact: 'Bats are the only mammals that can fly.', q: 'Which of these can fly?', a: 'Bat', d: ['Dog', 'Cow'] },
  { id: 'cow', cat: 'animals', lvl: 1, e: '🐄', fact: 'Cows eat grass and give us milk.', q: 'What do cows give us?', a: 'Milk', d: ['Juice', 'Honey'] },
  { id: 'hen', cat: 'animals', lvl: 1, e: '🐔', fact: 'Hens lay eggs. Chicks hatch out of the eggs.', q: 'Which animal lays eggs?', a: 'Hen', d: ['Dog', 'Cat'] },
  { id: 'owl', cat: 'animals', lvl: 2, e: '🦉', fact: 'Owls hunt at night and sleep in the day.', q: 'When do owls hunt?', a: 'At night', d: ['In the morning'] },
  { id: 'camel', cat: 'animals', lvl: 3, e: '🐪', fact: 'A camel stores fat in its hump, so it can go a long time without food.', q: 'Where does a camel store fat?', a: 'In its hump', d: ['In its ears', 'In its feet'] },
  { id: 'octopus', cat: 'animals', lvl: 1, e: '🐙', fact: 'An octopus has eight arms.', q: 'How many arms does an octopus have?', a: '8', d: ['4', '6'] },
  { id: 'spider', cat: 'animals', lvl: 2, e: '🕷️', fact: 'Spiders have eight legs. Insects have six legs.', q: 'How many legs does a spider have?', a: '8', d: ['6', '2'] },
  { id: 'ants', cat: 'animals', lvl: 3, e: '🐜', fact: 'Ants live together in big groups called colonies.', q: 'A big group of ants is called a...', a: 'Colony', d: ['Band', 'Team'] },
  { id: 'dolphin', cat: 'animals', lvl: 3, e: '🐬', fact: 'Dolphins are not fish. They are mammals and they breathe air.', q: 'Do dolphins breathe air?', a: 'Yes', d: ['No'] },
  { id: 'kangaroo', cat: 'animals', lvl: 2, e: '🦘', fact: 'A kangaroo carries its baby in a pouch.', q: 'Where does a kangaroo keep its baby?', a: 'In a pouch', d: ['In a tree', 'In a shell'] },
  { id: 'snake', cat: 'animals', lvl: 1, e: '🐍', fact: 'Snakes have no legs. They slide along on their belly.', q: 'How many legs does a snake have?', a: '0', d: ['2', '4'] },
  { id: 'snail', cat: 'animals', lvl: 1, e: '🐌', fact: 'A snail carries its shell everywhere it goes.', q: 'What does a snail carry?', a: 'Its shell', d: ['Its bed', 'Its lunch'] },
  { id: 'chameleon', cat: 'animals', lvl: 3, e: '🦎', fact: 'Some lizards can change colour to hide.', q: 'Why do some lizards change colour?', a: 'To hide', d: ['To sing', 'To fly'] },
  { id: 'whale', cat: 'animals', lvl: 2, e: '🐳', fact: 'The blue whale is the biggest animal in the world.', q: 'What is the biggest animal?', a: 'Blue whale', d: ['Elephant', 'Horse'] },
  // Space
  { id: 'sun', cat: 'space', lvl: 1, e: '☀️', fact: 'The Sun is a star. It gives us light and heat.', q: 'What is the Sun?', a: 'A star', d: ['A planet', 'A cloud'] },
  { id: 'earth', cat: 'space', lvl: 1, e: '🌍', fact: 'We live on a planet called Earth.', q: 'What is the name of our planet?', a: 'Earth', d: ['Mars', 'Moon'] },
  { id: 'moon', cat: 'space', lvl: 2, e: '🌙', fact: 'The Moon goes around the Earth.', q: 'What goes around the Earth?', a: 'The Moon', d: ['The Sun', 'A cloud'] },
  { id: 'saturn', cat: 'space', lvl: 3, e: '🔭', fact: 'Saturn is a planet with big rings around it.', q: 'Which planet has big rings?', a: 'Saturn', d: ['Earth', 'Mars'] },
  { id: 'astronaut', cat: 'space', lvl: 1, e: '🚀', fact: 'Astronauts wear space suits so they can breathe in space.', q: 'What do astronauts wear?', a: 'Space suits', d: ['Pyjamas', 'Raincoats'] },
  { id: 'stars', cat: 'space', lvl: 2, e: '🌟', fact: 'Stars look tiny because they are very, very far away.', q: 'Why do stars look tiny?', a: 'They are far away', d: ['They are shy', 'They are cold'] },
  { id: 'mars', cat: 'space', lvl: 2, e: '🔴', fact: 'Mars is called the red planet.', q: 'Which planet is red?', a: 'Mars', d: ['Earth', 'Saturn'] },
  { id: 'spin', cat: 'space', lvl: 3, e: '🌎', fact: 'The Earth spins around. That is why we have day and night.', q: 'What makes day and night?', a: 'The Earth spinning', d: ['The wind', 'The rain'] },
  { id: 'moonair', cat: 'space', lvl: 3, e: '🌕', fact: 'There is no air on the Moon.', q: 'Is there air on the Moon?', a: 'No', d: ['Yes'] },
  // Body
  { id: 'teeth', cat: 'body', lvl: 1, e: '😁', fact: 'Brush your teeth two times a day to keep them healthy.', q: 'How often should you brush your teeth?', a: 'Two times a day', d: ['Once a year', 'Never'] },
  { id: 'heart', cat: 'body', lvl: 2, e: '❤️', fact: 'Your heart pumps blood all around your body.', q: 'What pumps blood around your body?', a: 'Heart', d: ['Nose', 'Foot'] },
  { id: 'lungs', cat: 'body', lvl: 2, e: '💨', fact: 'Your lungs help you breathe in air.', q: 'What helps you breathe?', a: 'Lungs', d: ['Bones', 'Hair'] },
  { id: 'bones', cat: 'body', lvl: 2, e: '🦴', fact: 'Bones make your skeleton. They hold your body up.', q: 'What holds your body up?', a: 'Bones', d: ['Water', 'Hair'] },
  { id: 'ears', cat: 'body', lvl: 1, e: '👂', fact: 'You see with your eyes and hear with your ears.', q: 'What do you hear with?', a: 'Ears', d: ['Eyes', 'Toes'] },
  { id: 'sleep', cat: 'body', lvl: 1, e: '💤', fact: 'Sleep helps your body and your brain grow.', q: 'What helps your brain grow?', a: 'Sleep', d: ['TV', 'Candy'] },
  { id: 'brain', cat: 'body', lvl: 2, e: '🧠', fact: 'Your brain is the boss of your body. It tells your body what to do.', q: 'What tells your body what to do?', a: 'Brain', d: ['Tummy', 'Knee'] },
  { id: 'veg', cat: 'body', lvl: 1, e: '🥕', fact: 'Fruit and vegetables help keep you healthy and strong.', q: 'Which is a healthy snack?', a: 'Carrot', d: ['Lollipop', 'Chips'] },
  { id: 'water', cat: 'body', lvl: 1, e: '💧', fact: 'Your body needs water. Drink water every day.', q: 'What should you drink every day?', a: 'Water', d: ['Soda', 'Paint'] },
  { id: 'tongue', cat: 'body', lvl: 2, e: '👅', fact: 'You smell with your nose and taste with your tongue.', q: 'What do you taste with?', a: 'Tongue', d: ['Ear', 'Elbow'] },
  { id: 'fingers', cat: 'body', lvl: 3, e: '🖐️', fact: 'You have five fingers on each hand. That makes ten fingers.', q: 'How many fingers on two hands?', a: '10', d: ['5', '8'] },
  { id: 'germs', cat: 'body', lvl: 2, e: '🧼', fact: 'Soap and water wash germs off your hands.', q: 'What washes germs off your hands?', a: 'Soap and water', d: ['Sand', 'Glue'] },
  // Weather & Earth
  { id: 'rain', cat: 'earth', lvl: 1, e: '🌧️', fact: 'Rain falls from clouds.', q: 'Where does rain fall from?', a: 'Clouds', d: ['Trees', 'Rocks'] },
  { id: 'rainbow', cat: 'earth', lvl: 2, e: '🌈', fact: 'A rainbow appears when the sun shines through rain.', q: 'What do you need for a rainbow?', a: 'Sun and rain', d: ['Snow and ice', 'Wind and sand'] },
  { id: 'freeze', cat: 'earth', lvl: 2, e: '❄️', fact: 'When it is very cold, water freezes and turns into ice.', q: 'What happens to water when it is very cold?', a: 'It freezes', d: ['It boils', 'It sings'] },
  { id: 'ocean', cat: 'earth', lvl: 3, e: '🌊', fact: 'Most of the Earth is covered by water.', q: 'Is most of the Earth land or water?', a: 'Water', d: ['Land'] },
  { id: 'volcano', cat: 'earth', lvl: 2, e: '🌋', fact: 'A volcano is a mountain that can spit out hot lava.', q: 'What comes out of a volcano?', a: 'Lava', d: ['Milk', 'Snow'] },
  { id: 'wind', cat: 'earth', lvl: 1, e: '🍃', fact: 'Wind is air that is moving.', q: 'What is wind?', a: 'Moving air', d: ['Cold water', 'Hot sand'] },
  { id: 'clouds', cat: 'earth', lvl: 3, e: '☁️', fact: 'Clouds are made of tiny drops of water.', q: 'What are clouds made of?', a: 'Tiny water drops', d: ['Cotton', 'Smoke'] },
  { id: 'thermo', cat: 'earth', lvl: 3, e: '🌡️', fact: 'A thermometer tells us how hot or cold it is.', q: 'What does a thermometer measure?', a: 'How hot or cold', d: ['How heavy', 'How loud'] },
  { id: 'thunder', cat: 'earth', lvl: 2, e: '⚡', fact: 'Thunder is the sound that lightning makes.', q: 'What sound does lightning make?', a: 'Thunder', d: ['Music', 'Barking'] },
  { id: 'recycle', cat: 'earth', lvl: 2, e: '♻️', fact: 'Recycling turns old things into new things.', q: 'What does recycling do?', a: 'Makes old things new', d: ['Makes rain', 'Makes noise'] },
  { id: 'seasons', cat: 'earth', lvl: 3, e: '🍂', fact: 'There are four seasons: spring, summer, autumn and winter.', q: 'How many seasons are there?', a: '4', d: ['2', '7'] },
  // Plants
  { id: 'grow', cat: 'plants', lvl: 1, e: '🌱', fact: 'Plants need water, sunlight and air to grow.', q: 'What does a plant need to grow?', a: 'Water and sun', d: ['Candy', 'TV'] },
  { id: 'oxygen', cat: 'plants', lvl: 3, e: '🌳', fact: 'Trees make the oxygen that we breathe.', q: 'What do trees give us?', a: 'Oxygen', d: ['Milk', 'Shoes'] },
  { id: 'sunflower', cat: 'plants', lvl: 2, e: '🌻', fact: 'Sunflowers turn to face the sun.', q: 'Which way do sunflowers face?', a: 'The sun', d: ['The ground', 'The moon'] },
  { id: 'apples', cat: 'plants', lvl: 1, e: '🍎', fact: 'Apples grow on trees.', q: 'Where do apples grow?', a: 'On trees', d: ['Under water', 'In the sky'] },
  { id: 'seed', cat: 'plants', lvl: 1, e: '🌰', fact: 'A tiny seed can grow into a big plant.', q: 'What can grow into a plant?', a: 'A seed', d: ['A rock', 'A coin'] },
  { id: 'carrot', cat: 'plants', lvl: 2, e: '🥕', fact: 'Carrots grow under the ground.', q: 'Where do carrots grow?', a: 'Under the ground', d: ['On trees', 'In water'] },
  { id: 'autumn', cat: 'plants', lvl: 2, e: '🍁', fact: 'In autumn, many trees drop their leaves.', q: 'When do many trees drop their leaves?', a: 'Autumn', d: ['Summer'] },
  { id: 'cactus', cat: 'plants', lvl: 2, e: '🌵', fact: 'A cactus stores water, so it can live in the hot desert.', q: 'Where does a cactus live?', a: 'Desert', d: ['Ocean', 'Snow'] },
  { id: 'roots', cat: 'plants', lvl: 3, e: '🌿', fact: 'Roots hold a plant in the ground and drink up water.', q: 'What do roots do?', a: 'Drink up water', d: ['Make music', 'Fly away'] },
  // Everyday science
  { id: 'melt', cat: 'things', lvl: 1, e: '🍦', fact: 'Ice melts and turns into water when it gets warm.', q: 'What does ice become when it gets warm?', a: 'Water', d: ['Rock', 'Sand'] },
  { id: 'magnet', cat: 'things', lvl: 2, e: '🧲', fact: 'A magnet pulls things made of iron.', q: 'What does a magnet pull?', a: 'Iron', d: ['Paper', 'Wood'] },
  { id: 'float', cat: 'things', lvl: 1, e: '⛵', fact: 'Wood floats on water. Rocks sink.', q: 'Which one floats?', a: 'Wood', d: ['Rock'] },
  { id: 'light', cat: 'things', lvl: 3, e: '🔦', fact: 'Light travels very, very fast.', q: 'Is light fast or slow?', a: 'Fast', d: ['Slow'] },
  { id: 'hotair', cat: 'things', lvl: 3, e: '🎈', fact: 'Hot air goes up. That is how hot air balloons fly.', q: 'Which way does hot air go?', a: 'Up', d: ['Down'] },
  { id: 'salt', cat: 'things', lvl: 3, e: '🧂', fact: 'Salt dissolves in water. It disappears, but you can still taste it.', q: 'What happens to salt in water?', a: 'It dissolves', d: ['It floats', 'It grows'] },
  { id: 'sound', cat: 'things', lvl: 3, e: '🔊', fact: 'Sound is made when things shake very fast. We call that vibrating.', q: 'What makes sound?', a: 'Things vibrating', d: ['Things that are blue', 'Things that are wet'] },
  { id: 'shadow', cat: 'things', lvl: 2, e: '🌑', fact: 'A shadow is made when something blocks the light.', q: 'What makes a shadow?', a: 'Blocking light', d: ['A loud noise', 'Cold air'] },
  { id: 'wheels', cat: 'things', lvl: 1, e: '🚲', fact: 'Wheels help things roll and move easily.', q: 'What helps a bike move?', a: 'Wheels', d: ['Wings', 'Fins'] },
  { id: 'rust', cat: 'things', lvl: 3, e: '🔩', fact: 'Iron can go rusty and brown when it gets wet.', q: 'What makes iron rusty?', a: 'Water', d: ['Music', 'Sunshine'] },
  { id: 'echo', cat: 'things', lvl: 3, e: '🏔️', fact: 'An echo is a sound bouncing back to you.', q: 'What is an echo?', a: 'A sound bouncing back', d: ['A kind of bird', 'A cold wind'] },
];

// Sorting questions built from small lists.
const LIVING = [['cat', '🐱'], ['tree', '🌳'], ['flower', '🌸'], ['bee', '🐝'], ['fish', '🐟'], ['frog', '🐸'], ['bird', '🐦'], ['dog', '🐶']];
const NONLIVING = [['car', '🚗'], ['ball', '⚽'], ['book', '📖'], ['cup', '🥤'], ['key', '🔑'], ['robot', '🤖'], ['clock', '⏰'], ['sock', '🧦']];
const WATER = [['fish', '🐟'], ['whale', '🐳'], ['octopus', '🐙'], ['crab', '🦀'], ['dolphin', '🐬'], ['shark', '🦈']];
const LAND = [['cat', '🐱'], ['dog', '🐶'], ['horse', '🐴'], ['lion', '🦁'], ['elephant', '🐘'], ['cow', '🐄']];
const FLY = [['bird', '🐦'], ['bee', '🐝'], ['butterfly', '🦋'], ['bat', '🦇'], ['owl', '🦉']];
const NOFLY = [['dog', '🐶'], ['cow', '🐄'], ['pig', '🐷'], ['fish', '🐟'], ['snake', '🐍']];
const HOT = [['sun', '☀️'], ['fire', '🔥'], ['soup', '🍲'], ['candle', '🕯️']];
const COLD = [['snow', '❄️'], ['ice cream', '🍦'], ['snowman', '⛄'], ['penguin', '🐧']];
const FLOATS = [['boat', '⛵'], ['leaf', '🍃'], ['duck', '🦆'], ['balloon', '🎈']];
const SINKS = [['key', '🔑'], ['spoon', '🥄'], ['anchor', '⚓'], ['ring', '💍']];
const BABIES = [['dog', 'puppy'], ['cat', 'kitten'], ['cow', 'calf'], ['sheep', 'lamb'], ['frog', 'tadpole'], ['hen', 'chick'], ['duck', 'duckling'], ['pig', 'piglet'], ['horse', 'foal'], ['kangaroo', 'joey']];
const FROM = [['milk', 'cow', '🐄'], ['eggs', 'hen', '🐔'], ['honey', 'bee', '🐝'], ['wool', 'sheep', '🐑'], ['apples', 'tree', '🌳']];
const SENSES = [['see', 'eyes', '👀'], ['hear', 'ears', '👂'], ['smell', 'nose', '👃'], ['taste', 'tongue', '👅'], ['touch', 'hands', '✋']];

function sortQ(id, prompt, yes, no) {
  const target = pick(yes);
  const others = sample(no, 2);
  const options = shuffle([target, ...others]).map(([w, e]) => ({ emoji: e, label: w, value: w }));
  return { subject: 'science', skill: 'sort', kind: 'choice', id: `science:sort:${id}:${target[0]}`, prompt, options, answer: target[0] };
}

const GENERATED = [
  () => sortQ('living', 'Which one is a living thing?', LIVING, NONLIVING),
  () => sortQ('nonliving', 'Which one is NOT alive?', NONLIVING, LIVING),
  () => sortQ('water', 'Which animal lives in the water?', WATER, LAND),
  () => sortQ('land', 'Which animal lives on land?', LAND, WATER),
  () => sortQ('fly', 'Which one can fly?', FLY, NOFLY),
  () => sortQ('hot', 'Which one is hot?', HOT, COLD),
  () => sortQ('cold', 'Which one is cold?', COLD, HOT),
  () => sortQ('float', 'Which one floats on water?', FLOATS, SINKS),
  () => sortQ('sink', 'Which one sinks in water?', SINKS, FLOATS),
  () => {
    const [animal, baby] = pick(BABIES);
    const opts = makeOptions(baby, BABIES.map((b) => b[1]), 3).map((x) => ({ label: x, value: x }));
    return { subject: 'science', skill: 'baby', kind: 'choice', id: `science:baby:${animal}`, prompt: `What is a baby ${animal} called?`, options: opts, answer: baby };
  },
  () => {
    const [thing, src, e] = pick(FROM);
    const opts = shuffle([[src, e], ...sample(FROM.filter((f) => f[1] !== src), 2).map((f) => [f[1], f[2]])]).map(([w, em]) => ({ emoji: em, label: w, value: w }));
    return { subject: 'science', skill: 'from', kind: 'choice', id: `science:from:${thing}`, prompt: `Where do we get ${thing} from?`, options: opts, answer: src };
  },
  () => {
    const [verb, part, e] = pick(SENSES);
    const opts = shuffle([[part, e], ...sample(SENSES.filter((s) => s[1] !== part), 2).map((s) => [s[1], s[2]])]).map(([w, em]) => ({ emoji: em, label: w, value: w }));
    return { subject: 'science', skill: 'senses', kind: 'choice', id: `science:senses:${verb}`, prompt: `What do you use to ${verb}?`, options: opts, answer: part };
  },
];

export const MAX_LEVEL = 6;

/** Map the 1..6 skill level to fact difficulty 1..3. */
const factLevel = (level) => Math.min(3, Math.max(1, Math.ceil(level / 2)));

/**
 * Generate a science question. `seen` is a list of fact ids already shown;
 * facts are cycled so a child sees every fact before repeats.
 */
export function genScience(level = 1, seen = []) {
  const lv = factLevel(level);
  if (Math.random() < 0.3) {
    const g = pick(GENERATED)();
    g.level = level;
    return g;
  }
  let pool = FACTS.filter((f) => f.lvl <= lv && !seen.includes(f.id));
  if (pool.length === 0) pool = FACTS.filter((f) => f.lvl <= lv);
  const f = pick(pool);
  const options = shuffle([f.a, ...f.d]).map((x) => ({ label: x, value: x }));
  return {
    subject: 'science', skill: f.cat, kind: 'choice', level,
    id: `science:fact:${f.id}`, factId: f.id,
    fact: { emoji: f.e, text: f.fact },
    prompt: f.q,
    options,
    answer: f.a,
  };
}
