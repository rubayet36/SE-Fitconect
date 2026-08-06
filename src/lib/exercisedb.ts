// Uses yuhonas/free-exercise-db open-source dataset (873 exercises with images)
// https://github.com/yuhonas/free-exercise-db
// primaryMuscles => bodyPart, category => exerciseType

const GITHUB_RAW = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main'
const EXERCISES_JSON = `${GITHUB_RAW}/dist/exercises.json`
const IMAGE_BASE = `${GITHUB_RAW}/exercises`

export interface Exercise {
  id: string
  name: string
  bodyPart: string
  equipment: string
  target: string
  secondaryMuscles: string[]
  instructions: string[]
  gifUrl?: string
  images?: string[]
}

interface RawExercise {
  id: string
  name: string
  primaryMuscles: string[]
  secondaryMuscles: string[]
  equipment: string
  category: string
  instructions: string[]
  images: string[]
}

function toExercise(raw: RawExercise): Exercise {
  const firstImage = raw.images?.[0]
  return {
    id: raw.id,
    name: raw.name,
    // primaryMuscles[0] gives real body parts like "chest", "back", "abdominals"
    bodyPart: raw.primaryMuscles?.[0] || raw.category || 'general',
    // equipment field comes through directly
    equipment: raw.equipment || 'body only',
    target: raw.primaryMuscles?.[0] || 'general',
    secondaryMuscles: raw.secondaryMuscles || [],
    instructions: raw.instructions || [],
    gifUrl: firstImage ? `${IMAGE_BASE}/${firstImage}` : undefined,
    images: raw.images?.map(img => `${IMAGE_BASE}/${img}`) || [],
  }
}

// Simple in-memory cache so we only fetch the JSON once per server lifetime
let _exerciseCache: Exercise[] | null = null

async function getAllExercises(): Promise<Exercise[]> {
  if (_exerciseCache) return _exerciseCache
  try {
    const res = await fetch(EXERCISES_JSON, { next: { revalidate: 86400 } })
    if (!res.ok) return []
    const data: RawExercise[] = await res.json()
    _exerciseCache = data.map(toExercise)
    return _exerciseCache
  } catch {
    return []
  }
}

export async function getBodyParts(): Promise<string[]> {
  const exercises = await getAllExercises()
  // Collect all unique primaryMuscles values
  const parts = new Set(exercises.map(e => e.bodyPart))
  return Array.from(parts).sort()
}

export async function getEquipmentList(): Promise<string[]> {
  const exercises = await getAllExercises()
  const equipment = new Set(exercises.map(e => e.equipment))
  return Array.from(equipment).sort()
}

export async function getExercisesByBodyPart(bodyPart: string, limit = 24, offset = 0): Promise<Exercise[]> {
  const exercises = await getAllExercises()
  const bp = bodyPart.toLowerCase()
  const filtered = exercises.filter(e =>
    e.bodyPart.toLowerCase() === bp ||
    e.secondaryMuscles.some(m => m.toLowerCase() === bp)
  )
  return filtered.slice(offset, offset + limit)
}

export async function getExercisesByEquipment(equipment: string, limit = 24, offset = 0): Promise<Exercise[]> {
  const exercises = await getAllExercises()
  const eq = equipment.toLowerCase()
  const filtered = exercises.filter(e => e.equipment.toLowerCase() === eq)
  return filtered.slice(offset, offset + limit)
}

export async function searchExercises(query: string, limit = 24, offset = 0): Promise<Exercise[]> {
  const exercises = await getAllExercises()
  const q = query.toLowerCase()
  const filtered = exercises.filter(e =>
    e.name.toLowerCase().includes(q) ||
    e.bodyPart.toLowerCase().includes(q) ||
    e.target.toLowerCase().includes(q) ||
    e.equipment.toLowerCase().includes(q) ||
    e.secondaryMuscles.some(m => m.toLowerCase().includes(q))
  )
  return filtered.slice(offset, offset + limit)
}

export async function getExerciseById(id: string): Promise<Exercise> {
  const exercises = await getAllExercises()
  const found = exercises.find(e => e.id === id)
  if (!found) throw new Error(`Exercise not found: ${id}`)
  return found
}
