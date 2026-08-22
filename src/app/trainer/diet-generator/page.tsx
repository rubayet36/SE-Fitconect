'use client'

import { useState, useEffect, useMemo, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Sparkles,
  Calculator,
  Flame,
  Utensils,
  ChefHat,
  Plus,
  Trash2,
  RotateCcw,
  Save,
  Send,
  Copy,
  Check,
  Search,
  User,
  Scale,
  Dumbbell,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  HeartPulse,
  Activity,
  Layers,
  FileCheck2,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────

interface MemberProfile {
  id: string
  email: string
  full_name: string | null
  user_id_code?: string | null
  avatar_url?: string | null
  phone?: string | null
}

interface MemberRequest {
  id: string
  member_id: string
  trainer_id: string
  request_type: 'diet' | 'workout' | 'both'
  status: 'pending' | 'in_progress' | 'completed'
  notes: string | null
  created_at: string
}

type FitnessGoal = 'fat_loss' | 'maintenance' | 'muscle_gain'
type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active'
type DietPreference = 'standard' | 'vegetarian' | 'vegan' | 'keto' | 'mediterranean' | 'pescatarian'
type Gender = 'male' | 'female' | 'other'

interface MealItem {
  id: string
  meal_time: string
  food_items: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  notes: string
}

interface MacroCalculation {
  bmr: number
  tdee: number
  targetCalories: number
  proteinGrams: number
  proteinCalories: number
  carbsGrams: number
  carbsCalories: number
  fatGrams: number
  fatCalories: number
  proteinPercent: number
  carbsPercent: number
  fatPercent: number
  calorieDelta: number
}

// ── Meal Databases for AI Generation ──────────────────────────────────

interface MealOptionTemplate {
  name: string
  description: (pScale: number, cScale: number, fScale: number) => string
  baseMacros: { calories: number; protein: number; carbs: number; fat: number }
  tip: string
}

const MEAL_TEMPLATES: Record<DietPreference, Record<string, MealOptionTemplate[]>> = {
  standard: {
    'Early Morning': [
      {
        name: 'Metabolic Primer & Hydration Tonic',
        description: (_p, _c, f) => `500ml Warm Himalayan Pink Salt & Lemon Infusion + ${Math.max(5, Math.round(10 * f))}g Soaked California Almonds (peeled) + 1 tbsp Chia Seeds steeped in lukewarm water`,
        baseMacros: { calories: 120, protein: 4, carbs: 6, fat: 9 },
        tip: 'Enhances bile production, rehydrates cellular matrix, and primes enzymatic digestion upon waking.'
      },
      {
        name: 'Antioxidant Green Tea & Superseed Boost',
        description: (_p, _c, f) => `300ml Ceremonial Japanese Green Tea / Matcha + ${Math.max(5, Math.round(12 * f))}g Crushed Walnut Halves + 1 tsp Organic Honey & Ceylon Cinnamon`,
        baseMacros: { calories: 110, protein: 3, carbs: 8, fat: 8 },
        tip: 'Rich in EGCG polyphenols for metabolic stimulation and oxidative stress management.'
      }
    ],
    'Breakfast': [
      {
        name: 'Pro-Anabolic Power Oatmeal & Whey Bowl',
        description: (p, c, f) => `${Math.round(60 * c)}g Rolled Scottish Oats cooked in water/almond milk, mixed with ${Math.round(35 * p)}g Ultra-Filtered Whey Isolate, topped with ${Math.round(60 * c)}g Fresh Blueberries, ${Math.round(12 * f)}g Almond Butter, and a dash of cinnamon`,
        baseMacros: { calories: 520, protein: 42, carbs: 58, fat: 12 },
        tip: 'Provides sustained low-glycemic complex glycogen replenishment and rapid muscle protein synthesis (MPS).'
      },
      {
        name: 'Farm-Fresh Whole Eggs, Sourdough & Avocado',
        description: (p, c, f) => `${Math.max(2, Math.round(3 * p))} Large Pasture-Raised Eggs (scrambled/poached) + 2 Egg Whites, 2 slices (${Math.round(70 * c)}g) Artisanal Sourdough Toast, ${Math.round(40 * f)}g Sliced Haas Avocado, and ${Math.round(80 * c)}g Grilled Cherry Tomatoes`,
        baseMacros: { calories: 550, protein: 38, carbs: 46, fat: 22 },
        tip: 'Complete amino acid profile rich in choline, lutein, and monounsaturated fatty acids for hormonal optimization.'
      },
      {
        name: 'Greek Yogurt Parfait with Toasted Granola',
        description: (p, c, f) => `${Math.round(220 * p)}g 0% Plain Greek Yogurt / Skyr, 1 scoop Whey Isolate folded in, ${Math.round(45 * c)}g Low-Sugar Hemp Granola, ${Math.round(75 * c)}g Sliced Strawberries & ${Math.round(15 * f)}g Pumpkin Seeds`,
        baseMacros: { calories: 480, protein: 48, carbs: 48, fat: 10 },
        tip: 'High concentration of gut-friendly probiotics, casein for sustained amino release, and vital minerals.'
      }
    ],
    'Lunch': [
      {
        name: 'Herb-Roasted Chicken Breast & Ancient Grain Bowl',
        description: (p, c, f) => `${Math.round(180 * p)}g Tender Herb-Marinated Grilled Chicken Breast, ${Math.round(160 * c)}g Cooked Tri-Color Quinoa & Brown Basmati Rice, ${Math.round(120 * c)}g Steamed Broccoli Florets & Asparagus Spears drizzled with ${Math.round(10 * f)}ml Extra Virgin Cold-Pressed Olive Oil`,
        baseMacros: { calories: 620, protein: 52, carbs: 62, fat: 16 },
        tip: 'High leucine threshold activation paired with slow-burning whole-grain fiber to avoid afternoon insulin spikes.'
      },
      {
        name: 'Lean Grass-Fed Beef & Roasted Sweet Potato Power Box',
        description: (p, c, f) => `${Math.round(170 * p)}g 93/7 Lean Grass-Fed Ground Beef browned with garlic & cumin, ${Math.round(200 * c)}g Cubed Paprika-Roasted Sweet Potato, ${Math.round(100 * c)}g Sautéed Green Beans with ${Math.round(8 * f)}g Ghee or Olive Oil`,
        baseMacros: { calories: 640, protein: 48, carbs: 65, fat: 18 },
        tip: 'Natural source of bioavailable creatine, heme iron, zinc, and beta-carotene for cellular recovery.'
      },
      {
        name: 'Mediterranean Grilled Turkey & Pearl Couscous Medley',
        description: (p, c, f) => `${Math.round(190 * p)}g Lean Turkey Breast Cutlets, ${Math.round(150 * c)}g Cooked Whole-Wheat Couscous with diced Persian cucumber, bell peppers, fresh parsley, lemon juice, and ${Math.round(12 * f)}g Crumbled Low-Fat Feta`,
        baseMacros: { calories: 580, protein: 50, carbs: 58, fat: 14 },
        tip: 'Ultra-lean tryptophan-rich protein promoting serotonin regulation and stable blood pressure.'
      }
    ],
    'Snacks': [
      {
        name: 'Sustained-Release Casein / Whey & Rice Cakes',
        description: (p, c, f) => `${Math.round(30 * p)}g Premium Protein Isolate Shake in water/unsweetened almond milk + 3 Organic Brown Rice Cakes spread with ${Math.round(20 * f)}g Natural All-Natural Peanut/Almond Butter and sliced banana coins`,
        baseMacros: { calories: 340, protein: 32, carbs: 32, fat: 10 },
        tip: 'Ideal 60-90 minutes pre-workout or late afternoon to elevate nitrogen retention and exercise capacity.'
      },
      {
        name: 'High-Protein Cottage Cheese & Spiced Apple Bowl',
        description: (p, c, f) => `${Math.round(180 * p)}g Low-Fat 2% Cottage Cheese, 1 Crisp Honeycrisp Apple (diced), dusted with Ceylon Cinnamon, ${Math.round(10 * f)}g Chia Seeds, and a drizzle of raw maple syrup`,
        baseMacros: { calories: 290, protein: 26, carbs: 34, fat: 6 },
        tip: 'Slow-digesting micellar casein aminos that protect skeletal muscle from catabolic degradation.'
      }
    ],
    'Dinner': [
      {
        name: 'Pan-Seared Wild Atlantic Salmon & Roasted Asparagus',
        description: (p, c, _f) => `${Math.round(190 * p)}g Fresh Wild Alaskan Salmon Fillet pan-seared with lemon dill glaze, ${Math.round(150 * c)}g Steamed Baby Gold Potatoes or Jasmine Rice, ${Math.round(140 * c)}g Oven-Roasted Lemon Asparagus Spears with garlic`,
        baseMacros: { calories: 580, protein: 44, carbs: 42, fat: 22 },
        tip: 'Loaded with EPA/DHA Omega-3 fatty acids for neurological anti-inflammatory recovery and deep REM sleep support.'
      },
      {
        name: 'Grilled White Fish / Cod with Cilantro Lime Quinoa',
        description: (p, c, f) => `${Math.round(220 * p)}g Line-Caught Atlantic Cod or Mahi-Mahi Fillet, ${Math.round(170 * c)}g Fluffy Cilantro Lime Quinoa, large garden salad with spinach, cucumber, radishes, and ${Math.round(12 * f)}ml Olive Oil Lemon Vinaigrette`,
        baseMacros: { calories: 510, protein: 46, carbs: 48, fat: 12 },
        tip: 'Light, fast-absorbing lean protein that prevents gastrointestinal heaviness before bedtime.'
      }
    ]
  },
  vegetarian: {
    'Early Morning': [
      {
        name: 'Alkaline Warm Lemon Chia Elixir',
        description: (_p, _c, f) => `500ml Warm Filtered Water with fresh squeezed Meyer Lemon, 1 tbsp Soaked Chia Seeds + ${Math.max(5, Math.round(12 * f))}g Raw Soaked Mamra Almonds`,
        baseMacros: { calories: 125, protein: 4, carbs: 7, fat: 9 },
        tip: 'Kickstarts digestive peristalsis and delivers essential hydrophilic omega-3 alpha-linolenic acids.'
      }
    ],
    'Breakfast': [
      {
        name: 'Paneer / Cottage Scramble & Multigrain Roti',
        description: (p, c, _f) => `${Math.round(140 * p)}g Fresh Low-Fat Paneer / Organic Paneer crumbled with turmeric, cumin, tomatoes & baby spinach, 2 Whole Multigrain Rotis (${Math.round(60 * c)}g), with fresh coriander chutney and sliced cucumber`,
        baseMacros: { calories: 490, protein: 34, carbs: 48, fat: 16 },
        tip: 'Rich in bioavailable calcium, casein peptides, and dietary complex fibers.'
      },
      {
        name: 'Protein-Enriched Rolled Oat & Mixed Berry Porridge',
        description: (p, c, f) => `${Math.round(60 * c)}g Organic Rolled Oats, 1.25 scoops Plant/Whey Protein, ${Math.round(15 * f)}g Chia & Hemp Hearts, 100g Stewed Wild Blueberries & Raspberries`,
        baseMacros: { calories: 470, protein: 38, carbs: 54, fat: 11 },
        tip: 'High beta-glucan content for LDL cholesterol optimization and sustained glycemic stability.'
      }
    ],
    'Lunch': [
      {
        name: 'Rich Lentil & Chickpea Curry with Brown Basmati & Tofu',
        description: (p, c, _f) => `${Math.round(180 * p)}g Spiced Yellow Moong / Chana Dal cooked with ginger & tomatoes, paired with ${Math.round(120 * p)}g Pan-Tossed Firm Organic Tofu cubes, ${Math.round(150 * c)}g Steamed Brown Basmati Rice & Cucumber Kachumber Salad with lime`,
        baseMacros: { calories: 610, protein: 42, carbs: 75, fat: 14 },
        tip: 'Complementary legume and whole grain pairing yielding complete amino acid profile (PDCAAS score 1.0).'
      }
    ],
    'Snacks': [
      {
        name: 'Roasted Edamame, Greek Yogurt & Flaxseed Crunch',
        description: (p, _c, _f) => `${Math.round(180 * p)}g Greek Yogurt / Soya Skyr, 30g Lightly Salted Crispy Roasted Edamame Beans, 1 tbsp Ground Golden Flaxseed, and a hint of honey`,
        baseMacros: { calories: 310, protein: 30, carbs: 24, fat: 9 },
        tip: 'Supplies isoflavones, prebiotic fiber, and long-lasting muscular fullness.'
      }
    ],
    'Dinner': [
      {
        name: 'Tandoori Marinated Paneer & Grilled Veggie Skewers',
        description: (p, c, _f) => `${Math.round(160 * p)}g Low-Fat Spiced Grilled Paneer / Tofu Tikka cubes, grilled bell peppers, onions, mushrooms, ${Math.round(140 * c)}g Cooked Quinoa Pilaf, and mint yogurt dip`,
        baseMacros: { calories: 530, protein: 38, carbs: 46, fat: 18 },
        tip: 'Night-time steady release amino acids with zinc and magnesium for cellular restoration.'
      }
    ]
  },
  vegan: {
    'Early Morning': [
      {
        name: 'Golden Turmeric Ginger Metabolism Shot & Almonds',
        description: (_p, _c, f) => `Warm ginger, turmeric, black pepper and lemon infusion + ${Math.max(5, Math.round(12 * f))}g Soaked Raw Almonds & 1 tbsp Soaked Chia Gel`,
        baseMacros: { calories: 120, protein: 4, carbs: 6, fat: 9 },
        tip: 'Curcumin-activated anti-inflammatory tonic for joint mobility and metabolic activation.'
      }
    ],
    'Breakfast': [
      {
        name: 'High-Protein Tofu Scramble with Avocado & Spelt Toast',
        description: (p, c, f) => `${Math.round(200 * p)}g Crumbled Organic Firm Tofu sautéed with nutritional yeast, spinach, cherry tomatoes & turmeric, 2 slices (${Math.round(70 * c)}g) Sprouted Ezekiel / Spelt bread, and ${Math.round(35 * f)}g Sliced Avocado`,
        baseMacros: { calories: 480, protein: 36, carbs: 44, fat: 16 },
        tip: 'Rich in fortified Vitamin B12, complete plant proteins, and heart-healthy oleic acids.'
      }
    ],
    'Lunch': [
      {
        name: 'Tempeh, Black Bean & Quinoa Fiesta Bowl',
        description: (p, c, f) => `${Math.round(150 * p)}g Pan-Seared Smokey Organic Tempeh, ${Math.round(120 * c)}g Black Beans, ${Math.round(140 * c)}g Tri-Color Quinoa, shredded red cabbage, fresh guacamole (${Math.round(30 * f)}g) and lime cilantro salsa`,
        baseMacros: { calories: 590, protein: 42, carbs: 68, fat: 17 },
        tip: 'Fermented tempeh provides enhanced nutrient bioavailability, gut microflora symbiosis, and high iron.'
      }
    ],
    'Snacks': [
      {
        name: 'Plant Protein Pea/Rice Shake & Spiced Roasted Chickpeas',
        description: (p, c, _f) => `${Math.round(35 * p)}g Organic Pea & Brown Rice Protein Isolate shaken in cold almond milk + ${Math.round(40 * c)}g Air-Popped Paprika Spiced Crunchy Chickpeas`,
        baseMacros: { calories: 330, protein: 34, carbs: 32, fat: 6 },
        tip: 'Optimized branched-chain amino acids (BCAA) leucine, isoleucine, and valine for plant-based athletes.'
      }
    ],
    'Dinner': [
      {
        name: 'Seitan / Edamame Veggie Stir-Fry with Soba Noodles',
        description: (p, c, f) => `${Math.round(140 * p)}g High-Protein Vital Wheat Gluten Seitan / Edamame medley, ${Math.round(130 * c)}g 100% Buckwheat Soba Noodles, stir-fried bok choy, snap peas, bell peppers, with sesame ginger tamari glaze (${Math.round(10 * f)}g sesame oil)`,
        baseMacros: { calories: 540, protein: 48, carbs: 54, fat: 14 },
        tip: 'High-density protein recovery meal rich in routine antioxidants and magnesium.'
      }
    ]
  },
  keto: {
    'Early Morning': [
      {
        name: 'Keto Electrolyte & Apple Cider Vinegar Tonic',
        description: (_p, _c, _f) => `500ml Filtered Water with 2 tbsp Organic Apple Cider Vinegar, 1/4 tsp Potassium Salt & Himalayan Pink Salt, 1 tbsp MCT Oil emulsified`,
        baseMacros: { calories: 125, protein: 0, carbs: 1, fat: 14 },
        tip: 'Prevents keto-flu electrolyte depletion and elevates blood ketone ketone production.'
      }
    ],
    'Breakfast': [
      {
        name: 'Bacon, Pastured Eggs, Spinach & Cheddar Omelet',
        description: (_p, _c, f) => `3 Large Pasture-Raised Eggs + 2 Strips Sugar-Free Smoked Turkey/Pork Bacon, ${Math.round(30 * f)}g Aged Sharp Cheddar, sautéed in 1 tbsp Grass-Fed Butter with baby spinach and mushrooms`,
        baseMacros: { calories: 540, protein: 36, carbs: 3, fat: 42 },
        tip: 'Virtually zero carbohydrates with maximum satiety signaling through peptide YY release.'
      }
    ],
    'Lunch': [
      {
        name: 'Keto Grilled Ribeye / Salmon Caesar Salad with Avocado',
        description: (p, _c, f) => `${Math.round(180 * p)}g Grilled Prime Ribeye Steak or Wild Salmon, crisp Romaine lettuce, 1 whole Haas Avocado (${Math.round(100 * f)}g), shaved Parmesan cheese, and 2 tbsp Real Olive Oil Caesar Dressing`,
        baseMacros: { calories: 680, protein: 46, carbs: 5, fat: 52 },
        tip: 'Nutrient-dense ketogenic fueling maintaining cellular lipolysis and mental clarity.'
      }
    ],
    'Snacks': [
      {
        name: 'Macadamia, Pecan & Keto Collagen Shake',
        description: (p, _c, f) => `${Math.round(25 * p)}g Hydrolyzed Collagen / Zero-Carb Isolate in unsweetened coconut milk + ${Math.round(30 * f)}g Raw Macadamia Nuts & Pecans`,
        baseMacros: { calories: 360, protein: 24, carbs: 3, fat: 30 },
        tip: 'Packed with monounsaturated fats (omega-7 palmitoleic acid) and collagen peptides for joint repair.'
      }
    ],
    'Dinner': [
      {
        name: 'Garlic Herb Butter Salmon & Creamy Cauliflower Mash',
        description: (p, c, f) => `${Math.round(200 * p)}g Pan-Roasted King Salmon in herb garlic butter (${Math.round(20 * f)}g), served with ${Math.round(180 * c)}g Riced Cauliflower whipped with cream cheese and chives, plus roasted zucchini coins`,
        baseMacros: { calories: 620, protein: 42, carbs: 6, fat: 48 },
        tip: 'Anti-inflammatory evening ketosis maintenance supporting deep neuro-regenerative sleep.'
      }
    ]
  },
  mediterranean: {
    'Early Morning': [
      {
        name: 'Lemon Infused Olive Leaf & Walnut Awakening',
        description: (_p, _c, f) => `Warm spring water with lemon slice + ${Math.max(5, Math.round(12 * f))}g Organic Greek Walnuts & 1 tbsp Soaked Chia Seeds`,
        baseMacros: { calories: 120, protein: 4, carbs: 5, fat: 10 },
        tip: 'Cardioprotective oleic and linolenic essential fatty acid booster.'
      }
    ],
    'Breakfast': [
      {
        name: 'Mediterranean Shakshuka with Feta & Crusty Whole Wheat',
        description: (p, c, f) => `3 Free-Range Eggs poached in a rich tomato, roasted bell pepper, garlic and cumin sauce, topped with ${Math.round(30 * f)}g Real Sheep Milk Feta, with 2 slices (${Math.round(60 * c)}g) Whole Grain Sourdough`,
        baseMacros: { calories: 510, protein: 32, carbs: 45, fat: 22 },
        tip: 'Rich in lycopene, vitamin C, carotenoids, and high-quality ovomucoid proteins.'
      }
    ],
    'Lunch': [
      {
        name: 'Greek Souvlaki Chicken Skewers with Farro Salad',
        description: (p, c, f) => `${Math.round(180 * p)}g Lemon-Oregano Marinated Chicken Breast Skewers, ${Math.round(140 * c)}g Ancient Grain Farro, kalamata olives (${Math.round(20 * f)}g), cherry tomatoes, cucumber, tzatziki sauce, and extra virgin olive oil`,
        baseMacros: { calories: 590, protein: 48, carbs: 56, fat: 18 },
        tip: 'Ancient grains deliver sustained low GI glycogen synthesis with bioflavonoids.'
      }
    ],
    'Snacks': [
      {
        name: 'Authentic Greek Yogurt with Honey, Figs & Pistachios',
        description: (p, c, f) => `${Math.round(200 * p)}g 2% Authentic Strained Greek Yogurt, 2 Dried Mission Figs / Fresh Berries, ${Math.round(15 * f)}g Raw Sicilian Pistachios, and a drizzle of raw thyme honey`,
        baseMacros: { calories: 320, protein: 26, carbs: 32, fat: 9 },
        tip: 'Provides bone-strengthening potassium, magnesium, and slow-acting milk proteins.'
      }
    ],
    'Dinner': [
      {
        name: 'Pan-Seared Mediterranean Sea Bass (Branzino) & Roasted Potatoes',
        description: (p, c, _f) => `${Math.round(220 * p)}g Fresh Sea Bass / Branzino Fillet with rosemary, garlic, and capers, ${Math.round(160 * c)}g Rosemary Roasted Fingerling Potatoes, and ${Math.round(120 * c)}g Charred Broccolini drizzled with extra virgin olive oil`,
        baseMacros: { calories: 540, protein: 44, carbs: 48, fat: 16 },
        tip: 'Delicate marine protein high in selenium and iodine for thyroid metabolic harmony.'
      }
    ]
  },
  pescatarian: {
    'Early Morning': [
      {
        name: 'Clean Lemon Chlorophyll Hydration & Almonds',
        description: (_p, _c, f) => `500ml Purified Water with organic liquid chlorophyll and fresh lemon juice + ${Math.max(5, Math.round(12 * f))}g Soaked Raw Almonds`,
        baseMacros: { calories: 110, protein: 4, carbs: 5, fat: 9 },
        tip: 'Internal cellular deodorizer and gentle alkalizing wake-up routine.'
      }
    ],
    'Breakfast': [
      {
        name: 'Smoked Wild Salmon, Poached Eggs & Rye Avocado Toast',
        description: (p, c, f) => `${Math.round(90 * p)}g Wild Alaskan Smoked Salmon (Lox), 2 Pasture-Raised Poached Eggs, 2 slices (${Math.round(65 * c)}g) Dark Artisanal Rye Bread, with ${Math.round(35 * f)}g Smashed Avocado and capers`,
        baseMacros: { calories: 520, protein: 40, carbs: 42, fat: 20 },
        tip: 'Exceptional cognitive enhancer with DHA, vitamin D3, and soluble rye beta-glucans.'
      }
    ],
    'Lunch': [
      {
        name: 'Seared Ahi Tuna Bowl with Edamame & Brown Jasmine Rice',
        description: (p, c, _f) => `${Math.round(170 * p)}g Sesame-Crusted Seared Yellowfin Ahi Tuna steak, ${Math.round(150 * c)}g Steamed Brown Jasmine Rice, ${Math.round(80 * p)}g Steamed Shelled Edamame, sliced nori seaweed, pickled ginger, and ginger ponzu glaze`,
        baseMacros: { calories: 580, protein: 52, carbs: 58, fat: 12 },
        tip: 'Ultra-pure lean protein with minimal saturated fat and maximal athletic bioavailability.'
      }
    ],
    'Snacks': [
      {
        name: 'Organic Greek Yogurt Parfait with Hemp Seeds & Mango',
        description: (p, c, f) => `${Math.round(200 * p)}g Plain Strained Greek Yogurt / Coconut Protein Yogurt, ${Math.round(15 * f)}g Shelled Hemp Hearts, ${Math.round(75 * c)}g Diced Fresh Mango`,
        baseMacros: { calories: 310, protein: 28, carbs: 28, fat: 8 },
        tip: 'Perfect balance of short-chain and medium-chain fatty acids with complete plant-dairy protein.'
      }
    ],
    'Dinner': [
      {
        name: 'Grilled Tiger Prawns / Shrimp with Sweet Potato & Asparagus',
        description: (p, c, _f) => `${Math.round(220 * p)}g Jumbo Wild Tiger Prawns seasoned with garlic, smoked paprika & lemon, ${Math.round(180 * c)}g Baked Sweet Potato with cinnamon, ${Math.round(130 * c)}g Grilled Asparagus drizzled with 1 tbsp Extra Virgin Olive Oil`,
        baseMacros: { calories: 510, protein: 46, carbs: 52, fat: 12 },
        tip: 'Loaded with astaxanthin antioxidant and zinc for rapid muscular fiber reconstruction.'
      }
    ]
  }
}

// ── AI Algorithm Calculation Functions ────────────────────────────────

export function calculateMacros({
  weightKg,
  heightCm,
  age,
  gender,
  fitnessGoal,
  activityLevel,
  dietPreference
}: {
  weightKg: number
  heightCm: number
  age: number
  gender: Gender
  fitnessGoal: FitnessGoal
  activityLevel: ActivityLevel
  dietPreference: DietPreference
}): MacroCalculation {
  // 1. Basal Metabolic Rate (Mifflin-St Jeor)
  let bmr: number
  if (gender === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5
  } else if (gender === 'female') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 78 // Neutral
  }

  // 2. Activity Multiplier
  const activityMultipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9,
  }
  const activityFactor = activityMultipliers[activityLevel] || 1.55
  const tdee = Math.round(bmr * activityFactor)

  // 3. Goal Adjustment & Calorie Target
  let calorieDelta = 0
  let proteinMultiplier = 2.0 // g per kg of bodyweight
  let fatPercentage = 0.25   // % of total calories

  if (fitnessGoal === 'fat_loss') {
    // 20-22% Caloric Deficit
    calorieDelta = -Math.round(tdee * 0.22)
    proteinMultiplier = 2.2 // High protein to preserve muscle in deficit
    fatPercentage = 0.23    // Moderate-low fat
  } else if (fitnessGoal === 'muscle_gain') {
    // 12-15% Caloric Surplus
    calorieDelta = Math.round(tdee * 0.14)
    proteinMultiplier = 2.0 // Optimal protein for hypertrophy
    fatPercentage = 0.25    // Balanced healthy fats
  } else {
    // Maintenance / Body Recomposition
    calorieDelta = 0
    proteinMultiplier = 1.9
    fatPercentage = 0.26
  }

  // Special adjustments for Keto
  if (dietPreference === 'keto') {
    fatPercentage = 0.70
  }

  const targetCalories = Math.max(1200, Math.round(tdee + calorieDelta))

  // 4. Macronutrient Distribution
  let proteinGrams: number
  let fatGrams: number
  let carbsGrams: number

  if (dietPreference === 'keto') {
    // Keto: 70% Fat, 25% Protein, 5% Carbs (<30-50g net)
    const fatCal = targetCalories * 0.70
    const protCal = targetCalories * 0.25
    const carbCal = targetCalories * 0.05
    fatGrams = Math.round(fatCal / 9)
    proteinGrams = Math.round(protCal / 4)
    carbsGrams = Math.round(carbCal / 4)
  } else {
    // Standard / High Protein Distribution
    proteinGrams = Math.round(weightKg * proteinMultiplier)
    const proteinCal = proteinGrams * 4

    const fatCal = targetCalories * fatPercentage
    fatGrams = Math.round(fatCal / 9)

    const remainingCal = Math.max(0, targetCalories - proteinCal - fatCal)
    carbsGrams = Math.round(remainingCal / 4)
  }

  const proteinCalories = proteinGrams * 4
  const carbsCalories = carbsGrams * 4
  const fatCalories = fatGrams * 9

  const actualTotalCal = proteinCalories + carbsCalories + fatCalories
  const proteinPercent = Math.round((proteinCalories / actualTotalCal) * 100)
  const carbsPercent = Math.round((carbsCalories / actualTotalCal) * 100)
  const fatPercent = Math.round((fatCalories / actualTotalCal) * 100)

  return {
    bmr: Math.round(bmr),
    tdee,
    targetCalories,
    proteinGrams,
    proteinCalories,
    carbsGrams,
    carbsCalories,
    fatGrams,
    fatCalories,
    proteinPercent,
    carbsPercent,
    fatPercent,
    calorieDelta,
  }
}

