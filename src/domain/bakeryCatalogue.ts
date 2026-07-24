export const BAKERY_CATALOGUE_SCHEMA_VERSION = 5;

export type SupplierId = "starting-shop" | "common-supplier" | "filling-supplier" | "artisan-supplier" | "premium-supplier";
export type RecipeCategory = "Starting" | "Classics" | "Filled" | "Premium" | "Specialities" | "Premium Combination";
export const RECIPE_CATEGORIES: readonly RecipeCategory[] = ["Starting", "Classics", "Filled", "Premium", "Premium Combination", "Specialities"];
export type DiscoveryCondition = { ingredientPurchased?: string; ingredientAvailable?: string; recipeOwned?: string };
export interface DiscoveryRule { visibleFromStart?: boolean; all?: DiscoveryCondition[]; any?: DiscoveryCondition[] }
export interface SupplierDefinition { id: SupplierId; name: string; cost: number; prerequisiteSupplierId?: SupplierId; ingredientIds: string[] }
export interface IngredientDefinition { id: string; name: string; supplierId: SupplierId; packQuantity: number; packPrice: number; assetKey: string }
export interface RecipeDefinition { id: string; productId: string; name: string; category: RecipeCategory; price: number; ingredients: Record<string, number>; yield: number; discovery: DiscoveryRule; neutralPrice: number; marketTier: ProductDefinition["marketTier"]; assetKey: string; lineage?: { parentRecipeId: string; addedIngredientIds: string[] }; lineageComparisons?: { parentRecipeId: string; addedPurchasedCost: number }[]; description?: string }
export interface ProductDefinition { id: string; name: string; neutralPrice: number; marketTier: "simple" | "filled" | "combination"; assetKey: string }

export const SUPPLIERS: readonly SupplierDefinition[] = [
  { id: "starting-shop", name: "Starting shop", cost: 0, ingredientIds: ["dough", "sugar", "icing", "sprinkles", "cinnamon"] },
  { id: "common-supplier", name: "Common Supplier", cost: 25, ingredientIds: ["cocoa", "vanilla", "ginger"] },
  { id: "filling-supplier", name: "Filling Supplier", cost: 120, prerequisiteSupplierId: "common-supplier", ingredientIds: ["chocolate", "jam", "custard", "cream", "coconut", "mint", "banana", "marshmallow"] },
  { id: "artisan-supplier", name: "Artisan Supplier", cost: 400, prerequisiteSupplierId: "filling-supplier", ingredientIds: ["caramel", "lemon-curd", "apple-filling", "coffee", "maple-syrup", "pecan"] },
  { id: "premium-supplier", name: "Premium Supplier", cost: 1200, prerequisiteSupplierId: "artisan-supplier", ingredientIds: ["biscuit-crumb", "peanut-butter", "hazelnut", "berries"] },
];

const ingredient = (id: string, name: string, supplierId: SupplierId, packPrice: number): IngredientDefinition => ({ id, name, supplierId, packQuantity: 10, packPrice, assetKey: id });
export const INGREDIENTS: readonly IngredientDefinition[] = [
  ingredient("dough", "Dough", "starting-shop", 40), ingredient("sugar", "Sugar", "starting-shop", 10), ingredient("icing", "Icing", "starting-shop", 30), ingredient("sprinkles", "Sprinkles", "starting-shop", 20), ingredient("cinnamon", "Cinnamon", "starting-shop", 20),
  ingredient("cocoa", "Cocoa", "common-supplier", 30), ingredient("vanilla", "Vanilla", "common-supplier", 40), ingredient("ginger", "Ginger", "common-supplier", 50),
  ingredient("chocolate", "Chocolate", "filling-supplier", 60), ingredient("jam", "Jam", "filling-supplier", 70), ingredient("custard", "Custard", "filling-supplier", 90), ingredient("cream", "Cream", "filling-supplier", 100), ingredient("coconut", "Coconut", "filling-supplier", 120), ingredient("mint", "Mint", "filling-supplier", 80), ingredient("banana", "Banana", "filling-supplier", 100), ingredient("marshmallow", "Marshmallow", "filling-supplier", 130),
  ingredient("caramel", "Caramel", "artisan-supplier", 110), ingredient("lemon-curd", "Lemon Curd", "artisan-supplier", 120), ingredient("apple-filling", "Apple Filling", "artisan-supplier", 130), ingredient("coffee", "Coffee", "artisan-supplier", 140), ingredient("maple-syrup", "Maple Syrup", "artisan-supplier", 150), ingredient("pecan", "Pecan", "artisan-supplier", 220),
  ingredient("biscuit-crumb", "Biscuit Crumb", "premium-supplier", 160), ingredient("peanut-butter", "Peanut Butter", "premium-supplier", 170), ingredient("hazelnut", "Hazelnut", "premium-supplier", 180), ingredient("berries", "Berries", "premium-supplier", 190),
];

