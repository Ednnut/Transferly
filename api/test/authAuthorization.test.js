const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

process.env.NODE_ENV = 'test';
process.env.REDIS_URL = 'redis://127.0.0.1:6379';
process.env.PAYPAL_CLIENT_ID = 'auth-authorization-client';
process.env.PAYPAL_CLIENT_SECRET = 'paypal-client-secret';
process.env.PAYPAL_WEBHOOK_ID = 'auth-authorization-webhook';

const config = require('../config');
const {
  assertCanAccessUserResource,
  resolveUserIdForRequest
} = require('../middleware/authenticateRequest');
const { requireAdminActor } = require('../middleware/requireAdminActor');

function invokeMiddleware(middleware, request) {
  let nextError;
  middleware(request, {}, (error) => {
    nextError = error || null;
  });
  return nextError;
}

describe('authorization middleware', () => {
  test('admin routes fail closed even when the legacy admin-token flag is disabled', () => {
    const originalAdminAuthEnabled = config.ADMIN_AUTH_ENABLED;
    config.ADMIN_AUTH_ENABLED = false;

    try {
      const error = invokeMiddleware(requireAdminActor, {
        auth: null,
        headers: {
          'x-admin-actor-id': 'forged-actor'
        }
      });

      assert.equal(error.statusCode, 401);
      assert.equal(error.code, 'ADMIN_AUTH_REQUIRED');
    } finally {
      config.ADMIN_AUTH_ENABLED = originalAdminAuthEnabled;
    }
  });

  test('admin routes reject authenticated non-admin users', () => {
    const error = invokeMiddleware(requireAdminActor, {
      auth: {
        role: 'USER',
        actorId: 'user-1',
        userId: 'user-1',
        method: 'jwt'
      },
      headers: {}
    });

    assert.equal(error.statusCode, 401);
    assert.equal(error.code, 'ADMIN_AUTH_REQUIRED');
  });

  test('JWT administrators cannot override their audited actor identity with a header', () => {
    const request = {
      auth: {
        role: 'OWNER',
        actorId: 'owner-1',
        userId: 'owner-1',
        method: 'jwt'
      },
      headers: {
        'x-admin-actor-id': 'forged-actor'
      }
    };

    const error = invokeMiddleware(requireAdminActor, request);

    assert.equal(error, null);
    assert.equal(request.adminActorId, 'owner-1');
  });

  test('shared admin API tokens can retain an explicit operational actor ID', () => {
    const request = {
      auth: {
        role: 'ADMIN',
        actorId: 'default-admin',
        method: 'admin_api_token'
      },
      headers: {
        'x-admin-actor-id': 'operations-admin'
      }
    };

    const error = invokeMiddleware(requireAdminActor, request);

    assert.equal(error, null);
    assert.equal(request.adminActorId, 'operations-admin');
  });

  test('user-scope helpers fail closed without authenticated identity', () => {
    assert.throws(
      () => resolveUserIdForRequest({ auth: null }, 'user-1'),
      (error) => error.statusCode === 401 && error.code === 'USER_AUTH_REQUIRED'
    );
    assert.throws(
      () => assertCanAccessUserResource({ auth: null }, 'user-1'),
      (error) => error.statusCode === 401 && error.code === 'USER_AUTH_REQUIRED'
    );
  });
});
