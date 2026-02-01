export type ApiErrorField = {
  field: string;
  message: string;
  received?: unknown;
};

export type ApiErrorPayload = {
  status: string;
  code: number;
  message?: string;
  errors?: ApiErrorField[];
};
