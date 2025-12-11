/**
 * Formata número de telefone brasileiro
 * Suporta fixo (10 dígitos) e celular (11 dígitos)
 */
export function formatPhoneNumber(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, "");
  
  // Limita a 11 dígitos
  const limited = numbers.slice(0, 11);
  
  // Aplica máscara baseada no tamanho
  if (limited.length <= 2) {
    return limited.length ? `(${limited}` : "";
  }
  if (limited.length <= 6) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  }
  if (limited.length <= 10) {
    // Telefone fixo: (00) 0000-0000
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
  }
  // Celular: (00) 00000-0000
  return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
}

/**
 * Remove formatação e retorna apenas números
 */
export function unformatPhoneNumber(value: string): string {
  return value.replace(/\D/g, "");
}
