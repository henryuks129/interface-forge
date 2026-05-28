import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { Factory, FixtureError, FixtureValidationError } from './index';
import { z } from 'zod/v4';
import { ZodFactory } from './zod';

describe('Factory Fixture Functionality', () => {
    let tempDir: string;

    beforeEach(() => {
        // Create a temporary directory for each test
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fixture-test-'));
    });

    afterEach(() => {
        // Clean up temporary directory
        fs.rmSync(tempDir, { force: true, recursive: true });
    });

    describe('build() with generateFixture option', () => {
        it('should create a fixture file when generateFixture is string', () => {
            const factory = new Factory<{ age: number; name: string }>(
                (faker) => ({
                    age: faker.number.int({ max: 80, min: 18 }),
                    name: faker.person.firstName(),
                }),
                {
                    fixtures: { basePath: tempDir },
                },
            );

            const result = factory.build(undefined, {
                generateFixture: 'user',
            });

            // Check that fixture file was created
            const fixturePath = path.join(tempDir, '__fixtures__', 'user.json');
            expect(fs.existsSync(fixturePath)).toBe(true);

            // Check that result has correct shape
            expect(result).toHaveProperty('name');
            expect(result).toHaveProperty('age');
            expect(typeof result.name).toBe('string');
            expect(typeof result.age).toBe('number');

            // Check fixture file content
            const fixtureContent = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
            expect(fixtureContent).toHaveProperty('signature');
            expect(fixtureContent).toHaveProperty('createdAt');
            expect(fixtureContent).toHaveProperty('version');
            expect(fixtureContent).toHaveProperty('data');
            expect(fixtureContent.data).toEqual(result);
        });

        it('should return cached data if fixture exists', () => {
            const factory = new Factory<{ id: string }>(
                (faker) => ({
                    id: faker.string.uuid(),
                }),
                {
                    fixtures: { basePath: tempDir },
                },
            );

            // Create first fixture
            const first = factory.build(undefined, {
                generateFixture: 'cached',
            });

            // Get fixture again - should return same data
            const second = factory.build(undefined, {
                generateFixture: 'cached',
            });

            expect(second).toEqual(first);
            expect(second.id).toBe(first.id);
        });

        it('should respect kwargs overrides', () => {
            const factory = new Factory<{ name: string; role: string }>(
                (faker) => ({
                    name: faker.person.firstName(),
                    role: 'user',
                }),
                {
                    fixtures: { basePath: tempDir },
                },
            );

            const result = factory.build({ role: 'admin' }, { generateFixture: 'admin-user' });

            expect(result.role).toBe('admin');
            expect(result.name).toBeDefined();
        });

        it('should handle nested paths correctly', () => {
            const factory = new Factory<{ value: number }>(
                (faker) => ({
                    value: faker.number.int(),
                }),
                {
                    fixtures: { basePath: tempDir },
                },
            );

            const result = factory.build(undefined, {
                generateFixture: 'nested/deep/path/data',
            });

            const fixturePath = path.join(tempDir, 'nested/deep/path/__fixtures__', 'data.json');
            expect(fs.existsSync(fixturePath)).toBe(true);
            expect(result).toHaveProperty('value');
        });

        it('should add .json extension if not provided', () => {
            const factory = new Factory<{ test: boolean }>(
                () => ({
                    test: true,
                }),
                {
                    fixtures: { basePath: tempDir },
                },
            );

            factory.build(undefined, { generateFixture: 'no-extension' });

            const fixturePath = path.join(tempDir, '__fixtures__', 'no-extension.json');
            expect(fs.existsSync(fixturePath)).toBe(true);
        });

        it('should replace non-json extensions', () => {
            const factory = new Factory<{ test: boolean }>(
                () => ({
                    test: true,
                }),
                {
                    fixtures: { basePath: tempDir },
                },
            );

            factory.build(undefined, { generateFixture: 'data.txt' });

            const fixturePath = path.join(tempDir, '__fixtures__', 'data.json');
            expect(fs.existsSync(fixturePath)).toBe(true);
        });

        it('should use default path when generateFixture is true', () => {
            const factory = new Factory<{ test: boolean }>(
                () => ({
                    test: true,
                }),
                {
                    fixtures: { basePath: tempDir },
                },
            );

            factory.build(undefined, { generateFixture: true });

            // Should create a file with factory name and timestamp
            const files = fs.readdirSync(path.join(tempDir, '__fixtures__'));
            expect(files.length).toBe(1);
            expect(files[0]).toMatch(/^factory-\d+\.json$/);
        });

        it('should not generate fixture when generateFixture is not set', () => {
            const factory = new Factory<{ test: boolean }>(
                () => ({
                    test: true,
                }),
                {
                    fixtures: { basePath: tempDir },
                },
            );

            factory.build();

            // No fixtures directory should be created
            expect(fs.existsSync(path.join(tempDir, '__fixtures__'))).toBe(false);
        });

        it('should throw FixtureValidationError when factory signature changes', () => {
            const factory1 = new Factory<{ name: string }>(
                (faker) => ({
                    name: faker.person.firstName(),
                }),
                {
                    fixtures: { basePath: tempDir },
                },
            );

            // Create fixture with first factory
            factory1.build(undefined, { generateFixture: 'signature-test' });

            // Create new factory with different schema
            const factory2 = new Factory<{ email: string; name: string }>(
                (faker) => ({
                    email: faker.internet.email(),
                    name: faker.person.firstName(),
                }),
                {
                    fixtures: { basePath: tempDir },
                },
            );

            // Should throw because signature changed
            expect(() =>
                factory2.build(undefined, {
                    generateFixture: 'signature-test',
                }),
            ).toThrow(FixtureValidationError);
        });

        it('should not validate signature when validateSignature is false', () => {
            const factory1 = new Factory<{ name: string }>(
                (faker) => ({
                    name: faker.person.firstName(),
                }),
                {
                    fixtures: { basePath: tempDir },
                },
            );

            // Create fixture with first factory
            const first = factory1.build(undefined, {
                generateFixture: 'no-validate',
            });

            // Create new factory with different schema but validation disabled
            const factory2 = new Factory<{ email: string; name: string }>(
                (faker) => ({
                    email: faker.internet.email(),
                    name: faker.person.firstName(),
                }),
                {
                    fixtures: {
                        basePath: tempDir,
                        validateSignature: false,
                    },
                },
            );

            // Should return cached data without validation
            const second = factory2.build(undefined, {
                generateFixture: 'no-validate',
            });
            expect(second).toEqual(first);
        });
    });

    describe('buildAsync() with generateFixture option', () => {
        it('should work with async factory functions', async () => {
            const factory = new Factory<{ data: string }>(
                async (faker) => ({
                    data: await Promise.resolve(faker.lorem.word()),
                }),
                {
                    fixtures: { basePath: tempDir },
                },
            );

            const result = await factory.buildAsync(undefined, {
                generateFixture: 'async-data',
            });

            expect(result).toHaveProperty('data');
            expect(typeof result.data).toBe('string');

            // Verify fixture was created
            const fixturePath = path.join(tempDir, '__fixtures__', 'async-data.json');
            expect(fs.existsSync(fixturePath)).toBe(true);
        });

        it('should work with async hooks', async () => {
            const factory = new Factory<{ id: number; timestamp: number }>(
                (faker) => ({
                    id: faker.number.int(),
                    timestamp: 0,
                }),
                {
                    fixtures: { basePath: tempDir },
                },
            );

            factory.afterBuild(async (instance) => ({
                ...instance,
                timestamp: await Promise.resolve(Date.now()),
            }));

            const result = await factory.buildAsync(undefined, {
                generateFixture: 'with-hooks',
            });

            expect(result.timestamp).toBeGreaterThan(0);
        });
    });

    describe('Custom fixture paths', () => {
        it('should respect custom directory name', () => {
            const factory = new Factory<{ test: boolean }>(
                () => ({
                    test: true,
                }),
                {
                    fixtures: {
                        basePath: tempDir,
                        directory: 'my-fixtures',
                    },
                },
            );

            factory.build(undefined, { generateFixture: 'custom-dir' });

            const fixturePath = path.join(tempDir, 'my-fixtures', 'custom-dir.json');
            expect(fs.existsSync(fixturePath)).toBe(true);
        });

        it('should handle empty directory (no subdirectory)', () => {
            const factory = new Factory<{ test: boolean }>(
                () => ({
                    test: true,
                }),
                {
                    fixtures: {
                        basePath: tempDir,
                        directory: '',
                        useSubdirectory: false,
                    },
                },
            );

            factory.build(undefined, { generateFixture: 'no-subdir' });

            const fixturePath = path.join(tempDir, 'no-subdir.json');
            expect(fs.existsSync(fixturePath)).toBe(true);
        });

        it('should handle absolute paths', () => {
            const factory = new Factory<{ test: boolean }>(
                () => ({
                    test: true,
                }),
                {
                    fixtures: { basePath: tempDir },
                },
            );

            // When providing an absolute path, the dirname becomes the location
            // and the basename becomes the fixture filename
            const absolutePath = path.join(tempDir, 'custom', 'location');
            factory.build(undefined, { generateFixture: absolutePath });

            // The fixture should be created at custom/__fixtures__/location.json
            const fixturePath = path.join(tempDir, 'custom', '__fixtures__', 'location.json');
            expect(fs.existsSync(fixturePath)).toBe(true);
        });

        it('should respect useSubdirectory=false', () => {
            const factory = new Factory<{ value: number }>(
                (faker) => ({
                    value: faker.number.int(),
                }),
                {
                    fixtures: {
                        basePath: tempDir,
                        useSubdirectory: false,
                    },
                },
            );

            factory.build(undefined, { generateFixture: 'direct/path/file' });

            // Should create file directly without __fixtures__ subdirectory
            const fixturePath = path.join(tempDir, 'direct/path/file.json');
            expect(fs.existsSync(fixturePath)).toBe(true);

            // Should NOT create __fixtures__ subdirectory
            const subdirPath = path.join(tempDir, 'direct/path/__fixtures__/file.json');
            expect(fs.existsSync(subdirPath)).toBe(false);
        });
    });

    describe('Partial factories', () => {
        it('should work with partial factory functions', () => {
            const factory = new Factory<{
                age?: number;
                email?: string;
                name: string;
            }>(
                (faker) => ({
                    name: faker.person.firstName(),
                }),
                {
                    fixtures: { basePath: tempDir },
                },
            );

            const result = factory.build(undefined, {
                generateFixture: 'partial-test',
            });

            expect(result).toHaveProperty('name');
            expect(result.email).toBeUndefined();
            expect(result.age).toBeUndefined();
        });
    });

    describe('Factory hooks with fixtures', () => {
        it('should apply beforeBuild hooks', () => {
            const factory = new Factory<{ count: number }>(
                () => ({
                    count: 0,
                }),
                {
                    fixtures: { basePath: tempDir },
                },
            );

            factory.beforeBuild((params) => ({
                ...params,
                count: 100,
            }));

            const result = factory.build(undefined, {
                generateFixture: 'before-hook',
            });
            expect(result.count).toBe(100);
        });

        it('should apply afterBuild hooks', () => {
            const factory = new Factory<{ doubled: number; value: number }>(
                (faker) => ({
                    doubled: 0,
                    value: faker.number.int({ max: 10, min: 1 }),
                }),
                {
                    fixtures: { basePath: tempDir },
                },
            );

            factory.afterBuild((instance) => ({
                ...instance,
                doubled: instance.value * 2,
            }));

            const result = factory.build(undefined, {
                generateFixture: 'after-hook',
            });
            expect(result.doubled).toBe(result.value * 2);
        });

        it('should include hook count in signature', () => {
            const factory1 = new Factory<{ test: boolean }>(
                () => ({
                    test: true,
                }),
                {
                    fixtures: { basePath: tempDir },
                },
            );

            // Create fixture without hooks
            factory1.build(undefined, { generateFixture: 'hook-signature' });

            // Add a hook to the factory
            factory1.afterBuild((instance) => instance);

            // Should throw because hook count changed
            expect(() =>
                factory1.build(undefined, {
                    generateFixture: 'hook-signature',
                }),
            ).toThrow(FixtureValidationError);
        });
    });

    describe('ZodFactory fixtures', () => {
        const UserSchema = z.object({
            age: z.number().int().min(18).max(100),
            email: z.email(),
            id: z.uuid(),
            name: z.string(),
        });

        it('should work with ZodFactory', () => {
            const factory = new ZodFactory(UserSchema, {
                fixtures: { basePath: tempDir },
            });

            const result = factory.build(undefined, {
                generateFixture: 'zod-user',
            } as any);

            // Validate against schema
            expect(() => UserSchema.parse(result)).not.toThrow();

            // Check fixture was created
            const fixturePath = path.join(tempDir, '__fixtures__', 'zod-user.json');
            expect(fs.existsSync(fixturePath)).toBe(true);
        });

        it('should include schema information in signature', () => {
            const factory1 = new ZodFactory(z.object({ name: z.string() }), {
                fixtures: { basePath: tempDir },
            });

            // Create fixture with first schema
            factory1.build(undefined, {
                generateFixture: 'zod-signature',
            } as any);

            // Create factory with different schema
            const factory2 = new ZodFactory(z.object({ email: z.string(), name: z.string() }), {
                fixtures: { basePath: tempDir },
            });

            // Should throw because schema changed
            expect(() =>
                factory2.build(undefined, {
                    generateFixture: 'zod-signature',
                } as any),
            ).toThrow(FixtureValidationError);
        });

        it('should handle partial factory functions with Zod', () => {
            const factory = new ZodFactory(
                UserSchema,
                () => ({
                    email: 'john@example.com',
                    name: 'John Doe',
                }),
                {
                    fixtures: { basePath: tempDir },
                },
            );

            const result = factory.build(undefined, {
                generateFixture: 'zod-partial',
            } as any);

            expect(result.name).toBe('John Doe');
            expect(result.email).toBe('john@example.com');
            expect(result.id).toBeDefined(); // Auto-generated
            expect(result.age).toBeDefined(); // Auto-generated
        });
    });

    describe('Error handling', () => {
        it('should throw FixtureError for file system errors', () => {
            const factory = new Factory<{ test: boolean }>(
                () => ({
                    test: true,
                }),
                {
                    fixtures: { basePath: '/invalid/path/that/does/not/exist' },
                },
            );

            expect(() => factory.build(undefined, { generateFixture: 'error-test' })).toThrow(FixtureError);
        });

        it('should handle corrupted fixture files gracefully', () => {
            const factory = new Factory<{ value: number }>(
                (faker) => ({
                    value: faker.number.int(),
                }),
                {
                    fixtures: {
                        basePath: tempDir,
                    },
                },
            );

            // Create a corrupted fixture file
            const fixturePath = path.join(tempDir, '__fixtures__');
            fs.mkdirSync(fixturePath, { recursive: true });
            fs.writeFileSync(path.join(fixturePath, 'corrupted.json'), 'invalid json');

            // Should throw FixtureError when trying to read corrupted file
            expect(() => factory.build(undefined, { generateFixture: 'corrupted' })).toThrow(FixtureError);
        });
    });

    describe('Signature calculation', () => {
        it('should not change signature for same factory configuration', () => {
            const factory1 = new Factory<{ test: string }>(
                (faker) => ({
                    test: faker.lorem.word(),
                }),
                {
                    fixtures: { basePath: tempDir },
                },
            );

            const factory2 = new Factory<{ test: string }>(
                (faker) => ({
                    test: faker.lorem.word(),
                }),
                {
                    fixtures: { basePath: tempDir },
                },
            );

            // Create fixture with first factory
            const result1 = factory1.build(undefined, {
                generateFixture: 'same-sig',
            });

            // Should return cached result with second factory (same signature)
            const result2 = factory2.build(undefined, {
                generateFixture: 'same-sig',
            });

            expect(result2).toEqual(result1);
        });

        it('should exclude factory source when includeSource is false', () => {
            const factory1 = new Factory<{ value: number }>(
                () => ({
                    value: 1,
                }),
                {
                    fixtures: {
                        basePath: tempDir,
                        includeSource: false,
                    },
                },
            );

            // Create fixture
            factory1.build(undefined, { generateFixture: 'no-source' });

            // Create factory with different implementation but same structure
            const factory2 = new Factory<{ value: number }>(
                () => ({
                    value: 2, // Different value
                }),
                {
                    fixtures: {
                        basePath: tempDir,
                        includeSource: false,
                    },
                },
            );

            // Should return cached result (source not included in signature)
            const result = factory2.build(undefined, {
                generateFixture: 'no-source',
            });
            expect(result.value).toBe(1); // Cached value
        });
    });

    describe('Concurrent access', () => {
        it('should handle concurrent fixture access safely', async () => {
            const factory = new Factory<{ id: string }>(
                (faker) => ({
                    id: faker.string.uuid(),
                }),
                {
                    fixtures: { basePath: tempDir },
                },
            );

            // Create multiple concurrent fixture calls
            const promises = Array.from({ length: 10 }, (_, i) =>
                Promise.resolve(
                    factory.build(undefined, {
                        generateFixture: `concurrent-${i}`,
                    }),
                ),
            );

            const results = await Promise.all(promises);

            // All results should be defined and have correct shape
            expect(results).toHaveLength(10);
            results.forEach((result) => {
                expect(result).toHaveProperty('id');
                expect(typeof result.id).toBe('string');
            });
        });
    });

    describe('Factory with generateFixture in constructor options', () => {
        it('should generate fixtures when set in factory options', () => {
            const factory = new Factory<{ value: number }>(
                (faker) => ({
                    value: faker.number.int(),
                }),
                {
                    fixtures: { basePath: tempDir },
                    generateFixture: 'constructor-fixture',
                },
            );

            // Should generate fixture even without passing options to build
            const result = factory.build();

            const fixturePath = path.join(tempDir, '__fixtures__', 'constructor-fixture.json');
            expect(fs.existsSync(fixturePath)).toBe(true);

            // Second call should return cached data
            const second = factory.build();
            expect(second).toEqual(result);
        });

        it('should allow overriding constructor generateFixture option', () => {
            const factory = new Factory<{ value: number }>(
                (faker) => ({
                    value: faker.number.int(),
                }),
                {
                    fixtures: { basePath: tempDir },
                    generateFixture: 'default-fixture',
                },
            );

            // Override with different fixture path
            factory.build(undefined, { generateFixture: 'override-fixture' });

            // Should create override fixture, not default
            expect(fs.existsSync(path.join(tempDir, '__fixtures__', 'override-fixture.json'))).toBe(true);
            expect(fs.existsSync(path.join(tempDir, '__fixtures__', 'default-fixture.json'))).toBe(false);
        });
    });
});
