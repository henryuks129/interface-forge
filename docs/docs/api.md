---
sidebar_position: 6
---

# API Reference

Complete API documentation for Interface Forge classes and types.

## Core Classes

### Factory\<T>

Main class for generating type-safe mock data.

```typescript
import { Factory } from 'interface-forge';

const userFactory = new Factory<User>((faker) => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
}));
```

**Methods:**

- `build(overrides?)` - Generate single object
- `batch(count, overrides?)` - Generate multiple objects
- `buildAsync(overrides?)` - Async generation
- `batchAsync(count, overrides?)` - Async batch generation
- `use(definition)` - Update factory definition
- `extend(additions)` - Extend with additional fields
- `compose(composition)` - Compose with other factories
- `beforeBuild(hook)` - Add pre-generation hook
- `afterBuild(hook)` - Add post-generation hook
- `create(overrides?, options?)` - Generate and persist single object
- `createMany(count, overrides?, options?)` - Generate and persist multiple objects
- `withAdapter(adapter)` - Set persistence adapter

### ZodFactory

Generate data from Zod schemas.

```typescript
import { ZodFactory } from 'interface-forge/zod';

const factory = new ZodFactory(userSchema);
const user = factory.build();
```

**Methods:**

- `build(overrides?)` - Generate from schema
- `batch(count, overrides?)` - Generate multiple from schema
- `withTypeHandler(typeName, handler)` - Add custom type handler
- `withTypeHandlers(handlers)` - Add multiple type handlers

### JsonSchemaFactory

Generate data from JSON Schema and validate it with AJV.

```typescript
import { JsonSchemaFactory } from 'interface-forge/json-schema';

const factory = new JsonSchemaFactory(userSchema);
const user = factory.build();
```

**Methods:**

- `build(overrides?)` - Generate and validate one object
- `batch(count, overrides?)` - Generate and validate multiple objects
- `buildAsync(overrides?)` - Async generation
- `batchAsync(count, overrides?)` - Async batch generation

### Utility Classes

**Ref\<T>** - Lazy references

```typescript
const userRef = new Ref<User>();
```

**CycleGenerator** - Cycle through values

```typescript
const gen = new CycleGenerator(['a', 'b', 'c']);
```

**SampleGenerator** - Random sampling

```typescript
const gen = new SampleGenerator(['x', 'y', 'z']);
```

**factory.sequence** - Stateful sequence helpers

```typescript
const userFactory = new Factory<User>((faker) => ({
    id: faker.sequence.increment({ start: 1 }),
    slug: faker.sequence.template('user-{0000}'),
}));
```

## Type Definitions

```typescript
type FactoryFunction<T> = (faker: Faker, iteration: number) => T;

type FactorySchema<T> = {
    [K in keyof T]: T[K] | Generator<T[K]> | Ref<T[K]>;
};

type FactoryComposition<T> = {
    [K in keyof T]?: Factory<T[K]> | T[K];
};

type BeforeBuildHook<T> = (
    data: Partial<T>,
) => Partial<T> | Promise<Partial<T>>;
type AfterBuildHook<T> = (data: T) => T | Promise<T>;

type ZodTypeHandler = (
    schema: ZodType,
    generator: ZodSchemaGenerator,
    currentDepth: number,
) => unknown;

interface PersistenceAdapter<T, R = T> {
    create(data: T): Promise<R>;
    createMany(data: T[]): Promise<R[]>;
}

interface FixtureConfiguration {
    basePath?: string;
    directory?: string;
    includeSource?: boolean;
    useSubdirectory?: boolean;
    validateSignature?: boolean;
}
```

## Error Classes

- `ConfigurationError` - Invalid configuration
- `CircularReferenceError` - Circular reference detection
- `ValidationError` - Schema validation failures
- `FixtureError` - Fixture operation failures
- `FixtureValidationError` - Fixture signature validation failures

## Examples

### Basic Factory

```typescript
const userFactory = new Factory<User>((faker) => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
}));

const user = userFactory.build();
const users = userFactory.batch(5);
```

### Composition

```typescript
const enhancedFactory = userFactory.compose<EnhancedUser>({
    profile: profileFactory,
    isActive: true,
});
```

### Persistence

```typescript
const factory = userFactory.withAdapter(new MongooseAdapter(UserModel));
const user = await factory.create();
```

### Fixtures

```typescript
const user = userFactory.build({}, { generateFixture: 'test-user' });
```

### Zod Integration

```typescript
const factory = new ZodFactory(userSchema);
const user = factory.build(); // Validates against schema
```

For detailed usage, see the [Getting Started](./getting-started/basic-usage) guide.
