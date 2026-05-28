// Prisma persistence adapter example

import type { PersistenceAdapter } from 'interface-forge';

interface PrismaModelDelegate<T> {
    create(args: { data: T }): Promise<T>;
    createMany(args: { data: T[] }): Promise<{ count: number }>;
}

export class PrismaAdapter<T> implements PersistenceAdapter<T, T> {
    constructor(private readonly model: PrismaModelDelegate<T>) {}

    async create(data: T): Promise<T> {
        return await this.model.create({ data });
    }

    async createMany(data: T[]): Promise<T[]> {
        await this.model.createMany({ data });
        return data; // Prisma doesn't return created records from createMany
    }
}

/*
Usage:

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const userFactory = new Factory<User>((faker) => ({
    email: faker.internet.email(),
    name: faker.person.fullName(),
}));

// Option 1: Set default adapter
const factoryWithAdapter = userFactory.withAdapter(new PrismaAdapter(prisma.user));
const user = await factoryWithAdapter.create();
const users = await factoryWithAdapter.createMany(5);

// Option 2: Pass adapter in options
const user2 = await userFactory.create(undefined, {
    adapter: new PrismaAdapter(prisma.user)
});
const users2 = await userFactory.createMany(5, undefined, {
    adapter: new PrismaAdapter(prisma.user)
});
*/
