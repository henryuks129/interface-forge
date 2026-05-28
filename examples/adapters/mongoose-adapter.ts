// Mongoose persistence adapter example

import type { PersistenceAdapter } from 'interface-forge';

interface MongooseModel<T> {
    create(data: T): Promise<T>;
    insertMany(data: T[]): Promise<T[]>;
}

export class MongooseAdapter<T> implements PersistenceAdapter<T, T> {
    constructor(private readonly model: MongooseModel<T>) {}

    async create(data: T): Promise<T> {
        return await this.model.create(data);
    }

    async createMany(data: T[]): Promise<T[]> {
        return await this.model.insertMany(data);
    }
}

/*
Usage:

import { model, Schema } from 'mongoose';

const UserSchema = new Schema({
    email: { type: String, required: true },
    name: { type: String, required: true },
});

const UserModel = model('User', UserSchema);

const userFactory = new Factory<User>((faker) => ({
    email: faker.internet.email(),
    name: faker.person.fullName(),
}));

// Option 1: Set default adapter
const factoryWithAdapter = userFactory.withAdapter(new MongooseAdapter(UserModel));
const user = await factoryWithAdapter.create();
const users = await factoryWithAdapter.createMany(5);

// Option 2: Pass adapter in options
const user2 = await userFactory.create(undefined, {
    adapter: new MongooseAdapter(UserModel)
});
const users2 = await userFactory.createMany(5, undefined, {
    adapter: new MongooseAdapter(UserModel)
});
*/
