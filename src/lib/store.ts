'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useSyncExternalStore } from 'react'

export interface Price {
  ingredient_id: string
  provider: string
  product_name: string
  price: number
  quantity: number
  unit: string
  url_sale: string
  url_product: string
  delivery_time_days: number
  price_per_unit: number
}

export interface Ingredient {
  id: string
  name: string
  alternative_names: string[]
  category: string
  main_function: string
  functions: string[]
  characteristics: {
    physical_state: string
    ph: string | number | null
    notes: string | null
    [key: string]: unknown
  }
  safety: {
    risk_level: string
    required_ppe: string[]
    warnings?: string[]
  }
  storage: string | null
  mixing_parameters?: {
    dissolution_time_min: number | null
    speed: string
    technique: string
  }
}

export interface RecipeIngredient {
  ingredient_id: string
  name: string
  amount: number
  unit: string
  order: number
  notes: string | null
}

export interface ProcedureStep {
  step: number
  description: string
  time_min: number | null
  ingredients_involved: string[]
  warning?: string
  mixing_speed?: string
  hydration_time_hours?: number
}

export interface Recipe {
  id: string
  name: string
  description: string
  category: string
  base_volume_ml: number
  target_ph: { min: number; max: number } | null
  rest_time_hours: number | null
  requires_preservative: boolean
  preservative_notes?: string
  ingredients: RecipeIngredient[]
  procedure: ProcedureStep[]
  type?: string
  calculation_formula?: {
    description: string
    formula: string
    example: string
  }
  storage_notes?: string
  precautions?: string[]
}

export interface ProductionBatch {
  id: string
  recipeId: string
  recipeName: string
  targetAmount: number
  unit: string
  createdAt: string
  ingredients: {
    ingredientId: string
    name: string
    amount: number
    unit: string
  }[]
  procedure: ProcedureStep[]
  totalTime: number | null
  restTime: number | null
  costs: {
    ingredientId: string
    name: string
    amount: number
    unit: string
    cost: number | null
  }[]
  notes: string
}

export interface ImageEntry {
  image?: string
  alt?: string
}

export interface ImagesMap {
  ingredients: Record<string, ImageEntry>
  recipes: Record<string, ImageEntry>
}

// Shape of an exported/imported collection file (the protected data).
export interface Collection {
  metadata?: Record<string, unknown>
  ingredients: Ingredient[]
  recipes: Recipe[]
  prices: Price[]
  images?: Partial<ImagesMap>
}

const EMPTY_IMAGES: ImagesMap = { ingredients: {}, recipes: {} }

// Helper to convert amount between units.
// Cross-domain (g↔ml, g↔L, ml↔kg) assumes aqueous density ≈ 1 g/ml.
export function convertAmount(amount: number, fromUnit: string, toUnit: string): number {
  const from = fromUnit.toLowerCase()
  const to = toUnit.toLowerCase()
  if (from === to) return amount
  // mass
  if (from === 'g'  && to === 'kg') return amount / 1000
  if (from === 'kg' && to === 'g')  return amount * 1000
  // volume
  if (from === 'ml' && to === 'l')  return amount / 1000
  if (from === 'l'  && to === 'ml') return amount * 1000
  // cross-domain (density ≈ 1 g/ml)
  if (from === 'g'  && to === 'ml') return amount
  if (from === 'ml' && to === 'g')  return amount
  if (from === 'g'  && to === 'l')  return amount / 1000
  if (from === 'l'  && to === 'g')  return amount * 1000
  if (from === 'ml' && to === 'kg') return amount / 1000
  if (from === 'kg' && to === 'ml') return amount * 1000
  return amount
}

