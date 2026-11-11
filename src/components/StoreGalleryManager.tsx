import React, { useState, useEffect, useRef } from 'react'
import { StoreGalleryPhotoRecord, StoreRecord } from '@/types'
import {
  listStoreGalleryPhotos,
  uploadMultipleGalleryPhotos,
  deleteGalleryPhoto,
  getGalleryPhotoUrl,
} from '@/services/storeGalleryService'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  Images,
  Upload,
  Trash2,
  Loader2,
  ZoomIn,
  AlertCircle,
  Sparkles,
  Info,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { getStorePublicUrl } from '@/lib/storeUrl'

interface StoreGalleryManagerProps {
  store: StoreRecord | null
  isMerchantSuspended?: boolean
  onPhotosCountChange?: (count: number) => void
}

export const StoreGalleryManager: React.FC<StoreGalleryManagerProps> = ({
  store,
  isMerchantSuspended = false,
  onPhotosCountChange,
}) => {
  const [photos, setPhotos] = useState<StoreGalleryPhotoRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ completed: number; total: number } | null>(
    null,
  )
  const [isDragOver, setIsDragOver] = useState(false)

  // Exclusão com confirmação
  const [photoToDelete, setPhotoToDelete] = useState<StoreGalleryPhotoRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Visualização ampliada (lightbox do lojista)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const loadPhotos = async () => {
    if (!store?.id) {
      setPhotos([])
      setIsLoading(false)
      onPhotosCountChange?.(0)
      return
    }

    setIsLoading(true)
    try {
      const data = await listStoreGalleryPhotos(store.id)
      setPhotos(data)
      onPhotosCountChange?.(data.length)
    } catch (err) {
      console.error('Erro ao carregar fotos da galeria:', err)
      toast({
        title: 'Erro ao carregar galeria',
        description: 'Não foi possível carregar as fotos salvas.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPhotos()
  }, [store?.id])

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !store) return

    if (isMerchantSuspended) {
      toast({
        title: 'Operação bloqueada',
        description: 'Seu acesso está temporariamente suspenso para novas alterações.',
        variant: 'destructive',
      })
      return
    }

    const files = Array.from(fileList)
    setIsUploading(true)
    setUploadProgress({ completed: 0, total: files.length })

    try {
      const { success, errors } = await uploadMultipleGalleryPhotos(
        store.id,
        files,
        (completed, total) => {
          setUploadProgress({ completed, total })
        },
      )

      if (success.length > 0) {
        setPhotos((prev) => {
          const updated = [...prev, ...success]
          onPhotosCountChange?.(updated.length)
          return updated
        })
        toast({
          title: success.length === 1 ? 'Foto adicionada!' : `${success.length} fotos adicionadas!`,
          description: 'As imagens já estão disponíveis na galeria da sua loja.',
        })
      }

      if (errors.length > 0) {
        toast({
          title: 'Algumas fotos não puderam ser enviadas',
          description: errors.map((e) => `${e.fileName}: ${e.message}`).join(' | '),
          variant: 'destructive',
        })
      }
    } catch (err: any) {
      console.error('Erro no upload múltiplo:', err)
      toast({
        title: 'Falha no envio',
        description: err?.message || 'Ocorreu um erro ao enviar as fotos.',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteConfirm = async () => {
    if (!photoToDelete) return

    setIsDeleting(true)
    try {
      await deleteGalleryPhoto(photoToDelete.id)
      setPhotos((prev) => {
        const next = prev.filter((p) => p.id !== photoToDelete.id)
        onPhotosCountChange?.(next.length)
        return next
      })
      toast({
        title: 'Foto excluída',
        description: 'A imagem foi removida da galeria com sucesso.',
      })
      setPhotoToDelete(null)
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir',
        description: err?.message || 'Não foi possível remover a imagem.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files) {
      handleFilesSelected(e.dataTransfer.files)
    }
  }

  const handleNextPreview = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (previewIndex === null || photos.length === 0) return
    setPreviewIndex((previewIndex + 1) % photos.length)
  }

  const handlePrevPreview = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (previewIndex === null || photos.length === 0) return
    setPreviewIndex((previewIndex - 1 + photos.length) % photos.length)
  }

  if (!store) {
    return (
      <Card className="rounded-3xl p-8 text-center max-w-lg mx-auto border-slate-200">
        <Images className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 mb-1">Cadastre sua loja primeiro</h3>
        <p className="text-xs text-slate-500">
          Preencha os dados da sua loja para habilitar o envio de fotos dos seus produtos e serviços
          na galeria.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* CARD PRINCIPAL DE GESTÃO DA GALERIA */}
      <Card className="rounded-3xl border-slate-200 shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Images className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                    Galeria de Fotos
                    <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px] font-bold">
                      {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Divulgue fotos de produtos, serviços, pratos, ambiente e novidades na página
                    pública da sua loja
                  </CardDescription>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {store.slug && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(getStorePublicUrl(store.slug), '_blank', 'noopener,noreferrer')
                  }
                  className="rounded-xl text-xs font-semibold border-slate-300"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                  Ver Página Pública
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* ÁREA DE UPLOAD (DRAG & DROP / BOTÃO) */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
              isDragOver
                ? 'border-rose-500 bg-rose-50/70 scale-[1.01]'
                : 'border-slate-300 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
              disabled={isUploading || isMerchantSuspended}
            />

            <div className="max-w-md mx-auto flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3 shadow-xs">
                {isUploading ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <Upload className="w-7 h-7" />
                )}
              </div>

              {isUploading ? (
                <div className="space-y-2 w-full max-w-xs">
                  <p className="text-sm font-bold text-slate-900">
                    Enviando fotos...{' '}
                    {uploadProgress && `(${uploadProgress.completed}/${uploadProgress.total})`}
                  </p>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-rose-600 h-full transition-all duration-300 rounded-full"
                      style={{
                        width: uploadProgress
                          ? `${(uploadProgress.completed / uploadProgress.total) * 100}%`
                          : '0%',
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Aguarde o processamento das imagens no servidor...
                  </p>
                </div>
              ) : (
                <>
                  <h4 className="text-sm font-black text-slate-900 mb-1">
                    Arraste suas fotos aqui ou clique para selecionar
                  </h4>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    Envie quantas fotos quiser para divulgar seus produtos e serviços. Formatos
                    suportados: JPG, PNG, WEBP (até 10MB cada).
                  </p>

                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isMerchantSuspended}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs px-5 py-2"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Selecionar Fotos do Dispositivo
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* DICAS DE MARKETING */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span className="font-bold">Dica para aumentar suas vendas:</span> Fotos reais dos
              seus produtos, pratos, cortes de cabelo ou espaço físico aumentam em até 70% a adesão
              ao programa de fidelidade e os agendamentos online.
            </div>
          </div>

          {/* GRADE DE MINIATURAS DAS FOTOS */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Images className="w-3.5 h-3.5 text-slate-500" />
                Fotos Cadastradas ({photos.length})
              </h4>
              {photos.length > 0 && (
                <span className="text-[11px] text-slate-400">Clique numa foto para ampliar</span>
              )}
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <p className="text-xs font-medium">Carregando galeria...</p>
              </div>
            ) : photos.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/40">
                <Images className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Nenhuma foto adicionada ainda</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-0.5">
                  Use a área acima para adicionar as primeiras fotos dos seus produtos e serviços.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {photos.map((photo, index) => {
                  const url = getGalleryPhotoUrl(photo)
                  return (
                    <div
                      key={photo.id}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer"
                      onClick={() => setPreviewIndex(index)}
                    >
                      <img
                        src={url}
                        alt={photo.title || `Foto ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />

                      {/* Gradiente de overlay ao passar o mouse */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              setPhotoToDelete(photo)
                            }}
                            className="w-7 h-7 rounded-lg bg-rose-600/90 hover:bg-rose-700 text-white shadow-xs"
                            title="Excluir foto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between text-white text-[10px] font-medium">
                          <span className="flex items-center gap-1 drop-shadow-sm">
                            <ZoomIn className="w-3 h-3" />
                            Ampliar
                          </span>
                          <span className="bg-black/50 px-1.5 py-0.5 rounded text-[9px]">
                            #{index + 1}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* DIÁLOGO DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <AlertDialog
        open={Boolean(photoToDelete)}
        onOpenChange={(open) => !open && setPhotoToDelete(null)}
      >
        <AlertDialogContent className="rounded-3xl max-w-sm">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <Trash2 className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-center text-lg font-black text-slate-900">
              Excluir esta foto?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs text-slate-500 leading-relaxed">
              Esta ação removerá a imagem permanentemente da galeria da sua loja no portal público.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {photoToDelete && (
            <div className="w-24 h-24 rounded-xl overflow-hidden mx-auto my-2 border border-slate-200 shadow-inner">
              <img
                src={getGalleryPhotoUrl(photoToDelete)}
                alt="Foto a excluir"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <AlertDialogCancel
              disabled={isDeleting}
              className="rounded-xl text-xs font-bold w-full sm:w-auto"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white w-full sm:w-auto"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Sim, Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL / LIGHTBOX DE VISUALIZAÇÃO AMPLIADA DO LOJISTA */}
      <Dialog open={previewIndex !== null} onOpenChange={(open) => !open && setPreviewIndex(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-0 rounded-3xl overflow-hidden text-white shadow-2xl">
          {previewIndex !== null && photos[previewIndex] && (
            <div className="relative flex flex-col items-center justify-center min-h-[300px] max-h-[85vh]">
              {/* Barra superior do modal */}
              <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                <span className="text-xs font-semibold text-slate-300 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-md">
                  Foto {previewIndex + 1} de {photos.length}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const cur = photos[previewIndex]
                      setPreviewIndex(null)
                      setPhotoToDelete(cur)
                    }}
                    className="h-8 px-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setPreviewIndex(null)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Imagem em tela cheia */}
              <div className="w-full h-full flex items-center justify-center p-4 pt-16 pb-12 overflow-hidden">
                <img
                  src={getGalleryPhotoUrl(photos[previewIndex])}
                  alt={`Foto ${previewIndex + 1}`}
                  className="max-h-[75vh] max-w-full object-contain rounded-xl select-none"
                />
              </div>

              {/* Botões de navegação anterior/próxima */}
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevPreview}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition-all active:scale-95 z-20"
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextPreview}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition-all active:scale-95 z-20"
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
    </div>
  )
}
