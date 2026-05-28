import { z } from 'zod/v4';
import { ZodFactory } from 'interface-forge/zod';

/**
 * Example: Using ZodFactory for Test Data Generation
 *
 * This example shows how to use ZodFactory to generate test data
 * for unit tests, integration tests, and development.
 */

// Define your domain schemas
const ProductSchema = z.object({
    active: z.boolean(),
    category: z.enum(['electronics', 'clothing', 'food', 'books']),

    currency: z.enum(['USD', 'EUR', 'GBP']),
    description: z.string().max(500),
    id: z.uuid(),
    images: z.array(z.url()).min(1).max(5),
    name: z.string().min(3).max(100),
    price: z.number().positive().multipleOf(0.01),
    sku: z.string().regex(/^PROD-\d{6}$/),
    specifications: z.record(z.string(), z.string()).optional(),
    stock: z.number().int().min(0),
    tags: z.array(z.string()).default([]),
});

const OrderItemSchema = z.object({
    discount: z.number().min(0).max(1).default(0),
    product: ProductSchema,
    quantity: z.number().int().positive(),
    total: z.number().positive().multipleOf(0.01),
    unitPrice: z.number().positive().multipleOf(0.01),
});

const OrderSchema = z.object({
    createdAt: z.date(),
    customerId: z.uuid(),
    id: z.uuid(),
    items: z.array(OrderItemSchema).min(1),
    orderNumber: z.string().regex(/^ORD-\d{8}$/),
    paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']),
    shipping: z.number().min(0).multipleOf(0.01),
    shippingAddress: z.object({
        city: z.string(),
        country: z.string(),
        postalCode: z.string(),
        state: z.string(),
        street: z.string(),
    }),
    status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
    subtotal: z.number().positive().multipleOf(0.01),
    tax: z.number().min(0).multipleOf(0.01),
    total: z.number().positive().multipleOf(0.01),
    updatedAt: z.date(),
});

// Create factories with partial customization
// Only define the fields you want to customize - others are auto-generated
const productFactory = new ZodFactory(ProductSchema, (factory) => ({
    description: factory.commerce.productDescription(),
    images: factory.helpers.multiple(() => factory.image.url(), {
        count: { max: 3, min: 1 },
    }),
    name: factory.commerce.productName(),
    price: Number(factory.commerce.price({ dec: 2, max: 1000, min: 10 })),
    sku: `PROD-${factory.string.numeric(6)}`,
    // id, currency, stock, category, tags, active, specifications are auto-generated
}));

const orderItemFactory = new ZodFactory(OrderItemSchema, (factory) => {
    const product = productFactory.build();
    const quantity = factory.number.int({ max: 10, min: 1 });
    const unitPrice = product.price;
    const discount = factory.datatype.boolean({ probability: 0.3 })
        ? factory.number.float({ fractionDigits: 2, max: 0.3, min: 0.05 })
        : 0;

    return {
        discount,
        product,
        quantity,
        total: Number((quantity * unitPrice * (1 - discount)).toFixed(2)),
        unitPrice,
    };
});

// Partial factory function - only customize what you need
const orderFactory = new ZodFactory(OrderSchema, (factory) => {
    const items = factory.helpers.multiple(() => orderItemFactory.build(), {
        count: { max: 5, min: 1 },
    });

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = Number((subtotal * 0.08).toFixed(2)); // 8% tax
    const shipping = subtotal > 100 ? 0 : 9.99;

    return {
        createdAt: factory.date.past(),
        items,
        orderNumber: `ORD-${factory.string.numeric(8)}`,
        shipping,
        shippingAddress: {
            city: factory.location.city(),
            country: factory.location.country(),
            postalCode: factory.location.zipCode(),
            state: factory.location.state({ abbreviated: true }),
            street: factory.location.streetAddress(),
        },
        subtotal: Number(subtotal.toFixed(2)),
        tax,
        total: Number((subtotal + tax + shipping).toFixed(2)),
        updatedAt: factory.date.recent(),
        // id, customerId, status, paymentStatus are auto-generated from schema
    };
});

