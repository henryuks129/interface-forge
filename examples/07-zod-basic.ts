// Works with both Zod v3 and v4
import { z } from 'zod/v4'; // You can also use: import { z } from 'zod';
import { ZodFactory } from 'interface-forge/zod';

// Basic example: User registration schema
const UserRegistrationSchema = z
    .object({
        acceptTerms: z.boolean(),
        confirmPassword: z.string(),
        email: z.email(),
        marketingEmails: z.boolean().default(false),
        password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
        profile: z.object({
            dateOfBirth: z.date(),
            firstName: z.string().min(2),
            lastName: z.string().min(2),
            phoneNumber: z.string().optional(),
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    });

// Create a factory
const userRegFactory = new ZodFactory(UserRegistrationSchema);

// Generate test data
const testUser = userRegFactory.build({
    acceptTerms: true, // Override to ensure terms are accepted
});

console.log('Generated user registration:', testUser);

// Generate multiple test users for testing
const testUsers = userRegFactory.batch(5, [
    { acceptTerms: true, marketingEmails: true },
    { acceptTerms: true, marketingEmails: false },
    { acceptTerms: true }, // Will cycle through these overrides
]);

console.log(`\nGenerated ${testUsers.length} test users`);
testUsers.forEach((user, i) => {
    console.log(`User ${i + 1}: ${user.email} - Marketing: ${user.marketingEmails}`);
});

// Example with API response schema
const ApiResponseSchema = z.object({
    data: z.object({
        pagination: z.object({
            page: z.number().int().positive(),
            perPage: z.number().int().positive(),
            total: z.number().int().min(0),
            totalPages: z.number().int().positive(),
        }),
        users: z.array(
            z.object({
                email: z.email(),
                id: z.uuid(),
                lastSeen: z.date().nullable(),
                name: z.string(),
                role: z.enum(['admin', 'user', 'guest']),
            }),
        ),
    }),
    error: z
        .object({
            code: z.string(),
            message: z.string(),
        })
        .nullable(),
    success: z.boolean(),
});

const apiFactory = new ZodFactory(ApiResponseSchema);

// Generate a successful response
const successResponse = apiFactory.build({
    error: null,
    success: true,
});

console.log('\nAPI Response:', JSON.stringify(successResponse, null, 2));

// Validate the generated data
try {
    ApiResponseSchema.parse(successResponse);
    console.log('\n✓ Generated API response is valid!');
} catch (error) {
    console.error('Validation failed:', error);
}
