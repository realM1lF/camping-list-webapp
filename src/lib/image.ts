/** Bild für Avatar verkleinern (Quadrat, max. Kantenlänge, JPEG). */
export async function prepareAvatar(file: File, maxSize = 512, quality = 0.85): Promise<File> {
	if (!file.type.startsWith('image/')) {
		throw new Error('Bitte ein Bild wählen.');
	}

	const bitmap = await createImageBitmap(file);
	const side = Math.min(bitmap.width, bitmap.height);
	const sx = (bitmap.width - side) / 2;
	const sy = (bitmap.height - side) / 2;
	const out = Math.min(maxSize, side);

	const canvas = document.createElement('canvas');
	canvas.width = out;
	canvas.height = out;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas nicht verfügbar.');

	ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, out, out);
	bitmap.close();

	const blob = await new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(
			(b) => (b ? resolve(b) : reject(new Error('Bild konnte nicht verarbeitet werden.'))),
			'image/jpeg',
			quality
		);
	});

	return new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
}
