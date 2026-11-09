import React, { useState } from 'react'
import { StoreGalleryPhotoRecord } from '@/types'
import { getGalleryPhotoUrl } from '@/services/storeGalleryService'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Images, ZoomIn, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react'

interface StorePublicGalleryProps {
  photos: StoreGalleryPhotoRecord[]
  storeName: string
}

export const StorePublicGallery: React.FC<StorePublicGalleryProps> = ({ photos, storeName }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  // Critério de aceitação 4: loja sem fotos cadastradas não mostra a seção
  if (!photos || photos.length === 0) {
    return null
  }

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (selectedIndex === null) return
    setSelectedIndex((selectedIndex + 1) % photos.length)
  }

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (selectedIndex === null) return
    setSelectedIndex((selectedIndex - 1 + photos.length) % photos.length)
  }

  return (
    <>
      <div className="p-6 rounded-3xl border border-rose-200/80 bg-gradient-to-br from-rose-50/40 via-white to-pink-50/30 space-y-4">
        {/* Cabeçalho da seção de galeria */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Images className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-base sm:text-lg">Galeria de Fotos</h3>
                <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px] font-bold">
                  {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Conheça nossos produtos, serviços e o espaço de {storeName}
              </p>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Clique na imagem para ampliar
          </span>
        </div>

        {/* Grade de fotos responsiva */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 pt-1">
          {photos.map((photo, index) => {
            const url = getGalleryPhotoUrl(photo)
            return (
              <div
                key={photo.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedIndex(index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedIndex(index)
                  }
                }}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                aria-label={`Visualizar foto ${index + 1} de ${storeName}`}
              >
                <img
                  src={url}
                  alt={photo.title || `Foto de ${storeName} ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Overlay com hover para desktop / feedback sutil */}
                <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-md scale-90 group-hover:scale-100 transition-transform">
                    <ZoomIn className="w-5 h-5 text-rose-600" />
                  </div>
                </div>

                {/* Badge com numeração no canto */}
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-full shadow-xs">
                  {index + 1}/{photos.length}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal / Lightbox com navegação anterior/próxima */}
      <Dialog
        open={selectedIndex !== null}
        onOpenChange={(open) => !open && setSelectedIndex(null)}
      >
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-0 rounded-3xl overflow-hidden text-white shadow-2xl">
          {selectedIndex !== null && photos[selectedIndex] && (
            <div className="relative flex flex-col items-center justify-center min-h-[320px] max-h-[85vh]">
              {/* Barra superior do lightbox */}
              <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-200 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                    {selectedIndex + 1} de {photos.length}
                  </span>
                  <span className="text-xs text-slate-300 font-medium truncate max-w-[200px] sm:max-w-md hidden sm:inline">
                    {storeName}
                  </span>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedIndex(null)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white"
                  aria-label="Fechar visualização"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Área da foto ampliada */}
              <div className="w-full h-full flex items-center justify-center p-4 pt-16 pb-12 overflow-hidden">
                <img
                  src={getGalleryPhotoUrl(photos[selectedIndex])}
                  alt={photos[selectedIndex].title || `Foto ampliada de ${storeName}`}
                  className="max-h-[75vh] max-w-full object-contain rounded-xl select-none"
                />
              </div>

              {/* Botões de navegação anterior/próxima */}
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition-all active:scale-95 z-20"
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition-all active:scale-95 z-20"
                    aria-label="Próxima foto"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
