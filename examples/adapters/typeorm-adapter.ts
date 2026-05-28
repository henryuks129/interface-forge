// TypeORM persistence adapter example

import type { PersistenceAdapter } from 'interface-forge';

interface TypeORMRepository<T> {
    create(data: T): T;
    create(data: T[]): T[];
    save(entity: T): Promise<T>;
    save(entities: T[]): Promise<T[]>;
}

export class TypeORMAdapter<T> implements PersistenceAdapter<T, T> {
    constructor(private readonly repository: TypeORMRepository<T>) {}

    async create(data: T): Promise<T> {
        const entity = this.repository.create(data);
        return await this.repository.save(entity);
    }

    async createMany(data: T[]): Promise<T[]> {
        const entities = this.repository.create(data);
        return await this.repository.save(entities);
    }
}

/*
Usage:

import { Entity, PrimaryGeneratedColumn, Column, DataSource } from 'typeorm';

@Entity()
class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    email: string;

    @Column()
    name: string;
}

const dataSource = new DataSource({
    type: 'postgres',
    entities: [User],
    // ... other config
});

await dataSource.initialize();
const userRepository = dataSource.getRepository(User);

const userFactory = new Factory<User>((faker) => ({
    email: faker.internet.email(),
    name: faker.person.fullName(),
}));

// Option 1: Set default adapter
const factoryWithAdapter = userFactory.withAdapter(new TypeORMAdapter(userRepository));
const user = await factoryWithAdapter.create();
const users = await factoryWithAdapter.createMany(5);

// Option 2: Pass adapter in options
const user2 = await userFactory.create(undefined, {
    adapter: new TypeORMAdapter(userRepository)
});
const users2 = await userFactory.createMany(5, undefined, {
    adapter: new TypeORMAdapter(userRepository)
});
*/
