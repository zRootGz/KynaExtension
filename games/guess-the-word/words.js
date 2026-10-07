(function () {
  if (typeof window !== "undefined" && typeof window.GAME_CATEGORIES !== "undefined") {
    return;
  }

  // 8 Chủ đề chuẩn
  const GAME_CATEGORIES = {
    ANIMALS: "Animals",
    FRUITS: "Fruits",
    OCCUPATIONS: "Occupations",
    SCHOOL: "School",
    TRANSPORT: "Transport",
    CLOTHING: "Clothing",
    COLORS: "Colors",
    ACTIONS: "Actions"
  };

/**
 * Hàm tạo ảnh SVG Doodle nét vẽ tay trực quan độc đáo cho từ vựng
 */
function createCustomDoodleSvg(word, hint, emoji, themeColor = "#6366F1") {
  const cleanWord = (word || "PUZZLE").toUpperCase();
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
    <!-- Nền giấy tập kẻ caro nét đứt -->
    <rect width="400" height="300" fill="#FCFBF7" rx="14"/>
    <defs>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E5E7EB" stroke-width="0.8"/>
      </pattern>
    </defs>
    <rect width="400" height="300" fill="url(#grid)" rx="14"/>

    <!-- Trang trí nét vẽ Doodle xung quanh -->
    <path d="M 20 30 Q 60 10 120 25 T 220 20" stroke="${themeColor}" stroke-width="3" stroke-linecap="round" fill="none" stroke-dasharray="5,4" opacity="0.5"/>
    <circle cx="340" cy="45" r="20" stroke="#F59E0B" stroke-width="3" stroke-dasharray="4,3" fill="none"/>
    <path d="M 330 240 Q 360 210 380 250" stroke="#EC4899" stroke-width="3" fill="none" stroke-linecap="round"/>
    <polygon points="30,250 50,230 70,260" stroke="#10B981" stroke-width="2.5" fill="none" stroke-dasharray="3,2"/>

    <!-- Vùng Icon nét vẽ Doodle chính -->
    <g transform="translate(140, 45)">
      <circle cx="60" cy="60" r="58" stroke="${themeColor}" stroke-width="4" fill="#FFFFFF" stroke-dasharray="6,3"/>
      <text x="60" y="82" font-size="76" text-anchor="middle" font-family="'Segoe UI Emoji', sans-serif">${emoji}</text>
    </g>

    <!-- Khung Trang trí Doodle Puzzle (KHÔNG HIỆN ĐÁP ÁN) -->
    <rect x="60" y="180" width="280" height="46" rx="23" fill="${themeColor}" fill-opacity="0.08" stroke="${themeColor}" stroke-width="2.5" stroke-dasharray="6,3"/>
    <text x="200" y="210" font-size="20" font-weight="900" fill="${themeColor}" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif" letter-spacing="6">
      ❓ GUESS THE WORD ❓
    </text>

    <!-- Gợi ý Tiếng Anh -->
    <text x="200" y="252" font-size="14" font-weight="600" fill="#4B5563" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif" font-style="italic">
      💡 Hint: ${hint}
    </text>
  </svg>`;

  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

// BỘ DATA DỮ LIỆU TỪ VỰNG TIẾNG ANH CƠ BẢN (OXFORD 3000) - 240+ TỪ VỰNG (ĐA DẠNG X5)
const MASTER_WORD_DATABASE = [
  // --- 1. ANIMALS (32 từ) ---
  { word: "BIRD", category: GAME_CATEGORIES.ANIMALS, hint: "A creature with feathers and wings", query: "bird doodle sketch", emoji: "🐦", imageUrl: createCustomDoodleSvg("BIRD", "A creature with feathers and wings", "🐦", "#6366F1") },
  { word: "CAT", category: GAME_CATEGORIES.ANIMALS, hint: "A small animal kept as a pet", query: "cat doodle sketch", emoji: "🐱", imageUrl: createCustomDoodleSvg("CAT", "A small animal kept as a pet", "🐱", "#F59E0B") },
  { word: "COW", category: GAME_CATEGORIES.ANIMALS, hint: "Kept on farms for milk or meat", query: "cow doodle sketch", emoji: "🐮", imageUrl: createCustomDoodleSvg("COW", "Kept on farms for milk or meat", "🐮", "#8B5CF6") },
  { word: "DOG", category: GAME_CATEGORIES.ANIMALS, hint: "An animal with four legs, often kept as a pet", query: "dog doodle sketch", emoji: "🐶", imageUrl: createCustomDoodleSvg("DOG", "Often kept as a pet", "🐶", "#0EA5E9") },
  { word: "FISH", category: GAME_CATEGORIES.ANIMALS, hint: "A creature that lives in water", query: "fish doodle sketch", emoji: "🐟", imageUrl: createCustomDoodleSvg("FISH", "A creature that lives in water", "🐟", "#3B82F6") },
  { word: "HORSE", category: GAME_CATEGORIES.ANIMALS, hint: "A large animal that people can ride", query: "horse doodle sketch", emoji: "🐴", imageUrl: createCustomDoodleSvg("HORSE", "A large animal people can ride", "🐴", "#D97706") },
  { word: "MOUSE", category: GAME_CATEGORIES.ANIMALS, hint: "A small animal with a long tail", query: "mouse doodle sketch", emoji: "🐭", imageUrl: createCustomDoodleSvg("MOUSE", "A small animal with a long tail", "🐭", "#EC4899") },
  { word: "PIG", category: GAME_CATEGORIES.ANIMALS, hint: "A fat animal kept on farms for its meat", query: "pig doodle sketch", emoji: "🐷", imageUrl: createCustomDoodleSvg("PIG", "Kept on farms for its meat", "🐷", "#A855F7") },
  { word: "DUCK", category: GAME_CATEGORIES.ANIMALS, hint: "A water bird with a broad beak and webbed feet", query: "duck doodle sketch", emoji: "🦆", imageUrl: createCustomDoodleSvg("DUCK", "A water bird with webbed feet", "🦆", "#10B981") },
  { word: "FROG", category: GAME_CATEGORIES.ANIMALS, hint: "A small green animal with long legs for jumping", query: "frog doodle sketch", emoji: "🐸", imageUrl: createCustomDoodleSvg("FROG", "Green animal with long legs for jumping", "🐸", "#22C55E") },
  { word: "LION", category: GAME_CATEGORIES.ANIMALS, hint: "A large wild cat known as king of the jungle", query: "lion doodle sketch", emoji: "🦁", imageUrl: createCustomDoodleSvg("LION", "King of the jungle", "🦁", "#EAB308") },
  { word: "TIGER", category: GAME_CATEGORIES.ANIMALS, hint: "A large wild cat with black stripes", query: "tiger doodle sketch", emoji: "🐯", imageUrl: createCustomDoodleSvg("TIGER", "Large wild cat with black stripes", "🐯", "#F97316") },
  { word: "BEAR", category: GAME_CATEGORIES.ANIMALS, hint: "A large heavy wild animal with thick fur", query: "bear doodle sketch", emoji: "🐻", imageUrl: createCustomDoodleSvg("BEAR", "Large wild animal with thick fur", "🐻", "#92400E") },
  { word: "ELEPHANT", category: GAME_CATEGORIES.ANIMALS, hint: "A very large gray animal with a long trunk", query: "elephant doodle sketch", emoji: "🐘", imageUrl: createCustomDoodleSvg("ELEPHANT", "Very large gray animal with a long trunk", "🐘", "#64748B") },
  { word: "MONKEY", category: GAME_CATEGORIES.ANIMALS, hint: "An animal with a long tail that climbs trees", query: "monkey doodle sketch", emoji: "🐒", imageUrl: createCustomDoodleSvg("MONKEY", "Climbs trees and loves bananas", "🐒", "#D97706") },
  { word: "RABBIT", category: GAME_CATEGORIES.ANIMALS, hint: "A small animal with long ears and soft fur", query: "rabbit doodle sketch", emoji: "🐰", imageUrl: createCustomDoodleSvg("RABBIT", "Small animal with long ears", "🐰", "#F472B6") },
  { word: "SHEEP", category: GAME_CATEGORIES.ANIMALS, hint: "An animal with thick curly hair kept for wool", query: "sheep doodle sketch", emoji: "🐑", imageUrl: createCustomDoodleSvg("SHEEP", "Kept on farms for wool", "🐑", "#A855F7") },
  { word: "SNAKE", category: GAME_CATEGORIES.ANIMALS, hint: "A long reptile with no legs", query: "snake doodle sketch", emoji: "🐍", imageUrl: createCustomDoodleSvg("SNAKE", "A long reptile with no legs", "🐍", "#16A34A") },
  { word: "SPIDER", category: GAME_CATEGORIES.ANIMALS, hint: "A small creature with eight legs", query: "spider doodle sketch", emoji: "🕷️", imageUrl: createCustomDoodleSvg("SPIDER", "Small creature with eight legs", "🕷️", "#334155") },
  { word: "TURTLE", category: GAME_CATEGORIES.ANIMALS, hint: "A reptile with a hard shell on its back", query: "turtle doodle sketch", emoji: "🐢", imageUrl: createCustomDoodleSvg("TURTLE", "Reptile with a hard shell", "🐢", "#059669") },
  { word: "WHALE", category: GAME_CATEGORIES.ANIMALS, hint: "A very large mammal living in the ocean", query: "whale doodle sketch", emoji: "🐋", imageUrl: createCustomDoodleSvg("WHALE", "Very large mammal living in ocean", "🐋", "#0284C7") },
  { word: "ZEBRA", category: GAME_CATEGORIES.ANIMALS, hint: "Wild animal with black and white stripes", query: "zebra doodle sketch", emoji: "🦓", imageUrl: createCustomDoodleSvg("ZEBRA", "Has black and white stripes", "🦓", "#475569") },
  { word: "ANT", category: GAME_CATEGORIES.ANIMALS, hint: "A tiny insect living in large groups", query: "ant doodle sketch", emoji: "🐜", imageUrl: createCustomDoodleSvg("ANT", "Tiny insect living in colonies", "🐜", "#DC2626") },
  { word: "BEE", category: GAME_CATEGORIES.ANIMALS, hint: "A flying insect that makes honey", query: "bee doodle sketch", emoji: "🐝", imageUrl: createCustomDoodleSvg("BEE", "Flying insect that makes honey", "🐝", "#EAB308") },
  { word: "BUTTERFLY", category: GAME_CATEGORIES.ANIMALS, hint: "An insect with large colorful wings", query: "butterfly doodle sketch", emoji: "🦋", imageUrl: createCustomDoodleSvg("BUTTERFLY", "Insect with large colorful wings", "🦋", "#8B5CF6") },
  { word: "CAMEL", category: GAME_CATEGORIES.ANIMALS, hint: "Desert animal with one or two humps", query: "camel doodle sketch", emoji: "🐫", imageUrl: createCustomDoodleSvg("CAMEL", "Desert animal with humps", "🐫", "#D97706") },
  { word: "CHICKEN", category: GAME_CATEGORIES.ANIMALS, hint: "Farm bird raised for eggs and meat", query: "chicken doodle sketch", emoji: "🐔", imageUrl: createCustomDoodleSvg("CHICKEN", "Farm bird raised for eggs", "🐔", "#F59E0B") },
  { word: "GOAT", category: GAME_CATEGORIES.ANIMALS, hint: "An animal with horns living on farms", query: "goat doodle sketch", emoji: "🐐", imageUrl: createCustomDoodleSvg("GOAT", "Animal with horns on farms", "🐐", "#78350F") },
  { word: "PANDA", category: GAME_CATEGORIES.ANIMALS, hint: "A large black and white bear from China", query: "panda doodle sketch", emoji: "🐼", imageUrl: createCustomDoodleSvg("PANDA", "Black and white bear from China", "🐼", "#1E293B") },
  { word: "PENGUIN", category: GAME_CATEGORIES.ANIMALS, hint: "Black and white sea bird that cannot fly", query: "penguin doodle sketch", emoji: "🐧", imageUrl: createCustomDoodleSvg("PENGUIN", "Sea bird that cannot fly", "🐧", "#0EA5E9") },
  { word: "SHARK", category: GAME_CATEGORIES.ANIMALS, hint: "A large ocean fish with sharp teeth", query: "shark doodle sketch", emoji: "🦈", imageUrl: createCustomDoodleSvg("SHARK", "Large ocean fish with sharp teeth", "🦈", "#0284C7") },
  { word: "WOLF", category: GAME_CATEGORIES.ANIMALS, hint: "A wild animal like a large dog hunting in packs", query: "wolf doodle sketch", emoji: "🐺", imageUrl: createCustomDoodleSvg("WOLF", "Wild animal like a large dog", "🐺", "#475569") },

  // --- 2. FRUITS & VEGETABLES (30 từ) ---
  { word: "APPLE", category: GAME_CATEGORIES.FRUITS, hint: "A round fruit with red or green skin", query: "apple doodle sketch", emoji: "🍎", imageUrl: createCustomDoodleSvg("APPLE", "Round fruit with red/green skin", "🍎", "#EF4444") },
  { word: "BANANA", category: GAME_CATEGORIES.FRUITS, hint: "A long curved fruit with a yellow skin", query: "banana doodle sketch", emoji: "🍌", imageUrl: createCustomDoodleSvg("BANANA", "Long curved fruit with yellow skin", "🍌", "#EAB308") },
  { word: "LEMON", category: GAME_CATEGORIES.FRUITS, hint: "A yellow fruit with sour juice", query: "lemon doodle sketch", emoji: "🍋", imageUrl: createCustomDoodleSvg("LEMON", "A yellow fruit with sour juice", "🍋", "#10B981") },
  { word: "ORANGE", category: GAME_CATEGORIES.FRUITS, hint: "A round, sweet fruit with a thick skin", query: "orange doodle sketch", emoji: "🍊", imageUrl: createCustomDoodleSvg("ORANGE", "Round, sweet fruit with thick skin", "🍊", "#F97316") },
  { word: "TOMATO", category: GAME_CATEGORIES.FRUITS, hint: "A soft, red fruit eaten as a vegetable", query: "tomato doodle sketch", emoji: "🍅", imageUrl: createCustomDoodleSvg("TOMATO", "Soft, red fruit eaten as a vegetable", "🍅", "#F43F5E") },
  { word: "POTATO", category: GAME_CATEGORIES.FRUITS, hint: "A round root vegetable", query: "potato doodle sketch", emoji: "🥔", imageUrl: createCustomDoodleSvg("POTATO", "A round root vegetable", "🥔", "#CA8A04") },
  { word: "GRAPE", category: GAME_CATEGORIES.FRUITS, hint: "Small green or purple fruit in bunches", query: "grape doodle sketch", emoji: "🍇", imageUrl: createCustomDoodleSvg("GRAPE", "Small green or purple fruit in bunches", "🍇", "#9333EA") },
  { word: "MANGO", category: GAME_CATEGORIES.FRUITS, hint: "Sweet tropical fruit with yellow-orange flesh", query: "mango doodle sketch", emoji: "🥭", imageUrl: createCustomDoodleSvg("MANGO", "Tropical fruit with yellow flesh", "🥭", "#F59E0B") },
  { word: "PEACH", category: GAME_CATEGORIES.FRUITS, hint: "Round juicy fruit with soft skin", query: "peach doodle sketch", emoji: "🍑", imageUrl: createCustomDoodleSvg("PEACH", "Round juicy fruit with soft skin", "🍑", "#FB7185") },
  { word: "PEAR", category: GAME_CATEGORIES.FRUITS, hint: "A sweet fruit shaped like a bell", query: "pear doodle sketch", emoji: "🍐", imageUrl: createCustomDoodleSvg("PEAR", "Sweet fruit shaped like a bell", "🍐", "#84CC16") },
  { word: "PINEAPPLE", category: GAME_CATEGORIES.FRUITS, hint: "Large tropical fruit with prickly skin", query: "pineapple doodle sketch", emoji: "🍍", imageUrl: createCustomDoodleSvg("PINEAPPLE", "Large fruit with prickly skin", "🍍", "#EAB308") },
  { word: "STRAWBERRY", category: GAME_CATEGORIES.FRUITS, hint: "Small red juicy fruit with seeds on skin", query: "strawberry doodle sketch", emoji: "🍓", imageUrl: createCustomDoodleSvg("STRAWBERRY", "Red juicy fruit with seeds on skin", "🍓", "#E11D48") },
  { word: "WATERMELON", category: GAME_CATEGORIES.FRUITS, hint: "Large green fruit with sweet red flesh", query: "watermelon doodle sketch", emoji: "🍉", imageUrl: createCustomDoodleSvg("WATERMELON", "Large fruit with sweet red flesh", "🍉", "#10B981") },
  { word: "COCONUT", category: GAME_CATEGORIES.FRUITS, hint: "Large hard brown fruit with white flesh", query: "coconut doodle sketch", emoji: "🥥", imageUrl: createCustomDoodleSvg("COCONUT", "Hard brown fruit with white flesh", "🥥", "#78350F") },
  { word: "CHERRY", category: GAME_CATEGORIES.FRUITS, hint: "Small round bright red fruit with a stone", query: "cherry doodle sketch", emoji: "🍒", imageUrl: createCustomDoodleSvg("CHERRY", "Small bright red fruit", "🍒", "#DC2626") },
  { word: "MELON", category: GAME_CATEGORIES.FRUITS, hint: "A large sweet fruit with many seeds inside", query: "melon doodle sketch", emoji: "🍈", imageUrl: createCustomDoodleSvg("MELON", "Large sweet fruit with seeds", "🍈", "#A3E635") },
  { word: "ONION", category: GAME_CATEGORIES.FRUITS, hint: "Round vegetable with strong smell and layers", query: "onion doodle sketch", emoji: "🧅", imageUrl: createCustomDoodleSvg("ONION", "Round vegetable with strong smell", "🧅", "#C084FC") },
  { word: "CARROT", category: GAME_CATEGORIES.FRUITS, hint: "A long orange root vegetable", query: "carrot doodle sketch", emoji: "🥕", imageUrl: createCustomDoodleSvg("CARROT", "A long orange root vegetable", "🥕", "#F97316") },
  { word: "CORN", category: GAME_CATEGORIES.FRUITS, hint: "Yellow vegetable with rows of grains", query: "corn doodle sketch", emoji: "🌽", imageUrl: createCustomDoodleSvg("CORN", "Yellow vegetable with rows of grains", "🌽", "#EAB308") },
  { word: "CUCUMBER", category: GAME_CATEGORIES.FRUITS, hint: "Long green vegetable eaten in salads", query: "cucumber doodle sketch", emoji: "🥒", imageUrl: createCustomDoodleSvg("CUCUMBER", "Long green vegetable for salads", "🥒", "#16A34A") },
  { word: "GARLIC", category: GAME_CATEGORIES.FRUITS, hint: "Small vegetable bulb with strong taste", query: "garlic doodle sketch", emoji: "🧄", imageUrl: createCustomDoodleSvg("GARLIC", "Small bulb with strong taste", "🧄", "#E2E8F0") },
  { word: "MUSHROOM", category: GAME_CATEGORIES.FRUITS, hint: "Fungus with a round cap and short stem", query: "mushroom doodle sketch", emoji: "🍄", imageUrl: createCustomDoodleSvg("MUSHROOM", "Fungus with a round cap", "🍄", "#EF4444") },
  { word: "PEA", category: GAME_CATEGORIES.FRUITS, hint: "Small round green seed eaten as vegetable", query: "pea doodle sketch", emoji: "🫛", imageUrl: createCustomDoodleSvg("PEA", "Small round green seed", "🫛", "#22C55E") },
  { word: "PEPPER", category: GAME_CATEGORIES.FRUITS, hint: "Red, green or yellow hollow vegetable", query: "pepper doodle sketch", emoji: "🫑", imageUrl: createCustomDoodleSvg("PEPPER", "Red, green or yellow vegetable", "🫑", "#DC2626") },
  { word: "PUMPKIN", category: GAME_CATEGORIES.FRUITS, hint: "Large round orange vegetable", query: "pumpkin doodle sketch", emoji: "🎃", imageUrl: createCustomDoodleSvg("PUMPKIN", "Large round orange vegetable", "🎃", "#F97316") },
  { word: "CABBAGE", category: GAME_CATEGORIES.FRUITS, hint: "Large round green or purple leafy vegetable", query: "cabbage doodle sketch", emoji: "🥬", imageUrl: createCustomDoodleSvg("CABBAGE", "Large round leafy vegetable", "🥬", "#16A34A") },
  { word: "BEAN", category: GAME_CATEGORIES.FRUITS, hint: "A seed pod eaten as a vegetable", query: "bean doodle sketch", emoji: "🫘", imageUrl: createCustomDoodleSvg("BEAN", "A seed pod eaten as a vegetable", "🫘", "#92400E") },
  { word: "LIME", category: GAME_CATEGORIES.FRUITS, hint: "A green citrus fruit similar to a lemon", query: "lime doodle sketch", emoji: "🍋‍🟩", imageUrl: createCustomDoodleSvg("LIME", "Green citrus fruit", "🍋‍🟩", "#84CC16") },
  { word: "NUT", category: GAME_CATEGORIES.FRUITS, hint: "A hard shell around an edible seed", query: "nut doodle sketch", emoji: "🥜", imageUrl: createCustomDoodleSvg("NUT", "Hard shell around edible seed", "🥜", "#D97706") },
  { word: "OLIVE", category: GAME_CATEGORIES.FRUITS, hint: "Small bitter oval fruit used for oil", query: "olive doodle sketch", emoji: "🫒", imageUrl: createCustomDoodleSvg("OLIVE", "Small bitter oval fruit", "🫒", "#65A30D") },

  // --- 3. OCCUPATIONS (30 từ) ---
  { word: "DOCTOR", category: GAME_CATEGORIES.OCCUPATIONS, hint: "A person trained to treat sick people", query: "doctor doodle sketch", emoji: "👨‍⚕️", imageUrl: createCustomDoodleSvg("DOCTOR", "Trained to treat sick people", "👨‍⚕️", "#0284C7") },
  { word: "TEACHER", category: GAME_CATEGORIES.OCCUPATIONS, hint: "A person whose job is teaching", query: "teacher doodle sketch", emoji: "👩‍🏫", imageUrl: createCustomDoodleSvg("TEACHER", "A person whose job is teaching", "👩‍🏫", "#4F46E5") },
  { word: "POLICE", category: GAME_CATEGORIES.OCCUPATIONS, hint: "People whose job is to stop crime", query: "police doodle sketch", emoji: "👮‍♂️", imageUrl: createCustomDoodleSvg("POLICE", "People whose job is to stop crime", "👮‍♂️", "#1E40AF") },
  { word: "ACTOR", category: GAME_CATEGORIES.OCCUPATIONS, hint: "Performs in plays or movies", query: "actor doodle sketch", emoji: "🎭", imageUrl: createCustomDoodleSvg("ACTOR", "Performs in plays or movies", "🎭", "#F59E0B") },
  { word: "WRITER", category: GAME_CATEGORIES.OCCUPATIONS, hint: "A person whose job is writing books", query: "writer doodle sketch", emoji: "✍️", imageUrl: createCustomDoodleSvg("WRITER", "Job is writing books", "✍️", "#DC2626") },
  { word: "FARMER", category: GAME_CATEGORIES.OCCUPATIONS, hint: "A person who owns or manages a farm", query: "farmer doodle sketch", emoji: "👨‍🌾", imageUrl: createCustomDoodleSvg("FARMER", "Owns or manages a farm", "👨‍🌾", "#0369A1") },
  { word: "NURSE", category: GAME_CATEGORIES.OCCUPATIONS, hint: "Cares for sick people in hospital", query: "nurse doodle sketch", emoji: "👩‍⚕️", imageUrl: createCustomDoodleSvg("NURSE", "Cares for sick in hospital", "👩‍⚕️", "#6D28D9") },
  { word: "ARTIST", category: GAME_CATEGORIES.OCCUPATIONS, hint: "A person who paints or draws", query: "artist doodle sketch", emoji: "🎨", imageUrl: createCustomDoodleSvg("ARTIST", "Paints or draws art", "🎨", "#EC4899") },
  { word: "CHEF", category: GAME_CATEGORIES.OCCUPATIONS, hint: "A professional cook in a restaurant", query: "chef doodle sketch", emoji: "🧑‍🍳", imageUrl: createCustomDoodleSvg("CHEF", "Professional cook in restaurant", "🧑‍🍳", "#F59E0B") },
  { word: "DENTIST", category: GAME_CATEGORIES.OCCUPATIONS, hint: "A doctor who takes care of teeth", query: "dentist doodle sketch", emoji: "🦷", imageUrl: createCustomDoodleSvg("DENTIST", "Takes care of teeth", "🦷", "#0EA5E9") },
  { word: "DRIVER", category: GAME_CATEGORIES.OCCUPATIONS, hint: "Drives vehicles like cars or buses", query: "driver doodle sketch", emoji: "🚗", imageUrl: createCustomDoodleSvg("DRIVER", "Drives cars or buses", "🚗", "#2563EB") },
  { word: "ENGINEER", category: GAME_CATEGORIES.OCCUPATIONS, hint: "Designs machines or structures", query: "engineer doodle sketch", emoji: "👷‍♂️", imageUrl: createCustomDoodleSvg("ENGINEER", "Designs machines or structures", "👷‍♂️", "#D97706") },
  { word: "FIREMAN", category: GAME_CATEGORIES.OCCUPATIONS, hint: "A person whose job is to put out fires", query: "fireman doodle sketch", emoji: "👨‍🚒", imageUrl: createCustomDoodleSvg("FIREMAN", "Puts out fires", "👨‍🚒", "#EF4444") },
  { word: "JUDGE", category: GAME_CATEGORIES.OCCUPATIONS, hint: "Decides cases in a court of law", query: "judge doodle sketch", emoji: "⚖️", imageUrl: createCustomDoodleSvg("JUDGE", "Decides cases in court", "⚖️", "#374151") },
  { word: "LAWYER", category: GAME_CATEGORIES.OCCUPATIONS, hint: "A person who practices law", query: "lawyer doodle sketch", emoji: "💼", imageUrl: createCustomDoodleSvg("LAWYER", "Practices or advises on law", "💼", "#1E293B") },
  { word: "MUSICIAN", category: GAME_CATEGORIES.OCCUPATIONS, hint: "Plays musical instruments or composes", query: "musician doodle sketch", emoji: "🎵", imageUrl: createCustomDoodleSvg("MUSICIAN", "Plays instruments or composes", "🎵", "#8B5CF6") },
  { word: "PILOT", category: GAME_CATEGORIES.OCCUPATIONS, hint: "A person who flies an airplane", query: "pilot doodle sketch", emoji: "🧑‍✈️", imageUrl: createCustomDoodleSvg("PILOT", "Flies an airplane", "🧑‍✈️", "#0284C7") },
  { word: "SINGER", category: GAME_CATEGORIES.OCCUPATIONS, hint: "A person who sings songs as a job", query: "singer doodle sketch", emoji: "🎤", imageUrl: createCustomDoodleSvg("SINGER", "Sings songs as a job", "🎤", "#EC4899") },
  { word: "SOLDIER", category: GAME_CATEGORIES.OCCUPATIONS, hint: "A person who serves in an army", query: "soldier doodle sketch", emoji: "🪖", imageUrl: createCustomDoodleSvg("SOLDIER", "Serves in an army", "🪖", "#15803D") },
  { word: "WORKER", category: GAME_CATEGORIES.OCCUPATIONS, hint: "Does physical or practical work", query: "worker doodle sketch", emoji: "👷", imageUrl: createCustomDoodleSvg("WORKER", "Does physical work", "👷", "#64748B") },
  { word: "BUILDER", category: GAME_CATEGORIES.OCCUPATIONS, hint: "Repairs or builds houses", query: "builder doodle sketch", emoji: "🔨", imageUrl: createCustomDoodleSvg("BUILDER", "Builds or repairs houses", "🔨", "#D97706") },
  { word: "COOK", category: GAME_CATEGORIES.OCCUPATIONS, hint: "Prepares food for eating", query: "cook doodle sketch", emoji: "🍳", imageUrl: createCustomDoodleSvg("COOK", "Prepares food for eating", "🍳", "#F97316") },
  { word: "DANCER", category: GAME_CATEGORIES.OCCUPATIONS, hint: "Moves body rhythmically to music", query: "dancer doodle sketch", emoji: "💃", imageUrl: createCustomDoodleSvg("DANCER", "Moves body to music", "💃", "#E11D48") },
  { word: "DESIGNER", category: GAME_CATEGORIES.OCCUPATIONS, hint: "Plans how something will look", query: "designer doodle sketch", emoji: "✏️", imageUrl: createCustomDoodleSvg("DESIGNER", "Plans how something looks", "✏️", "#9333EA") },
  { word: "GUARD", category: GAME_CATEGORIES.OCCUPATIONS, hint: "Protects a place or people", query: "guard doodle sketch", emoji: "🛡️", imageUrl: createCustomDoodleSvg("GUARD", "Protects a place or people", "🛡️", "#475569") },
  { word: "MANAGER", category: GAME_CATEGORIES.OCCUPATIONS, hint: "In charge of a business or team", query: "manager doodle sketch", emoji: "👔", imageUrl: createCustomDoodleSvg("MANAGER", "In charge of business/team", "👔", "#0F766E") },
  { word: "SCIENTIST", category: GAME_CATEGORIES.OCCUPATIONS, hint: "Studies or works in science", query: "scientist doodle sketch", emoji: "🔬", imageUrl: createCustomDoodleSvg("SCIENTIST", "Studies or works in science", "🔬", "#0284C7") },
  { word: "TRUCKER", category: GAME_CATEGORIES.OCCUPATIONS, hint: "Drives large heavy trucks", query: "trucker doodle sketch", emoji: "🚛", imageUrl: createCustomDoodleSvg("TRUCKER", "Drives large heavy trucks", "🚛", "#475569") },
  { word: "WAITER", category: GAME_CATEGORIES.OCCUPATIONS, hint: "Serves food in a restaurant", query: "waiter doodle sketch", emoji: "🧑‍🍳", imageUrl: createCustomDoodleSvg("WAITER", "Serves food in restaurant", "🧑‍🍳", "#D97706") },
  { word: "VET", category: GAME_CATEGORIES.OCCUPATIONS, hint: "A medical doctor for animals", query: "vet doodle sketch", emoji: "🩺", imageUrl: createCustomDoodleSvg("VET", "Doctor for animals", "🩺", "#10B981") },

  // --- 4. SCHOOL (30 từ) ---
  { word: "BOOK", category: GAME_CATEGORIES.SCHOOL, hint: "Printed pages bound together", query: "book doodle sketch", emoji: "📚", imageUrl: createCustomDoodleSvg("BOOK", "Printed pages bound together", "📚", "#F59E0B") },
  { word: "PENCIL", category: GAME_CATEGORIES.SCHOOL, hint: "Instrument for writing or drawing", query: "pencil doodle sketch", emoji: "✏️", imageUrl: createCustomDoodleSvg("PENCIL", "Instrument for writing or drawing", "✏️", "#E11D48") },
  { word: "DESK", category: GAME_CATEGORIES.SCHOOL, hint: "A table you sit at to work", query: "desk doodle sketch", emoji: "🪑", imageUrl: createCustomDoodleSvg("DESK", "A table you sit at to work", "🪑", "#059669") },
  { word: "PAPER", category: GAME_CATEGORIES.SCHOOL, hint: "Material used for writing or drawing", query: "paper doodle sketch", emoji: "📄", imageUrl: createCustomDoodleSvg("PAPER", "Used for writing or drawing", "📄", "#475569") },
  { word: "BOARD", category: GAME_CATEGORIES.SCHOOL, hint: "Flat surface in classroom to write on", query: "board doodle sketch", emoji: "🛹", imageUrl: createCustomDoodleSvg("BOARD", "Flat surface in classroom to write", "🛹", "#0EA5E9") },
  { word: "CLASS", category: GAME_CATEGORIES.SCHOOL, hint: "Group of students taught together", query: "class doodle sketch", emoji: "🏫", imageUrl: createCustomDoodleSvg("CLASS", "Students taught together", "🏫", "#7C3AED") },
  { word: "STUDENT", category: GAME_CATEGORIES.SCHOOL, hint: "A person studying at a school", query: "student doodle sketch", emoji: "👨‍🎓", imageUrl: createCustomDoodleSvg("STUDENT", "Studying at a school", "👨‍🎓", "#F43F5E") },
  { word: "ERASER", category: GAME_CATEGORIES.SCHOOL, hint: "Removes pencil marks from paper", query: "eraser doodle sketch", emoji: "🧹", imageUrl: createCustomDoodleSvg("ERASER", "Removes pencil marks", "🧹", "#EC4899") },
  { word: "PEN", category: GAME_CATEGORIES.SCHOOL, hint: "An instrument for writing with ink", query: "pen doodle sketch", emoji: "🖊️", imageUrl: createCustomDoodleSvg("PEN", "Instrument for writing with ink", "🖊️", "#2563EB") },
  { word: "RULER", category: GAME_CATEGORIES.SCHOOL, hint: "Strip of plastic/wood to measure length", query: "ruler doodle sketch", emoji: "📏", imageUrl: createCustomDoodleSvg("RULER", "Measures length or draws straight lines", "📏", "#10B981") },
  { word: "BAG", category: GAME_CATEGORIES.SCHOOL, hint: "Carries books and school supplies", query: "bag doodle sketch", emoji: "🎒", imageUrl: createCustomDoodleSvg("BAG", "Carries books and school supplies", "🎒", "#EF4444") },
  { word: "CHAIR", category: GAME_CATEGORIES.SCHOOL, hint: "A seat for one person with a back", query: "chair doodle sketch", emoji: "🪑", imageUrl: createCustomDoodleSvg("CHAIR", "Seat for one person with back", "🪑", "#D97706") },
  { word: "COMPUTER", category: GAME_CATEGORIES.SCHOOL, hint: "Electronic device for processing data", query: "computer doodle sketch", emoji: "💻", imageUrl: createCustomDoodleSvg("COMPUTER", "Electronic device processing data", "💻", "#0284C7") },
  { word: "DICTIONARY", category: GAME_CATEGORIES.SCHOOL, hint: "Book explaining word meanings", query: "dictionary doodle sketch", emoji: "📖", imageUrl: createCustomDoodleSvg("DICTIONARY", "Book explaining word meanings", "📖", "#6366F1") },
  { word: "EXAM", category: GAME_CATEGORIES.SCHOOL, hint: "Formal test of knowledge or ability", query: "exam doodle sketch", emoji: "📝", imageUrl: createCustomDoodleSvg("EXAM", "Formal test of knowledge", "📝", "#DC2626") },
  { word: "LESSON", category: GAME_CATEGORIES.SCHOOL, hint: "A period of learning or teaching", query: "lesson doodle sketch", emoji: "👩‍🏫", imageUrl: createCustomDoodleSvg("LESSON", "Period of learning or teaching", "👩‍🏫", "#4F46E5") },
  { word: "LIBRARY", category: GAME_CATEGORIES.SCHOOL, hint: "Room containing books to read/borrow", query: "library doodle sketch", emoji: "🏛️", imageUrl: createCustomDoodleSvg("LIBRARY", "Room with books to read or borrow", "🏛️", "#059669") },
  { word: "MAP", category: GAME_CATEGORIES.SCHOOL, hint: "Drawing of world showing countries", query: "map doodle sketch", emoji: "🗺️", imageUrl: createCustomDoodleSvg("MAP", "Drawing showing countries/places", "🗺️", "#D97706") },
  { word: "NOTEBOOK", category: GAME_CATEGORIES.SCHOOL, hint: "Book of plain paper for writing notes", query: "notebook doodle sketch", emoji: "📓", imageUrl: createCustomDoodleSvg("NOTEBOOK", "Paper book for writing notes", "📓", "#3B82F6") },
  { word: "PAGE", category: GAME_CATEGORIES.SCHOOL, hint: "One side of a sheet of paper in a book", query: "page doodle sketch", emoji: "📑", imageUrl: createCustomDoodleSvg("PAGE", "One side of a sheet of paper", "📑", "#64748B") },
  { word: "QUESTION", category: GAME_CATEGORIES.SCHOOL, hint: "Sentence used to ask for information", query: "question doodle sketch", emoji: "❓", imageUrl: createCustomDoodleSvg("QUESTION", "Used to ask for information", "❓", "#8B5CF6") },
  { word: "QUIZ", category: GAME_CATEGORIES.SCHOOL, hint: "A short game or test of knowledge", query: "quiz doodle sketch", emoji: "🎯", imageUrl: createCustomDoodleSvg("QUIZ", "Short game or test of knowledge", "🎯", "#F59E0B") },
  { word: "ROOM", category: GAME_CATEGORIES.SCHOOL, hint: "Space in a building separated by walls", query: "room doodle sketch", emoji: "🚪", imageUrl: createCustomDoodleSvg("ROOM", "Space in building with walls", "🚪", "#78350F") },
  { word: "SCHOOL", category: GAME_CATEGORIES.SCHOOL, hint: "Place where children go to be educated", query: "school doodle sketch", emoji: "🏫", imageUrl: createCustomDoodleSvg("SCHOOL", "Place to learn and be educated", "🏫", "#0284C7") },
  { word: "SHARPENER", category: GAME_CATEGORIES.SCHOOL, hint: "Tool used to sharpen pencils", query: "sharpener doodle sketch", emoji: "✏️", imageUrl: createCustomDoodleSvg("SHARPENER", "Tool used to sharpen pencils", "✏️", "#F43F5E") },
  { word: "SUBJECT", category: GAME_CATEGORIES.SCHOOL, hint: "Area of knowledge studied in school", query: "subject doodle sketch", emoji: "📖", imageUrl: createCustomDoodleSvg("SUBJECT", "Area of knowledge in school", "📖", "#10B981") },
  { word: "TEST", category: GAME_CATEGORIES.SCHOOL, hint: "Short examination of knowledge", query: "test doodle sketch", emoji: "📋", imageUrl: createCustomDoodleSvg("TEST", "Short examination of knowledge", "📋", "#E11D48") },
  { word: "UNIFORM", category: GAME_CATEGORIES.SCHOOL, hint: "Special set of clothes worn by students", query: "uniform doodle sketch", emoji: "👔", imageUrl: createCustomDoodleSvg("UNIFORM", "Set of clothes worn at school", "👔", "#1E40AF") },
  { word: "CLOCK", category: GAME_CATEGORIES.SCHOOL, hint: "Instrument for showing time", query: "clock doodle sketch", emoji: "⏰", imageUrl: createCustomDoodleSvg("CLOCK", "Instrument for showing time", "⏰", "#F59E0B") },
  { word: "BELL", category: GAME_CATEGORIES.SCHOOL, hint: "Metal object making a ringing sound", query: "bell doodle sketch", emoji: "🔔", imageUrl: createCustomDoodleSvg("BELL", "Makes a ringing sound", "🔔", "#EAB308") },

  // --- 5. TRANSPORT (30 từ) ---
  { word: "BICYCLE", category: GAME_CATEGORIES.TRANSPORT, hint: "Vehicle with two wheels you pedal", query: "bicycle doodle sketch", emoji: "🚲", imageUrl: createCustomDoodleSvg("BICYCLE", "A vehicle with two wheels", "🚲", "#10B981") },
  { word: "BOAT", category: GAME_CATEGORIES.TRANSPORT, hint: "Vehicle for traveling on water", query: "boat doodle sketch", emoji: "⛵", imageUrl: createCustomDoodleSvg("BOAT", "Vehicle for traveling on water", "⛵", "#0284C7") },
  { word: "BUS", category: GAME_CATEGORIES.TRANSPORT, hint: "Large vehicle carrying many passengers", query: "bus doodle sketch", emoji: "🚌", imageUrl: createCustomDoodleSvg("BUS", "Large vehicle carrying passengers", "🚌", "#0369A1") },
  { word: "CAR", category: GAME_CATEGORIES.TRANSPORT, hint: "Vehicle with four wheels driven by engine", query: "car doodle sketch", emoji: "🚗", imageUrl: createCustomDoodleSvg("CAR", "A vehicle with four wheels", "🚗", "#D97706") },
  { word: "PLANE", category: GAME_CATEGORIES.TRANSPORT, hint: "Vehicle with wings flying in the sky", query: "plane doodle sketch", emoji: "✈️", imageUrl: createCustomDoodleSvg("PLANE", "Flies in the sky", "✈️", "#E11D48") },
  { word: "TRAIN", category: GAME_CATEGORIES.TRANSPORT, hint: "Carriages traveling along railway lines", query: "train doodle sketch", emoji: "🚂", imageUrl: createCustomDoodleSvg("TRAIN", "Travels along a railway", "🚂", "#EF4444") },
  { word: "SHIP", category: GAME_CATEGORIES.TRANSPORT, hint: "Large boat for deep water travel", query: "ship doodle sketch", emoji: "🚢", imageUrl: createCustomDoodleSvg("SHIP", "Large boat for deep water", "🚢", "#4B5563") },
  { word: "TAXI", category: GAME_CATEGORIES.TRANSPORT, hint: "Car that takes paying passengers", query: "taxi doodle sketch", emoji: "🚕", imageUrl: createCustomDoodleSvg("TAXI", "Car taking paying passengers", "🚕", "#EAB308") },
  { word: "TRUCK", category: GAME_CATEGORIES.TRANSPORT, hint: "Large vehicle carrying heavy goods", query: "truck doodle sketch", emoji: "🚚", imageUrl: createCustomDoodleSvg("TRUCK", "Large vehicle carrying goods", "🚚", "#2563EB") },
  { word: "BIKE", category: GAME_CATEGORIES.TRANSPORT, hint: "Short name for bicycle or motorcycle", query: "bike doodle sketch", emoji: "🏍️", imageUrl: createCustomDoodleSvg("BIKE", "Two-wheeled vehicle", "🏍️", "#0EA5E9") },
  { word: "HELICOPTER", category: GAME_CATEGORIES.TRANSPORT, hint: "Aircraft with spinning blades on top", query: "helicopter doodle sketch", emoji: "🚁", imageUrl: createCustomDoodleSvg("HELICOPTER", "Aircraft with spinning blades", "🚁", "#DC2626") },
  { word: "MOTORCYCLE", category: GAME_CATEGORIES.TRANSPORT, hint: "Two-wheeled vehicle driven by motor", query: "motorcycle doodle sketch", emoji: "🏍️", imageUrl: createCustomDoodleSvg("MOTORCYCLE", "Two-wheeled motor vehicle", "🏍️", "#1E293B") },
  { word: "ROCKET", category: GAME_CATEGORIES.TRANSPORT, hint: "Vehicle used to travel into space", query: "rocket doodle sketch", emoji: "🚀", imageUrl: createCustomDoodleSvg("ROCKET", "Vehicle traveling into space", "🚀", "#F97316") },
  { word: "SUBWAY", category: GAME_CATEGORIES.TRANSPORT, hint: "Underground railway system", query: "subway doodle sketch", emoji: "🚇", imageUrl: createCustomDoodleSvg("SUBWAY", "Underground railway system", "🚇", "#7C3AED") },
  { word: "AMBULANCE", category: GAME_CATEGORIES.TRANSPORT, hint: "Takes sick people to hospital urgently", query: "ambulance doodle sketch", emoji: "🚑", imageUrl: createCustomDoodleSvg("AMBULANCE", "Takes sick people to hospital", "🚑", "#EF4444") },
  { word: "CANOE", category: GAME_CATEGORIES.TRANSPORT, hint: "Light narrow boat moved with a paddle", query: "canoe doodle sketch", emoji: "🛶", imageUrl: createCustomDoodleSvg("CANOE", "Narrow boat moved with paddle", "🛶", "#D97706") },
  { word: "CART", category: GAME_CATEGORIES.TRANSPORT, hint: "Vehicle with wheels pulled by horses", query: "cart doodle sketch", emoji: "🛒", imageUrl: createCustomDoodleSvg("CART", "Wheeled vehicle pulled by horses", "🛒", "#78350F") },
  { word: "FERRY", category: GAME_CATEGORIES.TRANSPORT, hint: "Boat carrying passengers across water", query: "ferry doodle sketch", emoji: "⛴️", imageUrl: createCustomDoodleSvg("FERRY", "Boat carrying cars and passengers", "⛴️", "#0284C7") },
  { word: "SCOOTER", category: GAME_CATEGORIES.TRANSPORT, hint: "Small vehicle with two wheels and handle", query: "scooter doodle sketch", emoji: "🛵", imageUrl: createCustomDoodleSvg("SCOOTER", "Small vehicle with two wheels", "🛵", "#F59E0B") },
  { word: "TRAM", category: GAME_CATEGORIES.TRANSPORT, hint: "Electric vehicle running along city tracks", query: "tram doodle sketch", emoji: "🚋", imageUrl: createCustomDoodleSvg("TRAM", "Runs along tracks in streets", "🚋", "#059669") },
  { word: "VAN", category: GAME_CATEGORIES.TRANSPORT, hint: "Medium vehicle for carrying goods", query: "van doodle sketch", emoji: "🚐", imageUrl: createCustomDoodleSvg("VAN", "Medium vehicle for goods", "🚐", "#64748B") },
  { word: "YACHT", category: GAME_CATEGORIES.TRANSPORT, hint: "Large boat used for pleasure or racing", query: "yacht doodle sketch", emoji: "🛥️", imageUrl: createCustomDoodleSvg("YACHT", "Large boat for pleasure", "🛥️", "#3B82F6") },
  { word: "VEHICLE", category: GAME_CATEGORIES.TRANSPORT, hint: "Thing used to transport people/goods", query: "vehicle doodle sketch", emoji: "🚘", imageUrl: createCustomDoodleSvg("VEHICLE", "Used for transport", "🚘", "#1E40AF") },
  { word: "DRIVE", category: GAME_CATEGORIES.TRANSPORT, hint: "To control and operate a vehicle", query: "drive doodle sketch", emoji: "🛞", imageUrl: createCustomDoodleSvg("DRIVE", "Operate a motor vehicle", "🛞", "#0F766E") },
  { word: "JET", category: GAME_CATEGORIES.TRANSPORT, hint: "A fast airplane powered by jet engines", query: "jet doodle sketch", emoji: "🛩️", imageUrl: createCustomDoodleSvg("JET", "Fast jet-powered airplane", "🛩️", "#0EA5E9") },
  { word: "LORRY", category: GAME_CATEGORIES.TRANSPORT, hint: "A large truck for carrying heavy loads", query: "lorry doodle sketch", emoji: "🚛", imageUrl: createCustomDoodleSvg("LORRY", "Large truck for heavy loads", "🚛", "#475569") },
  { word: "SPEEDBOAT", category: GAME_CATEGORIES.TRANSPORT, hint: "A small fast motorboat", query: "speedboat doodle sketch", emoji: "🚤", imageUrl: createCustomDoodleSvg("SPEEDBOAT", "Small fast motorboat", "🚤", "#0284C7") },
  { word: "ENGINE", category: GAME_CATEGORIES.TRANSPORT, hint: "Machine providing power to vehicle", query: "engine doodle sketch", emoji: "⚙️", imageUrl: createCustomDoodleSvg("ENGINE", "Machine providing power", "⚙️", "#334155") },
  { word: "TICKET", category: GAME_CATEGORIES.TRANSPORT, hint: "Paper showing you paid to travel", query: "ticket doodle sketch", emoji: "🎫", imageUrl: createCustomDoodleSvg("TICKET", "Paper allowing travel", "🎫", "#F43F5E") },
  { word: "WHEEL", category: GAME_CATEGORIES.TRANSPORT, hint: "Circular object turning on an axle", query: "wheel doodle sketch", emoji: "🛞", imageUrl: createCustomDoodleSvg("WHEEL", "Circular object that turns", "🛞", "#475569") },

  // --- 6. CLOTHING (30 từ) ---
  { word: "DRESS", category: GAME_CATEGORIES.CLOTHING, hint: "Clothing covering upper body and legs", query: "dress doodle sketch", emoji: "👗", imageUrl: createCustomDoodleSvg("DRESS", "Clothing for women or girls", "👗", "#B45309") },
  { word: "HAT", category: GAME_CATEGORIES.CLOTHING, hint: "A covering made for the head", query: "hat doodle sketch", emoji: "👒", imageUrl: createCustomDoodleSvg("HAT", "A covering made for the head", "👒", "#2563EB") },
  { word: "SHIRT", category: GAME_CATEGORIES.CLOTHING, hint: "Upper body clothing with buttons", query: "shirt doodle sketch", emoji: "👕", imageUrl: createCustomDoodleSvg("SHIRT", "Clothing for upper body", "👕", "#1E293B") },
  { word: "SHOE", category: GAME_CATEGORIES.CLOTHING, hint: "Outer covering for your feet", query: "shoe doodle sketch", emoji: "👞", imageUrl: createCustomDoodleSvg("SHOE", "Covering for your feet", "👞", "#EC4899") },
  { word: "SKIRT", category: GAME_CATEGORIES.CLOTHING, hint: "Clothing hanging from the waist", query: "skirt doodle sketch", emoji: "👗", imageUrl: createCustomDoodleSvg("SKIRT", "Hangs from the waist", "👗", "#F43F5E") },
  { word: "COAT", category: GAME_CATEGORIES.CLOTHING, hint: "Outdoor clothing worn over clothes", query: "coat doodle sketch", emoji: "🧥", imageUrl: createCustomDoodleSvg("COAT", "Outdoor clothing item", "🧥", "#D97706") },
  { word: "BOOTS", category: GAME_CATEGORIES.CLOTHING, hint: "Strong shoes covering foot and lower leg", query: "boots doodle sketch", emoji: "👢", imageUrl: createCustomDoodleSvg("BOOTS", "Strong shoes covering lower leg", "👢", "#78350F") },
  { word: "CAP", category: GAME_CATEGORIES.CLOTHING, hint: "Soft hat with a peak at front", query: "cap doodle sketch", emoji: "🧢", imageUrl: createCustomDoodleSvg("CAP", "Soft hat with a peak", "🧢", "#0284C7") },
  { word: "GLOVES", category: GAME_CATEGORIES.CLOTHING, hint: "Coverings for hands with separate fingers", query: "gloves doodle sketch", emoji: "🧤", imageUrl: createCustomDoodleSvg("GLOVES", "Coverings for the hands", "🧤", "#10B981") },
  { word: "JACKET", category: GAME_CATEGORIES.CLOTHING, hint: "A short coat with sleeves", query: "jacket doodle sketch", emoji: "🧥", imageUrl: createCustomDoodleSvg("JACKET", "Short coat with sleeves", "🧥", "#475569") },
  { word: "JEANS", category: GAME_CATEGORIES.CLOTHING, hint: "Trousers made of strong denim", query: "jeans doodle sketch", emoji: "👖", imageUrl: createCustomDoodleSvg("JEANS", "Trousers of blue denim", "👖", "#2563EB") },
  { word: "PANTS", category: GAME_CATEGORIES.CLOTHING, hint: "Clothing covering body from waist to ankles", query: "pants doodle sketch", emoji: "👖", imageUrl: createCustomDoodleSvg("PANTS", "Covering waist to ankles", "👖", "#1E40AF") },
  { word: "RING", category: GAME_CATEGORIES.CLOTHING, hint: "Small metal band worn on a finger", query: "ring doodle sketch", emoji: "💍", imageUrl: createCustomDoodleSvg("RING", "Metal band worn on finger", "💍", "#EAB308") },
  { word: "SCARF", category: GAME_CATEGORIES.CLOTHING, hint: "Cloth worn around neck for warmth", query: "scarf doodle sketch", emoji: "🧣", imageUrl: createCustomDoodleSvg("SCARF", "Worn around neck for warmth", "🧣", "#DC2626") },
  { word: "SHORTS", category: GAME_CATEGORIES.CLOTHING, hint: "Trousers ending above the knees", query: "shorts doodle sketch", emoji: "🩳", imageUrl: createCustomDoodleSvg("SHORTS", "Trousers ending at knees", "🩳", "#0EA5E9") },
  { word: "SOCK", category: GAME_CATEGORIES.CLOTHING, hint: "Soft clothing item worn inside shoes", query: "sock doodle sketch", emoji: "🧦", imageUrl: createCustomDoodleSvg("SOCK", "Soft item worn inside shoes", "🧦", "#F59E0B") },
  { word: "SUIT", category: GAME_CATEGORIES.CLOTHING, hint: "Matching jacket and trousers", query: "suit doodle sketch", emoji: "👔", imageUrl: createCustomDoodleSvg("SUIT", "Matching jacket and trousers", "👔", "#1E293B") },
  { word: "SWEATER", category: GAME_CATEGORIES.CLOTHING, hint: "Warm knitted top for upper body", query: "sweater doodle sketch", emoji: "🧶", imageUrl: createCustomDoodleSvg("SWEATER", "Warm knitted upper body top", "🧶", "#8B5CF6") },
  { word: "TIE", category: GAME_CATEGORIES.CLOTHING, hint: "Long strip of cloth worn around shirt collar", query: "tie doodle sketch", emoji: "👔", imageUrl: createCustomDoodleSvg("TIE", "Strip worn around shirt collar", "👔", "#EF4444") },
  { word: "TROUSERS", category: GAME_CATEGORIES.CLOTHING, hint: "Clothing covering waist to ankles", query: "trousers doodle sketch", emoji: "👖", imageUrl: createCustomDoodleSvg("TROUSERS", "Clothing covering legs", "👖", "#334155") },
  { word: "WATCH", category: GAME_CATEGORIES.CLOTHING, hint: "Small clock worn on your wrist", query: "watch doodle sketch", emoji: "⌚", imageUrl: createCustomDoodleSvg("WATCH", "Small clock worn on wrist", "⌚", "#D97706") },
  { word: "BELT", category: GAME_CATEGORIES.CLOTHING, hint: "Strip of leather worn around waist", query: "belt doodle sketch", emoji: "🪢", imageUrl: createCustomDoodleSvg("BELT", "Strip worn around waist", "🪢", "#78350F") },
  { word: "GLASSES", query: "glasses doodle sketch", category: GAME_CATEGORIES.CLOTHING, hint: "Lenses worn over eyes to help vision", emoji: "👓", imageUrl: createCustomDoodleSvg("GLASSES", "Worn over eyes for vision", "👓", "#64748B") },
  { word: "UNIFORM", category: GAME_CATEGORIES.CLOTHING, hint: "Special clothes for work or school", query: "uniform doodle sketch", emoji: "🥼", imageUrl: createCustomDoodleSvg("UNIFORM", "Special clothes for work/school", "🥼", "#0284C7") },
  { word: "CLOTHES", category: GAME_CATEGORIES.CLOTHING, hint: "Items worn to cover the body", query: "clothes doodle sketch", emoji: "👚", imageUrl: createCustomDoodleSvg("CLOTHES", "Items worn to cover body", "👚", "#EC4899") },
  { word: "POCKET", category: GAME_CATEGORIES.CLOTHING, hint: "Small bag sewn into clothing", query: "pocket doodle sketch", emoji: "👛", imageUrl: createCustomDoodleSvg("POCKET", "Small bag sewn into clothes", "👛", "#9333EA") },
  { word: "ZIPPER", category: GAME_CATEGORIES.CLOTHING, hint: "Device for closing clothes or bags", query: "zipper doodle sketch", emoji: "🤐", imageUrl: createCustomDoodleSvg("ZIPPER", "Used for closing clothes/bags", "🤐", "#475569") },
  { word: "APRON", category: GAME_CATEGORIES.CLOTHING, hint: "Worn over front to protect clothes in kitchen", query: "apron doodle sketch", emoji: "🥼", imageUrl: createCustomDoodleSvg("APRON", "Worn in kitchen to protect clothes", "🥼", "#059669") },
  { word: "PYJAMAS", category: GAME_CATEGORIES.CLOTHING, hint: "Soft loose clothing worn in bed", query: "pyjamas doodle sketch", emoji: "🥋", imageUrl: createCustomDoodleSvg("PYJAMAS", "Soft clothes worn in bed", "🥋", "#3B82F6") },
  { word: "WALLET", category: GAME_CATEGORIES.CLOTHING, hint: "Small flat case used for money and cards", query: "wallet doodle sketch", emoji: "👛", imageUrl: createCustomDoodleSvg("WALLET", "Small case for money & cards", "👛", "#78350F") },

  // --- 7. COLORS (30 từ) ---
  { word: "RED", category: GAME_CATEGORIES.COLORS, hint: "The color of blood, strawberries, or tomato", query: "red color doodle", emoji: "🔴", imageUrl: createCustomDoodleSvg("RED", "The color of blood", "🔴", "#EF4444") },
  { word: "BLUE", category: GAME_CATEGORIES.COLORS, hint: "The color of the sky or ocean", query: "blue color doodle", emoji: "🔵", imageUrl: createCustomDoodleSvg("BLUE", "The color of the sky", "🔵", "#3B82F6") },
  { word: "YELLOW", category: GAME_CATEGORIES.COLORS, hint: "The color of the sun or a banana", query: "yellow color doodle", emoji: "🟡", imageUrl: createCustomDoodleSvg("YELLOW", "The color of the sun", "🟡", "#EAB308") },
  { word: "GREEN", category: GAME_CATEGORIES.COLORS, hint: "The color of grass or fresh leaves", query: "green color doodle", emoji: "🟢", imageUrl: createCustomDoodleSvg("GREEN", "The color of grass", "🟢", "#10B981") },
  { word: "BROWN", category: GAME_CATEGORIES.COLORS, hint: "The color of earth, wood, or chocolate", query: "brown color doodle", emoji: "🟤", imageUrl: createCustomDoodleSvg("BROWN", "The color of earth or wood", "🟤", "#8B5CF6") },
  { word: "BLACK", category: GAME_CATEGORIES.COLORS, hint: "The darkest color, like night sky", query: "black color doodle", emoji: "⚫", imageUrl: createCustomDoodleSvg("BLACK", "The very darkest color", "⚫", "#A855F7") },
  { word: "WHITE", category: GAME_CATEGORIES.COLORS, hint: "The color of fresh snow or milk", query: "white color doodle", emoji: "⚪", imageUrl: createCustomDoodleSvg("WHITE", "The color of snow or milk", "⚪", "#94A3B8") },
  { word: "PINK", category: GAME_CATEGORIES.COLORS, hint: "A pale red color, like roses", query: "pink color doodle", emoji: "🩷", imageUrl: createCustomDoodleSvg("PINK", "A pale red color", "🩷", "#EC4899") },
  { word: "PURPLE", category: GAME_CATEGORIES.COLORS, hint: "Color made by mixing red and blue", query: "purple color doodle", emoji: "🟣", imageUrl: createCustomDoodleSvg("PURPLE", "Mixed red and blue", "🟣", "#A855F7") },
  { word: "ORANGE", category: GAME_CATEGORIES.COLORS, hint: "Color between red and yellow", query: "orange color doodle", emoji: "🟠", imageUrl: createCustomDoodleSvg("ORANGE", "Between red and yellow", "🟠", "#F97316") },
  { word: "GRAY", category: GAME_CATEGORIES.COLORS, hint: "Color between black and white", query: "gray color doodle", emoji: "🩶", imageUrl: createCustomDoodleSvg("GRAY", "Between black and white", "🩶", "#64748B") },
  { word: "SILVER", category: GAME_CATEGORIES.COLORS, hint: "Shiny gray color like polished metal", query: "silver color doodle", emoji: "🪙", imageUrl: createCustomDoodleSvg("SILVER", "Shiny gray metal color", "🪙", "#94A3B8") },
  { word: "GOLD", category: GAME_CATEGORIES.COLORS, hint: "Bright yellow shiny precious metal color", query: "gold color doodle", emoji: "🪙", imageUrl: createCustomDoodleSvg("GOLD", "Bright yellow shiny color", "🪙", "#EAB308") },
  { word: "BRONZE", category: GAME_CATEGORIES.COLORS, hint: "Yellowish-brown shiny metal color", query: "bronze color doodle", emoji: "🥉", imageUrl: createCustomDoodleSvg("BRONZE", "Yellowish-brown metal color", "🥉", "#D97706") },
  { word: "VIOLET", category: GAME_CATEGORIES.COLORS, hint: "Bluish-purple color like flowers", query: "violet color doodle", emoji: "🪻", imageUrl: createCustomDoodleSvg("VIOLET", "Bluish-purple color", "🪻", "#7C3AED") },
  { word: "INDIGO", category: GAME_CATEGORIES.COLORS, hint: "Dark blue color between blue and violet", query: "indigo color doodle", emoji: "🌌", imageUrl: createCustomDoodleSvg("INDIGO", "Dark blue color", "🌌", "#4338CA") },
  { word: "CYAN", category: GAME_CATEGORIES.COLORS, hint: "Bright light blue-green color", query: "cyan color doodle", emoji: "🩵", imageUrl: createCustomDoodleSvg("CYAN", "Light blue-green color", "🩵", "#06B6D4") },
  { word: "MAGENTA", category: GAME_CATEGORIES.COLORS, hint: "Deep purplish-red color", query: "magenta color doodle", emoji: "🌺", imageUrl: createCustomDoodleSvg("MAGENTA", "Deep purplish-red color", "🌺", "#D946EF") },
  { word: "BEIGE", category: GAME_CATEGORIES.COLORS, hint: "Very pale light brown color", query: "beige color doodle", emoji: "🏷️", imageUrl: createCustomDoodleSvg("BEIGE", "Pale light brown color", "🏷️", "#D97706") },
  { word: "TEAL", category: GAME_CATEGORIES.COLORS, hint: "Dark greenish-blue color", query: "teal color doodle", emoji: "🪿", imageUrl: createCustomDoodleSvg("TEAL", "Dark greenish-blue color", "🪿", "#0D9488") },
  { word: "MAROON", category: GAME_CATEGORIES.COLORS, hint: "Dark brownish-red color", query: "maroon color doodle", emoji: "🔴", imageUrl: createCustomDoodleSvg("MAROON", "Dark brownish-red color", "🔴", "#881337") },
  { word: "TURQUOISE", category: GAME_CATEGORIES.COLORS, hint: "Bright greenish-blue gem color", query: "turquoise color doodle", emoji: "🩵", imageUrl: createCustomDoodleSvg("TURQUOISE", "Bright greenish-blue color", "🩵", "#14B8A6") },
  { word: "AMBER", category: GAME_CATEGORIES.COLORS, hint: "Warm yellow-orange resin color", query: "amber color doodle", emoji: "🪨", imageUrl: createCustomDoodleSvg("AMBER", "Warm yellow-orange color", "🪨", "#F59E0B") },
  { word: "CORAL", category: GAME_CATEGORIES.COLORS, hint: "Pinkish-orange color like reef coral", query: "coral color doodle", emoji: "🪸", imageUrl: createCustomDoodleSvg("CORAL", "Pinkish-orange color", "🪸", "#F43F5E") },
  { word: "IVORY", category: GAME_CATEGORIES.COLORS, hint: "Creamy white color like elephant tusk", query: "ivory color doodle", emoji: "🐘", imageUrl: createCustomDoodleSvg("IVORY", "Creamy white color", "🐘", "#F5F5F4") },
  { word: "OLIVE", category: GAME_CATEGORIES.COLORS, hint: "Dark yellowish-green color", query: "olive color doodle", emoji: "🫒", imageUrl: createCustomDoodleSvg("OLIVE", "Dark yellowish-green color", "🫒", "#65A30D") },
  { word: "PEACH", category: GAME_CATEGORIES.COLORS, hint: "Soft yellowish-pink fruit color", query: "peach color doodle", emoji: "🍑", imageUrl: createCustomDoodleSvg("PEACH", "Soft yellowish-pink color", "🍑", "#FB7185") },
  { word: "CHARCOAL", category: GAME_CATEGORIES.COLORS, hint: "Very dark gray or near black color", query: "charcoal color doodle", emoji: "🖤", imageUrl: createCustomDoodleSvg("CHARCOAL", "Very dark gray color", "🖤", "#334155") },
  { word: "DARK", category: GAME_CATEGORIES.COLORS, hint: "Having little or no light, deep color", query: "dark color doodle", emoji: "🌙", imageUrl: createCustomDoodleSvg("DARK", "Deep in color, little light", "🌙", "#1E293B") },
  { word: "LIGHT", category: GAME_CATEGORIES.COLORS, hint: "Having a lot of light, pale in color", query: "light color doodle", emoji: "☀️", imageUrl: createCustomDoodleSvg("LIGHT", "Pale in color, bright light", "☀️", "#FDE047") },

  // --- 8. ACTIONS (30 từ) ---
  { word: "WALK", category: GAME_CATEGORIES.ACTIONS, hint: "Move on your feet at normal speed", query: "walk doodle sketch", emoji: "🚶", imageUrl: createCustomDoodleSvg("WALK", "Move on your feet", "🚶", "#0EA5E9") },
  { word: "RUN", category: GAME_CATEGORIES.ACTIONS, hint: "Move on your feet very fast", query: "run doodle sketch", emoji: "🏃", imageUrl: createCustomDoodleSvg("RUN", "Move on your feet very fast", "🏃", "#EC4899") },
  { word: "SLEEP", category: GAME_CATEGORIES.ACTIONS, hint: "Rest with eyes closed and body inactive", query: "sleep doodle sketch", emoji: "😴", imageUrl: createCustomDoodleSvg("SLEEP", "Rest with your eyes closed", "😴", "#F59E0B") },
  { word: "READ", category: GAME_CATEGORIES.ACTIONS, hint: "Look at and understand printed words", query: "read doodle sketch", emoji: "📖", imageUrl: createCustomDoodleSvg("READ", "Look at and understand words", "📖", "#6366F1") },
  { word: "WRITE", category: GAME_CATEGORIES.ACTIONS, hint: "Make words on paper with pen or pencil", query: "write doodle sketch", emoji: "✍️", imageUrl: createCustomDoodleSvg("WRITE", "Make words on paper", "✍️", "#64748B") },
  { word: "EAT", category: GAME_CATEGORIES.ACTIONS, hint: "Put food into your mouth and swallow", query: "eat doodle sketch", emoji: "🍽️", imageUrl: createCustomDoodleSvg("EAT", "Put food into your mouth", "🍽️", "#F97316") },
  { word: "DRINK", category: GAME_CATEGORIES.ACTIONS, hint: "Take liquid into mouth and swallow", query: "drink doodle sketch", emoji: "🥤", imageUrl: createCustomDoodleSvg("DRINK", "Take liquid into mouth", "🥤", "#0284C7") },
  { word: "JUMP", category: GAME_CATEGORIES.ACTIONS, hint: "Push off ground into air using legs", query: "jump doodle sketch", emoji: "🦘", imageUrl: createCustomDoodleSvg("JUMP", "Push off ground into air", "🦘", "#10B981") },
  { word: "SING", category: GAME_CATEGORIES.ACTIONS, hint: "Make musical sounds with your voice", query: "sing doodle sketch", emoji: "🎤", imageUrl: createCustomDoodleSvg("SING", "Make musical sounds with voice", "🎤", "#EC4899") },
  { word: "DANCE", category: GAME_CATEGORIES.ACTIONS, hint: "Move your body rhythmically to music", query: "dance doodle sketch", emoji: "💃", imageUrl: createCustomDoodleSvg("DANCE", "Move body rhythmically to music", "💃", "#F43F5E") },
  { word: "SWIM", category: GAME_CATEGORIES.ACTIONS, hint: "Move through water using body", query: "swim doodle sketch", emoji: "🏊", imageUrl: createCustomDoodleSvg("SWIM", "Move through water", "🏊", "#0284C7") },
  { word: "FLY", category: GAME_CATEGORIES.ACTIONS, hint: "Move through the air like a bird", query: "fly doodle sketch", emoji: "🕊️", imageUrl: createCustomDoodleSvg("FLY", "Move through air like a bird", "🕊️", "#3B82F6") },
  { word: "COOK", category: GAME_CATEGORIES.ACTIONS, hint: "Prepare food by heating it", query: "cook doodle sketch", emoji: "🧑‍🍳", imageUrl: createCustomDoodleSvg("COOK", "Prepare food by heating it", "🧑‍🍳", "#F59E0B") },
  { word: "DRAW", category: GAME_CATEGORIES.ACTIONS, hint: "Make pictures using a pencil or pen", query: "draw doodle sketch", emoji: "🎨", imageUrl: createCustomDoodleSvg("DRAW", "Make pictures with pencil", "🎨", "#8B5CF6") },
  { word: "PLAY", category: GAME_CATEGORIES.ACTIONS, hint: "Do an activity for enjoyment and fun", query: "play doodle sketch", emoji: "🎮", imageUrl: createCustomDoodleSvg("PLAY", "Activity for enjoyment and fun", "🎮", "#10B981") },
  { word: "TALK", category: GAME_CATEGORIES.ACTIONS, hint: "Speak words to communicate with someone", query: "talk doodle sketch", emoji: "💬", imageUrl: createCustomDoodleSvg("TALK", "Speak words to communicate", "💬", "#0EA5E9") },
  { word: "LISTEN", category: GAME_CATEGORIES.ACTIONS, hint: "Pay attention to sounds with your ears", query: "listen doodle sketch", emoji: "🎧", imageUrl: createCustomDoodleSvg("LISTEN", "Pay attention to sounds", "🎧", "#A855F7") },
  { word: "SMILE", category: GAME_CATEGORIES.ACTIONS, hint: "Make happy expression with your mouth", query: "smile doodle sketch", emoji: "😊", imageUrl: createCustomDoodleSvg("SMILE", "Happy expression with mouth", "😊", "#EAB308") },
  { word: "LAUGH", category: GAME_CATEGORIES.ACTIONS, hint: "Make sounds showing something is funny", query: "laugh doodle sketch", emoji: "😂", imageUrl: createCustomDoodleSvg("LAUGH", "Sounds showing something is funny", "😂", "#F59E0B") },
  { word: "WASH", category: GAME_CATEGORIES.ACTIONS, hint: "Clean something with water and soap", query: "wash doodle sketch", emoji: "🧼", imageUrl: createCustomDoodleSvg("WASH", "Clean with water and soap", "🧼", "#06B6D4") },
  { word: "STUDY", category: GAME_CATEGORIES.ACTIONS, hint: "Spend time learning about a subject", query: "study doodle sketch", emoji: "📚", imageUrl: createCustomDoodleSvg("STUDY", "Spend time learning a subject", "📚", "#4F46E5") },
  { word: "OPEN", category: GAME_CATEGORIES.ACTIONS, hint: "Move something so it is not closed", query: "open doodle sketch", emoji: "🔓", imageUrl: createCustomDoodleSvg("OPEN", "Uncover or unblock an opening", "🔓", "#10B981") },
  { word: "CLOSE", category: GAME_CATEGORIES.ACTIONS, hint: "Move something so opening is covered", query: "close doodle sketch", emoji: "🔒", imageUrl: createCustomDoodleSvg("CLOSE", "Cover or shut an opening", "🔒", "#EF4444") },
  { word: "SIT", category: GAME_CATEGORIES.ACTIONS, hint: "Rest body on a chair or floor", query: "sit doodle sketch", emoji: "🪑", imageUrl: createCustomDoodleSvg("SIT", "Rest body on chair or floor", "🪑", "#78350F") },
  { word: "STAND", category: GAME_CATEGORIES.ACTIONS, hint: "Be in an upright position on feet", query: "stand doodle sketch", emoji: "🧍", imageUrl: createCustomDoodleSvg("STAND", "Upright position on feet", "🧍", "#475569") },
  { word: "CLIMB", category: GAME_CATEGORIES.ACTIONS, hint: "Move upwards using hands and feet", query: "climb doodle sketch", emoji: "🧗", imageUrl: createCustomDoodleSvg("CLIMB", "Move upwards using hands/feet", "🧗", "#D97706") },
  { word: "THROW", category: GAME_CATEGORIES.ACTIONS, hint: "Send something through air with arm", query: "throw doodle sketch", emoji: "⚾", imageUrl: createCustomDoodleSvg("THROW", "Send something through air", "⚾", "#E11D48") },
  { word: "CATCH", category: GAME_CATEGORIES.ACTIONS, hint: "Capture something moving in the air", query: "catch doodle sketch", emoji: "🤲", imageUrl: createCustomDoodleSvg("CATCH", "Capture moving item in air", "🤲", "#059669") },
  { word: "DRIVE", category: GAME_CATEGORIES.ACTIONS, hint: "Control and steer a vehicle", query: "drive doodle sketch", emoji: "🚗", imageUrl: createCustomDoodleSvg("DRIVE", "Control and steer a vehicle", "🚗", "#2563EB") },
  { word: "PUSH", category: GAME_CATEGORIES.ACTIONS, hint: "Use force to move something away", query: "push doodle sketch", emoji: "🫷", imageUrl: createCustomDoodleSvg("PUSH", "Move something away with force", "🫷", "#DC2626") },
  { word: "PULL", category: GAME_CATEGORIES.ACTIONS, hint: "Use force to move something towards you", query: "pull doodle sketch", emoji: "🫱", imageUrl: createCustomDoodleSvg("PULL", "Move something towards you", "🫱", "#2563EB") }
];

/**
 * Chuẩn hóa chuỗi (Bỏ dấu tiếng Việt, loại bỏ ký tự đặc biệt, đưa về IN HOA)
 */
function normalizeAnswerString(str) {
  if (!str) return "";
  return str
    .toString()
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Xóa dấu tiếng Việt
    .replace(/[^A-Z0-9]/g, "");     // Chỉ giữ ký tự A-Z và số
}

/**
 * Tìm kiếm từ vựng trong Master Database
 */
function searchWordsInDatabase(keyword, category = null) {
  const normKey = normalizeAnswerString(keyword);
  return MASTER_WORD_DATABASE.filter(item => {
    const matchCategory = !category || category === "ALL" || item.category === category;
    const matchWord = !normKey || normalizeAnswerString(item.word).includes(normKey) || item.hint.toLowerCase().includes(keyword.toLowerCase());
    return matchCategory && matchWord;
  });
}

/**
 * Lấy danh sách từ theo chủ đề
 */
function getWordsByCategory(category) {
  if (!category || category === "ALL") return [...MASTER_WORD_DATABASE];
  return MASTER_WORD_DATABASE.filter(item => item.category === category);
}

/**
 * Tạo ảnh minh họa SVG Doodle fallback ngẫu nhiên nếu không có sẵn
 */
function generateFallbackDoodleSvg(word, hint = "") {
  return createCustomDoodleSvg(word, hint, "🎨", "#6366F1");
}

// Export biến cho môi trường Extension Browser
if (typeof window !== "undefined") {
  window.GAME_CATEGORIES = GAME_CATEGORIES;
  window.MASTER_WORD_DATABASE = MASTER_WORD_DATABASE;
  window.normalizeAnswerString = normalizeAnswerString;
  window.searchWordsInDatabase = searchWordsInDatabase;
  window.getWordsByCategory = getWordsByCategory;
  window.generateFallbackDoodleSvg = generateFallbackDoodleSvg;
}
})();
