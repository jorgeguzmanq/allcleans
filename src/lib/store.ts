'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import ingredientsData from './data/ingredients.json'
import recipesData from './data/recipes.json'

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

type Store = {
  ingredients: Ingredient[]
  recipes: Recipe[]
  productions: ProductionBatch[]
  productionCosts: Record<string, number>
  
  getIngredient: (id: string) => Ingredient | undefined
  getRecipe: (id: string) => Recipe | undefined
  getIngredientsByCategory: (category: string) => Ingredient[]
  
  formatProcedure: (procedure: ProcedureStep[], ingredients: RecipeIngredient[]) => ProcedureStep[]
  
  addProduction: (production: ProductionBatch) => void
  deleteProduction: (id: string) => void
  updateProductionCost: (ingredientId: string, cost: number) => void
  
  calculateProduction: (recipeId: string, targetAmount: number, unit: string) => ProductionBatch | null
}

const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ingredients: ingredientsData.ingredients as Ingredient[],
      recipes: recipesData.recipes as Recipe[],
      productions: [],
      productionCosts: {},

      getIngredient: (id: string) => {
        return get().ingredients.find(i => i.id === id)
      },

      getRecipe: (id: string) => {
        return get().recipes.find(r => r.id === id)
      },

      getIngredientsByCategory: (category: string) => {
        return get().ingredients.filter(i => i.category === category)
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

        let targetInMl = targetAmount
        if (unit === 'L') {
          targetInMl = targetAmount * 1000
        }

        const scaleFactor = targetInMl / recipe.base_volume_ml
        
        const isLiters = unit === 'L'
        
        const scaledIngredients = recipe.ingredients.map(ing => {
          const scaledAmount = ing.amount * scaleFactor
          return {
            ingredientId: ing.ingredient_id,
            name: ing.name,
            amount: isLiters 
              ? Math.round(scaledAmount / 10) / 100 
              : Math.round(scaledAmount * 100) / 100,
            unit: isLiters ? 'kg' : ing.unit
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
          const cost = get().productionCosts[ing.ingredientId]
          const amountInGrams = isLiters ? ing.amount * 1000 : ing.amount
          return {
            ingredientId: ing.ingredientId,
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            cost: cost !== undefined ? Math.round(amountInGrams * cost * 100) / 100 : null
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
      partialize: (state) => ({
        productions: state.productions,
        productionCosts: state.productionCosts
      })
    }
  )
)

export { useStore }