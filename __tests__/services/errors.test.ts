/**
 * Unit tests for `src/services/api/errors.ts`.
 */

import { ApiError, isRetryable, normalizeErrorResponse, toError } from '@/services/api/errors';

// ── ApiError ──────────────────────────────────────────────────────────────

describe('ApiError', () => {
  describe('given standard constructor args, when created', () => {
    it('then has correct name, status, code, message, retryable', () => {
      const err = new ApiError(404, 'NOT_FOUND', 'Resource not found', false);

      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(ApiError);
      expect(err.name).toBe('ApiError');
      expect(err.status).toBe(404);
      expect(err.code).toBe('NOT_FOUND');
      expect(err.message).toBe('Resource not found');
      expect(err.retryable).toBe(false);
    });

    it('then retryable=true is preserved', () => {
      const err = new ApiError(503, 'SERVICE_UNAVAILABLE', 'Down', true);
      expect(err.retryable).toBe(true);
    });
  });
});

// ── isRetryable ───────────────────────────────────────────────────────────

describe('isRetryable', () => {
  it('returns false for 400', () => expect(isRetryable(400)).toBe(false));
  it('returns false for 401', () => expect(isRetryable(401)).toBe(false));
  it('returns false for 403', () => expect(isRetryable(403)).toBe(false));
  it('returns false for 404', () => expect(isRetryable(404)).toBe(false));
  it('returns false for 422', () => expect(isRetryable(422)).toBe(false));
  it('returns true for 429', () => expect(isRetryable(429)).toBe(true));
  it('returns true for 500', () => expect(isRetryable(500)).toBe(true));
  it('returns true for 502', () => expect(isRetryable(502)).toBe(true));
  it('returns true for 503', () => expect(isRetryable(503)).toBe(true));
  it('returns true for 504', () => expect(isRetryable(504)).toBe(true));
});

// ── normalizeErrorResponse ────────────────────────────────────────────────

describe('normalizeErrorResponse', () => {
  function makeResponse(
    status: number,
    body: unknown,
    contentType = 'application/json',
  ): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': contentType },
    });
  }

  describe('given a 500 JSON response with code and message', () => {
    it('then returns ApiError with those values', async () => {
      const response = makeResponse(500, {
        code: 'DB_ERROR',
        message: 'Database connection failed',
      });

      const err = await normalizeErrorResponse(response);

      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(500);
      expect(err.code).toBe('DB_ERROR');
      expect(err.message).toBe('Database connection failed');
      expect(err.retryable).toBe(true);
    });
  });

  describe('given a 403 response with error field instead of message', () => {
    it('then uses the error field as message', async () => {
      const response = makeResponse(403, { code: 'FORBIDDEN', error: 'Access denied' });

      const err = await normalizeErrorResponse(response);

      expect(err.status).toBe(403);
      expect(err.code).toBe('FORBIDDEN');
      expect(err.message).toBe('Access denied');
    });
  });

  describe('given a non-JSON response body', () => {
    it('then falls back to synthesized code and generic message', async () => {
      const response = new Response('<html>Internal Error</html>', {
        status: 502,
        headers: { 'Content-Type': 'text/html' },
      });

      const err = await normalizeErrorResponse(response);

      expect(err.status).toBe(502);
      expect(err.code).toBe('UNKNOWN');
      expect(err.message).toContain('502');
    });
  });

  describe('given a response with no code field', () => {
    it('then synthesizes code=UNKNOWN', async () => {
      const response = makeResponse(422, { message: 'Validation failed' });

      const err = await normalizeErrorResponse(response);

      expect(err.code).toBe('UNKNOWN');
      expect(err.message).toBe('Validation failed');
    });
  });
});

// ── toError ───────────────────────────────────────────────────────────────

describe('toError', () => {
  describe('given an existing Error instance', () => {
    it('then returns it unchanged', () => {
      const original = new Error('original');
      expect(toError(original, 'ctx')).toBe(original);
    });
  });

  describe('given a non-Error value', () => {
    it('then wraps it in a new Error with context prefix', () => {
      const result = toError('string error', 'myFunction');
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('myFunction');
      expect(result.message).toContain('string error');
    });

    it('then handles null gracefully', () => {
      const result = toError(null, 'ctx');
      expect(result.message).toContain('null');
    });

    it('then handles plain object gracefully', () => {
      const result = toError({ code: 42 }, 'ctx');
      expect(result).toBeInstanceOf(Error);
    });
  });
});
