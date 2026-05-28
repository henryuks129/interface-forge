import { isFunction, isObject, isRecord } from '@tool-belt/type-predicates';

/**
 * Encapsulates a function and its arguments for deferred execution within factories.
 * This enables lazy evaluation of nested factory calls, preventing infinite recursion
 * and allowing complex object relationships to be defined declaratively.
 *
 * @template T - The return type of the encapsulated function
 * @template C - The function type that returns T
 */
export class Ref<T, C extends (...args: never[]) => T> {
    private readonly args: Parameters<C>;
    private readonly handler: C;

    constructor({ args, handler }: { args: Parameters<C>; handler: C }) {
        this.handler = handler;
        this.args = args;
    }

    callHandler(): T {
        return this.handler(...this.args);
    }
}

/**
 * Safely get a nested property value from an object using a path array.
 *
 * @param obj The object to get the property from
 * @param path Array of property keys forming the path to the desired value
 * @returns The value at the path, or undefined if not found
 */
export function getProperty(obj: unknown, path: string[]): unknown {
    let current = obj;
    for (const key of path) {
        if (!isObject(current) || !Reflect.has(current, key)) {
            return undefined;
        }
        current = Reflect.get(current, key);
    }
    return current;
}

/**
 * Type guard to check if an object has a method with a specific name.
 *
 * @param obj The object to check
 * @param method The method name to check for
 * @returns True if the object has the method
 */
export function hasMethod<K extends PropertyKey>(
    obj: unknown,
    method: K,
): obj is Record<K, (...args: never[]) => unknown> {
    return hasProperty(obj, method) && isFunction(Reflect.get(obj, method));
}

/**
 * Type guard to check if an object has a specific property.
 *
 * @param obj The object to check
 * @param prop The property to check for
 * @returns True if the object has the property
 */
export function hasProperty<T extends PropertyKey>(obj: unknown, prop: T): obj is Record<T, unknown> {
    return isObject(obj) && Reflect.has(obj, prop);
}

/**
 * Converts any iterable (Set, string, Array, etc.) to an array.
 * Used internally by generators to enable indexed access to values.
 *
 * @param iterable Any JavaScript iterable
 * @returns Array containing all values from the iterable
 */
export function iterableToArray<T>(iterable: Iterable<T>): T[] {
    const values: T[] = [];
    for (const value of iterable) {
        values.push(value);
    }
    return values;
}

/**
 * Performs a deep merge of objects, recursively merging nested objects.
 * Arrays and non-object values are replaced, not merged.
 * Used for applying kwargs overrides to factory-generated values.
 *
 * @param target The base object
 * @param sources Objects whose properties will override the target
 * @returns New object with merged properties (target is not mutated)
 */
export function merge<T>(target: T, ...sources: unknown[]): T {
    const output = { ...target } as Record<string, unknown>;

    for (const source of sources) {
        if (!source || typeof source !== 'object') {
            continue;
        }

        for (const key in source as Record<string, unknown>) {
            const sourceValue = (source as Record<string, unknown>)[key];
            const targetValue = output[key];

            output[key] =
                isRecord(sourceValue) && isRecord(targetValue) ? merge(targetValue, sourceValue) : sourceValue;
        }
    }

    return output as T;
}

/**
 * Validates that a value is a valid batch size (non-negative integer).
 *
 * @param size The size to validate
 * @throws {Error} If size is not a non-negative integer
 */
export function validateBatchSize(size: number): void {
    if (!Number.isInteger(size) || size < 0) {
        throw new Error('Batch size must be a non-negative integer');
    }
}