const bought = (id: string): DiscoveryRule => ({ all: [{ ingredientPurchased: id }] });
const ownedAndBought = (recipeOwned: string, ingredientPurchased: string): DiscoveryRule => ({ all: [{ recipeOwned }, { ingredientPurchased }] });
const ownedPair = (firstRecipeOwned: string, secondRecipeOwned: string): DiscoveryRule => ({ all: [{ recipeOwned: firstRecipeOwned }, { recipeOwned: secondRecipeOwned }] });
const recipe = (id: string, name: string, category: RecipeCategory, price: number, ingredients: Record<string, number>, neutralPrice: number, discovery: DiscoveryRule, marketTier: ProductDefinition["marketTier"], lineage?: RecipeDefinition["lineage"], description?: string, lineageComparisons?: RecipeDefinition["lineageComparisons"]): RecipeDefinition => ({ id, productId: id, name, category, price, ingredients, yield: 1, discovery, neutralPrice, marketTier, assetKey: id, lineage, description, lineageComparisons });
export const RECIPES: readonly RecipeDefinition[] = [
  recipe("sprinkle-donut","Sprinkle Donut","Starting",20,{dough:1,sugar:2,sprinkles:1},16,bought("sprinkles"),"simple"),
  recipe("iced-sprinkle-donut","Iced Sprinkle Donut","Starting",35,{dough:1,sugar:2,sprinkles:1,icing:1},22,ownedPair("glazed-donut","sprinkle-donut"),"simple"),
  recipe("glazed-donut","Glazed Donut","Starting",12,{dough:1,sugar:2,icing:1},18,{visibleFromStart:true},"simple"),
  recipe("cinnamon-sugar-donut","Cinnamon Sugar Donut","Classics",45,{dough:1,sugar:2,cinnamon:1},18,{any:[{ingredientPurchased:"sugar"},{ingredientPurchased:"cinnamon"}]},"simple"),
  recipe("cocoa-sugar-donut","Cocoa Sugar Donut","Classics",60,{dough:1,sugar:2,cocoa:1},24,bought("cocoa"),"simple"),
  recipe("vanilla-glazed-donut","Vanilla Glazed Donut","Classics",90,{dough:1,sugar:2,icing:1,vanilla:1},30,ownedAndBought("glazed-donut","vanilla"),"simple",{parentRecipeId:"glazed-donut",addedIngredientIds:["vanilla"]}),
  recipe("chocolate-iced-donut","Chocolate Iced Donut","Classics",120,{dough:1,chocolate:1,icing:1},38,bought("chocolate"),"simple"),
  recipe("coconut-iced-donut","Coconut Iced Donut","Classics",150,{dough:1,coconut:1,icing:1},46,bought("coconut"),"simple"),
  recipe("jam-donut","Jam Donut","Filled",140,{dough:1,sugar:2,jam:1},44,bought("jam"),"filled"),
  recipe("custard-donut","Custard Donut","Filled",180,{dough:1,sugar:2,custard:1},54,bought("custard"),"filled"),
  recipe("cream-donut","Cream Donut","Filled",210,{dough:1,sugar:2,cream:1},60,bought("cream"),"filled"),
  recipe("lemon-curd-donut","Lemon Curd Donut","Filled",250,{dough:1,sugar:2,"lemon-curd":1},70,bought("lemon-curd"),"filled"),
  recipe("apple-cinnamon-donut","Apple Cinnamon Donut","Filled",300,{dough:1,sugar:2,cinnamon:1,"apple-filling":1},82,ownedAndBought("cinnamon-sugar-donut","apple-filling"),"filled",{parentRecipeId:"cinnamon-sugar-donut",addedIngredientIds:["apple-filling"]}),
  recipe("caramel-glazed-donut","Caramel Glazed Donut","Premium",260,{dough:1,sugar:2,icing:1,caramel:1},66,ownedAndBought("glazed-donut","caramel"),"filled",{parentRecipeId:"glazed-donut",addedIngredientIds:["caramel"]}),
  recipe("maple-glazed-donut","Maple Glazed Donut","Premium",320,{dough:1,sugar:2,icing:1,"maple-syrup":1},78,ownedAndBought("glazed-donut","maple-syrup"),"filled",{parentRecipeId:"glazed-donut",addedIngredientIds:["maple-syrup"]}),
  recipe("coffee-cream-donut","Coffee Cream Donut","Premium",420,{dough:1,sugar:2,cream:1,coffee:1},98,ownedAndBought("cream-donut","coffee"),"filled",{parentRecipeId:"cream-donut",addedIngredientIds:["coffee"]}),
  recipe("chocolate-custard-donut","Chocolate Custard Donut","Premium",450,{dough:1,sugar:2,custard:1,chocolate:1},104,ownedAndBought("custard-donut","chocolate"),"filled",{parentRecipeId:"custard-donut",addedIngredientIds:["chocolate"]}),
  recipe("jam-and-cream-donut","Jam and Cream Donut","Premium",480,{dough:1,sugar:2,jam:1,cream:1},112,ownedAndBought("jam-donut","cream"),"filled",{parentRecipeId:"jam-donut",addedIngredientIds:["cream"]}),
  recipe("lemon-cream-donut","Lemon Cream Donut","Premium",520,{dough:1,sugar:2,"lemon-curd":1,cream:1},126,ownedAndBought("lemon-curd-donut","cream"),"filled",{parentRecipeId:"lemon-curd-donut",addedIngredientIds:["cream"]}),
  recipe("peanut-butter-chocolate-donut","Peanut Butter Chocolate Donut","Specialities",650,{dough:1,chocolate:1,icing:1,"peanut-butter":1},150,ownedAndBought("chocolate-iced-donut","peanut-butter"),"combination",{parentRecipeId:"chocolate-iced-donut",addedIngredientIds:["peanut-butter"]}),
  recipe("hazelnut-chocolate-donut","Hazelnut Chocolate Donut","Specialities",680,{dough:1,chocolate:1,icing:1,hazelnut:1},158,ownedAndBought("chocolate-iced-donut","hazelnut"),"combination",{parentRecipeId:"chocolate-iced-donut",addedIngredientIds:["hazelnut"]}),
  recipe("cookies-and-cream-donut","Cookies and Cream Donut","Specialities",720,{dough:1,sugar:2,cream:1,"biscuit-crumb":1,icing:1},172,ownedAndBought("cream-donut","biscuit-crumb"),"combination",{parentRecipeId:"cream-donut",addedIngredientIds:["biscuit-crumb","icing"]}),
  recipe("berry-cream-donut","Berry Cream Donut","Specialities",760,{dough:1,sugar:2,cream:1,berries:1},180,ownedAndBought("cream-donut","berries"),"combination",{parentRecipeId:"cream-donut",addedIngredientIds:["berries"]}),
  recipe("deluxe-jam-donut","Deluxe Jam Donut","Specialities",820,{dough:1,sugar:2,jam:1,cream:1,icing:1},190,{all:[{recipeOwned:"jam-and-cream-donut"}]},"combination",{parentRecipeId:"jam-and-cream-donut",addedIngredientIds:["icing"]}),
  recipe("mocha-donut","Mocha Donut","Specialities",900,{dough:1,sugar:2,cream:1,coffee:1,chocolate:1},210,ownedAndBought("coffee-cream-donut","chocolate"),"combination",{parentRecipeId:"coffee-cream-donut",addedIngredientIds:["chocolate"]}),
  recipe("lemon-meringue-donut","Lemon Meringue Donut","Specialities",980,{dough:1,sugar:2,"lemon-curd":1,cream:1,icing:1},224,{all:[{recipeOwned:"lemon-cream-donut"}]},"combination",{parentRecipeId:"lemon-cream-donut",addedIngredientIds:["sugar","icing"]}),
  recipe("triple-chocolate-donut","Triple Chocolate Donut","Specialities",1200,{dough:1,chocolate:2,icing:1,cocoa:1},240,{all:[{recipeOwned:"chocolate-iced-donut"},{recipeOwned:"cocoa-sugar-donut"}]},"combination",{parentRecipeId:"chocolate-iced-donut",addedIngredientIds:["chocolate","cocoa"]}),
  recipe("caramel-coconut-donut","Caramel Coconut Donut","Premium Combination",580,{dough:1,icing:1,caramel:1,coconut:1},138,ownedPair("caramel-glazed-donut","coconut-iced-donut"),"combination",{parentRecipeId:"coconut-iced-donut",addedIngredientIds:["caramel"]},"An iced Donut finished with rich caramel glaze and shredded coconut.",[{parentRecipeId:"coconut-iced-donut",addedPurchasedCost:11},{parentRecipeId:"caramel-glazed-donut",addedPurchasedCost:12}]),
  recipe("maple-apple-donut","Maple Apple Donut","Premium Combination",640,{dough:1,sugar:2,cinnamon:1,"apple-filling":1,"maple-syrup":1},154,ownedPair("apple-cinnamon-donut","maple-glazed-donut"),"combination",{parentRecipeId:"apple-cinnamon-donut",addedIngredientIds:["maple-syrup"]},"An apple-filled cinnamon Donut finished with a sweet maple glaze.",[{parentRecipeId:"apple-cinnamon-donut",addedPurchasedCost:15},{parentRecipeId:"maple-glazed-donut",addedPurchasedCost:15}]),
  recipe("peanut-butter-biscuit-donut","Peanut Butter Biscuit Donut","Premium Combination",780,{dough:1,sugar:2,icing:1,"peanut-butter":1,"biscuit-crumb":1},180,ownedPair("peanut-butter-chocolate-donut","cookies-and-cream-donut"),"combination",{parentRecipeId:"peanut-butter-chocolate-donut",addedIngredientIds:["biscuit-crumb"]},"An iced peanut-butter Donut finished with a generous coating of biscuit crumb.",[{parentRecipeId:"cookies-and-cream-donut",addedPurchasedCost:7},{parentRecipeId:"peanut-butter-chocolate-donut",addedPurchasedCost:11}]),
  recipe("vanilla-berry-cream-donut","Vanilla Berry Cream Donut","Premium Combination",850,{dough:1,sugar:2,icing:1,vanilla:1,cream:1,berries:1},198,ownedPair("vanilla-glazed-donut","berry-cream-donut"),"combination",{parentRecipeId:"berry-cream-donut",addedIngredientIds:["vanilla","icing"]},"A cream-filled berry Donut finished with fragrant vanilla icing.",[{parentRecipeId:"berry-cream-donut",addedPurchasedCost:4},{parentRecipeId:"vanilla-glazed-donut",addedPurchasedCost:29}]),
  recipe("hazelnut-coffee-cream-donut","Hazelnut Coffee Cream Donut","Premium Combination",880,{dough:1,sugar:2,cream:1,coffee:1,hazelnut:1},204,ownedPair("hazelnut-chocolate-donut","coffee-cream-donut"),"combination",{parentRecipeId:"coffee-cream-donut",addedIngredientIds:["hazelnut"]},"A coffee-and-cream Donut finished with roasted hazelnut pieces.",[{parentRecipeId:"coffee-cream-donut",addedPurchasedCost:18},{parentRecipeId:"hazelnut-chocolate-donut",addedPurchasedCost:19}]),
  recipe("sugar-donut","Sugar Donut","Starting",0,{dough:1,sugar:2},12,{visibleFromStart:true},"simple"),
  recipe("cinnamon-iced-donut","Cinnamon Iced Donut","Classics",75,{dough:1,sugar:2,cinnamon:1,icing:1},30,ownedPair("cinnamon-sugar-donut","iced-sprinkle-donut"),"simple",{parentRecipeId:"cinnamon-sugar-donut",addedIngredientIds:[]}),
  recipe("vanilla-sprinkle-donut","Vanilla Sprinkle Donut","Classics",110,{dough:1,sugar:1,icing:1,vanilla:1,sprinkles:1},40,ownedPair("vanilla-glazed-donut","iced-sprinkle-donut"),"simple"),
  recipe("chocolate-sprinkle-donut","Chocolate Sprinkle Donut","Classics",135,{dough:1,sugar:1,icing:1,chocolate:1,sprinkles:1},46,ownedPair("chocolate-iced-donut","iced-sprinkle-donut"),"simple",{parentRecipeId:"chocolate-iced-donut",addedIngredientIds:[]}),
  recipe("chocolate-vanilla-donut","Chocolate Vanilla Donut","Classics",180,{dough:1,icing:1,chocolate:1,vanilla:1},58,ownedPair("chocolate-iced-donut","vanilla-glazed-donut"),"filled",{parentRecipeId:"chocolate-iced-donut",addedIngredientIds:["vanilla"]}),
  recipe("lemon-glazed-donut","Lemon Glazed Donut","Classics",220,{dough:1,icing:1,"lemon-curd":1},66,ownedAndBought("glazed-donut","lemon-curd"),"filled",{parentRecipeId:"glazed-donut",addedIngredientIds:["lemon-curd"]}),
  recipe("vanilla-custard-donut","Vanilla Custard Donut","Filled",230,{dough:1,sugar:2,vanilla:1,custard:1},72,ownedPair("vanilla-glazed-donut","custard-donut"),"filled",{parentRecipeId:"custard-donut",addedIngredientIds:["vanilla"]}),
  recipe("chocolate-cream-donut","Chocolate Cream Donut","Filled",320,{dough:1,icing:1,chocolate:1,cream:1},90,ownedPair("chocolate-iced-donut","cream-donut"),"filled",{parentRecipeId:"chocolate-iced-donut",addedIngredientIds:["cream"]}),
  recipe("vanilla-cream-donut","Vanilla Cream Donut","Filled",380,{dough:1,icing:1,vanilla:1,cream:1},96,ownedPair("vanilla-glazed-donut","cream-donut"),"filled",{parentRecipeId:"cream-donut",addedIngredientIds:["vanilla"]}),
  recipe("cinnamon-cream-donut","Cinnamon Cream Donut","Filled",390,{dough:1,sugar:2,cinnamon:1,cream:1},98,ownedPair("cinnamon-sugar-donut","cream-donut"),"filled",{parentRecipeId:"cream-donut",addedIngredientIds:["cinnamon"]}),
  recipe("chocolate-caramel-donut","Chocolate Caramel Donut","Premium",400,{dough:1,icing:1,chocolate:1,caramel:1},104,ownedPair("chocolate-iced-donut","caramel-glazed-donut"),"filled",{parentRecipeId:"chocolate-iced-donut",addedIngredientIds:["caramel"]}),
  recipe("chocolate-coconut-donut","Chocolate Coconut Donut","Premium",420,{dough:1,icing:1,chocolate:1,coconut:1},108,ownedPair("chocolate-iced-donut","coconut-iced-donut"),"filled",{parentRecipeId:"chocolate-iced-donut",addedIngredientIds:["coconut"]}),
  recipe("jam-custard-donut","Jam Custard Donut","Filled",440,{dough:1,sugar:2,jam:1,custard:1},112,ownedPair("jam-donut","custard-donut"),"filled",{parentRecipeId:"custard-donut",addedIngredientIds:["jam"]}),
  recipe("caramel-custard-donut","Caramel Custard Donut","Filled",460,{dough:1,icing:1,caramel:1,custard:1},116,ownedPair("caramel-glazed-donut","custard-donut"),"filled",{parentRecipeId:"custard-donut",addedIngredientIds:["caramel"]}),
  recipe("chocolate-biscuit-donut","Chocolate Biscuit Donut","Premium",500,{dough:1,icing:1,chocolate:1,"biscuit-crumb":1},122,ownedAndBought("chocolate-iced-donut","biscuit-crumb"),"filled",{parentRecipeId:"chocolate-iced-donut",addedIngredientIds:["biscuit-crumb"]}),
  recipe("peanut-butter-and-jam-donut","Peanut Butter and Jam Donut","Filled",520,{dough:1,sugar:2,"peanut-butter":1,jam:1},126,ownedAndBought("jam-donut","peanut-butter"),"filled",{parentRecipeId:"jam-donut",addedIngredientIds:["peanut-butter"]}),
  recipe("berry-jam-donut","Berry Jam Donut","Filled",540,{dough:1,sugar:2,jam:1,berries:1},130,ownedAndBought("jam-donut","berries"),"filled",{parentRecipeId:"jam-donut",addedIngredientIds:["berries"]}),
  recipe("berry-custard-donut","Berry Custard Donut","Filled",560,{dough:1,sugar:2,custard:1,berries:1},132,ownedAndBought("custard-donut","berries"),"filled",{parentRecipeId:"custard-donut",addedIngredientIds:["berries"]}),
  recipe("vanilla-hazelnut-donut","Vanilla Hazelnut Donut","Premium",620,{dough:1,icing:1,vanilla:1,hazelnut:1},146,ownedAndBought("vanilla-glazed-donut","hazelnut"),"filled",{parentRecipeId:"vanilla-glazed-donut",addedIngredientIds:["hazelnut"]}),
  recipe("hazelnut-cream-donut","Hazelnut Cream Donut","Filled",650,{dough:1,icing:1,hazelnut:1,cream:1},152,ownedAndBought("cream-donut","hazelnut"),"filled",{parentRecipeId:"cream-donut",addedIngredientIds:["hazelnut"]}),
  recipe("lemon-berry-donut","Lemon Berry Donut","Premium",680,{dough:1,icing:1,"lemon-curd":1,berries:1},158,ownedAndBought("lemon-curd-donut","berries"),"filled",{parentRecipeId:"lemon-curd-donut",addedIngredientIds:["berries"]}),
  recipe("apple-crumble-donut","Apple Crumble Donut","Specialities",760,{dough:1,sugar:2,cinnamon:1,"apple-filling":1,"biscuit-crumb":1},176,ownedAndBought("apple-cinnamon-donut","biscuit-crumb"),"combination",{parentRecipeId:"apple-cinnamon-donut",addedIngredientIds:["biscuit-crumb"]}),
  recipe("vanilla-latte-donut","Vanilla Latte Donut","Specialities",800,{dough:1,icing:1,vanilla:1,coffee:1,cream:1},184,ownedPair("coffee-cream-donut","vanilla-glazed-donut"),"combination",{parentRecipeId:"coffee-cream-donut",addedIngredientIds:["vanilla"]}),
  recipe("chocolate-vanilla-cream-donut","Chocolate Vanilla Cream Donut","Filled",880,{dough:1,icing:1,chocolate:1,vanilla:1,cream:1},196,ownedPair("chocolate-vanilla-donut","vanilla-cream-donut"),"combination",{parentRecipeId:"chocolate-vanilla-donut",addedIngredientIds:["cream"]}),
  recipe("vanilla-berry-custard-donut","Vanilla Berry Custard Donut","Filled",900,{dough:1,icing:1,vanilla:1,custard:1,berries:1},202,ownedPair("vanilla-custard-donut","berry-custard-donut"),"combination",{parentRecipeId:"berry-custard-donut",addedIngredientIds:["vanilla"]}),
  recipe("lamington-donut","Lamington Donut","Specialities",930,{dough:1,icing:1,chocolate:1,jam:1,coconut:1},208,ownedPair("chocolate-coconut-donut","jam-donut"),"combination",{parentRecipeId:"chocolate-coconut-donut",addedIngredientIds:["jam"]}),
  recipe("caramel-latte-donut","Caramel Latte Donut","Specialities",960,{dough:1,icing:1,caramel:1,coffee:1,cream:1},214,ownedPair("coffee-cream-donut","caramel-glazed-donut"),"combination",{parentRecipeId:"coffee-cream-donut",addedIngredientIds:["caramel"]}),
  recipe("chocolate-hazelnut-cream-donut","Chocolate Hazelnut Cream Donut","Premium",1250,{dough:1,icing:1,chocolate:1,hazelnut:1,cream:1},250,ownedPair("hazelnut-chocolate-donut","chocolate-cream-donut"),"combination",{parentRecipeId:"hazelnut-chocolate-donut",addedIngredientIds:["cream"]}),
  recipe("chocolate-caramel-biscuit-donut","Chocolate Caramel Biscuit Donut","Specialities",1350,{dough:1,icing:1,chocolate:1,caramel:1,"biscuit-crumb":1},260,ownedPair("chocolate-caramel-donut","chocolate-biscuit-donut"),"combination",{parentRecipeId:"chocolate-caramel-donut",addedIngredientIds:["biscuit-crumb"]}),
  recipe("neapolitan-donut","Neapolitan Donut","Specialities",1650,{dough:1,icing:1,vanilla:1,chocolate:1,jam:1,cream:1},285,ownedPair("chocolate-vanilla-cream-donut","jam-and-cream-donut"),"combination",{parentRecipeId:"chocolate-vanilla-cream-donut",addedIngredientIds:["jam"]}),
  recipe("black-forest-donut","Black Forest Donut","Specialities",2200,{dough:1,icing:1,cocoa:1,chocolate:1,jam:1,cream:1,berries:1},320,{all:[{recipeOwned:"chocolate-cream-donut"},{recipeOwned:"berry-jam-donut"},{recipeOwned:"cocoa-sugar-donut"}]},"combination"),
  recipe("ultimate-apple-maple-crumble-donut","Ultimate Apple Maple Crumble Donut","Specialities",2500,{dough:1,sugar:2,cinnamon:1,"apple-filling":1,"maple-syrup":1,"biscuit-crumb":1,cream:1},340,{all:[{recipeOwned:"apple-crumble-donut"},{recipeOwned:"maple-glazed-donut"},{recipeOwned:"cream-donut"}]},"combination",{parentRecipeId:"apple-crumble-donut",addedIngredientIds:["maple-syrup","cream"]}),
  recipe("banana-cream-donut","Banana Cream Donut","Filled",360,{dough:1,sugar:2,banana:1,cream:1},100,ownedAndBought("cream-donut","banana"),"filled"),
  recipe("maple-pecan-donut","Maple Pecan Donut","Premium",780,{dough:1,sugar:2,icing:1,"maple-syrup":1,pecan:1},180,ownedAndBought("maple-glazed-donut","pecan"),"combination"),
  recipe("smores-donut","S’mores Donut","Specialities",900,{dough:1,icing:1,chocolate:1,marshmallow:1,"biscuit-crumb":1},204,ownedPair("chocolate-marshmallow-donut","chocolate-biscuit-donut"),"combination"),
  recipe("banoffee-donut","Banoffee Donut","Specialities",1500,{dough:1,sugar:2,banana:1,caramel:1,cream:1,"biscuit-crumb":1},270,{all:[{recipeOwned:"banana-cream-donut"},{recipeOwned:"caramel-glazed-donut"},{ingredientPurchased:"biscuit-crumb"}]},"combination"),
  recipe("chocolate-mint-donut","Chocolate Mint Donut","Premium",380,{dough:1,icing:1,chocolate:1,mint:1},104,ownedAndBought("chocolate-iced-donut","mint"),"filled"),
  recipe("banana-custard-donut","Banana Custard Donut","Filled",400,{dough:1,sugar:2,banana:1,custard:1},106,ownedAndBought("custard-donut","banana"),"filled"),
  recipe("caramel-pecan-donut","Caramel Pecan Donut","Premium",620,{dough:1,icing:1,caramel:1,pecan:1},148,ownedAndBought("caramel-glazed-donut","pecan"),"filled"),
  recipe("gingerbread-donut","Gingerbread Donut","Specialities",760,{dough:1,sugar:2,cinnamon:1,ginger:1,"biscuit-crumb":1},174,{all:[{recipeOwned:"cinnamon-sugar-donut"},{ingredientPurchased:"ginger"},{ingredientPurchased:"biscuit-crumb"}]},"combination"),
  recipe("chocolate-banana-donut","Chocolate Banana Donut","Premium",420,{dough:1,icing:1,chocolate:1,banana:1},110,ownedAndBought("chocolate-iced-donut","banana"),"filled"),
  recipe("banana-pecan-donut","Banana Pecan Donut","Specialities",800,{dough:1,sugar:2,cinnamon:1,banana:1,pecan:1},182,{all:[{recipeOwned:"banana-cream-donut"},{recipeOwned:"cinnamon-sugar-donut"},{ingredientPurchased:"pecan"}]},"combination"),
  recipe("peanut-butter-banana-donut","Peanut Butter Banana Donut","Filled",520,{dough:1,sugar:2,"peanut-butter":1,banana:1},126,ownedAndBought("banana-cream-donut","peanut-butter"),"filled"),
  recipe("apple-pecan-donut","Apple Pecan Donut","Specialities",830,{dough:1,sugar:2,cinnamon:1,"apple-filling":1,pecan:1},188,ownedAndBought("apple-cinnamon-donut","pecan"),"combination"),
  recipe("chocolate-pecan-donut","Chocolate Pecan Donut","Premium",640,{dough:1,icing:1,chocolate:1,pecan:1},152,ownedAndBought("chocolate-iced-donut","pecan"),"filled"),
  recipe("rocky-road-donut","Rocky Road Donut","Specialities",980,{dough:1,icing:1,chocolate:1,marshmallow:1,hazelnut:1},216,ownedPair("chocolate-marshmallow-donut","hazelnut-chocolate-donut"),"combination"),
  recipe("banana-bread-donut","Banana Bread Donut","Specialities",790,{dough:1,sugar:2,cinnamon:1,banana:1,"biscuit-crumb":1},178,{all:[{recipeOwned:"cinnamon-sugar-donut"},{ingredientPurchased:"banana"},{ingredientPurchased:"biscuit-crumb"}]},"combination"),
  recipe("chocolate-marshmallow-donut","Chocolate Marshmallow Donut","Premium",600,{dough:1,icing:1,chocolate:1,marshmallow:1},142,ownedAndBought("chocolate-iced-donut","marshmallow"),"filled"),
  recipe("pecan-pie-donut","Pecan Pie Donut","Specialities",1900,{dough:1,sugar:2,caramel:1,"maple-syrup":1,pecan:1,"biscuit-crumb":1},310,{all:[{recipeOwned:"maple-pecan-donut"},{recipeOwned:"caramel-pecan-donut"},{ingredientPurchased:"biscuit-crumb"}]},"combination"),
  recipe("banana-split-donut","Banana Split Donut","Specialities",2000,{dough:1,icing:1,banana:1,chocolate:1,cream:1,berries:1},318,{all:[{recipeOwned:"banana-cream-donut"},{recipeOwned:"chocolate-cream-donut"},{recipeOwned:"berry-cream-donut"}]},"combination"),
  recipe("pecan-coffee-cream-donut","Pecan Coffee Cream Donut","Specialities",1000,{dough:1,sugar:2,coffee:1,cream:1,pecan:1},220,ownedAndBought("coffee-cream-donut","pecan"),"combination"),
  recipe("mint-mocha-donut","Mint Mocha Donut","Specialities",2100,{dough:1,sugar:2,icing:1,chocolate:1,coffee:1,cream:1,mint:1},326,ownedPair("mocha-donut","chocolate-mint-donut"),"combination"),
  recipe("gingerbread-latte-donut","Gingerbread Latte Donut","Specialities",2800,{dough:1,sugar:2,icing:1,ginger:1,cinnamon:1,coffee:1,cream:1},360,ownedPair("gingerbread-donut","coffee-cream-donut"),"combination"),
  recipe("maple-ginger-donut","Maple Ginger Donut","Premium",820,{dough:1,sugar:2,icing:1,"maple-syrup":1,ginger:1},186,ownedAndBought("maple-glazed-donut","ginger"),"combination"),
  recipe("banana-berry-cream-donut","Banana Berry Cream Donut","Filled",1050,{dough:1,sugar:2,banana:1,cream:1,berries:1},228,ownedPair("banana-cream-donut","berry-cream-donut"),"combination"),
  recipe("toasted-marshmallow-donut","Toasted Marshmallow Donut","Classics",450,{dough:1,sugar:2,icing:1,marshmallow:1},112,ownedAndBought("glazed-donut","marshmallow"),"filled"),
  recipe("mint-chocolate-chip-donut","Mint Chocolate Chip Donut","Premium",680,{dough:1,icing:1,chocolate:2,mint:1},160,{all:[{recipeOwned:"chocolate-mint-donut"}]},"filled"),
  recipe("apple-pecan-crumble-donut","Apple Pecan Crumble Donut","Specialities",1550,{dough:1,sugar:2,cinnamon:1,"apple-filling":1,pecan:1,"biscuit-crumb":1},278,ownedPair("apple-crumble-donut","apple-pecan-donut"),"combination"),
  recipe("chocolate-peanut-butter-banana-donut","Chocolate Peanut Butter Banana Donut","Specialities",1080,{dough:1,icing:1,chocolate:1,"peanut-butter":1,banana:1},230,ownedPair("peanut-butter-chocolate-donut","chocolate-banana-donut"),"combination"),
  recipe("maple-pecan-cream-donut","Maple Pecan Cream Donut","Specialities",1600,{dough:1,sugar:2,icing:1,"maple-syrup":1,pecan:1,cream:1},282,ownedPair("maple-pecan-donut","cream-donut"),"combination"),
  recipe("marshmallow-cookies-and-cream-donut","Marshmallow Cookies and Cream Donut","Specialities",1520,{dough:1,sugar:2,icing:1,marshmallow:1,cream:1,"biscuit-crumb":1},276,ownedPair("cookies-and-cream-donut","toasted-marshmallow-donut"),"combination"),
  recipe("banana-maple-donut","Banana Maple Donut","Premium",850,{dough:1,sugar:2,icing:1,banana:1,"maple-syrup":1},190,ownedPair("banana-cream-donut","maple-glazed-donut"),"combination"),
  recipe("chocolate-mint-cream-donut","Chocolate Mint Cream Donut","Filled",1020,{dough:1,icing:1,chocolate:1,mint:1,cream:1},224,ownedPair("chocolate-mint-donut","cream-donut"),"combination"),
  recipe("pecan-caramel-biscuit-donut","Pecan Caramel Biscuit Donut","Specialities",1150,{dough:1,icing:1,caramel:1,pecan:1,"biscuit-crumb":1},238,{all:[{recipeOwned:"caramel-pecan-donut"},{ingredientPurchased:"biscuit-crumb"}]},"combination"),
  recipe("marshmallow-caramel-donut","Marshmallow Caramel Donut","Premium",660,{dough:1,icing:1,marshmallow:1,caramel:1},158,ownedPair("toasted-marshmallow-donut","caramel-glazed-donut"),"filled"),
  recipe("gingerbread-custard-donut","Gingerbread Custard Donut","Specialities",1580,{dough:1,sugar:2,ginger:1,cinnamon:1,custard:1,"biscuit-crumb":1},274,ownedPair("gingerbread-donut","custard-donut"),"combination"),
  recipe("banana-coconut-cream-donut","Banana Coconut Cream Donut","Filled",1060,{dough:1,sugar:2,banana:1,coconut:1,cream:1},220,ownedPair("banana-cream-donut","coconut-iced-donut"),"combination"),
  recipe("banana-hazelnut-cream-donut","Banana Hazelnut Cream Donut","Filled",1100,{dough:1,icing:1,banana:1,hazelnut:1,cream:1},232,ownedPair("banana-cream-donut","hazelnut-cream-donut"),"combination"),
];

