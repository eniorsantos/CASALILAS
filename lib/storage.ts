/**
 * Upload genérico para R2/S3. Implementação mínima: em produção trocar
 * por @aws-sdk/client-s3 com as credenciais do bucket.
 * Retorna a URL pública do arquivo.
 */
export async function uploadToStorage(key: string, body: Buffer): Promise<string> {
  const base = process.env.STORAGE_PUBLIC_URL ?? "https://storage.local";
  // TODO: integrar S3/R2 real. Por ora apenas simula o upload.
  void body;
  return `${base}/${key}`;
}
