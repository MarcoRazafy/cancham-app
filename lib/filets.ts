const FILETS = ["filet-vert", "filet-rouge", "filet-bleu", "filet-degrade"];

export function filetDe(graine: string): string {
  let h = 0;
  for (let i = 0; i < graine.length; i++)
    h = (h * 31 + graine.charCodeAt(i)) >>> 0;
  return FILETS[h % FILETS.length];
}
