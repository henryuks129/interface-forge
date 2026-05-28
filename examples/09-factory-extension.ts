/**
 * Factory Extension Patterns
 *
 * This example demonstrates how to use the extend() method to create
 * inheritance hierarchies and specialized factories from base factories.
 */

import { Factory } from 'interface-forge';

interface AdminUser extends User {
    department: string;
    permissions: string[];
}

// Simple types for demonstration
interface BaseEntity {
    createdAt: Date;
    id: string;
}

interface User extends BaseEntity {
    email: string;
    name: string;
    role: string;
}

// 1. Base Entity Factory
const BaseEntityFactory = new Factory<BaseEntity>((factory) => ({
    createdAt: factory.date.past(),
    id: factory.string.uuid(),
}));

// 2. Extend Base Entity to Create User Factory
const UserFactory = BaseEntityFactory.extend<User>((factory) => ({
    createdAt: factory.date.past(),
    email: factory.internet.email(),
    id: factory.string.uuid(),
    name: factory.person.fullName(),
    role: 'user',
}));

// 3. Extend User Factory to Create Admin Factory
const AdminUserFactory = UserFactory.extend<AdminUser>((factory) => ({
    createdAt: factory.date.past(),
    department: factory.helpers.arrayElement(['Engineering', 'Product', 'Marketing']),
    email: factory.internet.email(),
    id: factory.string.uuid(),
    name: factory.person.fullName(),
    permissions: ['read', 'write', 'delete'],
    role: 'admin',
}));

// Usage Examples
console.log('=== Factory Extension Examples ===\n');

// Base entity
const baseEntity = BaseEntityFactory.build();
console.log('Base Entity:', baseEntity);

// Regular user (extended from base)
const user = UserFactory.build();
console.log('\nRegular User:', user);

// Admin user (extended from user)
const admin = AdminUserFactory.build();
console.log('\nAdmin User:', admin);

// Batch generation with extensions
console.log('\n=== Batch Generation ===');
const userBatch = UserFactory.batch(2);
console.log('User Batch:', userBatch);

const adminBatch = AdminUserFactory.batch(2);
console.log('Admin Batch:', adminBatch);

// Extension with overrides
console.log('\n=== Extension with Overrides ===');
const customAdmin = AdminUserFactory.build({
    department: 'Security',
    permissions: ['security:admin', 'users:delete'],
});
console.log('Custom Admin:', customAdmin);

export { AdminUserFactory, BaseEntityFactory, UserFactory };