type Store = {
  ingredients: Ingredient[]
  recipes: Recipe[]
  productions: ProductionBatch[]
  productionCosts: Record<string, number>
  prices: Price[]
  selectedProviders: Record<string, string>
  images: ImagesMap
  collectionName: string | null

  hasCollection: () => boolean
  loadCollection: (data: Collection, name?: string) => void
  closeCollection: () => void
  exportCollection: () => Collection

  getIngredient: (id: string) => Ingredient | undefined
  getRecipe: (id: string) => Recipe | undefined
  getIngredientsByCategory: (category: string) => Ingredient[]
  getPricesByIngredient: (ingredientId: string) => Price[]
  getCheapestPrice: (ingredientId: string) => Price | undefined
  
  addIngredient: (ingredient: Ingredient) => void
  updateIngredient: (id: string, updates: Partial<Ingredient>) => void
  deleteIngredient: (id: string) => void
  
  addPrice: (price: Price) => void
  updatePrice: (index: number, updates: Partial<Price>) => void
  deletePrice: (index: number) => void

  selectProvider: (ingredientId: string, provider: string) => void
  
  formatProcedure: (procedure: ProcedureStep[], ingredients: RecipeIngredient[]) => ProcedureStep[]
  
  addProduction: (production: ProductionBatch) => void
  deleteProduction: (id: string) => void
  updateProductionCost: (ingredientId: string, cost: number) => void
  
  calculateProduction: (recipeId: string, targetAmount: number, unit: string) => ProductionBatch | null
}

const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ingredients: [],
      recipes: [],
      productions: [],
      productionCosts: {},
      prices: [],
      selectedProviders: {},
      images: EMPTY_IMAGES,
      collectionName: null,

      hasCollection: () => {
        const s = get()
        return s.ingredients.length > 0 || s.recipes.length > 0
      },

      loadCollection: (data: Collection, name?: string) => {
        set({
          ingredients: data.ingredients ?? [],
          recipes: data.recipes ?? [],
          prices: data.prices ?? [],
          images: {
            ingredients: data.images?.ingredients ?? {},
            recipes: data.images?.recipes ?? {},
          },
          collectionName: name ?? (data.metadata?.name as string) ?? 'Colección',
        })
      },

      closeCollection: () => {
        set({
          ingredients: [],
          recipes: [],
          prices: [],
          images: EMPTY_IMAGES,
          collectionName: null,
          selectedProviders: {},
        })
      },

      exportCollection: () => {
        const s = get()
        return {
          metadata: { name: s.collectionName ?? 'Colección', format_version: 1 },
          ingredients: s.ingredients,
          recipes: s.recipes,
          prices: s.prices,
          images: s.images,
        }
      },

      getIngredient: (id: string) => {
        return get().ingredients.find(i => i.id === id)
      },

      getRecipe: (id: string) => {
        return get().recipes.find(r => r.id === id)
      },

      getIngredientsByCategory: (category: string) => {
        return get().ingredients.filter(i => i.category === category)
      },

      getPricesByIngredient: (ingredientId: string) => {
        return get().prices.filter(p => p.ingredient_id === ingredientId)
      },

      getCheapestPrice: (ingredientId: string) => {
        const prices = get().prices.filter(p => p.ingredient_id === ingredientId)
        if (prices.length === 0) return undefined
        return prices.reduce((cheapest, current) => 
          current.price_per_unit < cheapest.price_per_unit ? current : cheapest
        )
      },

      addIngredient: (ingredient: Ingredient) => {
        set(state => ({
          ingredients: [...state.ingredients, ingredient]
        }))
      },

      updateIngredient: (id: string, updates: Partial<Ingredient>) => {
        set(state => ({
          ingredients: state.ingredients.map(i => 
            i.id === id ? { ...i, ...updates } : i
          )
        }))
      },

      deleteIngredient: (id: string) => {
        set(state => ({
          ingredients: state.ingredients.filter(i => i.id !== id)
        }))
      },

      addPrice: (price: Price) => {
        set(state => ({
          prices: [...state.prices, price]
        }))
      },

      updatePrice: (index: number, updates: Partial<Price>) => {
        set(state => ({
          prices: state.prices.map((p, i) => 
            i === index ? { ...p, ...updates } : p
          )
        }))
      },

      deletePrice: (index: number) => {
        set(state => ({
          prices: state.prices.filter((_, i) => i !== index)
        }))
      },

      selectProvider: (ingredientId: string, provider: string) => {
        set(state => ({
          selectedProviders: { ...state.selectedProviders, [ingredientId]: provider }
        }))
      },

      formatProcedure: (procedure, recipeIngredients) => {
        const ingredientMap = new Map(
          recipeIngredients.map(ing => [ing.ingredient_id, ing])
        )

        return procedure.map(step => {
          let description = step.description

          for (const ing of recipeIngredients) {
            const placeholder = `{{${ing.ingredient_id}}}`
            if (description.includes(placeholder)) {
              description = description.replace(
                placeholder,
                `${ing.amount} ${ing.unit}`
              )
            }

            const placeholderName = `{{${ing.ingredient_id}_name}}`
            if (description.includes(placeholderName)) {
              description = description.replace(placeholderName, ing.name)
            }

            const placeholderQuarter = `{{${ing.ingredient_id}_quarter}}`
            if (description.includes(placeholderQuarter)) {
              const quarter = Math.round(ing.amount / 4 * 100) / 100
              description = description.replace(
                placeholderQuarter,
                `${quarter} ${ing.unit}`
              )
            }
          }

          return { ...step, description }
        })
      },

      addProduction: (production: ProductionBatch) => {
        set(state => ({
          productions: [production, ...state.productions]
        }))
      },

      deleteProduction: (id: string) => {
        set(state => ({
          productions: state.productions.filter(p => p.id !== id)
        }))
      },

      updateProductionCost: (ingredientId: string, cost: number) => {
        set(state => ({
          productionCosts: { ...state.productionCosts, [ingredientId]: cost }
        }))
      },

