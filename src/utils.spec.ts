import { describe, expect, it } from 'vitest';
import { getProperty, hasMethod, hasProperty, iterableToArray, merge, Ref, validateBatchSize } from './utils';

describe('Utils', () => {
    describe('iterableToArray', () => {
        it('converts array to array', () => {
            const arr = [1, 2, 3];
            expect(iterableToArray(arr)).toEqual([1, 2, 3]);
        });

        it('converts Set to array', () => {
            const set = new Set([1, 2, 3]);
            expect(iterableToArray(set)).toEqual([1, 2, 3]);
        });

        it('converts string to array of characters', () => {
            const str = 'abc';
            expect(iterableToArray(str)).toEqual(['a', 'b', 'c']);
        });

        it('handles empty iterable', () => {
            expect(iterableToArray([])).toEqual([]);
            expect(iterableToArray(new Set())).toEqual([]);
            expect(iterableToArray('')).toEqual([]);
        });
    });

    describe('merge', () => {
        it('merges simple objects', () => {
            const target = { a: 1, b: 2 };
            const source = { b: 3, c: 4 };
            expect(merge(target, source)).toEqual({ a: 1, b: 3, c: 4 });
        });

        it('deep merges nested objects', () => {
            const target = { a: { b: 1, c: 2 }, d: 3 };
            const source = { a: { b: 4, e: 5 }, f: 6 };
            expect(merge(target, source)).toEqual({
                a: { b: 4, c: 2, e: 5 },
                d: 3,
                f: 6,
            });
        });

        it('handles null and undefined sources', () => {
            const target = { a: 1 };
            expect(merge(target, null, undefined)).toEqual({ a: 1 });
        });

        it('handles multiple sources', () => {
            const target = { a: 1 };
            const source1 = { b: 2 };
            const source2 = { c: 3 };
            const source3 = { a: 4, d: 5 };
            expect(merge(target, source1, source2, source3)).toEqual({
                a: 4,
                b: 2,
                c: 3,
                d: 5,
            });
        });

        it('does not mutate original objects', () => {
            const target = { a: 1 };
            const source = { b: 2 };
            const result = merge(target, source);
            expect(target).toEqual({ a: 1 });
            expect(source).toEqual({ b: 2 });
            expect(result).toEqual({ a: 1, b: 2 });
        });

        it('overwrites arrays instead of merging them', () => {
            const target = { arr: [1, 2, 3] };
            const source = { arr: [4, 5] };
            expect(merge(target, source)).toEqual({ arr: [4, 5] });
        });
    });

    describe('Ref', () => {
        it('stores and calls handler with arguments', () => {
            const handler = (a: number, b: number) => a + b;
            const ref = new Ref({ args: [2, 3], handler });
            expect(ref.callHandler()).toBe(5);
        });

        it('handles handlers with no arguments', () => {
            const handler = () => 'hello';
            const ref = new Ref({ args: [], handler });
            expect(ref.callHandler()).toBe('hello');
        });

        it('handles complex return types', () => {
            const handler = (n: number) => ({ doubled: n * 2, value: n });
            const ref = new Ref({ args: [5], handler });
            expect(ref.callHandler()).toEqual({ doubled: 10, value: 5 });
        });
    });

    describe('hasProperty', () => {
        it('returns true for existing properties', () => {
            const obj = { a: 1, b: undefined, c: null };
            expect(hasProperty(obj, 'a')).toBe(true);
            expect(hasProperty(obj, 'b')).toBe(true);
            expect(hasProperty(obj, 'c')).toBe(true);
        });

        it('returns false for non-existing properties', () => {
            const obj = { a: 1 };
            expect(hasProperty(obj, 'b')).toBe(false);
            expect(hasProperty(obj, 'nonexistent')).toBe(false);
        });

        it('returns false for non-objects', () => {
            expect(hasProperty(null, 'a')).toBe(false);
            expect(hasProperty(undefined, 'a')).toBe(false);
            expect(hasProperty(42, 'a')).toBe(false);
            expect(hasProperty('string', 'a')).toBe(false);
            expect(hasProperty(true, 'a')).toBe(false);
        });

        it('works with symbol properties', () => {
            const sym = Symbol('test');
            const obj = { [sym]: 'value' };
            expect(hasProperty(obj, sym)).toBe(true);
        });

        it('works with inherited properties', () => {
            class Parent {
                inherited = 'value';
            }
            class Child extends Parent {
                own = 'value';
            }
            const obj = new Child();
            expect(hasProperty(obj, 'own')).toBe(true);
            expect(hasProperty(obj, 'inherited')).toBe(true);
        });
    });

    describe('hasMethod', () => {
        it('returns true for methods', () => {
            const obj = {
                arrow: (x: number) => x * 2,
                method: () => 'result',
                regular() {
                    return 'regular';
                },
            };
            expect(hasMethod(obj, 'method')).toBe(true);
            expect(hasMethod(obj, 'arrow')).toBe(true);
            expect(hasMethod(obj, 'regular')).toBe(true);
        });

        it('returns false for non-function properties', () => {
            const obj = {
                nullValue: null,
                number: 42,
                object: { nested: true },
                string: 'value',
                undefinedValue: undefined,
            };
            expect(hasMethod(obj, 'string')).toBe(false);
            expect(hasMethod(obj, 'number')).toBe(false);
            expect(hasMethod(obj, 'object')).toBe(false);
            expect(hasMethod(obj, 'nullValue')).toBe(false);
            expect(hasMethod(obj, 'undefinedValue')).toBe(false);
        });

        it('returns false for non-existing properties', () => {
            const obj = { method: () => 'result' };
            expect(hasMethod(obj, 'nonexistent')).toBe(false);
        });

        it('returns false for non-objects', () => {
            expect(hasMethod(null, 'method')).toBe(false);
            expect(hasMethod(undefined, 'method')).toBe(false);
            expect(hasMethod(42, 'method')).toBe(false);
        });
    });

    describe('getProperty', () => {
        it('gets nested properties', () => {
            const obj = {
                a: {
                    b: {
                        c: 'value',
                    },
                },
            };
            expect(getProperty(obj, ['a', 'b', 'c'])).toBe('value');
            expect(getProperty(obj, ['a', 'b'])).toEqual({ c: 'value' });
            expect(getProperty(obj, ['a'])).toEqual({ b: { c: 'value' } });
        });

        it('returns undefined for non-existing paths', () => {
            const obj = { a: { b: 'value' } };
            expect(getProperty(obj, ['a', 'b', 'c'])).toBe(undefined);
            expect(getProperty(obj, ['x', 'y'])).toBe(undefined);
            expect(getProperty(obj, ['a', 'x'])).toBe(undefined);
        });

        it('handles empty path', () => {
            const obj = { a: 1 };
            expect(getProperty(obj, [])).toBe(obj);
        });

        it('handles null and undefined values in path', () => {
            const obj = { a: null, b: { c: undefined } };
            expect(getProperty(obj, ['a'])).toBe(null);
            expect(getProperty(obj, ['b', 'c'])).toBe(undefined);
            expect(getProperty(obj, ['a', 'x'])).toBe(undefined);
            expect(getProperty(obj, ['b', 'c', 'x'])).toBe(undefined);
        });

        it('handles non-object inputs', () => {
            expect(getProperty(null, ['a'])).toBe(undefined);
            expect(getProperty(undefined, ['a'])).toBe(undefined);
            expect(getProperty(42, ['a'])).toBe(undefined);
            expect(getProperty('string', ['a'])).toBe(undefined);
        });

        it('handles arrays', () => {
            const obj = { arr: [1, 2, { nested: 'value' }] };
            expect(getProperty(obj, ['arr', '0'])).toBe(1);
            expect(getProperty(obj, ['arr', '2', 'nested'])).toBe('value');
        });
    });

    describe('validateBatchSize', () => {
        it('accepts valid batch sizes', () => {
            expect(() => validateBatchSize(0)).not.toThrow();
            expect(() => validateBatchSize(1)).not.toThrow();
            expect(() => validateBatchSize(10)).not.toThrow();
            expect(() => validateBatchSize(1000)).not.toThrow();
        });

        it('rejects negative numbers', () => {
            expect(() => validateBatchSize(-1)).toThrow('Batch size must be a non-negative integer');
            expect(() => validateBatchSize(-10)).toThrow('Batch size must be a non-negative integer');
        });

        it('rejects non-integer numbers', () => {
            expect(() => validateBatchSize(1.5)).toThrow('Batch size must be a non-negative integer');
            expect(() => validateBatchSize(0.1)).toThrow('Batch size must be a non-negative integer');
            expect(() => validateBatchSize(Math.PI)).toThrow('Batch size must be a non-negative integer');
        });

        it('rejects NaN and Infinity', () => {
            expect(() => validateBatchSize(Number.NaN)).toThrow('Batch size must be a non-negative integer');
            expect(() => validateBatchSize(Infinity)).toThrow('Batch size must be a non-negative integer');
            expect(() => validateBatchSize(-Infinity)).toThrow('Batch size must be a non-negative integer');
        });
    });
});
