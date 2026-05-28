/* eslint-disable vitest/expect-expect */

import { expectTypeOf } from 'expect-type';

import { JsonSchemaFactory, type JsonSchema, type JsonSchemaFactoryOptions } from './json-schema';

interface User {
    id: string;
    name: string;
}

describe('JsonSchemaFactory Type Tests', () => {
    it('types build and batch results from generic type parameter', () => {
        const schema = {
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
            },
            required: ['id', 'name'],
            type: 'object',
        } satisfies JsonSchema;

        const factory = new JsonSchemaFactory<User>(schema);

        expectTypeOf(factory.build()).toEqualTypeOf<User>();
        expectTypeOf(factory.batch(2)).toEqualTypeOf<User[]>();
        expectTypeOf(factory.build({ name: 'Ada' })).toEqualTypeOf<User>();
    });

    it('accepts JSON Schema factory options', () => {
        const options: JsonSchemaFactoryOptions = {
            ajv: { allErrors: true },
            maxDepth: 2,
        };

        expectTypeOf(options).toEqualTypeOf<JsonSchemaFactoryOptions>();
    });
});
