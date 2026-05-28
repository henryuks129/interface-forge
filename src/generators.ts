import { iterableToArray } from './utils';

/**
 * Abstract base class for generators that produce infinite sequences from finite iterables.
 * Converts iterables to arrays for efficient random access and validates non-empty input.
 *
 * @template T - The type of values to generate
 */
export abstract class BaseGenerator<T> {
    protected values: T[];

    constructor(iterable: Iterable<T>) {
        this.values = iterableToArray(iterable);
        if (this.values.length === 0) {
            throw new Error('Cannot create generator from empty iterable');
        }
    }

    abstract generate(): Generator<T, T, T>;
}

/**
 * Generates values by cycling through an array in sequential order.
 * When the end is reached, it starts over from the beginning, creating an infinite sequence.
 * Useful for predictable, repeating patterns in test data.
 *
 * @template T - The type of values to cycle through
 */
export class CycleGenerator<T> extends BaseGenerator<T> {
    generate(): Generator<T, T, T> {
        const { values } = this;
        return (function* () {
            let counter = 0;
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            while (true) {
                yield values[counter];
                counter = (counter + 1) % values.length;
            }
        })();
    }
}

/**
 * Generates random values from an array while preventing consecutive duplicates.
 * Each value is randomly selected, but the same value will never appear twice in a row
 * unless the array contains only one element. Useful for creating varied but not
 * repetitive test data.
 *
 * @template T - The type of values to sample from
 */
export class SampleGenerator<T> extends BaseGenerator<T> {
    generate(): Generator<T, T, T> {
        const { values } = this;
        return (function* () {
            if (values.length === 1) {
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                while (true) {
                    yield values[0];
                }
            } else {
                let lastValue: null | T = null;
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                while (true) {
                    let newValue: T;
                    do {
                        newValue = values[Math.floor(Math.random() * values.length)];
                    } while (newValue === lastValue);

                    lastValue = newValue;
                    yield newValue;
                }
            }
        })();
    }
}
