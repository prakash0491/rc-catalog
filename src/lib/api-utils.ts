export function buildApiSuccess<T>(data: T) {
  return {
    success: true,
    data,
  };
}

export function buildApiError(message: string, code: string) {
  return {
    success: false,
    error: {
      message,
      code,
    },
  };
}

export function parsePaginationParams(page?: string, limit?: string) {
  const safePage = Number(page ?? '1');
  const safeLimit = Number(limit ?? '12');

  return {
    page: Number.isFinite(safePage) && safePage > 0 ? safePage : 1,
    limit: Number.isFinite(safeLimit) && safeLimit > 0 ? Math.min(safeLimit, 100) : 12,
  };
}

export function parseQueryParam(value?: string) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
