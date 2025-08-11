export type ErrorEventInput = {
  timestamp: string;
  userId: string;
  browser: string;
  url: string;
  errorMessage: string;
  stackTrace: string;
};
