/** Re-encode locally to cap uploads and strip EXIF/GPS metadata before explicit live analysis. */
export async function prepareSkyPhoto(file: Blob): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      'This browser couldn’t read that image for live analysis. Try a JPG, PNG, or WebP photo.',
    );
  }
  try {
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 80_000_000)
      throw new Error('That image is too large to inspect here. Choose a smaller photo.');
    const scale = Math.min(1, 1568 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser cannot prepare a photo. Try another browser.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const photo = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('The photo could not be prepared.'))),
        'image/jpeg',
        0.82,
      ),
    );
    if (photo.size > 2_000_000)
      throw new Error('That photo is still a little big. Try a smaller image.');
    return photo;
  } finally {
    bitmap.close();
  }
}
export async function imageBase64(image: Blob): Promise<string> {
  const bytes = new Uint8Array(await image.arrayBuffer());
  let binary = '';
  for (let index = 0; index < bytes.length; index += 8192)
    binary += String.fromCharCode(...bytes.subarray(index, index + 8192));
  return btoa(binary);
}
