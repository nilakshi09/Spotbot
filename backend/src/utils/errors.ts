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

export class ReportExpiredError extends AppError {
  constructor() {
    super(410, 'This report link has expired', 'REPORT_EXPIRED');
    this.name = 'ReportExpiredError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class InvitationExpiredError extends AppError {
  constructor() {
    super(410, 'This invitation has expired', 'INVITATION_EXPIRED');
    this.name = 'InvitationExpiredError';
  }
}

export class InvitationAlreadyAcceptedError extends AppError {
  constructor() {
    super(409, 'This invitation has already been used', 'INVITATION_ALREADY_ACCEPTED');
    this.name = 'InvitationAlreadyAcceptedError';
  }
}