// Generates 5 meals that dynamically sum up exactly to target macros
export function generateMealsFromMacros(
  macros: MacroCalculation,
  preference: DietPreference
): MealItem[] {
  const mealSlots = ['Early Morning', 'Breakfast', 'Lunch', 'Snacks', 'Dinner']
  
  // Proportions of daily intake across 5 meals
  const mealRatios: Record<string, { cal: number; p: number; c: number; f: number }> = {
    'Early Morning': { cal: 0.06, p: 0.04, c: 0.04, f: 0.12 },
    'Breakfast':     { cal: 0.28, p: 0.28, c: 0.29, f: 0.25 },
    'Lunch':         { cal: 0.34, p: 0.34, c: 0.35, f: 0.28 },
    'Snacks':        { cal: 0.12, p: 0.12, c: 0.12, f: 0.12 },
    'Dinner':        { cal: 0.20, p: 0.22, c: 0.20, f: 0.23 },
  }

  const prefTemplates = MEAL_TEMPLATES[preference] || MEAL_TEMPLATES.standard

  const meals: MealItem[] = mealSlots.map((slot) => {
    const ratio = mealRatios[slot] || { cal: 0.2, p: 0.2, c: 0.2, f: 0.2 }
    const targetMealCal = Math.round(macros.targetCalories * ratio.cal)
    const targetMealProt = Math.round(macros.proteinGrams * ratio.p)
    const targetMealCarb = Math.round(macros.carbsGrams * ratio.c)
    const targetMealFat = Math.round(macros.fatGrams * ratio.f)

    const templates = prefTemplates[slot] || MEAL_TEMPLATES.standard[slot] || []
    const template = templates[Math.floor(Math.random() * templates.length)] || templates[0]

    const pScale = targetMealProt > 0 && template.baseMacros.protein > 0 ? targetMealProt / template.baseMacros.protein : 1
    const cScale = targetMealCarb > 0 && template.baseMacros.carbs > 0 ? targetMealCarb / template.baseMacros.carbs : 1
    const fScale = targetMealFat > 0 && template.baseMacros.fat > 0 ? targetMealFat / template.baseMacros.fat : 1

    const foodText = template ? template.description(pScale, cScale, fScale) : `${slot} balanced meal`
    const noteText = template ? template.tip : 'Drink adequate water and maintain mindful eating pace.'

    return {
      id: `${slot}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      meal_time: slot,
      food_items: foodText,
      calories: targetMealCal,
      protein_g: targetMealProt,
      carbs_g: targetMealCarb,
      fat_g: targetMealFat,
      notes: noteText,
    }
  })

  // Normalize rounding differences so total equals exactly target macros
  const totalCal = meals.reduce((a, b) => a + b.calories, 0)
  const diffCal = macros.targetCalories - totalCal
  if (diffCal !== 0 && meals[2]) {
    meals[2].calories += diffCal // balance on Lunch
  }

  const totalProt = meals.reduce((a, b) => a + b.protein_g, 0)
  const diffProt = macros.proteinGrams - totalProt
  if (diffProt !== 0 && meals[2]) {
    meals[2].protein_g += diffProt
  }

  const totalCarb = meals.reduce((a, b) => a + b.carbs_g, 0)
  const diffCarb = macros.carbsGrams - totalCarb
  if (diffCarb !== 0 && meals[2]) {
    meals[2].carbs_g += diffCarb
  }

  const totalFat = meals.reduce((a, b) => a + b.fat_g, 0)
  const diffFat = macros.fatGrams - totalFat
  if (diffFat !== 0 && meals[2]) {
    meals[2].fat_g += diffFat
  }

  return meals
}

// ── Main Page Component ───────────────────────────────────────────────

export default function DietGeneratorPage() {
  const supabase = useMemo(() => createClient(), [])
  const [, startTransition] = useTransition()

  // Authenticated trainer state
  const [trainerUser, setTrainerUser] = useState<any>(null)
  const [trainerProfile, setTrainerProfile] = useState<any>(null)

  // Members & Requests state
  const [members, setMembers] = useState<MemberProfile[]>([])
  const [pendingRequests, setPendingRequests] = useState<MemberRequest[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState<string>('')
  const [searchMemberQuery, setSearchMemberQuery] = useState('')
  const [loadingMembers, setLoadingMembers] = useState(true)

  // Biometrics & AI inputs
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric')
  const [weight, setWeight] = useState<number>(75) // kg or lbs
  const [height, setHeight] = useState<number>(175) // cm or inches
  const [age, setAge] = useState<number>(26)
  const [gender, setGender] = useState<Gender>('male')
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>('muscle_gain')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderately_active')
  const [dietPreference, setDietPreference] = useState<DietPreference>('standard')

  // Generated Plan & Meals
  const [meals, setMeals] = useState<MealItem[]>([])
  const [existingPlanCount, setExistingPlanCount] = useState<number>(0)
  const [loadingExistingPlan, setLoadingExistingPlan] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  // Computed Macros
  const weightInKg = useMemo(() => {
    return unitSystem === 'metric' ? weight : Math.round(weight * 0.453592)
  }, [weight, unitSystem])

  const heightInCm = useMemo(() => {
    return unitSystem === 'metric' ? height : Math.round(height * 2.54)
  }, [height, unitSystem])

  const computedMacros = useMemo(() => {
    return calculateMacros({
      weightKg: Math.max(30, weightInKg || 70),
      heightCm: Math.max(100, heightInCm || 170),
      age: Math.max(14, age || 25),
      gender,
      fitnessGoal,
      activityLevel,
      dietPreference,
    })
  }, [weightInKg, heightInCm, age, gender, fitnessGoal, activityLevel, dietPreference])

  // Real-time Sum of Scheduled Meals
  const scheduledTotals = useMemo(() => {
    return meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + (Number(meal.calories) || 0),
        protein_g: acc.protein_g + (Number(meal.protein_g) || 0),
        carbs_g: acc.carbs_g + (Number(meal.carbs_g) || 0),
        fat_g: acc.fat_g + (Number(meal.fat_g) || 0),
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
    )
  }, [meals])

  // Selected Member Object
  const selectedMember = useMemo(() => {
    return members.find((m) => m.id === selectedMemberId) || null
  }, [members, selectedMemberId])

  // Member's active request if any
  const memberActiveRequest = useMemo(() => {
    return pendingRequests.find((r) => r.member_id === selectedMemberId) || null
  }, [pendingRequests, selectedMemberId])

  // Filtered members list
  const filteredMembers = useMemo(() => {
    if (!searchMemberQuery.trim()) return members
    const q = searchMemberQuery.toLowerCase()
    return members.filter(
      (m) =>
        m.full_name?.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.user_id_code?.toLowerCase().includes(q)
    )
  }, [members, searchMemberQuery])

  // ── Initial Load: Trainer info, members, and requests ─────────────────
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingMembers(true)
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return
        setTrainerUser(user)

        // Trainer profile
        const { data: profile } = (await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()) as any
        setTrainerProfile(profile)

        // Load all members
        const { data: memberRows, error: memberErr } = (await supabase
          .from('profiles')
          .select('id, email, full_name, user_id_code, avatar_url, phone')
          .eq('role', 'member')
          .order('full_name', { ascending: true })) as any

        if (!memberErr && memberRows) {
          setMembers(memberRows)
          if (memberRows.length > 0) {
            setSelectedMemberId(prev => prev || memberRows[0].id)
          }
        }

        // Load pending requests for this trainer or general requests
        const { data: requestRows } = (await supabase
          .from('requests')
          .select('*')
          .in('request_type', ['diet', 'both'])
          .neq('status', 'completed')
          .order('created_at', { ascending: false })) as any

        if (requestRows) {
          setPendingRequests(requestRows)
        }
      } catch (err: any) {
        console.error('Error loading diet generator data:', err)
        toast.error('Failed to initialize trainer portal')
      } finally {
        setLoadingMembers(false)
      }
    }
    loadData()
  }, [supabase])

  // ── Check if selected member already has diet plans ───────────────────
  useEffect(() => {
    if (!selectedMemberId) return
    async function checkExistingPlan() {
      setLoadingExistingPlan(true)
      const { data, count } = (await supabase
        .from('diet_plans')
        .select('*', { count: 'exact' })
        .eq('member_id', selectedMemberId)) as any

      setExistingPlanCount(count || data?.length || 0)
      setLoadingExistingPlan(false)
    }
    checkExistingPlan()
  }, [selectedMemberId, supabase])

  // ── Trigger Initial AI Generation Once Parameters Ready ───────────────
  useEffect(() => {
    if (meals.length === 0 && computedMacros.targetCalories > 0) {
      const generated = generateMealsFromMacros(computedMacros, dietPreference)
      setMeals(generated)
    }
  }, [computedMacros, dietPreference, meals.length])

  // ── Load Existing Member Plan from DB ─────────────────────────────────
  async function handleLoadExistingPlan() {
    if (!selectedMemberId) return
    setLoadingExistingPlan(true)
    try {
      const { data, error } = (await supabase
        .from('diet_plans')
        .select('*')
        .eq('member_id', selectedMemberId)
        .order('created_at', { ascending: true })) as any

      if (error) throw error
      if (!data || data.length === 0) {
        toast.info('No existing diet plan found for this member')
        return
      }

      const formattedMeals: MealItem[] = data.map((d: any) => ({
        id: d.id,
        meal_time: d.meal_time,
        food_items: d.food_items,
        calories: d.calories || 0,
        protein_g: d.protein_g || 0,
        carbs_g: d.carbs_g || 0,
        fat_g: d.fat_g || 0,
        notes: d.notes || '',
      }))

      setMeals(formattedMeals)
      toast.success(`Loaded ${data.length} meals from member profile!`)
    } catch (err: any) {
      toast.error('Failed to load existing plan: ' + err.message)
    } finally {
      setLoadingExistingPlan(false)
    }
  }

  // ── Full AI Generation Trigger ────────────────────────────────────────
  function handleGenerateAiPlan() {
    setIsGenerating(true)
    startTransition(() => {
      setTimeout(() => {
        const newMeals = generateMealsFromMacros(computedMacros, dietPreference)
        setMeals(newMeals)
        setIsGenerating(false)
        toast.success('AI Diet Schedule successfully generated! ⚡', {
          description: `Target: ${computedMacros.targetCalories} kcal with 5 balanced meal phases.`,
        })
      }, 450)
    })
  }

  // ── Regenerate / Swap Single Meal ─────────────────────────────────────
  function handleRegenerateSingleMeal(index: number) {
    const targetMeal = meals[index]
    if (!targetMeal) return

    const prefTemplates = MEAL_TEMPLATES[dietPreference] || MEAL_TEMPLATES.standard
    const slotTemplates = prefTemplates[targetMeal.meal_time] || MEAL_TEMPLATES.standard[targetMeal.meal_time] || []

    if (slotTemplates.length === 0) {
      toast.info('No alternative templates available for this meal time')
      return
    }

    // Pick an alternative template
    const currentText = targetMeal.food_items
    const alternativeTemplates = slotTemplates.filter(t => !currentText.includes(t.name))
    const chosenTemplate = alternativeTemplates.length > 0
      ? alternativeTemplates[Math.floor(Math.random() * alternativeTemplates.length)]
      : slotTemplates[Math.floor(Math.random() * slotTemplates.length)]

    const pScale = targetMeal.protein_g > 0 && chosenTemplate.baseMacros.protein > 0
      ? targetMeal.protein_g / chosenTemplate.baseMacros.protein
      : 1
    const cScale = targetMeal.carbs_g > 0 && chosenTemplate.baseMacros.carbs > 0
      ? targetMeal.carbs_g / chosenTemplate.baseMacros.carbs
      : 1
    const fScale = targetMeal.fat_g > 0 && chosenTemplate.baseMacros.fat > 0
      ? targetMeal.fat_g / chosenTemplate.baseMacros.fat
      : 1

    const updated = [...meals]
    updated[index] = {
      ...updated[index],
      food_items: chosenTemplate.description(pScale, cScale, fScale),
      notes: chosenTemplate.tip,
    }
    setMeals(updated)
    toast.success(`Swapped ${targetMeal.meal_time} with new AI recipe option!`)
  }

  // ── Meal Editing Helpers ──────────────────────────────────────────────
  function handleUpdateMeal(index: number, field: keyof MealItem, value: any) {
    const updated = [...meals]
    updated[index] = {
      ...updated[index],
      [field]: field === 'calories' || field === 'protein_g' || field === 'carbs_g' || field === 'fat_g'
        ? Number(value) || 0
        : value,
    }
    setMeals(updated)
  }

  function handleAddCustomMeal() {
    const newMeal: MealItem = {
      id: `custom-${Date.now()}`,
      meal_time: 'Post-Workout Snack',
      food_items: '30g Whey Isolate shaken with 300ml cold water + 1 Large Sliced Banana',
      calories: 230,
      protein_g: 26,
      carbs_g: 28,
      fat_g: 2,
      notes: 'Consume within 45 minutes of completing intense resistance training.',
    }
    setMeals([...meals, newMeal])
    toast.success('Added new custom meal slot')
  }

  function handleDeleteMeal(index: number) {
    if (meals.length <= 1) {
      toast.error('Plan must contain at least 1 meal phase')
      return
    }
    const updated = meals.filter((_, i) => i !== index)
    setMeals(updated)
    toast.info('Meal phase removed')
  }

  // ── Auto Rebalance Proportionally ─────────────────────────────────────
  function handleAutoRebalance() {
    if (meals.length === 0) return
    const rebalanced = generateMealsFromMacros(computedMacros, dietPreference)
    setMeals(rebalanced)
    toast.success('Meals re-synchronized to target macronutrients!')
  }

  // ── Copy Plan to Clipboard ────────────────────────────────────────────
  function handleCopyPlan() {
    const text = `🥗 VORTEX FITNESS CLUB — PERSONALIZED DIET CHART
Athlete: ${selectedMember?.full_name || 'Member'} (${selectedMember?.email || ''})
Trainer: ${trainerProfile?.full_name || trainerUser?.email || 'Vortex Trainer'}
Goal: ${fitnessGoal.replace('_', ' ').toUpperCase()} | Target: ${computedMacros.targetCalories} kcal (P: ${computedMacros.proteinGrams}g | C: ${computedMacros.carbsGrams}g | F: ${computedMacros.fatGrams}g)
--------------------------------------------------
${meals.map((m, i) => `[${i + 1}] ${m.meal_time.toUpperCase()} (${m.calories} kcal | P:${m.protein_g}g C:${m.carbs_g}g F:${m.fat_g}g)
• Food: ${m.food_items}
• Coach Tip: ${m.notes}`).join('\n\n')}
--------------------------------------------------
Stay hydrated and hit your daily macros! 🔥`

    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Diet plan copied to clipboard!')
    setTimeout(() => setCopied(false), 2500)
  }

  // ── Save and Publish to Supabase diet_plans table ─────────────────────
  async function handleSaveAndPublish() {
    if (!selectedMemberId) {
      toast.error('Please select a member first')
      return
    }
    if (meals.length === 0) {
      toast.error('Cannot save an empty diet plan')
      return
    }
    if (!trainerUser) {
      toast.error('You must be signed in as a trainer to publish plans')
      return
    }

    setIsSaving(true)
    try {
      // 1. Delete previous diet_plans for this member to avoid duplicate stale records
      const { error: delErr } = await supabase
        .from('diet_plans')
        .delete()
        .eq('member_id', selectedMemberId)

      if (delErr) {
        console.warn('Diet delete warning (continuing insert):', delErr.message)
      }

      // 2. Insert all meal rows
      const insertRows = meals.map((m) => ({
        member_id: selectedMemberId,
        trainer_id: trainerUser.id,
        meal_time: m.meal_time,
        food_items: m.food_items,
        calories: Number(m.calories) || 0,
        protein_g: Number(m.protein_g) || 0,
        carbs_g: Number(m.carbs_g) || 0,
        fat_g: Number(m.fat_g) || 0,
        notes: m.notes || null,
      }))

      const { error: insErr } = await supabase.from('diet_plans').insert(insertRows)
      if (insErr) throw insErr

      // 3. Mark pending request completed if member had an active diet request
      if (memberActiveRequest) {
        await supabase
          .from('requests')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', memberActiveRequest.id)

        setPendingRequests(pendingRequests.filter((r) => r.id !== memberActiveRequest.id))
      }

      // 4. Dispatch Automated SMTP Notification Email
      if (selectedMember?.email) {
        try {
          await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'diet',
              to: [selectedMember.email],
              payload: {
                memberName: selectedMember.full_name || 'Athlete',
                trainerName: trainerProfile?.full_name || 'Your Trainer',
                mealCount: meals.length,
                totalCalories: scheduledTotals.calories || computedMacros.targetCalories,
                protein_g: scheduledTotals.protein_g || computedMacros.proteinGrams,
                carbs_g: scheduledTotals.carbs_g || computedMacros.carbsGrams,
                fat_g: scheduledTotals.fat_g || computedMacros.fatGrams,
                fitnessGoal,
                dietPreference,
                notes: memberActiveRequest?.notes || undefined,
                meals: meals.map((m) => ({
                  meal_time: m.meal_time,
                  food_items: m.food_items,
                  calories: m.calories,
                  protein_g: m.protein_g,
                  carbs_g: m.carbs_g,
                  fat_g: m.fat_g,
                })),
              },
            }),
          })
          toast.success(`Diet plan assigned & email notification dispatched to ${selectedMember.email}!`)
        } catch (emailErr) {
          console.warn('Notification email dispatch notice:', emailErr)
          toast.success('Diet plan saved successfully to member profile!')
        }
      } else {
        toast.success('Diet plan saved successfully to member profile!')
      }

      setExistingPlanCount(meals.length)
    } catch (err: any) {
      console.error('Save diet plan error:', err)
      toast.error('Failed to publish diet plan: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-600/20 text-red-400 border border-red-500/30">
              Trainer Portal
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Sparkles size={11} /> AI Engine Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <ChefHat className="text-red-500" size={32} />
            AI Macronutrient Diet Generator
          </h1>
          <p className="text-zinc-400 text-sm mt-1 max-w-2xl">
            Precision metabolic calculation & automated 5-phase meal schedule generator tailored to athlete goals, activity tier, and dietary preferences.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={handleCopyPlan}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-zinc-800 flex items-center gap-2 shadow-sm"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy Summary'}
          </button>

          <button
            onClick={handleSaveAndPublish}
            disabled={isSaving || !selectedMemberId || meals.length === 0}
            className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-zinc-800 disabled:to-zinc-800 text-white disabled:text-zinc-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_25px_rgba(220,38,38,0.35)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] flex items-center gap-2"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={15} />
            )}
            Save & Publish Plan
          </button>
        </div>
      </div>

      {/* ── Pending Requests Quick Selector Banner ─────────────────── */}
      {pendingRequests.length > 0 && (
        <div className="bg-gradient-to-r from-red-950/40 via-zinc-900 to-zinc-950 border border-red-800/40 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="text-red-500" size={18} />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Pending Member Plan Requests ({pendingRequests.length})
            </h3>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {pendingRequests.map((req) => {
              const member = members.find((m) => m.id === req.member_id)
              const isSelected = selectedMemberId === req.member_id
              return (
                <button
                  key={req.id}
                  onClick={() => {
                    setSelectedMemberId(req.member_id)
                    toast.info(`Selected ${member?.full_name || 'Member'}'s request`, {
                      description: req.notes ? `Note: "${req.notes}"` : 'Type: ' + req.request_type,
                    })
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all border ${
                    isSelected
                      ? 'bg-red-600 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                      : 'bg-zinc-900/90 text-zinc-300 border-zinc-700/60 hover:border-red-500/50 hover:bg-zinc-800'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  <span className="font-bold">{member?.full_name || 'Member'}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-red-300 uppercase font-mono">
                    {req.request_type}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Main 2-Column Grid Layout ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── Left Column: Inputs & Biometrics (4 Cols) ─────────────── */}
        <div className="lg:col-span-4 space-y-6">
          {/* Member Card Selector */}
          <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <User size={15} className="text-red-500" />
                1. Select Member
              </h2>
              {existingPlanCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {existingPlanCount} Meals Active
                </span>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search member by name, email, or code..."
                value={searchMemberQuery}
                onChange={(e) => setSearchMemberQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            {/* Member Dropdown / List */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {loadingMembers ? (
                <div className="py-6 text-center text-xs text-zinc-500">Loading members...</div>
              ) : filteredMembers.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-500">No members found</div>
              ) : (
                filteredMembers.map((m) => {
                  const isSelected = selectedMemberId === m.id
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMemberId(m.id)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-red-600/15 border border-red-500/50 text-white'
                          : 'bg-zinc-900/50 hover:bg-zinc-900 text-zinc-400 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-600 to-zinc-800 flex items-center justify-center text-[11px] font-black text-white shrink-0">
                          {(m.full_name || m.email)[0]?.toUpperCase()}
                        </div>
                        <div className="truncate">
                          <p className={`font-bold truncate ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                            {m.full_name || 'Unnamed Athlete'}
                          </p>
                          <p className="text-[10px] text-zinc-500 truncate">{m.email}</p>
                        </div>
                      </div>
                      {m.user_id_code && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded shrink-0 ml-2">
                          {m.user_id_code}
                        </span>
                      )}
                    </button>
                  )
                })
              )}
            </div>

            {/* Selected Member Details & Actions */}
            {selectedMember && (
              <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                {memberActiveRequest && memberActiveRequest.notes && (
                  <div className="p-2.5 rounded-xl bg-red-950/20 border border-red-800/30 text-xs">
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block mb-1">
                      Member&apos;s Request Note:
                    </span>
                    <p className="text-zinc-300 italic text-[11px] leading-relaxed">
                      &quot;{memberActiveRequest.notes}&quot;
                    </p>
                  </div>
                )}

                {existingPlanCount > 0 && (
                  <button
                    onClick={handleLoadExistingPlan}
                    disabled={loadingExistingPlan}
                    className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    {loadingExistingPlan ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <RefreshCw size={12} />
                    )}
                    Load Existing Member Plan ({existingPlanCount} meals)
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Biometrics & Parameter Form */}
          <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-5 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Calculator size={15} className="text-red-500" />
                2. Athlete Biometrics
              </h2>
              {/* Metric/Imperial Toggle */}
              <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setUnitSystem('metric')}
                  className={`px-2 py-0.5 text-[10px] font-black uppercase rounded ${
                    unitSystem === 'metric' ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Metric (kg/cm)
                </button>
                <button
                  type="button"
                  onClick={() => setUnitSystem('imperial')}
                  className={`px-2 py-0.5 text-[10px] font-black uppercase rounded ${
                    unitSystem === 'imperial' ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Imperial (lbs/in)
                </button>
              </div>
            </div>

            {/* Weight & Height Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1 flex items-center justify-between">
                  <span>Weight</span>
                  <span className="text-red-400 font-mono text-[10px]">{unitSystem === 'metric' ? 'kg' : 'lbs'}</span>
                </label>
                <input
                  type="number"
                  min={30}
                  max={300}
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1 flex items-center justify-between">
                  <span>Height</span>
                  <span className="text-red-400 font-mono text-[10px]">{unitSystem === 'metric' ? 'cm' : 'in'}</span>
                </label>
                <input
                  type="number"
                  min={100}
                  max={250}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Age & Gender Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  Age (years)
                </label>
                <input
                  type="number"
                  min={14}
                  max={90}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  Biological Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-red-500"
                >
                  <option value="male">Male (+5 BMR)</option>
                  <option value="female">Female (-161 BMR)</option>
                  <option value="other">Neutral / Adaptive</option>
                </select>
              </div>
            </div>

            {/* Fitness Goal (3 Cards) */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Primary Fitness Goal
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    id: 'fat_loss',
                    label: 'Fat Loss',
                    icon: TrendingDown,
                    sub: '-22% Deficit',
                    color: 'text-amber-400',
                  },
                  {
                    id: 'maintenance',
                    label: 'Maintain',
                    icon: Scale,
                    sub: 'TDEE Neutral',
                    color: 'text-blue-400',
                  },
                  {
                    id: 'muscle_gain',
                    label: 'Bulking',
                    icon: TrendingUp,
                    sub: '+14% Surplus',
                    color: 'text-emerald-400',
                  },
                ].map((g) => {
                  const Icon = g.icon
                  const isSelected = fitnessGoal === g.id
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setFitnessGoal(g.id as FitnessGoal)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'bg-red-600/20 border-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <Icon size={16} className={`mx-auto mb-1 ${g.color}`} />
                      <p className="text-xs font-bold leading-tight">{g.label}</p>
                      <p className="text-[9px] text-zinc-500 mt-0.5">{g.sub}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Activity Level */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Weekly Activity Level
              </label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-red-500"
              >
                <option value="sedentary">Sedentary (Desk Job / 1.2x TDEE)</option>
                <option value="lightly_active">Lightly Active (1-3 gym sessions / 1.375x TDEE)</option>
                <option value="moderately_active">Moderately Active (3-5 intense sessions / 1.55x TDEE)</option>
                <option value="very_active">Very Active (6-7 intense sessions / 1.725x TDEE)</option>
                <option value="extremely_active">Extremely Active (Athletic / 2x a day / 1.9x TDEE)</option>
              </select>
            </div>

            {/* Dietary Preference */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Dietary Preference / Cuisine
              </label>
              <select
                value={dietPreference}
                onChange={(e) => setDietPreference(e.target.value as DietPreference)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-red-500 capitalize"
              >
                <option value="standard">Standard / High Protein Omnivore</option>
                <option value="vegetarian">Vegetarian (Lacto-Ovo / Paneer)</option>
                <option value="vegan">Vegan / 100% Plant-Based</option>
                <option value="keto">Keto / Low-Carb High-Fat</option>
                <option value="mediterranean">Mediterranean Heart-Healthy</option>
                <option value="pescatarian">Pescatarian (Fish & Seafood)</option>
              </select>
            </div>

            {/* AI Generate Button */}
            <button
              type="button"
              onClick={handleGenerateAiPlan}
              disabled={isGenerating}
              className="w-full py-3.5 bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              {isGenerating ? 'Computing AI Metabolic Algorithms...' : 'Generate 5-Phase Diet Plan'}
            </button>
          </div>
        </div>

        {/* ── Right Column: AI Macros & Meal Schedule (8 Cols) ──────── */}
        <div className="lg:col-span-8 space-y-6">
          {/* ── Macronutrient Metrics Dashboard ─────────────────────── */}
          <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-4">
              <div>
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                  Metabolic Analysis & TDEE Target
                </p>
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
                  <HeartPulse className="text-red-500" size={20} />
                  Target Macronutrient Split
                </h2>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="px-3 py-1 bg-zinc-900 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 font-mono text-[10px]">BMR: </span>
                  <span className="text-white font-bold">{computedMacros.bmr}</span>
                  <span className="text-zinc-500 text-[10px]"> kcal</span>
                </div>
                <div className="px-3 py-1 bg-zinc-900 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 font-mono text-[10px]">TDEE: </span>
                  <span className="text-white font-bold">{computedMacros.tdee}</span>
                  <span className="text-zinc-500 text-[10px]"> kcal</span>
                </div>
              </div>
            </div>

            {/* Macro 4-Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {/* Calories */}
              <div className="bg-gradient-to-br from-red-950/40 to-zinc-900 border border-red-800/40 rounded-xl p-4">
                <div className="flex items-center justify-between text-red-400 mb-1">
                  <span className="text-[11px] font-black uppercase tracking-wider">Calories</span>
                  <Flame size={15} />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {computedMacros.targetCalories}
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                  {computedMacros.calorieDelta > 0
                    ? `+${computedMacros.calorieDelta} kcal surplus`
                    : computedMacros.calorieDelta < 0
                    ? `${computedMacros.calorieDelta} kcal deficit`
                    : 'Maintenance energy'}
                </p>
              </div>

              {/* Protein */}
              <div className="bg-gradient-to-br from-blue-950/40 to-zinc-900 border border-blue-800/40 rounded-xl p-4">
                <div className="flex items-center justify-between text-blue-400 mb-1">
                  <span className="text-[11px] font-black uppercase tracking-wider">Protein</span>
                  <Dumbbell size={15} />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {computedMacros.proteinGrams}
                  <span className="text-xs text-blue-400 font-normal ml-1">g</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                  {computedMacros.proteinCalories} kcal ({computedMacros.proteinPercent}%)
                </p>
              </div>

              {/* Carbs */}
              <div className="bg-gradient-to-br from-emerald-950/40 to-zinc-900 border border-emerald-800/40 rounded-xl p-4">
                <div className="flex items-center justify-between text-emerald-400 mb-1">
                  <span className="text-[11px] font-black uppercase tracking-wider">Carbs</span>
                  <Activity size={15} />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {computedMacros.carbsGrams}
                  <span className="text-xs text-emerald-400 font-normal ml-1">g</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                  {computedMacros.carbsCalories} kcal ({computedMacros.carbsPercent}%)
                </p>
              </div>

              {/* Fats */}
              <div className="bg-gradient-to-br from-amber-950/40 to-zinc-900 border border-amber-800/40 rounded-xl p-4">
                <div className="flex items-center justify-between text-amber-400 mb-1">
                  <span className="text-[11px] font-black uppercase tracking-wider">Fats</span>
                  <Layers size={15} />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {computedMacros.fatGrams}
                  <span className="text-xs text-amber-400 font-normal ml-1">g</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                  {computedMacros.fatCalories} kcal ({computedMacros.fatPercent}%)
                </p>
              </div>
            </div>

            {/* Macro Ratio Visual Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Macronutrient Ratio Breakdown</span>
                <span className="font-mono text-zinc-500 text-[10px]">
                  P: {computedMacros.proteinPercent}% | C: {computedMacros.carbsPercent}% | F: {computedMacros.fatPercent}%
                </span>
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden flex bg-zinc-900">
                <div
                  style={{ width: `${computedMacros.proteinPercent}%` }}
                  className="bg-blue-500 transition-all duration-500"
                  title={`Protein ${computedMacros.proteinPercent}%`}
                />
                <div
                  style={{ width: `${computedMacros.carbsPercent}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                  title={`Carbs ${computedMacros.carbsPercent}%`}
                />
                <div
                  style={{ width: `${computedMacros.fatPercent}%` }}
                  className="bg-amber-500 transition-all duration-500"
                  title={`Fats ${computedMacros.fatPercent}%`}
                />
              </div>
            </div>

            {/* Live Scheduled Total vs. Target Reconciliation */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <FileCheck2 size={16} className="text-red-400 shrink-0" />
                <div>
                  <span className="text-zinc-400">Scheduled Meal Sum: </span>
                  <span className="font-black text-white">{scheduledTotals.calories} kcal</span>
                  <span className="text-zinc-500 font-mono ml-2">
                    (P: <strong className="text-blue-400">{scheduledTotals.protein_g}g</strong> | C:{' '}
                    <strong className="text-emerald-400">{scheduledTotals.carbs_g}g</strong> | F:{' '}
                    <strong className="text-amber-400">{scheduledTotals.fat_g}g</strong>)
                  </span>
                </div>
              </div>

              {scheduledTotals.calories !== computedMacros.targetCalories && (
                <button
                  type="button"
                  onClick={handleAutoRebalance}
                  className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                >
                  Auto-Balance to Target
                </button>
              )}
            </div>
          </div>

          {/* ── Meal Schedule Cards List ─────────────────────────────── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Utensils size={18} className="text-red-500" />
                  Scheduled Daily Meals ({meals.length} Phases)
                </h3>
                <p className="text-xs text-zinc-500">
                  Early Morning, Breakfast, Lunch, Snacks, Dinner with portion weights and coach guidelines.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddCustomMeal}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold border border-zinc-800 flex items-center gap-1.5 transition-all"
              >
                <Plus size={14} className="text-red-400" />
                Add Meal
              </button>
            </div>

            {/* Meals Array */}
            <div className="space-y-4">
              {meals.map((meal, index) => {
                return (
                  <div
                    key={meal.id || index}
                    className="bg-zinc-950 border border-zinc-800/90 hover:border-zinc-700/80 rounded-2xl p-5 shadow-lg transition-all space-y-4 group"
                  >
                    {/* Meal Card Top Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/60 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 flex items-center justify-center text-xs font-black shrink-0">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          value={meal.meal_time}
                          onChange={(e) => handleUpdateMeal(index, 'meal_time', e.target.value)}
                          className="bg-transparent font-black text-white text-base focus:outline-none focus:border-b focus:border-red-500 transition-colors w-48 sm:w-60"
                        />
                      </div>

                      {/* Top Right Quick Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleRegenerateSingleMeal(index)}
                          title="Regenerate this meal with AI"
                          className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                        >
                          <RotateCcw size={12} />
                          <span className="text-[11px]">Swap Recipe</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteMeal(index)}
                          title="Remove this meal phase"
                          className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Food Items Textarea */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center justify-between">
                        <span>Ingredients & Portion Sizes</span>
                        <span className="text-[10px] text-zinc-500 font-normal">Editable by trainer</span>
                      </label>
                      <textarea
                        rows={3}
                        value={meal.food_items}
                        onChange={(e) => handleUpdateMeal(index, 'food_items', e.target.value)}
                        className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-red-500 transition-colors leading-relaxed font-sans resize-y"
                        placeholder="Detailed food ingredients and gram portions..."
                      />
                    </div>

                    {/* Macros Grid for this meal */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/60">
                      <div>
                        <span className="text-[10px] font-black uppercase text-red-400 block mb-0.5">Calories</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={meal.calories}
                            onChange={(e) => handleUpdateMeal(index, 'calories', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs font-bold text-white focus:outline-none focus:border-red-500"
                          />
                          <span className="text-[10px] text-zinc-500">kcal</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-black uppercase text-blue-400 block mb-0.5">Protein</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={meal.protein_g}
                            onChange={(e) => handleUpdateMeal(index, 'protein_g', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                          />
                          <span className="text-[10px] text-zinc-500">g</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-black uppercase text-emerald-400 block mb-0.5">Carbs</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={meal.carbs_g}
                            onChange={(e) => handleUpdateMeal(index, 'carbs_g', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                          />
                          <span className="text-[10px] text-zinc-500">g</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-400 block mb-0.5">Fat</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={meal.fat_g}
                            onChange={(e) => handleUpdateMeal(index, 'fat_g', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                          />
                          <span className="text-[10px] text-zinc-500">g</span>
                        </div>
                      </div>
                    </div>

                    {/* Trainer Tip / Notes */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Coach Note / Preparation Tip
                      </label>
                      <input
                        type="text"
                        value={meal.notes}
                        onChange={(e) => handleUpdateMeal(index, 'notes', e.target.value)}
                        placeholder="e.g. Drink 500ml water upon waking. Take with omega-3 capsule..."
                        className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-lg px-3 py-1.5 text-xs text-zinc-400 italic focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom Save Bar */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-white">Ready to Assign Diet Chart?</p>
                <p className="text-xs text-zinc-500">
                  Will store plan in member&apos;s chart and dispatch email notification.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSaveAndPublish}
                  disabled={isSaving || !selectedMemberId || meals.length === 0}
                  className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.35)] flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                  Publish Diet Plan to {selectedMember?.full_name || 'Member'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
