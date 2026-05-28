/**
 * Testing Examples
 *
 * This example demonstrates how to use Interface-Forge in various
 * testing scenarios with popular testing frameworks.
 */

import { Factory } from 'interface-forge';

interface CartItem {
    product: Product;
    quantity: number;
}

interface Order {
    createdAt: Date;
    customerId: string;
    id: string;
    items: CartItem[];
    status: 'delivered' | 'pending' | 'processing' | 'shipped';
    total: number;
}

interface Product {
    category: string;
    id: string;
    inStock: boolean;
    name: string;
    price: number;
}

const ProductFactory = new Factory<Product>((faker) => ({
    category: faker.commerce.department(),
    id: faker.string.uuid(),
    inStock: faker.datatype.boolean({ probability: 0.8 }),
    name: faker.commerce.productName(),
    price: Number.parseFloat(faker.commerce.price()),
}));

const CartItemFactory = new Factory<CartItem>((faker) => ({
    product: ProductFactory.build(),
    quantity: faker.number.int({ max: 5, min: 1 }),
}));

const OrderFactory = new Factory<Order>((faker) => {
    const items = CartItemFactory.batch(faker.number.int({ max: 5, min: 1 }));
    const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    return {
        createdAt: faker.date.recent(),
        customerId: faker.string.uuid(),
        id: faker.string.uuid(),
        items,
        status: faker.helpers.arrayElement(['pending', 'processing', 'shipped', 'delivered']),
        total,
    };
});

function calculateDiscount(order: Order, discountPercentage: number): number {
    return order.total * (discountPercentage / 100);
}

const testOrder = OrderFactory.build({ total: 100 });
console.log('Discount test:', calculateDiscount(testOrder, 10) === 10);

const electronicProducts = ProductFactory.batch(5, {
    category: 'Electronics',
    inStock: true,
});

const outOfStockOrder = OrderFactory.build({
    items: electronicProducts.map((product) => ({
        product: { ...product, inStock: false },
        quantity: 1,
    })),
});

console.log(
    'Out of stock order test:',
    outOfStockOrder.items.every((item) => !item.product.inStock),
);

const snapshotData = OrderFactory.build({
    createdAt: new Date('2024-01-01'),
    customerId: 'customer-456',
    id: 'test-order-123',
    status: 'pending',
});

console.log('Snapshot test data:', JSON.stringify(snapshotData, null, 2));
