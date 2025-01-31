const firstNames = [

    "Mittens", "Whiskers", "Tiger", "Smokey", "Shadow", "Kitty", "Patches", "Oreo", "Socks", "Boots",
    "Snowball", "Ginger", "Pepper", "Misty", "Dusty", "Banjo", "Ziggy", "Simba", "Nala", "Milo",
    "Salem", "Garfield", "Sylvester", "Tom", "Felix", "Peanut", "Cookie", "Midnight", "Marble", "Tabby",
    "Callie", "Pixie", "Sunny", "Binx", "Biscuit", "Bubbles", "Buttons", "Caramel", "Coco", "Cuddles",
    "Fluffy", "Gizmo", "Jellybean", "Loki", "Mocha", "Muffin", "Ninja", "Pickles", "Pumpkin", "Snickers",
    "Charlie", "Max", "Bella", "Luna", "Lucy", "Daisy", "Milo", "Oscar", "Leo", "Coco", 
    "Oliver", "Jack", "Rosie", "Bailey", "Molly", "Toby", "Rocky", "Sophie", "Chloe", "Buddy", 
    "Lola", "Ruby", "Finn", "Ellie", "Sadie", "Sammy", "Maggie", "Bentley", "Jake", "Zoe", 
    "Henry", "Riley", "Harley", "Nala", "Buster", "Hazel", "Ginger", "Holly", "Lucky", "Winnie", 
    "Scout", "Penny", "Bear", "Gracie", "Louie", "Archie", "Simba", "Cleo", "Emma", "Olive", 
    "Bella", "Millie", "Zeus", "Phoebe", "George", "Frankie", "Lily", "Willow", "Bruno", "Freddie", 
    "Sunny", "Angel", "Sasha", "Hunter", "Marley", "Teddy", "Jasper", "Bo", "Ella", "Minnie", 
    "Ollie", "Sugar", "Duke", "Rex", "Hazel", "Pepper", "Koda", "Misty", "Juno", "Amber", 
    "Chester", "Poppy", "Benny", "Mimi", "Layla", "Shadow", "Blue", "Fiona", "Daisy", "Rusty", 
    "Cooper", "Murphy", "Mittens", "Baxter", "Maddie", "Cali", "Ace", "Moose", "Ziggy", "Clover", 
    "Thor", "Remy", "Stella", "Niko", "Mochi", "Beau", "Dexter", "Lulu", "Piper", "Rocco", 
    "Bambi", "Tank", "Gus", "Trixie", "Millie", "Tinker", "Sunny", "Bingo", "Cinnamon", "Shadow", 
    "Lucky", "Casper", "Mochi", "Pumpkin", "Bandit", "Rufus", "Pixie", "Chewy", "Scout", "Maisie", 
    "Bubbles", "Percy", "Milo", "Hank", "Sheba", "Buttercup", "Smokey", "Sugar", "Peanut", "Lacey", 
    "Sable", "Juno", "Roxy", "Rusty", "Cricket", "Jasper", "Gizmo", "Skip", "Chip", "Harlow", 
    "Teddy", "Fido", "Sadie", "Dakota", "Echo", "Rebel", "Socks", "Spike", "Clover", "Tango", 
    "Harper", "Loki", "Wally", "Muffin", "Ash", "Milo", "Sky", "Chance", "Sunny", "River", 
    "Storm", "Willow", "Diesel", "Benny", "Sunny", "Basil", "Jett", "Misty", "Doodle", "Zoe", 
    "Frosty", "Fluffy", "Zephyr", "Coco", "Mittens", "Thor", "Nova", "Maple", "Snickers", "Lucky", 
    "Meadow", "Blaze", "Trudy", "Clyde", "Leia", "Hershey", "Whiskers", "Spooky", "Oreo", "Dash"

];

