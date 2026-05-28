import { describe, expect, it } from 'vitest';
import {
    CycleGenerator,
    DateSequenceGenerator,
    Factory,
    IncrementSequenceGenerator,
    SampleGenerator,
    TemplateSequenceGenerator,
} from './index';

describe('Generators', () => {
    describe('CycleGenerator', () => {
        it('cycles through values in order', () => {
            const generator = new CycleGenerator([1, 2, 3]);
            const gen = generator.generate();

            expect(gen.next().value).toBe(1);
            expect(gen.next().value).toBe(2);
            expect(gen.next().value).toBe(3);
            expect(gen.next().value).toBe(1);
            expect(gen.next().value).toBe(2);
            expect(gen.next().value).toBe(3);
        });

        it('handles single value', () => {
            const generator = new CycleGenerator(['single']);
            const gen = generator.generate();

            expect(gen.next().value).toBe('single');
            expect(gen.next().value).toBe('single');
            expect(gen.next().value).toBe('single');
        });

        it('throws error for empty iterable', () => {
            expect(() => new CycleGenerator([])).toThrow('Cannot create generator from empty iterable');
        });
    });

    describe('SampleGenerator', () => {
        it('samples values without immediate repetition', () => {
            const generator = new SampleGenerator([1, 2, 3, 4, 5]);
            const gen = generator.generate();

            let lastValue = gen.next().value;
            for (let i = 0; i < 50; i++) {
                const { value } = gen.next();
                expect(value).not.toBe(lastValue);
                expect([1, 2, 3, 4, 5]).toContain(value);
                lastValue = value;
            }
        });

        it('handles single value by always returning it', () => {
            const generator = new SampleGenerator(['only']);
            const gen = generator.generate();

            expect(gen.next().value).toBe('only');
            expect(gen.next().value).toBe('only');
            expect(gen.next().value).toBe('only');
        });

        it('eventually samples all values', () => {
            const values = ['a', 'b', 'c'];
            const generator = new SampleGenerator(values);
            const gen = generator.generate();

            const sampled = new Set<string>();
            for (let i = 0; i < 100; i++) {
                sampled.add(gen.next().value);
            }

            expect([...sampled].toSorted()).toEqual(['a', 'b', 'c']);
        });

        it('throws error for empty iterable', () => {
            expect(() => new SampleGenerator([])).toThrow('Cannot create generator from empty iterable');
        });
    });

    describe('IncrementSequenceGenerator', () => {
        it('generates incrementing numbers', () => {
            const gen = new IncrementSequenceGenerator({ start: 10, step: 5 }).generate();

            expect(gen.next().value).toBe(10);
            expect(gen.next().value).toBe(15);
            expect(gen.next().value).toBe(20);
        });
    });

    describe('TemplateSequenceGenerator', () => {
        it('replaces raw and padded numeric placeholders', () => {
            const gen = new TemplateSequenceGenerator('user-{0000}-{n}', { start: 7 }).generate();

            expect(gen.next().value).toBe('user-0007-7');
            expect(gen.next().value).toBe('user-0008-8');
        });

        it('throws when the pattern has no placeholder', () => {
            expect(() => new TemplateSequenceGenerator('user')).toThrow(
                'Template sequence pattern must include {n} or a padded placeholder like {0000}',
            );
        });
    });

    describe('DateSequenceGenerator', () => {
        it('generates dates by day, hour, and minute', () => {
            const dayGen = new DateSequenceGenerator({ start: '2026-01-01T00:00:00.000Z', step: 2 }).generate();
            const hourGen = new DateSequenceGenerator({
                start: '2026-01-01T00:00:00.000Z',
                unit: 'hour',
            }).generate();
            const minuteGen = new DateSequenceGenerator({
                start: '2026-01-01T00:00:00.000Z',
                step: 30,
                unit: 'minute',
            }).generate();

            expect(dayGen.next().value.toISOString()).toBe('2026-01-01T00:00:00.000Z');
            expect(dayGen.next().value.toISOString()).toBe('2026-01-03T00:00:00.000Z');
            expect(hourGen.next().value.toISOString()).toBe('2026-01-01T00:00:00.000Z');
            expect(hourGen.next().value.toISOString()).toBe('2026-01-01T01:00:00.000Z');
            expect(minuteGen.next().value.toISOString()).toBe('2026-01-01T00:00:00.000Z');
            expect(minuteGen.next().value.toISOString()).toBe('2026-01-01T00:30:00.000Z');
        });

        it('throws for invalid start dates', () => {
            expect(() => new DateSequenceGenerator({ start: 'invalid' })).toThrow(
                'Date sequence start must be a valid date',
            );
        });
    });

    describe('factory.sequence', () => {
        it('creates independent generators for factory schemas', () => {
            interface User {
                createdAt: Date;
                id: number;
                sku: string;
            }

            const factory = new Factory<User>((faker) => ({
                createdAt: faker.sequence.date({ start: '2026-01-01T00:00:00.000Z' }),
                id: faker.sequence.increment({ start: 100 }),
                sku: faker.sequence.template('sku-{000}'),
            }));

            expect(factory.batch(3)).toEqual([
                { createdAt: new Date('2026-01-01T00:00:00.000Z'), id: 100, sku: 'sku-001' },
                { createdAt: new Date('2026-01-02T00:00:00.000Z'), id: 101, sku: 'sku-002' },
                { createdAt: new Date('2026-01-03T00:00:00.000Z'), id: 102, sku: 'sku-003' },
            ]);
        });

        it('does not share sequence state between generator instances', () => {
            const first = new IncrementSequenceGenerator().generate();
            const second = new IncrementSequenceGenerator().generate();

            expect(first.next().value).toBe(1);
            expect(first.next().value).toBe(2);
            expect(second.next().value).toBe(1);
            expect(second.next().value).toBe(2);
        });
    });
});
