---
sidebar_position: 2
---

# Fixtures

Cache generated data to disk for consistent, fast test data.

:::info Node.js Only
Fixtures require Node.js and are not available in browsers.
:::

## Quick Start

```typescript
// Enable fixtures with custom path
const user = userFactory.build({}, { generateFixture: 'test-user' });

// Enable with auto-generated path
const user = userFactory.build({}, { generateFixture: true });

// Configure at factory level
const factory = new Factory<User>(factoryFn, {
    generateFixture: 'default-user',
});
```

## How It Works

1. **First run**: Generates data and saves to disk
2. **Subsequent runs**: Loads cached data from disk
3. **Signature validation**: Regenerates if factory changes

## Configuration

```typescript
const factory = new Factory<User>(factoryFn, {
    fixtures: {
        basePath: './test-fixtures', // Base directory
        directory: 'users', // Subdirectory name
        validateSignature: true, // Check for changes
        useSubdirectory: true, // Use nested folders
        includeSource: true, // Include function source in signature
    },
    generateFixture: 'default', // Default fixture name
});
```

## Directory Structure

```text
project-root/
├── __fixtures__/              # Default directory
│   ├── user-data.json        # Custom fixture
│   └── api-responses/        # Nested fixtures
│       └── success.json
└── test-fixtures/            # Custom base path
    └── users/               # Custom subdirectory
        └── admin.json
```

## Fixture File Format

```json
{
    "version": 1,
    "createdAt": "2023-07-10T12:34:56.789Z",
    "signature": "sha256-hash-of-factory-config",
    "data": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "John Doe",
        "email": "john.doe@example.com"
    }
}
```

## Signature Validation

Fixtures are regenerated when:

- Factory function changes
- Options change (e.g., `maxDepth`)
- Hooks are added/removed

```typescript
// Disable validation for dynamic factories
const factory = new Factory(factoryFn, {
    fixtures: { validateSignature: false },
});
```

## Testing Integration

### Vitest/Jest

```typescript
describe('User API', () => {
    const factory = new Factory<User>(factoryFn, {
        fixtures: { basePath: './test-fixtures' },
    });

    it('should handle user registration', () => {
        const userData = factory.build(
            {},
            {
                generateFixture: 'registration-test',
            },
        );

        // Consistent data across test runs
        expect(userData.email).toMatch(/@/);
    });
});
```

### Storybook

```typescript
// UserCard.stories.ts
const factory = new Factory<User>(factoryFn, {
    fixtures: { basePath: './.storybook/fixtures' },
});

export const Default: StoryObj = {
    args: {
        user: factory.build({}, { generateFixture: 'default-user' }),
    },
};

export const Admin: StoryObj = {
    args: {
        user: factory.build(
            { role: 'admin' },
            { generateFixture: 'admin-user' },
        ),
    },
};
```

## Advanced Usage

### Dynamic Paths

```typescript
class UserFactory extends Factory<User> {
    buildForScenario(scenario: string) {
        return this.build(
            {},
            {
                generateFixture: `scenarios/${scenario}`,
            },
        );
    }

    buildForEnvironment(env: string) {
        return this.build(
            {},
            {
                generateFixture: `environments/${env}/user`,
                fixtures: { basePath: `./fixtures/${env}` },
            },
        );
    }
}
```

### Versioning

```typescript
// Use versioned fixture paths for schema changes
const v1User = userFactoryV1.build(
    {},
    {
        generateFixture: 'v1/user',
    },
);

const v2User = userFactoryV2.build(
    {},
    {
        generateFixture: 'v2/user',
    },
);
```

### Performance Testing

```typescript
const complexFactory = new Factory<ComplexData>(expensiveFactoryFn, {
    fixtures: { basePath: './perf-fixtures' },
});

// First run: slow (generates data)
// Subsequent runs: fast (loads from cache)
const data = complexFactory.build(
    {},
    {
        generateFixture: 'complex-dataset',
    },
);
```

## ZodFactory Integration

Works seamlessly with schema-based generation:

```typescript
const factory = new ZodFactory(userSchema, {
    fixtures: { basePath: './schema-fixtures' },
});

// Schema changes trigger regeneration
const user = factory.build({}, { generateFixture: 'validated-user' });
```

## Best Practices

1. **Organized Structure**: Use descriptive, hierarchical names

    ```typescript
    generateFixture: 'users/admin/with-permissions';
    generateFixture: 'api/responses/success';
    ```

2. **Environment-Specific**: Separate fixtures by environment

    ```typescript
    fixtures: {
        basePath: `./fixtures/${process.env.NODE_ENV}`;
    }
    ```

3. **Version Control**: Include fixtures for consistency

    ```gitignore
    __fixtures__/           # Include in git
    dev-fixtures/          # Exclude development-only
    ```

4. **Error Handling**: Fallback to normal generation

    ```typescript
    try {
        return factory.build({}, { generateFixture: 'user' });
    } catch (error) {
        if (error instanceof FixtureError) {
            return factory.build(); // Fallback
        }
        throw error;
    }
    ```