calculateProduction: (recipeId: string, targetAmount: number, unit: string) => {
        const recipe = get().getRecipe(recipeId)
        if (!recipe) return null

        // Auto-select cheapest provider, replacing any stale provider no longer in catalog
        recipe.ingredients.forEach(ing => {
          const currentProvider = get().selectedProviders[ing.ingredient_id]
          const available = get().prices.filter(p => p.ingredient_id === ing.ingredient_id)
          const isValid = currentProvider && available.some(p => p.provider === currentProvider)
          if (!isValid) {
            const cheapest = get().getCheapestPrice(ing.ingredient_id)
            if (cheapest) get().selectProvider(ing.ingredient_id, cheapest.provider)
          }
        })

        let targetInMl = targetAmount
        if (unit === 'L') {
          targetInMl = targetAmount * 1000
        }

        const scaleFactor = targetInMl / recipe.base_volume_ml
        
        const isLiters = unit === 'L'
        
        const scaledIngredients = recipe.ingredients.map(ing => {
          const scaledAmount = ing.amount * scaleFactor
          // In liters mode: convert mass (g→kg) and volume (ml→L) for readability
          let displayAmount: number
          let displayUnit: string
          if (isLiters) {
            if (ing.unit === 'g') {
              displayAmount = Math.round(scaledAmount / 10) / 100
              displayUnit = 'kg'
            } else if (ing.unit === 'ml') {
              displayAmount = Math.round(scaledAmount / 10) / 100
              displayUnit = 'L'
            } else {
              displayAmount = Math.round(scaledAmount * 100) / 100
              displayUnit = ing.unit
            }
          } else {
            displayAmount = Math.round(scaledAmount * 100) / 100
            displayUnit = ing.unit
          }
          return {
            ingredientId: ing.ingredient_id,
            name: ing.name,
            amount: displayAmount,
            unit: displayUnit
          }
        })

        const ingredientMap = new Map(
          scaledIngredients.map(ing => [ing.ingredientId, ing])
        )

        const scaleProcedureStep = (step: ProcedureStep): ProcedureStep => {
          let description = step.description

          const stepIngredients = step.ingredients_involved
            .map(id => ingredientMap.get(id))
            .filter(Boolean) as typeof scaledIngredients

          for (const ing of stepIngredients) {
            const placeholder = `{{${ing.ingredientId}}}`
            if (description.includes(placeholder)) {
              description = description.replace(
                placeholder,
                `${ing.amount} ${ing.unit}`
              )
            }

            const placeholderName = `{{${ing.ingredientId}_name}}`
            if (description.includes(placeholderName)) {
              description = description.replace(placeholderName, ing.name)
            }

            const placeholderQuarter = `{{${ing.ingredientId}_quarter}}`
            if (description.includes(placeholderQuarter)) {
              const quarter = Math.round(ing.amount / 4 * 100) / 100
              description = description.replace(
                placeholderQuarter,
                `${quarter} ${ing.unit}`
              )
            }
          }

          const hasPlaceholders = stepIngredients.length > 0 && 
            stepIngredients.some(ing => 
              description.includes(`{{${ing.ingredientId}}}`) ||
              description.includes(`{{${ing.ingredientId}_name}}`) ||
              description.includes(`{{${ing.ingredientId}_quarter}}`)
            )

if (!hasPlaceholders) {
            description = description.replace(
              /(\d+(\.\d+)?)\s*(g|gramos|ml|kg)/gi,
              (match, num, _dec, unitStr) => {
              const numValue = parseFloat(num)
              if (isNaN(numValue)) return match
              
              const scaled = Math.round(numValue * scaleFactor * 100) / 100
              const unitLower = unitStr.toLowerCase()
              const finalUnit = unitLower === 'g' || unitLower === 'gramos' 
                ? (isLiters ? 'kg' : 'g')
                : unitLower === 'ml' ? 'ml' : unitLower
              
              if (isLiters && (finalUnit === 'g' || finalUnit === 'kg')) {
                const inKg = Math.round(scaled / 10) / 100
                return `${inKg} kg`
              }
              
              return `${scaled} ${finalUnit}`
            }
            )
          }

          return {
            ...step,
            description
          }
        }

        const scaledProcedure = recipe.procedure.map(scaleProcedureStep)

        const totalTime = recipe.procedure
          .filter(step => step.time_min !== null)
          .reduce((sum, step) => sum + (step.time_min || 0), 0)

        const costs = scaledIngredients.map(ing => {
          const provider = get().selectedProviders[ing.ingredientId]
          const price = provider 
            ? get().prices.find(p => 
                p.ingredient_id === ing.ingredientId && p.provider === provider
              )
            : undefined
          
          let cost: number | null = null
          if (price) {
            // Convert amount to the unit used by the provider
            const amountInProviderUnit = convertAmount(ing.amount, ing.unit, price.unit)
            cost = Math.round(amountInProviderUnit * price.price_per_unit * 100) / 100
          } else if (!provider) {
            // Only use manual cost when no provider is selected at all
            const manualCost = get().productionCosts[ing.ingredientId]
            if (manualCost !== undefined) {
              // Manual cost is treated as per-recipe-unit (g or ml)
              cost = Math.round(ing.amount * manualCost * 100) / 100
            }
          }
          // If provider selected but not found in catalog → cost stays null
          
          return {
            ingredientId: ing.ingredientId,
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            cost
          }
        })

        return {
          id: `PROD-${Date.now()}`,
          recipeId: recipe.id,
          recipeName: recipe.name,
          targetAmount,
          unit,
          createdAt: new Date().toISOString(),
          ingredients: scaledIngredients,
          procedure: scaledProcedure,
          totalTime,
          restTime: recipe.rest_time_hours,
          costs,
          notes: ''
        }
      }
    }),
    {
      name: 'all-cleans-storage',
      version: 3,
      migrate: (persistedState, version) => {
        const s = (persistedState ?? {}) as Partial<Store>
        const base = {
          productions: s.productions ?? [],
          productionCosts: version < 2 ? {} : (s.productionCosts ?? {}),
          selectedProviders: s.selectedProviders ?? {},
          // v3: the collection now lives in the opened file / localStorage, not in the repo
          ingredients: s.ingredients ?? [],
          recipes: s.recipes ?? [],
          prices: s.prices ?? [],
          images: s.images ?? EMPTY_IMAGES,
          collectionName: s.collectionName ?? null,
        }
        return base
      },
      partialize: (state) => ({
        productions: state.productions,
        productionCosts: state.productionCosts,
        selectedProviders: state.selectedProviders,
        ingredients: state.ingredients,
        recipes: state.recipes,
        prices: state.prices,
        images: state.images,
        collectionName: state.collectionName,
      })
    }
  )
)

export { useStore }

// True once zustand/persist has rehydrated from localStorage on the client.
// Use to gate client-only UI and avoid hydration mismatches (replaces the
// useEffect(() => setMounted(true)) pattern, which the lint config forbids).
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useStore.persist.onFinishHydration(cb),
    () => useStore.persist.hasHydrated(),
    () => false
  )
}