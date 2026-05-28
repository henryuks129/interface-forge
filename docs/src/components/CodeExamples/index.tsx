import React from 'react';
import CodeBlock from '@theme/CodeBlock';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import styles from './styles.module.css';

const basicExample = `import { Factory } from 'interface-forge';

interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

const userFactory = new Factory<User>((factory) => ({
  id: factory.string.uuid(),
  name: factory.person.fullName(),
  email: factory.internet.email(),
  age: factory.number.int({ min: 18, max: 65 }),
}));

// Generate a single user
const user = userFactory.build();

// Generate multiple users
const users = userFactory.batch(10);`;

const zodExample = `import { z } from 'zod/v4';
import { ZodFactory } from 'interface-forge/zod';

const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().int().min(18).max(65),
});

const userFactory = new ZodFactory(userSchema);

// Automatically generates valid data
const user = userFactory.build();`;

const compositionExample = `const addressFactory = new Factory<Address>((factory) => ({
  street: factory.location.streetAddress(),
  city: factory.location.city(),
  country: factory.location.country(),
}));

const userWithAddressFactory = new Factory<UserWithAddress>((factory) => ({
  ...userFactory.build(),
  address: addressFactory.build(),
  registeredAt: factory.date.past(),
}));

// Compose factories for complex data structures
const userWithAddress = userWithAddressFactory.build();`;

export default function CodeExamples(): JSX.Element {
    return (
        <section className={styles.codeExamples}>
            <div className="container">
                <h2 className="text--center margin-bottom--lg">See It In Action</h2>
                <Tabs>
                    <TabItem value="basic" label="Basic Usage" default>
                        <CodeBlock language="typescript">{basicExample}</CodeBlock>
                    </TabItem>
                    <TabItem value="zod" label="With Zod Schemas">
                        <CodeBlock language="typescript">{zodExample}</CodeBlock>
                    </TabItem>
                    <TabItem value="composition" label="Factory Composition">
                        <CodeBlock language="typescript">{compositionExample}</CodeBlock>
                    </TabItem>
                </Tabs>
            </div>
        </section>
    );
}
