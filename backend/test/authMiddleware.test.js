const assert = require('node:assert/strict');
const test = require('node:test');
const {
    createFirebaseAuthMiddleware,
    requireAdmin,
    requireSelfBody,
    requireSelfParam
} = require('../middleware/authMiddleware');

const createResponse = () => {
    const res = {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        }
    };

    return res;
};

test('authenticateFirebase rejects requests without a bearer token', async () => {
    const req = { headers: {} };
    const res = createResponse();
    let nextCalled = false;
    const middleware = createFirebaseAuthMiddleware({
        verifyIdToken: async () => ({ uid: 'user-1' })
    });

    await middleware(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
});

test('authenticateFirebase attaches the decoded Firebase user', async () => {
    const req = { headers: { authorization: 'Bearer valid-token' } };
    const res = createResponse();
    let nextCalled = false;
    const middleware = createFirebaseAuthMiddleware({
        verifyIdToken: async (token) => {
            assert.equal(token, 'valid-token');
            return { uid: 'user-1', email: 'user@example.com' };
        }
    });

    await middleware(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(req.user.uid, 'user-1');
    assert.equal(req.user.email, 'user@example.com');
});

test('requireSelfParam blocks access to another user id', () => {
    const req = {
        user: { uid: 'user-1' },
        params: { uid: 'user-2' }
    };
    const res = createResponse();
    let nextCalled = false;

    requireSelfParam('uid')(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
});

test('requireSelfBody blocks spoofed body ids', () => {
    const req = {
        user: { uid: 'user-1' },
        body: { uid: 'user-2' }
    };
    const res = createResponse();
    let nextCalled = false;

    requireSelfBody(['uid'])(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
});

test('requireAdmin allows configured admin uids only', () => {
    const previousAdminUids = process.env.ADMIN_UIDS;
    process.env.ADMIN_UIDS = 'admin-1,admin-2';

    const req = { user: { uid: 'admin-2' } };
    const res = createResponse();
    let nextCalled = false;

    requireAdmin(req, res, () => {
        nextCalled = true;
    });

    if (previousAdminUids === undefined) {
        delete process.env.ADMIN_UIDS;
    } else {
        process.env.ADMIN_UIDS = previousAdminUids;
    }
    assert.equal(nextCalled, true);
});
