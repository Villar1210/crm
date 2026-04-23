/**
 * Test Setup & Global Configuration
 *
 * Global setup for all tests
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import * as dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// ─────────────────────────────────────────────────
// GLOBAL SETUP
// ─────────────────────────────────────────────────

beforeAll(async () => {
    // Initialize test environment
    process.env.NODE_ENV = 'test';
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    process.env.NEXTAUTH_SECRET = 'test-secret-key-change-in-production';

    console.log('✓ Test environment initialized');
});

afterAll(async () => {
    console.log('✓ Test suite completed');
});

// ─────────────────────────────────────────────────
// PER-TEST SETUP
// ─────────────────────────────────────────────────

beforeEach(async () => {
    // Reset mocks and state before each test
});

afterEach(async () => {
    // Cleanup after each test
});

// ─────────────────────────────────────────────────
// TEST UTILITIES
// ─────────────────────────────────────────────────

/**
 * Create a mock NextAuth session for testing
 */
export function createMockSession(overrides?: any) {
    return {
        user: {
            id: 'test-user-123',
            name: 'Test User',
            email: 'test@example.com',
            role: 'CLIENTE',
            emailVerified: true,
            ...overrides?.user,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        ...overrides,
    };
}

/**
 * Create a mock user for database tests
 */
export function createMockUser(overrides?: any) {
    return {
        id: 'user_test_123',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: '$2b$10$...',
        role: 'CLIENTE',
        status: 'ACTIVE',
        emailVerified: new Date(),
        emailVerificationToken: null,
        phone: null,
        company: null,
        cpf: null,
        cnpj: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        loginAttempts: 0,
        loginAttemptLocked: null,
        lastLogin: new Date(),
        lastIpAddress: '127.0.0.1',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}

/**
 * Wait for async operations
 */
export async function waitFor(condition: () => boolean, timeout = 1000): Promise<void> {
    const startTime = Date.now();
    while (!condition()) {
        if (Date.now() - startTime > timeout) {
            throw new Error('Timeout waiting for condition');
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
    }
}

/**
 * Create a mock HTTP request
 */
export function createMockRequest(overrides?: any) {
    return {
        method: 'GET',
        headers: {
            'content-type': 'application/json',
            'user-agent': 'Test/1.0',
            'x-forwarded-for': '127.0.0.1',
            ...overrides?.headers,
        },
        body: {},
        ...overrides,
    };
}

/**
 * Create a mock HTTP response
 */
export function createMockResponse() {
    const statusCode = 200;
    const headers: Record<string, string> = {};
    const data: any = {};

    return {
        status: (code: number) => {
            Object.assign(createMockResponse, { statusCode: code });
            return createMockResponse();
        },
        json: (obj: any) => {
            Object.assign(data, obj);
        },
        statusCode,
        headers,
        data,
    };
}

// ─────────────────────────────────────────────────
// TEST HELPERS
// ─────────────────────────────────────────────────

/**
 * Hash a password for testing
 */
export async function hashTestPassword(password: string): Promise<string> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.hash(password, 10);
}

/**
 * Compare password with hash
 */
export async function compareTestPassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(password, hash);
}

/**
 * Generate a test JWT token
 */
export function generateTestToken(payload: any = {}): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const body = Buffer.from(
        JSON.stringify({
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            ...payload,
        })
    ).toString('base64');
    const signature = Buffer.from('test-signature').toString('base64');

    return `${header}.${body}.${signature}`;
}

/**
 * Parse a test JWT token
 */
export function parseTestToken(token: string) {
    const [, body] = token.split('.');
    if (!body) throw new Error('Invalid token');
    return JSON.parse(Buffer.from(body, 'base64').toString());
}

export {};
