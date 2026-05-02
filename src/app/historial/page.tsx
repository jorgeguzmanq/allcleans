'use client'

import { useState } from 'react'
import { useStore, ProductionBatch } from '@/lib/store'
import { Button } from '@/components/ui/button'

export default function HistoryPage() {
  const { productions, deleteProduction } = useStore()
  const [selectedProduction, setSelectedProduction] = useState<ProductionBatch | null>(
    productions.length > 0 ? productions[0] : null
  )

  if (productions.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Historial de Producciones</h1>
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          No hay producciones guardadas. 
          <br />
          <Button className="mt-4" onClick={() => window.location.href = '/produccion'}>
            Crear Primera Producción
          </Button>
        </div>
      </div>
    )
  }

  const totalCost = selectedProduction?.costs.reduce((sum, c) => sum + (c.cost || 0), 0) || 0

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Historial de Producciones</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          {productions.map(prod => (
            <div 
              key={prod.id}
              className={`p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors ${selectedProduction?.id === prod.id ? 'bg-accent border-primary' : ''}`}
              onClick={() => setSelectedProduction(prod)}
            >
              <div className="flex justify-between items-start">
                <h4 className="font-medium">{prod.recipeName}</h4>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('¿Eliminar esta producción?')) {
                      deleteProduction(prod.id)
                      if (selectedProduction?.id === prod.id) {
                        setSelectedProduction(productions.length > 1 ? productions.find(p => p.id !== prod.id) || null : null)
                      }
                    }
                  }}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {prod.targetAmount} {prod.unit}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(prod.createdAt).toLocaleDateString()} {new Date(prod.createdAt).toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          {selectedProduction ? (
            <div className="space-y-6">
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold">{selectedProduction.recipeName}</h3>
                    <p className="text-muted-foreground">
                      ID: {selectedProduction.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{selectedProduction.targetAmount}</div>
                    <div className="text-muted-foreground">{selectedProduction.unit}</div>
                  </div>
                </div>

                <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                  <span>Creado: {new Date(selectedProduction.createdAt).toLocaleString()}</span>
                  {selectedProduction.totalTime && <span>⏱ {selectedProduction.totalTime} min</span>}
                  {selectedProduction.restTime && <span>🕐 {selectedProduction.restTime}h reposo</span>}
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-4">Ingredientes Utilizados</h4>
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">Ingrediente</th>
                      <th className="text-right p-2">Cantidad</th>
                      <th className="text-right p-2">Costo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProduction.ingredients.map((ing, i) => {
                      const cost = selectedProduction.costs[i]
                      return (
                        <tr key={ing.ingredientId} className="border-t">
                          <td className="p-2">{ing.name}</td>
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
                        <td className="p-2 font-medium">Costo Total</td>
                        <td className="p-2"></td>
                        <td className="p-2 text-right font-bold">${totalCost.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-4">Procedimiento</h4>
                <div className="space-y-3">
                  {selectedProduction.procedure.map((step, idx) => (
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

              <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                <div>
                  <span className="text-muted-foreground">Total producción:</span>{' '}
                  <span className="font-semibold">{selectedProduction.targetAmount} {selectedProduction.unit}</span>
                </div>
                {totalCost > 0 && (
                  <div>
                    <span className="text-muted-foreground">Costo:</span>{' '}
                    <span className="font-semibold text-lg">${totalCost.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-8 text-center text-muted-foreground">
              Selecciona una producción del historial
            </div>
          )}
        </div>
      </div>
    </div>
  )
}