// Example 1: Generate test products
console.log('=== Generating Test Products ===');
const testProducts = productFactory.batch(3);
testProducts.forEach((product, i) => {
    console.log(`\nProduct ${i + 1}:`);
    console.log(`  SKU: ${product.sku}`);
    console.log(`  Name: ${product.name}`);
    console.log(`  Price: ${product.currency} ${product.price}`);
    console.log(`  Stock: ${product.stock} units`);
    console.log(`  Category: ${product.category}`);
});

// Example 2: Generate specific test scenarios
console.log('\n\n=== Test Scenarios ===');

// Out of stock product
const outOfStockProduct = productFactory.build({
    active: false,
    stock: 0,
});
console.log('\nOut of stock product:', {
    active: outOfStockProduct.active,
    name: outOfStockProduct.name,
    stock: outOfStockProduct.stock,
});

// High-value order
const highValueOrder = orderFactory.build({
    items: orderItemFactory.batch(10), // Many items
    paymentStatus: 'paid',
    status: 'processing',
});
console.log('\nHigh-value order:', {
    itemCount: highValueOrder.items.length,
    orderNumber: highValueOrder.orderNumber,
    status: highValueOrder.status,
    total: `$${highValueOrder.total}`,
});

// Example 3: Generate data for different test cases
console.log('\n\n=== Test Case Data ===');

// Test case 1: New pending order
const pendingOrder = orderFactory.build({
    paymentStatus: 'pending',
    status: 'pending',
});

// Test case 2: Completed order
const completedOrder = orderFactory.build({
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    paymentStatus: 'paid',
    status: 'delivered',
});

// Test case 3: Cancelled order with refund
const cancelledOrder = orderFactory.build({
    paymentStatus: 'refunded',
    status: 'cancelled',
});

console.log('Test orders generated:', {
    cancelled: cancelledOrder.orderNumber,
    completed: completedOrder.orderNumber,
    pending: pendingOrder.orderNumber,
});

// Example 4: Mock API responses
const ApiOrderResponseSchema = z.object({
    data: OrderSchema.nullable(),
    error: z
        .object({
            code: z.string(),
            message: z.string(),
        })
        .nullable(),
    meta: z.object({
        requestId: z.uuid(),
        timestamp: z.iso.datetime(),
    }),
    success: z.boolean(),
});

// Partial factory - only customize meta field
const apiResponseFactory = new ZodFactory(ApiOrderResponseSchema, (factory) => ({
    meta: {
        requestId: factory.string.uuid(),
        timestamp: new Date().toISOString(),
    },
    // success, data, error fields are auto-generated from schema
}));

// Success response
const successResponse = apiResponseFactory.build({
    data: orderFactory.build(),
    error: null,
    success: true,
});

// Error response
const errorResponse = apiResponseFactory.build({
    data: null,
    error: {
        code: 'ORDER_NOT_FOUND',
        message: 'Order with the specified ID was not found',
    },
    success: false,
});

console.log('\n\n=== API Responses ===');
console.log('Success response:', {
    orderNumber: successResponse.data?.orderNumber,
    requestId: successResponse.meta.requestId,
    success: successResponse.success,
});
console.log('Error response:', {
    error: errorResponse.error,
    success: errorResponse.success,
});

// Example 5: Using with test frameworks (Jest/Vitest example)
console.log('\n\n=== Test Framework Integration ===');
console.log(`
// In your test file:
describe('Order Service', () => {
    const orderFactory = new ZodFactory(OrderSchema);

    it('should process a valid order', async () => {
        const testOrder = orderFactory.build({
            status: 'pending',
            paymentStatus: 'paid',
        });

        const result = await orderService.process(testOrder);
        expect(result.status).toBe('processing');
    });

    it('should handle multiple orders', async () => {
        const testOrders = orderFactory.batch(10);
        const results = await orderService.processMany(testOrders);
        expect(results).toHaveLength(10);
    });
});
`);

// Validate all generated data
console.log('\n=== Validation ===');
const validationResults = [
    { data: testProducts[0], name: 'Product', schema: ProductSchema },
    { data: highValueOrder, name: 'Order', schema: OrderSchema },
    {
        data: successResponse,
        name: 'API Response',
        schema: ApiOrderResponseSchema,
    },
];

validationResults.forEach(({ data, name, schema }) => {
    try {
        schema.parse(data);
        console.log(`✓ ${name} data is valid`);
    } catch (error) {
        console.error(`✗ ${name} validation failed:`, error);
    }
});

console.log('\nAll test data generated successfully!');
