---
sidebar_position: 3
---

# Utility Generators

Control repeated data patterns with generators.

## Factory Sequence Helpers

Use `factory.sequence` inside factory definitions for stateful values that advance across builds and batches:

```typescript
import { Factory } from 'interface-forge';

const userFactory = new Factory<User>((faker) => ({
    id: faker.sequence.increment({ start: 1000 }),
    slug: faker.sequence.template('user-{0000}'),
    createdAt: faker.sequence.date({
        start: '2026-01-01T00:00:00.000Z',
        unit: 'day',
    }),
    email: faker.internet.email(),
}));

const users = userFactory.batch(3);
// ids: 1000, 1001, 1002
// slugs: user-0001, user-0002, user-0003
```

Each helper call site has independent state. Create a new factory when you need to reset the sequence.

## CycleGenerator

Cycle through predefined values sequentially:

```typescript
import { CycleGenerator, Factory } from 'interface-forge';

const statusGenerator = new CycleGenerator(['pending', 'active', 'failed']).generate();

const taskFactory = new Factory<Task>((faker) => ({
    id: faker.string.uuid(),
    status: statusGenerator,
    title: faker.lorem.sentence(),
}));

const tasks = taskFactory.batch(6);
// statuses: pending, active, failed, pending, active, failed
```

## SampleGenerator

Randomly sample values without consecutive duplicates:

```typescript
import { Factory, SampleGenerator } from 'interface-forge';

const roleGenerator = new SampleGenerator(['user', 'admin', 'guest']).generate();

const userFactory = new Factory<User>((faker) => ({
    id: faker.string.uuid(),
    role: roleGenerator,
    name: faker.person.fullName(),
}));
```

## Specialized Sequence Classes

The factory helpers are the ergonomic path for factory definitions. The underlying classes are also exported when you need to manage generator instances yourself:

```typescript
import {
    DateSequenceGenerator,
    IncrementSequenceGenerator,
    TemplateSequenceGenerator,
} from 'interface-forge';

const ids = new IncrementSequenceGenerator({ start: 1, step: 2 }).generate();
const slugs = new TemplateSequenceGenerator('order-{0000}').generate();
const dates = new DateSequenceGenerator({
    start: '2026-01-01T00:00:00.000Z',
    unit: 'hour',
}).generate();
```

## Practical Patterns

### Sequential IDs

```typescript
const orderFactory = new Factory<Order>((faker) => ({
    id: faker.sequence.increment({ start: 1 }),
    total: faker.number.float({ min: 10, max: 1000 }),
}));
```

### State Transitions

```typescript
const statusGenerator = new CycleGenerator([
    'draft',
    'pending_review',
    'approved',
    'published',
]).generate();

const articleFactory = new Factory<Article>((faker) => ({
    title: faker.lorem.sentence(),
    status: statusGenerator,
}));
```

### Time Slots

```typescript
const appointmentFactory = new Factory<Appointment>((faker) => ({
    patientName: faker.person.fullName(),
    startsAt: faker.sequence.date({
        start: '2026-01-01T09:00:00.000Z',
        step: 30,
        unit: 'minute',
    }),
    duration: 30,
}));
```
