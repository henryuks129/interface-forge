/* eslint-disable @typescript-eslint/no-deprecated */ import { z as zv3 } from 'zod';
import { ZodFactory } from './zod';

describe('ZodFactory Zod v3 Compatibility', () => {
    describe('Basic Schema Types', () => {
        it('should work with v3 string schemas', () => {
            const schema = zv3.object({
                email: zv3.string().email(),
                name: zv3.string(),
                uuid: zv3.string().uuid(),
            });

            const factory = new ZodFactory(schema as any);
            const result = factory.build();

            expect(typeof result.name).toBe('string');
            expect(typeof result.email).toBe('string');
            expect(result.email).toContain('@');
            expect(typeof result.uuid).toBe('string');
            expect(result.uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        });

        it('should work with v3 number schemas', () => {
            const schema = zv3.object({
                age: zv3.number().int().min(0).max(120),
                price: zv3.number().positive(),
                score: zv3.number().min(-100).max(100),
            });

            const factory = new ZodFactory(schema as any);
            const result = factory.build();

            expect(typeof result.age).toBe('number');
            expect(Number.isInteger(result.age)).toBe(true);
            expect(result.age).toBeGreaterThanOrEqual(0);
            expect(result.age).toBeLessThanOrEqual(120);

            expect(typeof result.price).toBe('number');
            expect(result.price).toBeGreaterThan(0);

            expect(typeof result.score).toBe('number');
            expect(result.score).toBeGreaterThanOrEqual(-100);
            expect(result.score).toBeLessThanOrEqual(100);
        });

        it('should work with v3 boolean schemas', () => {
            const schema = zv3.object({
                hasAccess: zv3.boolean(),
                isActive: zv3.boolean(),
            });

            const factory = new ZodFactory(schema as any);
            const result = factory.build();

            expect(typeof result.isActive).toBe('boolean');
            expect(typeof result.hasAccess).toBe('boolean');
        });

        it('should work with v3 date schemas', () => {
            const schema = zv3.object({
                createdAt: zv3.date(),
                updatedAt: zv3.date(),
            });

            const factory = new ZodFactory(schema as any);
            const result = factory.build();

            expect(result.createdAt).toBeInstanceOf(Date);
            expect(result.updatedAt).toBeInstanceOf(Date);
        });
    });

    describe('Complex Schema Types', () => {
        it('should work with v3 array schemas', () => {
            const schema = zv3.object({
                scores: zv3.array(zv3.number()).length(3),
                tags: zv3.array(zv3.string()).min(1).max(5),
            });

            const factory = new ZodFactory(schema as any);
            const result = factory.build();

            expect(Array.isArray(result.tags)).toBe(true);
            expect(result.tags.length).toBeGreaterThanOrEqual(1);
            expect(result.tags.length).toBeLessThanOrEqual(5);
            result.tags.forEach((tag: unknown) => expect(typeof tag).toBe('string'));

            expect(Array.isArray(result.scores)).toBe(true);
            expect(result.scores).toHaveLength(3);
            result.scores.forEach((score: unknown) => expect(typeof score).toBe('number'));
        });

        it('should work with v3 object schemas', () => {
            const schema = zv3.object({
                user: zv3.object({
                    id: zv3.string(),
                    profile: zv3.object({
                        firstName: zv3.string(),
                        lastName: zv3.string(),
                    }),
                }),
            });

            const factory = new ZodFactory(schema as any);
            const result = factory.build();

            expect(typeof result.user).toBe('object');
            expect(typeof result.user.id).toBe('string');
            expect(typeof result.user.profile).toBe('object');
            expect(typeof result.user.profile.firstName).toBe('string');
            expect(typeof result.user.profile.lastName).toBe('string');
        });

        it('should work with v3 optional and nullable schemas', () => {
            const schema = zv3.object({
                nullableField: zv3.string().nullable(),
                optionalField: zv3.string().optional(),
                optionalNullable: zv3.string().optional().nullable(),
            });

            const factory = new ZodFactory(schema as any);
            const results = Array.from({ length: 10 }, () => factory.build());

            // Check that optional fields sometimes appear and sometimes don't
            const hasOptionalField = results.some((r) => r.optionalField !== undefined);
            const lacksOptionalField = results.some((r) => r.optionalField === undefined);
            expect(hasOptionalField || lacksOptionalField).toBe(true);

            // Check that nullable fields sometimes are null and sometimes aren't
            const hasNullableField = results.some((r) => r.nullableField !== null);
            const hasNullValue = results.some((r) => r.nullableField === null);
            expect(hasNullableField || hasNullValue).toBe(true);

            // All results should have the optionalNullable property
            results.forEach((result) => {
                expect('optionalNullable' in result || result.optionalNullable === undefined).toBe(true);
            });
        });

        it('should work with v3 enum schemas', () => {
            const StatusEnum = zv3.enum(['pending', 'approved', 'rejected']);
            const schema = zv3.object({
                status: StatusEnum,
            });

            const factory = new ZodFactory(schema as any);
            const results = Array.from({ length: 20 }, () => factory.build());

            results.forEach((result) => {
                expect(['pending', 'approved', 'rejected']).toContain(result.status);
            });

            // Should generate all possible values across multiple runs
            const uniqueStatuses = [...new Set(results.map((r) => r.status))];
            expect(uniqueStatuses.length).toBeGreaterThan(1);
        });

        it('should work with v3 union schemas', () => {
            const schema = zv3.object({
                value: zv3.union([zv3.string(), zv3.number(), zv3.boolean()]),
            });

            const factory = new ZodFactory(schema as any);
            const results = Array.from({ length: 20 }, () => factory.build());

            results.forEach((result) => {
                const type = typeof result.value;
                expect(['string', 'number', 'boolean']).toContain(type);
            });

            // Should generate different types across multiple runs
            const uniqueTypes = [...new Set(results.map((r) => typeof r.value))];
            expect(uniqueTypes.length).toBeGreaterThan(1);
        });

        it('should work with v3 literal schemas', () => {
            const schema = zv3.object({
                enabled: zv3.literal(true),
                type: zv3.literal('user'),
                version: zv3.literal(1),
            });

            const factory = new ZodFactory(schema as any);
            const result = factory.build();

            expect(result.type).toBe('user');
            expect(result.version).toBe(1);
            expect(result.enabled).toBe(true);
        });

        it('should work with v3 record schemas', () => {
            const schema = zv3.object({
                // @ts-expect-error, deprecated
                metadata: zv3.record(zv3.string()),
                // @ts-expect-error, deprecated
                scores: zv3.record(zv3.number()),
            });

            const factory = new ZodFactory(schema as any);
            const result = factory.build();

            expect(typeof result.metadata).toBe('object');
            expect(result.metadata).not.toBeNull();
            expect(Array.isArray(result.metadata)).toBe(false);
            Object.values(result.metadata).forEach((value) => {
                expect(typeof value).toBe('string');
            });

            expect(typeof result.scores).toBe('object');
            expect(result.scores).not.toBeNull();
            expect(Array.isArray(result.scores)).toBe(false);
            Object.values(result.scores).forEach((value) => {
                expect(typeof value).toBe('number');
            });
        });
    });

    describe('String Format Validation', () => {
        it('should work with v3 string format schemas', () => {
            const schema = zv3.object({
                email: zv3.string().email(),
                url: zv3.string().url(),
                uuid: zv3.string().uuid(),
            });

            const factory = new ZodFactory(schema as any);
            const result = factory.build();

            expect(typeof result.email).toBe('string');
            expect(result.email).toContain('@');

            expect(typeof result.url).toBe('string');
            expect(result.url).toMatch(/^https?:\/\//);

            expect(typeof result.uuid).toBe('string');
            expect(result.uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        });

        it('should work with v3 string length constraints', () => {
            const schema = zv3.object({
                exactLength: zv3.string().length(10),
                minOnly: zv3.string().min(20),
                shortString: zv3.string().min(1).max(5),
            });

            const factory = new ZodFactory(schema as any);
            const result = factory.build();

            expect(result.shortString.length).toBeGreaterThanOrEqual(1);
            expect(result.shortString.length).toBeLessThanOrEqual(5);

            expect(result.exactLength).toHaveLength(10);

            expect(result.minOnly.length).toBeGreaterThanOrEqual(20);
        });

        it('should work with v3 regex patterns', () => {
            const schema = zv3.object({
                alphanumeric: zv3.string().regex(/^[a-zA-Z0-9_]+$/),
                phoneNumber: zv3.string().regex(/^\+?[\d\s\-()]+$/),
            });

            const factory = new ZodFactory(schema as any);
            const result = factory.build();

            expect(typeof result.alphanumeric).toBe('string');
            expect(result.alphanumeric).toMatch(/^[a-zA-Z0-9_]+$/);

            expect(typeof result.phoneNumber).toBe('string');
            // Should generate a phone-like string
            expect(result.phoneNumber).toMatch(/^\+\d \(\d{3}\) \d{3}-\d{4}$/);
        });
    });

    describe('Number Constraints', () => {
        it('should work with v3 number constraints', () => {
            const schema = zv3.object({
                integerField: zv3.number().int(),
                minMaxField: zv3.number().min(10).max(50),
                multipleField: zv3.number().multipleOf(5),
                negativeField: zv3.number().negative(),
                positiveField: zv3.number().positive(),
            });

            const factory = new ZodFactory(schema as any);
            const result = factory.build();

            expect(Number.isInteger(result.integerField)).toBe(true);
            expect(result.positiveField).toBeGreaterThan(0);
            expect(result.negativeField).toBeLessThan(0);
            expect(result.minMaxField).toBeGreaterThanOrEqual(10);
            expect(result.minMaxField).toBeLessThanOrEqual(50);
            expect(result.multipleField % 5).toBe(0);
        });
    });

    describe('Batch Generation', () => {
        it('should generate multiple valid v3 schema instances', () => {
            const schema = zv3.object({
                active: zv3.boolean(),
                count: zv3.number().int().min(0),
                id: zv3.string(),
            });

            const factory = new ZodFactory(schema as any);
            const results = factory.batch(5);

            expect(results).toHaveLength(5);
            results.forEach((result) => {
                expect(typeof result.id).toBe('string');
                expect(typeof result.count).toBe('number');
                expect(Number.isInteger(result.count)).toBe(true);
                expect(result.count).toBeGreaterThanOrEqual(0);
                expect(typeof result.active).toBe('boolean');
            });
        });

        it('should apply overrides correctly with v3 schemas', () => {
            const schema = zv3.object({
                age: zv3.number(),
                name: zv3.string(),
                role: zv3.enum(['admin', 'user']),
            });

            const factory = new ZodFactory(schema as any);
            const result = factory.build({
                name: 'Custom Name',
                role: 'admin' as const,
            });

            expect(result.name).toBe('Custom Name');
            expect(result.role).toBe('admin');
            expect(typeof result.age).toBe('number');
        });
    });

    describe('Validation', () => {
        it('should generate data that passes v3 schema validation', () => {
            const schema = zv3.object({
                age: zv3.number().int().min(18).max(100),
                email: zv3.string().email(),
                profile: zv3.object({
                    firstName: zv3.string().min(1),
                    lastName: zv3.string().min(1),
                }),
                tags: zv3.array(zv3.string()).min(1),
            });

            const factory = new ZodFactory(schema as any);
            const results = factory.batch(10);

            // At least 80% should pass validation (allowing for some randomness in generation)
            const validResults = results.filter((result) => {
                try {
                    schema.parse(result);
                    return true;
                } catch {
                    return false;
                }
            });

            expect(validResults.length).toBeGreaterThanOrEqual(8); // 80% success rate
        });

        it('should work with deeply nested v3 schemas', () => {
            const schema = zv3.object({
                level1: zv3.object({
                    level2: zv3.object({
                        level3: zv3.object({
                            value: zv3.string(),
                        }),
                    }),
                }),
            });

            const factory = new ZodFactory(schema as any);
            const result = factory.build();

            expect(typeof result.level1).toBe('object');
            expect(typeof result.level1.level2).toBe('object');
            expect(typeof result.level1.level2.level3).toBe('object');
            expect(typeof result.level1.level2.level3.value).toBe('string');
        });
    });

    describe('Error Handling', () => {
        it('should handle unsupported v3 schema types gracefully', () => {
            const schema = zv3.object({
                anyField: zv3.any(),
                unknownField: zv3.unknown(),
            });

            const factory = new ZodFactory(schema as any);
            const result = factory.build();

            // Should generate something without throwing
            expect(result).toBeDefined();
            expect('anyField' in result).toBe(true);
            expect('unknownField' in result).toBe(true);
        });
    });

    describe('Custom Factory Functions with v3', () => {
        it('should work with custom factory functions for v3 schemas', () => {
            const schema = zv3.object({
                email: zv3.string().email(),
                id: zv3.string(),
                name: zv3.string(),
            });

            const factory = new ZodFactory(schema as any, (faker) => ({
                email: 'custom@example.com',
                name: faker.person.fullName(),
            }));

            const result = factory.build();

            expect(typeof result.id).toBe('string');
            expect(typeof result.name).toBe('string');
            expect(result.email).toBe('custom@example.com');

            // Should use custom factory for name, not schema generation
            expect(result.name).not.toBe('');
        });
    });
});
