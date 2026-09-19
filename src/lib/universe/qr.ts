import { encode } from "uqr";

export type QrGrid = {
  size: number;
  data: boolean[][];
};

export function qrGrid(text: string): QrGrid {
  const encoded = encode(text, { ecc: "M" });
  return {
    size: encoded.size,
    data: encoded.data as boolean[][],
  };
}

export function qrSvg(text: string, module = 4, extraQuiet = 3): string {
  const { size, data } = qrGrid(text);
  const dim = (size + extraQuiet * 2) * module;
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" width="${dim}" height="${dim}" shape-rendering="crispEdges" fill="#09061a">`,
    `<rect width="${dim}" height="${dim}" fill="#ffffff"/>`,
  ];
  for (let y = 0; y < size; y++) {
    const row = data[y];
    if (!row) continue;
    for (let x = 0; x < size; x++) {
      if (!row[x]) continue;
      parts.push(
        `<rect x="${(x + extraQuiet) * module}" y="${(y + extraQuiet) * module}" width="${module}" height="${module}"/>`,
      );
    }
  }
  parts.push("</svg>");
  return parts.join("");
}
