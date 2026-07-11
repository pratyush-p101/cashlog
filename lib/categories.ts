export const CATEGORIES = [
  "Food",
  "Groceries",
  "Travel",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Health",
  "Education",
  "Rent",
  "Personal Care",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_EMOJI: Record<Category, string> = {
  Food: "🍔",
  Groceries: "🛒",
  Travel: "🚕",
  Shopping: "🛍️",
  "Bills & Utilities": "💡",
  Entertainment: "🎬",
  Health: "💊",
  Education: "📚",
  Rent: "🏠",
  "Personal Care": "💇",
  Other: "📦",
};

// Keyword map tuned for Indian household spending. Matched as whole words
// against the lowercased message, so "rentokil" won't match "rent".
export const CATEGORY_KEYWORDS: Record<Exclude<Category, "Other">, string[]> = {
  Food: [
    "zomato", "swiggy", "restaurant", "hotel", "dhaba", "canteen", "tiffin",
    "pizza", "burger", "biryani", "dosa", "momos", "dominos", "mcdonalds",
    "kfc", "subway", "chai", "tea", "coffee", "cafe", "snacks", "sweets",
    "mithai", "icecream", "juice", "lunch", "dinner", "breakfast", "food",
    "paratha", "thali", "samosa",
  ],
  Groceries: [
    "grocery", "groceries", "blinkit", "zepto", "bigbasket", "instamart",
    "jiomart", "dmart", "kirana", "ration", "sabzi", "vegetables", "fruits",
    "milk", "doodh", "curd", "dahi", "paneer", "atta", "rice", "chawal",
    "dal", "oil", "ghee", "masala", "eggs", "bread", "sugar",
  ],
  Travel: [
    "uber", "ola", "rapido", "auto", "rickshaw", "cab", "taxi", "bus",
    "train", "irctc", "metro", "flight", "indigo", "petrol", "diesel",
    "fuel", "cng", "toll", "fastag", "parking", "ticket", "travel", "yatra",
  ],
  Shopping: [
    "amazon", "flipkart", "myntra", "ajio", "meesho", "nykaa", "clothes",
    "kapde", "shirt", "tshirt", "pants", "jeans", "kurta", "saree", "dress",
    "shoes", "chappal", "sandals", "watch", "bag", "shopping", "gift",
  ],
  "Bills & Utilities": [
    "wifi", "broadband", "internet", "electricity", "bijli", "water",
    "paani", "gas", "cylinder", "lpg", "recharge", "mobile", "phone",
    "jio", "airtel", "vi", "bsnl", "dth", "tatasky", "bill", "maintenance",
    "society", "emi", "insurance", "premium",
  ],
  Entertainment: [
    "netflix", "hotstar", "prime", "spotify", "youtube", "movie", "cinema",
    "pvr", "inox", "bookmyshow", "game", "gaming", "concert", "subscription",
    "party", "club",
  ],
  Health: [
    "medicine", "dawai", "pharmacy", "chemist", "apollo", "1mg", "pharmeasy",
    "netmeds", "doctor", "hospital", "clinic", "dentist", "checkup", "test",
    "lab", "gym", "yoga", "protein", "medical", "health",
  ],
  Education: [
    "school", "college", "tuition", "coaching", "course", "udemy",
    "coursera", "books", "book", "stationery", "pen", "notebook", "fees",
    "exam", "class",
  ],
  Rent: ["rent", "kiraya", "landlord", "pg", "hostel"],
  "Personal Care": [
    "salon", "haircut", "barber", "parlour", "parlor", "spa", "facial",
    "shampoo", "soap", "cosmetics", "makeup", "cream",
  ],
};
