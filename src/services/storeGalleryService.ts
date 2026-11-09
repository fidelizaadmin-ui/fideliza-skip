import pb from '@/lib/pocketbase/client'
import { StoreGalleryPhotoRecord } from '@/types'

/**
 * Obtém a URL pública de uma foto da galeria
 */
export function getGalleryPhotoUrl(photo: StoreGalleryPhotoRecord, thumb?: string): string {
  if (!photo?.photo_file) return ''
  return pb.files.getURL(photo as any, photo.photo_file, thumb ? { thumb } : undefined)
}

/**
 * Lista todas as fotos da galeria de uma loja específica, ordenadas por ordem/criação
 */
export async function listStoreGalleryPhotos(storeId: string): Promise<StoreGalleryPhotoRecord[]> {
  try {
    if (!storeId) return []
    return await pb.collection('store_gallery_photos').getFullList<StoreGalleryPhotoRecord>({
      filter: `store = "${storeId}"`,
      sort: 'sort_order,created',
    })
  } catch (error) {
    console.error('Erro ao listar fotos da galeria:', error)
    return []
  }
}

/**
 * Faz upload de uma foto para a galeria da loja
 */
export async function uploadGalleryPhoto(
  storeId: string,
  file: File,
  title?: string,
  sortOrder?: number,
): Promise<StoreGalleryPhotoRecord> {
  const formData = new FormData()
  formData.append('store', storeId)
  formData.append('photo_file', file)
  if (title?.trim()) {
    formData.append('title', title.trim())
  }
  if (typeof sortOrder === 'number') {
    formData.append('sort_order', String(sortOrder))
  }

  return await pb.collection('store_gallery_photos').create<StoreGalleryPhotoRecord>(formData)
}

/**
 * Faz upload de múltiplas fotos em lote, retornando os registros criados e eventuais falhas
 */
export async function uploadMultipleGalleryPhotos(
  storeId: string,
  files: File[],
  onProgress?: (completed: number, total: number) => void,
): Promise<{
  success: StoreGalleryPhotoRecord[]
  errors: { fileName: string; message: string }[]
}> {
  const success: StoreGalleryPhotoRecord[] = []
  const errors: { fileName: string; message: string }[] = []

  let completed = 0
  const total = files.length

  for (const file of files) {
    try {
      // Validação de tamanho (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error(`A foto "${file.name}" ultrapassa o limite de 10MB.`)
      }

      // Validação de tipo de arquivo
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!validTypes.includes(file.type)) {
        throw new Error(`O arquivo "${file.name}" não é uma imagem válida (JPG, PNG, WEBP).`)
      }

      const record = await uploadGalleryPhoto(storeId, file)
      success.push(record)
    } catch (err: any) {
      console.error(`Falha no upload de ${file.name}:`, err)
      errors.push({
        fileName: file.name,
        message: err?.message || 'Falha ao enviar arquivo',
      })
    } finally {
      completed++
      onProgress?.(completed, total)
    }
  }

  return { success, errors }
}

/**
 * Exclui uma foto da galeria
 */
export async function deleteGalleryPhoto(photoId: string): Promise<boolean> {
  try {
    await pb.collection('store_gallery_photos').delete(photoId)
    return true
  } catch (error) {
    console.error('Erro ao excluir foto da galeria:', error)
    throw error
  }
}
