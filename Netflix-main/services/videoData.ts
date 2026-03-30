export const YOUTUBE_IDS = [
  "JfVOs4VSpmA", // Spider-Man: No Way Home
  "8Qn_spdM5Zg", // Star Wars: The Rise of Skywalker
  "YoHD9XEInc0", // Inception
  "gv1gDk5F4aU", // NETFLIX Intro (very safe)
  "L9l8zCOwEII", // Netflix The World's Busy
  "r9jwGansp1E", // Transformers
  "HyHNuVaZJ-k", // Gorillaz - Feel Good Inc (Music Video usually visually stunning) -> Swapped for animated trailer: Zootopia "jWM0ct-OLsM"
  "jWM0ct-OLsM", // Zootopia
  "Gn35E3RvTvE", // Frozen 2
  "hA6hldpSTF8", // Avengers: Endgame
  "TcMBFSGVi1c", // Avengers: Endgame (Clip)
  "x_me3xsvDgk", // Planet Earth II
  "HJA3J--g_yI", // Our Planet
  "qLbnXQo5oFw", // Planet Earth
  "ScDxk9e15X0", // Planet Earth (Mountains)
  "aR-KA7Yofcw", // Dragon Ball Super: Broly
  "V-Z0b33L0-E", // Demon Slayer Mugen Train
  "0WWzgGyAH6Y", // Jujutsu Kaisen 0
  "eIho2S0ZahI", // Your Name
  "NLo9hUp8n1U", // Weathering With You
  "mqqft2x_Aa4", // The Batman
  "6ZfuNTqbHE8", // Avengers: Infinity War
  "JqcncLPi9zw", // Venom: Let There Be Carnage
  "NmzuHjWmXOc", // Dune part 1
  "Way9Dexny3w", // Dune part 2
  "d9MyW72ELq0", // Avatar: The Way of Water
  "o5F8MOz_IDw", // Oppenheimer
  "uZP7Ba2j27g", // Barbie
  "shW9i6k8cB0", // Spider-Man: Into the Spider-Verse
  "cqGjhVJWtEg", // Spider-Man: Across the Spider-Verse
  "L6P3nI6VnlY", // Mission Impossible: Dead Reckoning
  "Ydyz6EPZW8k", // John Wick 4
  "qEVUtrk8_B4", // John Wick
  "XIi_gIg_8TE", // John Wick 2
  "M7XM597XO94", // John Wick 3
  "1ViFVnjKHLk", // Stranger Things 4
  "b9EkMc79ZSU", // Stranger Things 3
  "R1ZXOOLMJ8s", // Stranger Things 2
  "XWxyRG_tckY", // Stranger Things 1
  "KPLWWIOCOOQ", // Game of Thrones
  "x7Krla_UxRg", // House of the Dragon
  "M1M7C0T8H64", // The Mandalorian
  "5J-LvmnTEQ0", // Andor
  "HhesaQXLuRY", // The Witcher
  "ndl1W4ltcmg", // The Witcher Season 3
  "x9D0uUKJ5KI", // Squid Game
  "sJ5s7VfK8k8", // Alice in Borderland
  "rrwycJ08PSA", // Train to Busan
  "pyM3z73oMAk", // Parasite
  "isOGD_7hNIY", // Minions: The Rise of Gru
  "T7A810duHvw", // Mario Movie
  "c_N_QnuKKdw", // Sonic the Hedgehog 2
  "G5kzUpWAusI", // The Lion King (2019)
  "7TavVZMewpY", // The Lion King (1994)
  "_Z3QKkl1WyM", // Black Panther
  "8YjFbMbfXaQ", // Shang-Chi
  "8p_M3J2d9Z4"  // Eternals
];

export const getRandomYoutubeId = () => {
  return YOUTUBE_IDS[Math.floor(Math.random() * YOUTUBE_IDS.length)];
};

export const getYoutubeIdByIndex = (index: number) => {
  return YOUTUBE_IDS[index % YOUTUBE_IDS.length];
};