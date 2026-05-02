'use client'

import { useState } from 'react'
import { useStore, Ingredient } from '@/lib/store'
import { Button } from '@/components/ui/button'

const categoryLabels: Record<string, string> = {
  base: 'Base',
  surfactant: 'Surfactantes',
  modificador_reologico: 'Modificadores Reológicos',
  regulador_ph: 'Reguladores pH',
  builder: 'Builders',
  emulsificante: 'Emulsificantes',
  humectante: 'Humectantes',
  solvente: 'Solventes',
  desinfectante: 'Desinfectantes',
  aditivo: 'Aditivos',
  conservante: 'Conservantes'
}

export default function IngredientsPage() {
  const { ingredients } = useStore()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)
  
  const categories = [...new Set(ingredients.map(i => i.category))]
  const filteredIngredients = selectedCategory 
    ? ingredients.filter(i => i.category === selectedCategory)
    : ingredients

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'muy alto': return 'text-red-600 bg-red-50'
      case 'alto': return 'text-orange-600 bg-orange-50'
      case 'medio': return 'text-yellow-600 bg-yellow-50'
      case 'bajo': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Ingredientes</h1>
        <div className="text-muted-foreground">{ingredients.length} ingredientes</div>
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
        <div className="lg:col-span-2">
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3">ID</th>
                  <th className="text-left p-3">Nombre</th>
                  <th className="text-left p-3">Categoría</th>
                  <th className="text-left p-3">Función</th>
                  <th className="text-left p-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredIngredients.map(ing => (
                  <tr 
                    key={ing.id} 
                    className={`border-t hover:bg-accent cursor-pointer ${selectedIngredient?.id === ing.id ? 'bg-accent' : ''}`}
                    onClick={() => setSelectedIngredient(ing)}
                  >
                    <td className="p-3 font-mono text-sm">{ing.id}</td>
                    <td className="p-3 font-medium">{ing.name}</td>
                    <td className="p-3 text-sm">{categoryLabels[ing.category] || ing.category}</td>
                    <td className="p-3 text-sm text-muted-foreground">{ing.main_function}</td>
                    <td className="p-3 text-sm">{ing.characteristics.physical_state}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1">
          {selectedIngredient ? (
            <div className="border rounded-lg p-4 space-y-4 sticky top-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedIngredient.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedIngredient.id}</p>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2">Nombres Alternativos</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedIngredient.alternative_names.map(name => (
                    <span key={name} className="text-xs px-2 py-1 bg-secondary rounded">
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-1">Función Principal</h4>
                <p className="text-sm">{selectedIngredient.main_function}</p>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-1">Funciones</h4>
                <ul className="text-sm space-y-1">
                  {selectedIngredient.functions.map(fn => (
                    <li key={fn} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      {fn}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm mb-1">Estado Físico</h4>
                  <p className="text-sm">{selectedIngredient.characteristics.physical_state}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">pH</h4>
                  <p className="text-sm">{selectedIngredient.characteristics.ph || 'N/A'}</p>
                </div>
              </div>

              {selectedIngredient.characteristics.notes && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Notas</h4>
                  <p className="text-sm text-muted-foreground">{selectedIngredient.characteristics.notes}</p>
                </div>
              )}

              <div className={`p-3 rounded-lg ${getRiskColor(selectedIngredient.safety.risk_level)}`}>
                <h4 className="font-medium text-sm">Nivel de Riesgo: {selectedIngredient.safety.risk_level.toUpperCase()}</h4>
                {selectedIngredient.safety.required_ppe.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedIngredient.safety.required_ppe.map(ppe => (
                      <span key={ppe} className="text-xs px-2 py-0.5 bg-background rounded">
                        {ppe}
                      </span>
                    ))}
                  </div>
                )}
                {selectedIngredient.safety.warnings && (
                  <ul className="mt-2 text-xs space-y-1">
                    {selectedIngredient.safety.warnings.map((w, i) => (
                      <li key={i}>⚠️ {w}</li>
                    ))}
                  </ul>
                )}
              </div>

              {selectedIngredient.storage && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Almacenamiento</h4>
                  <p className="text-sm text-muted-foreground">{selectedIngredient.storage}</p>
                </div>
              )}

              {selectedIngredient.mixing_parameters && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Parámetros de Mezcla</h4>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p>Tiempo: {selectedIngredient.mixing_parameters.dissolution_time_min || 'N/A'} min</p>
                    <p>Velocidad: {selectedIngredient.mixing_parameters.speed}</p>
                    <p className="text-xs mt-1">{selectedIngredient.mixing_parameters.technique}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="border rounded-lg p-4 text-center text-muted-foreground">
              Selecciona un ingrediente para ver los detalles
            </div>
          )}
        </div>
      </div>
    </div>
  )
}