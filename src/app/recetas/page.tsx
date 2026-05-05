'use client'

import { useState } from 'react'
import { useStore, Recipe } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { ImageWithFallback, getImageSrc, getImageAlt } from '@/components/ui/image-with-fallback'
import Link from 'next/link'

const categoryLabels: Record<string, string> = {
  lavanderia: 'Lavandería',
  cocina: 'Cocina',
  industrial: 'Industrial',
  hogar: 'Hogar',
  cuidado_personal: 'Cuidado Personal',
  desinfeccion: 'Desinfección',
  materia_prima: 'Materia Prima'
}

export default function RecipesPage() {
  const { recipes, formatProcedure } = useStore()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  
  const categories = [...new Set(recipes.map(r => r.category))]
  const filteredRecipes = selectedCategory 
    ? recipes.filter(r => r.category === selectedCategory)
    : recipes

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Recetas</h1>
        <div className="text-muted-foreground">{recipes.length} recetas</div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button 
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          Todos
        </Button>
        {categories.map(cat => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
          >
            {categoryLabels[cat] || cat}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          {filteredRecipes.map(recipe => (
            <div 
              key={recipe.id}
              className={`p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors ${selectedRecipe?.id === recipe.id ? 'bg-accent border-primary' : ''}`}
              onClick={() => setSelectedRecipe(recipe)}
            >
              <div className="flex gap-3">
                <ImageWithFallback
                  src={getImageSrc('recipe', recipe.id)}
                  alt={getImageAlt('recipe', recipe.id)}
                  size="small"
                  className="flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{recipe.name}</h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{recipe.description}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 bg-secondary rounded">
                  {recipe.base_volume_ml}ml
                </span>
                {recipe.target_ph && (
                  <span className="text-xs px-2 py-0.5 bg-secondary rounded">
                    pH {recipe.target_ph.min}-{recipe.target_ph.max}
                  </span>
                )}
              </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          {selectedRecipe ? (
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{selectedRecipe.name}</h3>
                    <p className="text-muted-foreground mt-2">{selectedRecipe.description}</p>
                  </div>
                  <ImageWithFallback
                    src={getImageSrc('recipe', selectedRecipe.id)}
                    alt={getImageAlt('recipe', selectedRecipe.id)}
                    size="large"
                    className="flex-shrink-0"
                  />
                </div>
                
                <div className="flex gap-4 mt-4 text-sm">
                  <span className="px-3 py-1 bg-secondary rounded">
                    Base: {selectedRecipe.base_volume_ml}ml
                  </span>
                  {selectedRecipe.target_ph && (
                    <span className="px-3 py-1 bg-secondary rounded">
                      pH {selectedRecipe.target_ph.min}-{selectedRecipe.target_ph.max}
                    </span>
                  )}
                  {selectedRecipe.rest_time_hours && (
                    <span className="px-3 py-1 bg-secondary rounded">
                      Reposo: {selectedRecipe.rest_time_hours}h
                    </span>
                  )}
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Ingredientes</h3>
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">#</th>
                      <th className="text-left p-2">Ingrediente</th>
                      <th className="text-right p-2">Cantidad</th>
                      <th className="text-left p-2">Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRecipe.ingredients.map(ing => (
                      <tr key={ing.ingredient_id} className="border-t">
                        <td className="p-2">{ing.order}</td>
                        <td className="p-2 font-medium">{ing.name}</td>
                        <td className="p-2 text-right">{ing.amount} {ing.unit}</td>
                        <td className="p-2 text-muted-foreground text-xs">{ing.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/50">
                    <tr>
                      <td className="p-2 font-medium" colSpan={2}>Total</td>
                      <td className="p-2 text-right font-medium">
                        {selectedRecipe.ingredients.reduce((sum, ing) => sum + ing.amount, 0)} g
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Procedimiento</h3>
                <div className="space-y-4">
                  {formatProcedure(selectedRecipe.procedure, selectedRecipe.ingredients).map((step, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{step.description}</p>
                        {step.time_min && (
                          <span className="text-xs text-muted-foreground mt-1 inline-block">
                            ⏱ {step.time_min} min
                          </span>
                        )}
                        {step.warning && (
                          <p className="text-xs text-red-600 mt-1">⚠️ {step.warning}</p>
                        )}
                        {step.hydration_time_hours && (
                          <span className="text-xs text-muted-foreground mt-1 inline-block">
                            🕐 Hidratación: {step.hydration_time_hours} horas
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedRecipe.calculation_formula && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h3 className="font-semibold mb-2">Fórmula de Cálculo</h3>
                  <p className="text-sm text-muted-foreground mb-2">{selectedRecipe.calculation_formula.description}</p>
                  <code className="text-sm bg-background p-2 rounded block">
                    {selectedRecipe.calculation_formula.formula}
                  </code>
                  <p className="text-xs text-muted-foreground mt-2">
                    Ejemplo: {selectedRecipe.calculation_formula.example}
                  </p>
                </div>
              )}

              {selectedRecipe.precautions && selectedRecipe.precautions.length > 0 && (
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <h3 className="font-semibold mb-2 text-red-800">Precauciones</h3>
                  <ul className="space-y-1">
                    {selectedRecipe.precautions.map((p, i) => (
                      <li key={i} className="text-sm text-red-700">⚠️ {p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedRecipe.storage_notes && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h3 className="font-semibold mb-2">Almacenamiento</h3>
                  <p className="text-sm text-muted-foreground">{selectedRecipe.storage_notes}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Link href={`/produccion?receta=${selectedRecipe.id}`}>
                  <Button>
                    Producir
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-8 text-center text-muted-foreground">
              Selecciona una receta para ver los detalles
            </div>
          )}
        </div>
      </div>
    </div>
  )
}