const descriptors = [
  // Classic Descriptors
  "Brave", "Mighty", "Swift", "Wise", "Cunning", "Fierce", "Bold",
  "Mystic", "Shadow", "Valiant", "Eternal", "Radiant", "Phantom",
  
  // Epic Qualities
  "Legendary", "Unstoppable", "Magnificent", "Mysterious", "Invincible",
  "Thunderous", "Ethereal", "Celestial", "Fearless", "Untamed", "Ancient",
  "Cosmic", "Divine", "Enigmatic", "Fabled", "Glorious", "Immortal",
  "Majestic", "Noble", "Omnipotent", "Pristine", "Resplendent", "Sovereign",
  
  // Combat Related
  "Destroyer", "Conqueror", "Vanquisher", "Warrior", "Champion", "Defender",
  "Protector", "Guardian", "Slayer", "Victor", "Undefeated", "Berserker",
  "Warlord", "Commander", "Gladiator", "Challenger", "Duelist", "Knight",
  
  // Magical
  "Enchanted", "Arcane", "Mystical", "Spellbound", "Ethereal", "Magical",
  "Sorcerous", "Enchanter", "Wizardly", "Supernatural", "Otherworldly",
  "Mythical", "Astral", "Elemental", "Enchanting", "Mysterious",
  
  // Nature-themed
  "Wild", "Stormy", "Tempestuous", "Savage", "Primal", "Feral",
  "Untamed", "Windswept", "Thundering", "Blazing", "Frozen", "Earthshaker",
  "Hurricane", "Tsunami", "Avalanche", "Volcanic", "Typhoon",
  
  // Royal/Noble
  "Regal", "Imperial", "Royal", "Sovereign", "Crowned", "Exalted",
  "Distinguished", "Illustrious", "Renowned", "Prestigious", "Eminent",
  "Dignified", "Aristocratic", "Lordly", "Commanding", "Authoritative",
  
  // Personality
  "Clever", "Witty", "Brilliant", "Ingenious", "Resourceful", "Dauntless",
  "Determined", "Resolute", "Steadfast", "Tenacious", "Unwavering",
  "Intrepid", "Courageous", "Daring", "Audacious", "Indomitable",
  
  // Mysterious/Dark
  "Shadowy", "Mysterious", "Enigmatic", "Cryptic", "Veiled", "Obscure",
  "Stealthy", "Twilight", "Nocturnal", "Midnight", "Clandestine",
  "Secretive", "Hidden", "Unseen", "Lurking", "Spectral",
  
  // Light/Holy
  "Radiant", "Luminous", "Brilliant", "Shining", "Glowing", "Divine",
  "Blessed", "Sacred", "Holy", "Virtuous", "Pure", "Sanctified",
  "Hallowed", "Enlightened", "Celestial", "Transcendent",
  
  // Time/Space
  "Timeless", "Eternal", "Infinite", "Endless", "Everlasting", "Immortal",
  "Ancient", "Primordial", "Ageless", "Perpetual", "Undying", "Cosmic",
  "Universal", "Dimensional", "Omnipresent", "Boundless",

  // Funny/Quirky Descriptors
  "Nap Champion", "Yarn Hunter", "Box Inspector", "Keyboard Walker", "Curtain Climber",
  "Laser Chaser", "Sock Thief", "Treat Beggar", "Zoom Master", "Catnip Connoisseur",
  "Sunbeam Sleeper", "Midnight Zoomie", "Counter Surfer", "Paper Shredder", "Plant Destroyer",
  "Sink Captain", "Toilet Paper Bandit", "Vacuum Nemesis", "Door Opener", "Food Critic",
  "Laptop Warmer", "Mouse Misser", "Gravity Tester", "Bread Loafer", "Cardboard Conqueror",
  "Hairball Artist", "Keyboard Warrior", "Pizza Thief", "Selfie Expert", "Window Watcher",
  "Couch Commander", "Blanket Burrower", "Alarm Clock", "Slipper Stalker", "Table Surfer",
  "Bag Inspector", "Chair Racer", "Shower Supervisor", "Laundry Inspector", "Pillow Fighter",

  // Food Related
  "Cheese Thief", "Tuna Bandit", "Milk Marauder", "Chicken Chaser",
  "Snack Tracker", "Butter Burglar", "Fish Fiend", "Turkey Terrorist",
  "Ham Heist Master", "Yogurt Yoink Expert"
];

export function generateCatName(): string {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const descriptor = descriptors[Math.floor(Math.random() * descriptors.length)];
  return  (Math.random() * 100) > 50 ? `${descriptor} ${firstName}` : `${firstName} the ${descriptor}`;
} 