export const PRODUCTS: readonly ProductDefinition[] = RECIPES.map((item) => ({ id:item.productId, name:item.name, neutralPrice:item.neutralPrice, marketTier:item.marketTier, assetKey:item.assetKey }));
export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((item) => [item.id,item])) as Record<string,RecipeDefinition>;
export const PRODUCT_BY_ID = Object.fromEntries(PRODUCTS.map((item) => [item.id,item])) as Record<string,ProductDefinition>;
export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((item) => [item.id,item])) as Record<string,IngredientDefinition>;
export const SUPPLIER_BY_ID = Object.fromEntries(SUPPLIERS.map((item) => [item.id,item])) as Record<string,SupplierDefinition>;
export const ALL_RESOURCE_IDS = ["coin",...INGREDIENTS.map((item)=>item.id)] as const;
export const INGREDIENT_IDS_IN_PURCHASE_ORDER = SUPPLIERS.flatMap((supplier) => supplier.ingredientIds);
const ingredientPurchaseOrderIndex = Object.fromEntries(INGREDIENT_IDS_IN_PURCHASE_ORDER.map((id, index) => [id, index])) as Record<string, number>;

export function ingredientIdsInPurchaseOrder<T extends string>(ids: readonly T[]): T[] {
  return [...ids].sort((left, right) => (ingredientPurchaseOrderIndex[left] ?? Number.MAX_SAFE_INTEGER) - (ingredientPurchaseOrderIndex[right] ?? Number.MAX_SAFE_INTEGER));
}

