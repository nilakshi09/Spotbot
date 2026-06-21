import { AppError } from '../middleware/error-handler.js';

export class ScanLimitError extends AppError {
  constructor(message: string) {
    super(402, message, 'SCAN_LIMIT_REACHED');
    this.name = 'ScanLimitError';
  }
}

export class UpstreamError extends AppError {
  constructor(message: string) {
    super(502, message, 'UPSTREAM_ERROR');
    this.name = 'UpstreamError';
  }
}
