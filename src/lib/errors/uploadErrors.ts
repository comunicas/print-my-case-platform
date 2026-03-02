/**
 * Utility for creating user-friendly error messages for upload operations
 */

export interface ParsedUploadError {
  title: string;
  description: string;
  isRetryable: boolean;
}

/**
 * Parse Supabase/storage errors into user-friendly messages in Portuguese
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const obj = error as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.error === 'string') return obj.error;
    if (typeof obj.error_description === 'string') return obj.error_description;
    try { return JSON.stringify(error); } catch { /* fall through */ }
  }
  return String(error);
}

export function parseUploadError(error: unknown): ParsedUploadError {
  const errorMessage = extractErrorMessage(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Network/connectivity errors
  if (lowerMessage.includes('fetch') || lowerMessage.includes('network') || lowerMessage.includes('timeout')) {
    return {
      title: 'Erro de conexão',
      description: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
      isRetryable: true,
    };
  }

  // Authentication errors
  if (lowerMessage.includes('jwt') || lowerMessage.includes('token') || lowerMessage.includes('unauthorized') || lowerMessage.includes('401')) {
    return {
      title: 'Sessão expirada',
      description: 'Sua sessão expirou. Por favor, faça login novamente.',
      isRetryable: false,
    };
  }

  // Permission errors
  if (lowerMessage.includes('permission') || lowerMessage.includes('denied') || lowerMessage.includes('403') || lowerMessage.includes('policy')) {
    return {
      title: 'Sem permissão',
      description: 'Você não tem permissão para realizar esta operação.',
      isRetryable: false,
    };
  }

  // Storage quota/size errors
  if (lowerMessage.includes('too large') || lowerMessage.includes('size') || lowerMessage.includes('quota')) {
    return {
      title: 'Arquivo muito grande',
      description: 'O arquivo excede o tamanho máximo permitido. Tente um arquivo menor.',
      isRetryable: false,
    };
  }

  // File type errors
  if (lowerMessage.includes('type') || lowerMessage.includes('format') || lowerMessage.includes('mime')) {
    return {
      title: 'Tipo de arquivo inválido',
      description: 'Este formato de arquivo não é suportado. Use arquivos .xlsx, .xls ou .csv.',
      isRetryable: false,
    };
  }

  // Duplicate/conflict errors
  if (lowerMessage.includes('duplicate') || lowerMessage.includes('conflict') || lowerMessage.includes('already exists')) {
    return {
      title: 'Conflito de dados',
      description: 'Este upload já existe ou há um conflito com dados existentes.',
      isRetryable: false,
    };
  }

  // Storage upload errors
  if (lowerMessage.includes('storage') || lowerMessage.includes('upload')) {
    return {
      title: 'Erro no armazenamento',
      description: 'Não foi possível salvar o arquivo. Tente novamente em alguns instantes.',
      isRetryable: true,
    };
  }

  // Database errors
  if (lowerMessage.includes('violates') || lowerMessage.includes('constraint') || lowerMessage.includes('null')) {
    return {
      title: 'Dados incompletos',
      description: 'Alguns campos obrigatórios estão faltando. Verifique os dados e tente novamente.',
      isRetryable: false,
    };
  }

  // Server errors
  if (lowerMessage.includes('500') || lowerMessage.includes('server') || lowerMessage.includes('internal')) {
    return {
      title: 'Erro do servidor',
      description: 'Ocorreu um erro interno. Nossa equipe foi notificada. Tente novamente mais tarde.',
      isRetryable: true,
    };
  }

  // Default fallback
  return {
    title: 'Erro inesperado',
    description: errorMessage || 'Ocorreu um erro ao processar sua solicitação. Tente novamente.',
    isRetryable: true,
  };
}

/**
 * Parse delete operation errors
 */
export function parseDeleteError(error: unknown): ParsedUploadError {
  const errorMessage = extractErrorMessage(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Admin-only restriction
  if (lowerMessage.includes('administrador') || lowerMessage.includes('admin')) {
    return {
      title: 'Ação restrita',
      description: 'Apenas administradores podem excluir uploads.',
      isRetryable: false,
    };
  }

  // Records still linked
  if (lowerMessage.includes('foreign key') || lowerMessage.includes('referenced') || lowerMessage.includes('constraint')) {
    return {
      title: 'Registros vinculados',
      description: 'Este upload possui registros vinculados que impedem a exclusão.',
      isRetryable: false,
    };
  }

  // Use general parser for other cases
  return parseUploadError(error);
}
