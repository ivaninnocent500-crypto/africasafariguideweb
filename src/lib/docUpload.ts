import { supabase } from './supabase'
import { saveUploadedDoc } from './applications'

const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'application/pdf': 'pdf' }
export const MAX_BYTES = 8 * 1024 * 1024

export async function uploadDocument(uid: string, appId: string, key: string, file: File) {
  const ext = TYPES[file.type]
  if (!ext) throw new Error('Use a JPG, PNG or PDF file.')
  if (file.size > MAX_BYTES) throw new Error('That file is larger than 8 MB.')
  const slug = key.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  const path = `${uid}/${appId}/${slug}-${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('visa-documents').upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw new Error('Upload failed. Check your connection and try again.')
  await saveUploadedDoc(appId, key, path)
}
