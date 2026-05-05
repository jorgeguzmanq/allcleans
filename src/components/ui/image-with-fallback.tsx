'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export type ImageSize = 'thumbnail' | 'small' | 'medium' | 'large'

const sizeClasses: Record<ImageSize, string> = {
  thumbnail: 'w-10 h-10',
  small: 'w-16 h-16',
  medium: 'w-32 h-32',
  large: 'w-48 h-48'
}

const sizesMap: Record<ImageSize, string> = {
  thumbnail: '40px',
  small: '64px',
  medium: '128px',
  large: '100vw'
}

interface ImageWithFallbackProps {
  src?: string
  alt: string
  size?: ImageSize
  className?: string
  objectFit?: 'cover' | 'contain'
}

function GradientPlaceholder({ alt, size, className }: { alt: string; size: ImageSize; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg',
        'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300',
        sizeClasses[size],
        className
      )}
    >
      <span className="text-gray-400 text-[10px] font-medium px-1 text-center line-clamp-2">
        {alt}
      </span>
    </div>
  )
}

export function ImageWithFallback({
  src,
  alt,
  size = 'medium',
  className,
  objectFit = 'cover'
}: ImageWithFallbackProps) {
  const [imgError, setImgError] = useState(false)
  const hasValidSrc = src && src.length > 0

  if (!hasValidSrc || imgError) {
    return <GradientPlaceholder alt={alt} size={size} className={className} />
  }

  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-muted', sizeClasses[size], className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizesMap[size]}
        unoptimized
        className={cn('object-center', objectFit === 'contain' ? 'object-contain' : 'object-cover')}
        onError={() => setImgError(true)}
      />
    </div>
  )
}

export function getImageSrc(type: 'ingredient' | 'recipe', id: string): string | undefined {
  const images = require('@/lib/data/images.json')
  
  if (type === 'ingredient') {
    return images.ingredients[id]?.image
  }
  return images.recipes[id]?.image
}

export function getImageAlt(type: 'ingredient' | 'recipe', id: string): string {
  const images = require('@/lib/data/images.json')
  
  if (type === 'ingredient') {
    return images.ingredients[id]?.alt || id
  }
  return images.recipes[id]?.alt || id
}

export function hasImage(type: 'ingredient' | 'recipe', id: string): boolean {
  const images = require('@/lib/data/images.json')
  
  if (type === 'ingredient') {
    return !!images.ingredients[id]?.image
  }
  return !!images.recipes[id]?.image
}