export function ingredientEntriesInPurchaseOrder(ingredients: Readonly<Record<string, number>>): Array<[string, number]> {
  return ingredientIdsInPurchaseOrder(Object.keys(ingredients)).map((id) => [id, ingredients[id]]);
}

const conditionMet = (condition: DiscoveryCondition, purchased: Set<string>, available: Set<string>, owned: Set<string>) =>
  (!condition.ingredientPurchased || purchased.has(condition.ingredientPurchased)) && (!condition.ingredientAvailable || available.has(condition.ingredientAvailable)) && (!condition.recipeOwned || owned.has(condition.recipeOwned));
export function discoverableRecipeIds(purchasedIngredientIds: readonly string[], unlockedSupplierIds: readonly string[], unlockedRecipeIds: readonly string[]) {
  const purchased = new Set(purchasedIngredientIds), owned = new Set(unlockedRecipeIds), suppliers = new Set(["starting-shop",...unlockedSupplierIds]);
  const available = new Set(INGREDIENTS.filter((item)=>suppliers.has(item.supplierId)).map((item)=>item.id));
  return RECIPES.filter(({discovery}) => discovery.visibleFromStart || (discovery.all?.every((c)=>conditionMet(c,purchased,available,owned)) ?? false) || (discovery.any?.some((c)=>conditionMet(c,purchased,available,owned)) ?? false)).map((item)=>item.id);
}
