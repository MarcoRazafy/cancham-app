export function codeRepresentant(code: string, rang: number): string {
  return rang === 0 ? code : `${code}-${rang + 1}`;
}

export function codeInscription(code: string): string {
  return code.replace(/-\d{1,2}$/, "");
}

export function estCodeInscription(code: string): boolean {
  return /^CC-[A-Z0-9]+-[A-Z0-9]{4,8}$/.test(code);
}

export function extraireCode(lu: string): string {
  return (
    /CC-[A-Z0-9]+-[A-Z0-9]{4,8}(?:-\d{1,2})?/i.exec(lu)?.[0].toUpperCase() ??
    lu.trim()
  );
}
