'use client'

import { useState } from 'react'
import { useStore, Ingredient, Price } from '@/lib/store'
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
  disinfectante: 'Desinfectantes',
  aditivo: 'Aditivos',
  conservante: 'Conservantes'
}

const categories = Object.keys(categoryLabels)

const emptyIngredient: Omit<Ingredient, 'id'> = {
  name: '',
  alternative_names: [],
  category: 'base',
  main_function: '',
  functions: [],
  characteristics: {
    physical_state: '',
    ph: null,
    notes: null
  },
  safety: {
    risk_level: 'bajo',
    required_ppe: []
  },
  storage: null
}

const emptyPrice: Omit<Price, 'ingredient_id'> = {
  provider: '',
  product_name: '',
  price: 0,
  quantity: 0,
  unit: 'kg',
  url_sale: '',
  url_product: '',
  delivery_time_days: 0,
  price_per_unit: 0
}

export default function IngredientsPage() {
  const { ingredients, prices, addIngredient, updateIngredient, addPrice, updatePrice, deletePrice } = useStore()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [isAddingPrice, setIsAddingPrice] = useState(false)
  const [isEditingPrice, setIsEditingPrice] = useState(false)
  const [editingPriceIndex, setEditingPriceIndex] = useState<number | null>(null)
  const [priceFilter, setPriceFilter] = useState('')
  const [editForm, setEditForm] = useState<Omit<Ingredient, 'id'> | null>(null)
  const [priceForm, setPriceForm] = useState<Omit<Price, 'ingredient_id'>>(emptyPrice)

  const ingredientPrices = selectedIngredient 
    ? prices.filter(p => p.ingredient_id === selectedIngredient.id)
    : []
  
  const filteredPrices = ingredientPrices.filter(p => 
    priceFilter === '' || p.provider.toLowerCase().includes(priceFilter.toLowerCase())
  )

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

  const generateId = () => {
    const maxNum = ingredients.reduce((max, ing) => {
      const num = parseInt(ing.id.replace('ING', ''))
      return num > max ? num : max
    }, 0)
    return `ING${String(maxNum + 1).padStart(3, '0')}`
  }

  const handleSave = () => {
    if (!editForm) return

    if (isAddingNew) {
      const newIngredient = { ...editForm, id: generateId() } as Ingredient
      addIngredient(newIngredient)
      setIsAddingNew(false)
    } else if (selectedIngredient && isEditing) {
      updateIngredient(selectedIngredient.id, editForm)
      setSelectedIngredient({ ...selectedIngredient, ...editForm } as Ingredient)
      setIsEditing(false)
    }
    setEditForm(null)
  }

  const handleAddPrice = () => {
    if (!selectedIngredient || !priceForm.provider) return

    addPrice({
      ...priceForm,
      ingredient_id: selectedIngredient.id
    })
    setIsAddingPrice(false)
    setPriceForm(emptyPrice)
  }

  const handleEditPrice = (index: number) => {
    const priceToEdit = prices[index]
    if (!priceToEdit) return
    setPriceForm({
      provider: priceToEdit.provider,
      product_name: priceToEdit.product_name,
      price: priceToEdit.price,
      quantity: priceToEdit.quantity,
      unit: priceToEdit.unit,
      url_sale: priceToEdit.url_sale,
      url_product: priceToEdit.url_product,
      delivery_time_days: priceToEdit.delivery_time_days,
      price_per_unit: priceToEdit.price_per_unit
    })
    setEditingPriceIndex(index)
    setIsEditingPrice(true)
    setIsAddingPrice(false)
  }

  const handleUpdatePrice = () => {
    if (editingPriceIndex === null || !priceForm.provider) return
    updatePrice(editingPriceIndex, priceForm)
    setIsEditingPrice(false)
    setEditingPriceIndex(null)
    setPriceForm(emptyPrice)
  }

  const closeDetail = () => {
    setSelectedIngredient(null)
    setIsEditing(false)
    setIsEditingPrice(false)
    setIsAddingPrice(false)
    setEditForm(null)
  }

  const inputStyle = "w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Ingredientes</h1>
        <div className="flex gap-2 items-center">
          <Button variant="outline" onClick={() => {
            setEditForm(emptyIngredient)
            setIsAddingNew(true)
            setSelectedIngredient(null)
          }}>
            + Nuevo Ingrediente
          </Button>
          <span className="text-muted-foreground text-sm">{ingredients.length} ingredientes</span>
        </div>
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
            {categoryLabels[cat]}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
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
                    onClick={() => {
                      setSelectedIngredient(ing)
                      setIsAddingNew(false)
                      setIsEditing(false)
                    }}
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

        <div className="lg:col-span-2">
          {selectedIngredient ? (
            <div className="border rounded-lg p-4 space-y-4 sticky top-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre</label>
                    <input 
                      className={inputStyle}
                      value={editForm?.name || ''} 
                      onChange={e => setEditForm({ ...editForm!, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Categoría</label>
                    <select 
                      className={inputStyle}
                      value={editForm?.category} 
                      onChange={e => setEditForm({ ...editForm!, category: e.target.value})}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{categoryLabels[cat]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Función Principal</label>
                    <input 
                      className={inputStyle}
                      value={editForm?.main_function || ''} 
                      onChange={e => setEditForm({ ...editForm!, main_function: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombres Alternativos (separados por coma)</label>
                    <input 
                      className={inputStyle}
                      value={editForm?.alternative_names.join(', ') || ''} 
                      onChange={e => setEditForm({ ...editForm!, alternative_names: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Estado Físico</label>
                    <input 
                      className={inputStyle}
                      value={editForm?.characteristics.physical_state || ''} 
                      onChange={e => setEditForm({ ...editForm!, characteristics: { ...editForm!.characteristics, physical_state: e.target.value }})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">pH</label>
                    <input 
                      className={inputStyle}
                      value={editForm?.characteristics.ph?.toString() || ''} 
                      onChange={e => setEditForm({ ...editForm!, characteristics: { ...editForm!.characteristics, ph: e.target.value || null }})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nivel de Riesgo</label>
                    <select 
                      className={inputStyle}
                      value={editForm?.safety.risk_level} 
                      onChange={e => setEditForm({ ...editForm!, safety: { ...editForm!.safety, risk_level: e.target.value }})}
                    >
                      <option value="ninguno">Ninguno</option>
                      <option value="bajo">Bajo</option>
                      <option value="medio">Medio</option>
                      <option value="alto">Alto</option>
                      <option value="muy alto">Muy Alto</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Notas</label>
                    <textarea 
                      className={inputStyle}
                      rows={3}
                      value={editForm?.characteristics.notes || ''} 
                      onChange={e => setEditForm({ ...editForm!, characteristics: { ...editForm!.characteristics, notes: e.target.value || null }})}
                    />
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-sm">Precios de Proveedores</h4>
                      {isEditing && (
                        <Button variant="outline" size="sm" onClick={() => {
                          setPriceForm(emptyPrice)
                          setIsAddingPrice(true)
                          setIsEditingPrice(false)
                        }}>+ Precio</Button>
                      )}
                    </div>

                    {ingredientPrices.length > 0 && (
                      <input
                        type="text"
                        placeholder="Filtrar proveedor..."
                        className={`${inputStyle} mb-2`}
                        value={priceFilter}
                        onChange={e => setPriceFilter(e.target.value)}
                      />
                    )}

                    {(isAddingPrice || isEditingPrice) && (
                      <div className="border rounded-lg p-3 space-y-3 mb-3 bg-muted/50">
                        <div>
                          <label className="block text-xs font-medium mb-1">Proveedor</label>
                          <input 
                            className={inputStyle}
                            value={priceForm.provider} 
                            onChange={e => setPriceForm({ ...priceForm, provider: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Producto</label>
                          <input 
                            className={inputStyle}
                            value={priceForm.product_name} 
                            onChange={e => setPriceForm({ ...priceForm, product_name: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs font-medium mb-1">Precio</label>
                            <input 
                              type="number"
                              className={inputStyle}
                              value={priceForm.price} 
                              onChange={e => setPriceForm({ ...priceForm, price: Number(e.target.value) })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Cantidad</label>
                            <input 
                              type="number"
                              className={inputStyle}
                              value={priceForm.quantity} 
                              onChange={e => setPriceForm({ ...priceForm, quantity: Number(e.target.value) })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Unidad</label>
                            <select 
                              className={inputStyle}
                              value={priceForm.unit}
                              onChange={e => setPriceForm({ ...priceForm, unit: e.target.value})}
                            >
                              <option value="kg">kg</option>
                              <option value="g">g</option>
                              <option value="L">L</option>
                              <option value="ml">ml</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium mb-1">Tiempo entrega (días)</label>
                            <input 
                              type="number"
                              className={inputStyle}
                              value={priceForm.delivery_time_days} 
                              onChange={e => setPriceForm({ ...priceForm, delivery_time_days: Number(e.target.value) })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">$/unidad</label>
                            <input 
                              type="number"
                              className={inputStyle}
                              value={priceForm.price_per_unit} 
                              onChange={e => setPriceForm({ ...priceForm, price_per_unit: Number(e.target.value) })}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {isEditingPrice ? (
                            <>
                              <Button size="sm" onClick={handleUpdatePrice}>Actualizar</Button>
                              <Button variant="outline" size="sm" onClick={() => {
                                setIsEditingPrice(false)
                                setEditingPriceIndex(null)
                                setPriceForm(emptyPrice)
                              }}>Cancelar</Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" onClick={handleAddPrice}>Agregar</Button>
                              <Button variant="outline" size="sm" onClick={() => setIsAddingPrice(false)}>Cancelar</Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {filteredPrices.length > 0 ? (
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="text-left p-2">Proveedor</th>
                              <th className="text-left p-2">Producto</th>
                              <th className="text-right p-2">Precio</th>
                              <th className="text-right p-2">$/ud</th>
                              <th className="text-right p-2">Días</th>
                              <th className="p-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredPrices.map((p, i) => {
                              const priceIndex = prices.indexOf(p)
                              return (
                                <tr key={i} className="border-t">
                                  <td className="p-2">{p.provider}</td>
                                  <td className="p-2 text-muted-foreground">{p.product_name}</td>
                                  <td className="p-2 text-right">${p.price.toLocaleString()}</td>
                                  <td className="p-2 text-right">${p.price_per_unit.toLocaleString()}/{p.unit}</td>
                                  <td className="p-2 text-right">{p.delivery_time_days}</td>
                                  <td className="p-2">
                                    {isEditing && (
                                      <div className="flex gap-1">
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => handleEditPrice(priceIndex)}
                                        >
                                          ✎
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => deletePrice(priceIndex)}
                                        >
                                          ✕
                                        </Button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sin precios registrados</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSave}>Guardar</Button>
                    <Button variant="outline" onClick={() => {
                      setIsEditing(false)
                      setEditForm(null)
                    }}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{selectedIngredient.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedIngredient.id}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditForm({ ...selectedIngredient })
                        setIsEditing(true)
                      }}>Editar</Button>
                      <Button variant="ghost" size="sm" onClick={closeDetail}>✕</Button>
                    </div>
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

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-sm">Precios de Proveedores</h4>
                      {isEditing && (
                        <Button variant="outline" size="sm" onClick={() => {
                          setPriceForm(emptyPrice)
                          setIsAddingPrice(true)
                          setIsEditingPrice(false)
                        }}>+ Precio</Button>
                      )}
                    </div>

                    {ingredientPrices.length > 0 && (
                      <input
                        type="text"
                        placeholder="Filtrar proveedor..."
                        className={`${inputStyle} mb-2`}
                        value={priceFilter}
                        onChange={e => setPriceFilter(e.target.value)}
                      />
                    )}

                    {(isAddingPrice || isEditingPrice) && (
                      <div className="border rounded-lg p-3 space-y-3 mb-3 bg-muted/50">
                        <div>
                          <label className="block text-xs font-medium mb-1">Proveedor</label>
                          <input 
                            className={inputStyle}
                            value={priceForm.provider} 
                            onChange={e => setPriceForm({ ...priceForm, provider: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Producto</label>
                          <input 
                            className={inputStyle}
                            value={priceForm.product_name} 
                            onChange={e => setPriceForm({ ...priceForm, product_name: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs font-medium mb-1">Precio</label>
                            <input 
                              type="number"
                              className={inputStyle}
                              value={priceForm.price} 
                              onChange={e => setPriceForm({ ...priceForm, price: Number(e.target.value) })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Cantidad</label>
                            <input 
                              type="number"
                              className={inputStyle}
                              value={priceForm.quantity} 
                              onChange={e => setPriceForm({ ...priceForm, quantity: Number(e.target.value) })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Unidad</label>
                            <select 
                              className={inputStyle}
                              value={priceForm.unit}
                              onChange={e => setPriceForm({ ...priceForm, unit: e.target.value})}
                            >
                              <option value="kg">kg</option>
                              <option value="g">g</option>
                              <option value="L">L</option>
                              <option value="ml">ml</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium mb-1">Tiempo entrega (días)</label>
                            <input 
                              type="number"
                              className={inputStyle}
                              value={priceForm.delivery_time_days} 
                              onChange={e => setPriceForm({ ...priceForm, delivery_time_days: Number(e.target.value) })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">$/unidad</label>
                            <input 
                              type="number"
                              className={inputStyle}
                              value={priceForm.price_per_unit} 
                              onChange={e => setPriceForm({ ...priceForm, price_per_unit: Number(e.target.value) })}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {isEditingPrice ? (
                            <>
                              <Button size="sm" onClick={handleUpdatePrice}>Actualizar</Button>
                              <Button variant="outline" size="sm" onClick={() => {
                                setIsEditingPrice(false)
                                setEditingPriceIndex(null)
                                setPriceForm(emptyPrice)
                              }}>Cancelar</Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" onClick={handleAddPrice}>Agregar</Button>
                              <Button variant="outline" size="sm" onClick={() => setIsAddingPrice(false)}>Cancelar</Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {filteredPrices.length > 0 ? (
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="text-left p-2">Proveedor</th>
                              <th className="text-left p-2">Producto</th>
                              <th className="text-right p-2">Precio</th>
                              <th className="text-right p-2">$/ud</th>
                              <th className="text-right p-2">Días</th>
                              <th className="p-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredPrices.map((p, i) => {
                              const priceIndex = prices.indexOf(p)
                              return (
                                <tr key={i} className="border-t">
                                  <td className="p-2">{p.provider}</td>
                                  <td className="p-2 text-muted-foreground">{p.product_name}</td>
                                  <td className="p-2 text-right">${p.price.toLocaleString()}</td>
                                  <td className="p-2 text-right">${p.price_per_unit.toLocaleString()}/{p.unit}</td>
                                  <td className="p-2 text-right">{p.delivery_time_days}</td>
                                  <td className="p-2">
                                    {isEditing && (
                                      <div className="flex gap-1">
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => handleEditPrice(priceIndex)}
                                        >
                                          ✎
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => deletePrice(priceIndex)}
                                        >
                                          ✕
                                        </Button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sin precios registrados</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : isAddingNew && editForm ? (
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold">Nuevo Ingrediente</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre</label>
                  <input 
                    className={inputStyle}
                    value={editForm.name || ''} 
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Categoría</label>
                  <select 
                    className={inputStyle}
                    value={editForm.category} 
                    onChange={e => setEditForm({ ...editForm, category: e.target.value})}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{categoryLabels[cat]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Función Principal</label>
                  <input 
                    className={inputStyle}
                    value={editForm.main_function || ''} 
                    onChange={e => setEditForm({ ...editForm, main_function: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nombres Alternativos (separados por coma)</label>
                  <input 
                    className={inputStyle}
                    value={editForm.alternative_names.join(', ') || ''} 
                    onChange={e => setEditForm({ ...editForm, alternative_names: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Estado Físico</label>
                  <input 
                    className={inputStyle}
                    value={editForm.characteristics.physical_state || ''} 
                    onChange={e => setEditForm({ ...editForm, characteristics: { ...editForm.characteristics, physical_state: e.target.value }})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">pH</label>
                  <input 
                    className={inputStyle}
                    value={editForm.characteristics.ph?.toString() || ''} 
                    onChange={e => setEditForm({ ...editForm, characteristics: { ...editForm.characteristics, ph: e.target.value || null }})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nivel de Riesgo</label>
                  <select 
                    className={inputStyle}
                    value={editForm.safety.risk_level} 
                    onChange={e => setEditForm({ ...editForm, safety: { ...editForm.safety, risk_level: e.target.value }})}
                  >
                    <option value="ninguno">Ninguno</option>
                    <option value="bajo">Bajo</option>
                    <option value="medio">Medio</option>
                    <option value="alto">Alto</option>
                    <option value="muy alto">Muy Alto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notas</label>
                  <textarea 
                    className={inputStyle}
                    rows={3}
                    value={editForm.characteristics.notes || ''} 
                    onChange={e => setEditForm({ ...editForm, characteristics: { ...editForm.characteristics, notes: e.target.value || null }})}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave}>Crear Ingrediente</Button>
                  <Button variant="outline" onClick={() => {
                    setIsAddingNew(false)
                    setEditForm(null)
                  }}>Cancelar</Button>
                </div>
              </div>
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