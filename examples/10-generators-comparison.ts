/**
 * Generators Comparison: iterate() vs sample()
 *
 * This example demonstrates the differences between iterate() and sample()
 * methods, showing when to use each one and their practical applications.
 */

import { Factory } from 'interface-forge';

interface Product {
    category: string;
    id: string;
    name: string;
    status: string;
}

console.log('=== Generators Comparison: iterate() vs sample() ===\n');

// Base factory
const ProductFactory = new Factory<Product>((factory) => ({
    category: 'electronics',
    id: factory.string.uuid(),
    name: factory.commerce.productName(),
    status: 'active',
}));

// 1. iterate() - Deterministic Cycling
console.log('1. iterate() - Deterministic Cycling\n');

const categories = ['electronics', 'clothing', 'books', 'home', 'sports'];
const categoryIterator = ProductFactory.iterate(categories);

console.log('Categories with iterate():');
for (let i = 0; i < 8; i++) {
    const category = categoryIterator.next().value;
    console.log(`${i + 1}. ${category}`);
}

console.log(
    '\nNotice: Categories cycle predictably: electronics → clothing → books → home → sports → electronics...\n',
);

// 2. sample() - Random Selection (No Consecutive Duplicates)
console.log('2. sample() - Random Selection\n');

const statusOptions = ['active', 'inactive', 'pending', 'archived'];
const statusSampler = ProductFactory.sample(statusOptions);

console.log('Status with sample():');
for (let i = 0; i < 8; i++) {
    const status = statusSampler.next().value;
    console.log(`${i + 1}. ${status}`);
}

console.log('\nNotice: Status is random but no consecutive duplicates\n');

// 3. When to Use Each
console.log('3. Decision Guide\n');

console.log('Use iterate() when:');
console.log('- Testing all possible states/values systematically');
console.log('- Creating predictable test sequences');
console.log('- Ensuring even distribution across all values');
console.log('- Debugging specific state transitions');

console.log('\nUse sample() when:');
console.log('- Simulating realistic random behavior');
console.log('- Avoiding predictable patterns');
console.log('- Creating varied test scenarios');
console.log('- Preventing consecutive duplicates');

// 4. Practical Example with Factory
console.log('\n4. Practical Factory Example\n');

const WorkflowFactory = new Factory<Product>((factory) => ({
    category: categoryIterator.next().value, // Cycling through categories
    id: factory.string.uuid(),
    name: factory.commerce.productName(),
    status: statusSampler.next().value, // Random status selection
}));

const products = WorkflowFactory.batch(5);
products.forEach((product, index) => {
    console.log(`Product ${index + 1}: ${product.category} | ${product.status}`);
});

export { ProductFactory, WorkflowFactory };
