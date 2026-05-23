function stripPNGMetadata(buffer: ArrayBuffer): ArrayBuffer {
  const dataView = new DataView(buffer);
  const uint8Array = new Uint8Array(buffer);

  // PNG Magic Number: 137 80 78 71 13 10 26 10
  if (
    uint8Array[0] !== 137 || uint8Array[1] !== 80 ||
    uint8Array[2] !== 78 || uint8Array[3] !== 71 ||
    uint8Array[4] !== 13 || uint8Array[5] !== 10 ||
    uint8Array[6] !== 26 || uint8Array[7] !== 10
  ) {
    return buffer; // Not a PNG
  }

  const chunks: { type: string; data: Uint8Array; crc: Uint8Array; length: number }[] = [];
  let offset = 8;

  while (offset < uint8Array.length) {
    const length = dataView.getUint32(offset);
    const type = String.fromCharCode(
      uint8Array[offset + 4],
      uint8Array[offset + 5],
      uint8Array[offset + 6],
      uint8Array[offset + 7]
    );

    const chunkData = new Uint8Array(buffer, offset + 8, length);
    const crc = new Uint8Array(buffer, offset + 8 + length, 4);

    chunks.push({
      type,
      length,
      data: chunkData,
      crc
    });

    offset += 12 + length;
  }

  // Essential chunks
  const essentialChunks = ['IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS', 'cHRM', 'gAMA', 'iCCP', 'sBIT', 'sRGB', 'bKGD', 'hIST', 'pHYs', 'sPLT'];
  // Actually, standard says critical chunks are: IHDR, PLTE, IDAT, IEND.
  // Wait, let's keep only critical chunks and maybe tRNS for transparency.
  const keepChunks = ['IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS'];

  const filteredChunks = chunks.filter(c => keepChunks.includes(c.type));

  let newSize = 8;
  for (const chunk of filteredChunks) {
    newSize += 12 + chunk.length;
  }

  const newBuffer = new ArrayBuffer(newSize);
  const newUint8Array = new Uint8Array(newBuffer);
  const newDataView = new DataView(newBuffer);

  // Copy magic number
  for (let i = 0; i < 8; i++) {
    newUint8Array[i] = uint8Array[i];
  }

  let writeOffset = 8;
  for (const chunk of filteredChunks) {
    newDataView.setUint32(writeOffset, chunk.length);
    newUint8Array[writeOffset + 4] = chunk.type.charCodeAt(0);
    newUint8Array[writeOffset + 5] = chunk.type.charCodeAt(1);
    newUint8Array[writeOffset + 6] = chunk.type.charCodeAt(2);
    newUint8Array[writeOffset + 7] = chunk.type.charCodeAt(3);

    newUint8Array.set(chunk.data, writeOffset + 8);
    newUint8Array.set(chunk.crc, writeOffset + 8 + chunk.length);

    writeOffset += 12 + chunk.length;
  }

  return newBuffer;
}
