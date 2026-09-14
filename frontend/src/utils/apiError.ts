interface ApiErrorShape {
  response?: {
    status?: number;
    data?: {
      detail?: string;
    };
  };
  message?: string;
}

export const getApiErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as ApiErrorShape;
  return e?.response?.data?.detail || e?.message || fallback;
};

export const getApiErrorStatus = (err: unknown): number | undefined => {
  const e = err as ApiErrorShape;
  return e?.response?.status;
};

export type { ApiErrorShape };