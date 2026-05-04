'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useStore, ProductionBatch, convertAmount } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { useSearchParams } from 'next/navigation'

function ProductionContent() {
  const searchParams = useSearchParams()
  const initialRecipeId = searchParams.get('receta')
  
  const { 
    recipes, calculateProduction, addProduction, productionCosts, updateProductionCost,
    prices, selectedProviders, selectProvider, getCheapestPrice
  } = useStore()
  
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(initialRecipeId)
  const [targetAmount, setTargetAmount] = useState<number>(1000)
  const [unit, setUnit] = useState<string>('ml')
  const [currentProduction, setCurrentProduction] = useState<ProductionBatch | null>(null)
  const [showSaved, setShowSaved] = useState(false)

  const selectedRecipe = useMemo(() => 
    recipes.find(r => r.id === selectedRecipeId),
    [recipes, selectedRecipeId]
  )

  // Auto-select cheapest providers when recipe changes, or when saved provider no longer exists
  useEffect(() => {
    if (selectedRecipe) {
      selectedRecipe.ingredients.forEach(ing => {
        const currentProvider = selectedProviders[ing.ingredient_id]
        const availablePrices = prices.filter(p => p.ingredient_id === ing.ingredient_id)
        const isValid = currentProvider && availablePrices.some(p => p.provider === currentProvider)
        if (!isValid) {
          const cheapest = getCheapestPrice(ing.ingredient_id)
          if (cheapest) selectProvider(ing.ingredient_id, cheapest.provider)
        }
      })
    }
  }, [selectedRecipeId])

  const handleCalculate = () => {
    if (!selectedRecipeId) return
    const production = calculateProduction(selectedRecipeId, targetAmount, unit)
    if (production) {
      setCurrentProduction(production)
      setShowSaved(false)
    }
  }

  const handleSave = () => {
    if (currentProduction) {
      addProduction(currentProduction)
      setShowSaved(true)
    }
  }

  const totalCost = currentProduction?.costs.reduce((sum, c) => sum + (c.cost || 0), 0) || 0

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Nueva Producción</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Seleccionar Receta</h3>
            <select 
              className="w-full p-2 border rounded-md bg-background"
              value={selectedRecipeId || ''}
              onChange={(e) => setSelectedRecipeId(e.target.value)}
            >
              <option value="">Selecciona una receta...</option>
              {recipes.map(recipe => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.name} ({recipe.base_volume_ml}ml)
                </option>
              ))}
            </select>
          </div>

          {selectedRecipe && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Cantidad a Producir</h3>
              <div className="flex gap-2">
                <input 
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(Number(e.target.value))}
                  className="flex-1 p-2 border rounded-md bg-background"
                  min="1"
                />
                <select 
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="p-2 border rounded-md bg-background"
                >
                  <option value="ml">ml</option>
                  <option value="L">L</option>
                </select>
              </div>
              
              <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                <div className="text-muted-foreground">Receta base</div>
                <div className="font-medium">{selectedRecipe.base_volume_ml} ml (1 L)</div>
                <div className="text-muted-foreground mt-2">Producción objetivo</div>
                <div className="font-medium">
                  {targetAmount} {unit}
                </div>
                <div className="text-muted-foreground mt-2">Factor de escala</div>
                <div className="font-medium">
                  {unit === 'L' 
                    ? ((targetAmount * 1000 / selectedRecipe.base_volume_ml) * 100).toFixed(1)
                    : ((targetAmount / selectedRecipe.base_volume_ml) * 100).toFixed(1)
                  }%
                </div>
              </div>

              <Button className="w-full mt-4" onClick={handleCalculate}>
                Calcular Producción
              </Button>
            </div>
          )}

          {selectedRecipe && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Costos por Ingrediente</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {selectedRecipe.ingredients.map(ing => {
                  const ingredientPrices = prices.filter(p => p.ingredient_id === ing.ingredient_id)
                  const selectedProvider = selectedProviders[ing.ingredient_id]
                  const selectedPrice = ingredientPrices.find(p => p.provider === selectedProvider)
                  
                  // Calcular costo para la cantidad de la receta
                  const scaledAmount = ing.amount * (targetAmount / selectedRecipe.base_volume_ml)
                  const amountInProviderUnit = selectedPrice
                    ? convertAmount(scaledAmount, ing.unit, selectedPrice.unit)
                    : scaledAmount

                  const costForRecipe = selectedPrice
                    ? (amountInProviderUnit * selectedPrice.price_per_unit).toFixed(2)
                    : (productionCosts[ing.ingredient_id]
                      ? (scaledAmount * productionCosts[ing.ingredient_id]).toFixed(2)
                      : '-')
                  
                  return (
                    <div key={ing.ingredient_id} className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="flex-1 truncate font-medium">{ing.name}</span>
                        {ingredientPrices.length > 0 ? (
                          <select 
                            className="p-1 border rounded bg-background text-xs"
                            value={selectedProvider || ''}
                            onChange={e => selectProvider(ing.ingredient_id, e.target.value)}
                          >
                            {ingredientPrices
                              .slice()
                              .sort((a, b) => a.price_per_unit - b.price_per_unit)
                              .map(p => (
                                <option key={p.provider} value={p.provider}>
                                  {p.provider} (${p.price_per_unit.toLocaleString()}/{p.unit})
                                </option>
                              ))
                            }
                          </select>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin precios</span>
                        )}
                      </div>
                      {selectedPrice && (
                        <div className="flex justify-between text-xs text-muted-foreground pl-1">
                          <span>
                            {amountInProviderUnit.toFixed(3).replace(/\.?0+$/, '')} {selectedPrice.unit} × ${selectedPrice.price_per_unit.toLocaleString()}/{selectedPrice.unit}
                          </span>
                          <span className="font-medium text-foreground">
                            ${costForRecipe}
                          </span>
                        </div>
                      )}
                      {!selectedPrice && ingredientPrices.length === 0 && (
                        <div className="flex items-center gap-2 pl-1">
                          <span className="text-xs text-muted-foreground">Costo manual:</span>
                          <input 
                            type="number"
                            step="0.01"
                            placeholder="0"
                            value={productionCosts[ing.ingredient_id] || ''}
                            onChange={(e) => updateProductionCost(ing.ingredient_id, Number(e.target.value))}
                            className="w-20 p-1 border rounded bg-background text-right text-xs"
                          />
                          <span className="text-xs text-muted-foreground">/{ing.unit}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {currentProduction ? (
            <div className="space-y-6">
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{currentProduction.recipeName}</h3>
                    <p className="text-muted-foreground">
                      {currentProduction.targetAmount} {currentProduction.unit} • 
                      {new Date(currentProduction.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {showSaved && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      ✓ Guardado
                    </span>
                  )}
                </div>

                <div className="flex gap-4 text-sm">
                  {currentProduction.totalTime && (
                    <span className="px-3 py-1 bg-muted rounded">
                      ⏱ {currentProduction.totalTime} min trabajo
                    </span>
                  )}
                  {currentProduction.restTime && (
                    <span className="px-3 py-1 bg-muted rounded">
                      🕐 {currentProduction.restTime}h reposo
                    </span>
                  )}
                  {totalCost > 0 && (
                    <span className="px-3 py-1 bg-muted rounded">
                      💰 ${totalCost.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-4">Ingredientes Calculados</h4>
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">Ingrediente</th>
                      <th className="text-left p-2">Proveedor</th>
                      <th className="text-right p-2">Cantidad</th>
                      <th className="text-right p-2">Costo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProduction.ingredients.map((ing, i) => {
                      const cost = currentProduction.costs[i]
                      const provider = selectedProviders[ing.ingredientId]
                      return (
                        <tr key={ing.ingredientId} className="border-t">
                          <td className="p-2">{ing.name}</td>
                          <td className="p-2 text-xs text-muted-foreground">{provider || '-'}</td>
                          <td className="p-2 text-right">{ing.amount} {ing.unit}</td>
                          <td className="p-2 text-right">
                            {cost.cost !== null ? `$${cost.cost.toFixed(2)}` : '-'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  {totalCost > 0 && (
                    <tfoot className="bg-muted/50">
                      <tr>
                        <td className="p-2 font-medium">Total</td>
                        <td className="p-2"></td>
                        <td className="p-2 text-right"></td>
                        <td className="p-2 text-right font-medium">${totalCost.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-4">Pasos de Producción</h4>
                <div className="space-y-3">
                  {currentProduction.procedure.map((step, idx) => (
                    <div key={idx} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {step.step}
                      </div>
                      <div className="flex-1 text-sm">
                        <p>{step.description}</p>
                        {step.time_min && (
                          <span className="text-xs text-muted-foreground">⏱ {step.time_min} min</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                {!showSaved && (
                  <Button onClick={handleSave}>
                    Guardar Producción
                  </Button>
                )}
                <Button variant="outline" onClick={() => setCurrentProduction(null)}>
                  Nuevo Cálculo
                </Button>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-8 text-center text-muted-foreground">
              Selecciona una receta y cantidad, luego haz clic en &ldquo;Calcular Producción&rdquo;
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ProductionPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ProductionContent />
    </Suspense>
  )
}