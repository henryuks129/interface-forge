---
sidebar_position: 2
---

# JSON Schema Integration

Generate data from JSON Schema with AJV validation.

Install the optional peer dependencies:

```bash
pnpm add ajv ajv-formats
```

```typescript
import { JsonSchemaFactory } from 'interface-forge/json-schema';

interface User {
    id: string;
    email: string;
    name: string;
    age: number;
}

const userSchema = {
    type: 'object',
    required: ['id', 'email', 'name', 'age'],
    properties: {
        id: { type: 'string', format: 'uuid' },
        email: { type: 'string', format: 'email' },
        name: { type: 'string', minLength: 2, maxLength: 80 },
        age: { type: 'integer', minimum: 18, maximum: 65 },
    },
} as const;

const userFactory = new JsonSchemaFactory<User>(userSchema);
const user = userFactory.build();
```

Generated values are validated with AJV before they are returned.

## Supported Schema Features

- Object schemas with `properties` and `required`
- Primitive types: `string`, `number`, `integer`, `boolean`, `null`, `array`, `object`
- `enum` and `const`
- String constraints: `minLength`, `maxLength`, `pattern`
- Number constraints: `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf`
- Array constraints: `minItems`, `maxItems`
- Formats: `email`, `uuid`, `uri`, `date`, `date-time`, `time`
- Shallow local references through `$defs` and `definitions`

## Custom Values

Pass a partial factory function when schema defaults need project-specific data:

```typescript
const factory = new JsonSchemaFactory<User>(userSchema, (faker) => ({
    email: faker.internet.email({ provider: 'example.com' }),
}));

const admin = factory.build({ name: 'Ada Lovelace' });
```

Factory values and build overrides are merged with generated schema values, then the final object is validated.

## Scope

The JSON Schema integration is intentionally focused. It does not implement OpenAPI-specific behavior, recursive `$ref` traversal, conditional schemas, broad draft compatibility matrices, or schema-to-TypeScript code generation.
