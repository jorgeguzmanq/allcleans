'use client'

import { useStore, useHydrated } from '@/lib/store'
import Link from 'next/link'

export default function Home() {
  const { ingredients, recipes, productions } = useStore()
  const mounted = useHydrated()
  const isEmpty = mounted && ingredients.length === 0 && recipes.length === 0

  const categories = [...new Set(ingredients.map(i => i.category))]
  const categoryLabels: Record<string, string> = {
    base: 'Base',
    surfactant: 'Surfactantes',
    modificador_reologico: 'Modificadores',
    regulador_ph: 'Reguladores pH',
    builder: 'Builders',
    emulsificante: 'Emulsificantes',
    humectante: 'Humectantes',
    solvente: 'Solventes',
    desinfectante: 'Desinfectantes',
    aditivo: 'Aditivos',
    conservante: 'Conservantes'
  }

  return (
    <div className="space-y-8">
      <section className="text-center py-8">
        <h2 className="text-4xl font-bold mb-4">Bienvenido a All Cleans</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Plataforma de gestión de fórmulas y recetas para productos químicos de limpieza.
          Administra ingredientes, recetas y calcula producciones.
        </p>
      </section>

      {isEmpty && (
        <section className="rounded-lg border border-dashed bg-card p-6 text-center">
          <h3 className="text-lg font-semibold mb-1">No hay ninguna colección abierta</h3>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Usa el botón <strong>Abrir</strong> (arriba a la derecha) para cargar tu archivo de colección
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">.json</code> con tus ingredientes y recetas.
            ¿No tienes uno? Descarga el{' '}
            <a href="/example-collection.json" download className="text-primary underline">
              archivo de ejemplo
            </a>{' '}
            para ver el formato y empezar a construir el tuyo.
          </p>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Link href="/ingredientes" className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors">
          <div className="text-3xl font-bold">{ingredients.length}</div>
          <div className="text-muted-foreground">Ingredientes</div>
        </Link>
        <Link href="/recetas" className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors">
          <div className="text-3xl font-bold">{recipes.length}</div>
          <div className="text-muted-foreground">Recetas</div>
        </Link>
        <Link href="/produccion" className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors">
          <div className="text-3xl font-bold">+</div>
          <div className="text-muted-foreground">Nueva Producción</div>
        </Link>
        <Link href="/historial" className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors">
          <div className="text-3xl font-bold">{productions.length}</div>
          <div className="text-muted-foreground">Producciones</div>
        </Link>
      </div>

      <section>
        <h3 className="text-2xl font-semibold mb-4">Categorías de Ingredientes</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <span key={cat} className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm">
              {categoryLabels[cat] || cat}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-semibold mb-4">Recetas Disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.slice(0, 6).map(recipe => (
            <Link 
              key={recipe.id} 
              href={`/recetas/${recipe.id}`}
              className="p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
            >
              <h4 className="font-semibold">{recipe.name}</h4>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{recipe.description}</p>
              <div className="text-xs text-muted-foreground mt-2">
                Base: {recipe.base_volume_ml}ml • pH: {recipe.target_ph ? `${recipe.target_ph.min}-${recipe.target_ph.max}` : 'N/A'}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {productions.length > 0 && (
        <section>
          <h3 className="text-2xl font-semibold mb-4">Última Producción</h3>
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{productions[0].recipeName}</h4>
                <p className="text-sm text-muted-foreground">
                  {productions[0].targetAmount} {productions[0].unit} • {new Date(productions[0].createdAt).toLocaleDateString()}
                </p>
              </div>
              <Link 
                href={`/historial/${productions[0].id}`}
                className="text-sm text-primary hover:underline"
              >
                Ver detalles →
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}