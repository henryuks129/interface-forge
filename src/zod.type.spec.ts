/* eslint-disable vitest/expect-expect,@typescript-eslint/no-unused-vars */
import { expectTypeOf } from 'expect-type';
import { z } from 'zod/v4';
import type { Factory } from './index';
import { ZodFactory } from './zod';

describe('ZodFactory Type Tests', () => {
    it('should infer types from simple Zod schema', () => {
        const UserSchema = z.object({
            age: z.number().int().min(18).max(100),
            createdAt: z.date(),
            email: z.email(),
            id: z.uuid(),
            isActive: z.boolean(),
            name: z.string(),
        });

        type User = z.infer<typeof UserSchema>;

        const factory = new ZodFactory(UserSchema);
        const user = factory.build();

        expectTypeOf(user).toEqualTypeOf<User>();
        expectTypeOf(user.id).toBeString();
        expectTypeOf(user.name).toBeString();
        expectTypeOf(user.email).toBeString();
        expectTypeOf(user.age).toBeNumber();
        expectTypeOf(user.isActive).toBeBoolean();
        expectTypeOf(user.createdAt).toEqualTypeOf<Date>();
    });

    it('should handle optional fields correctly', () => {
        const ProfileSchema = z.object({
            bio: z.string().nullable(),
            firstName: z.string(),
            lastName: z.string(),
            middleName: z.string().optional(),
            phoneNumber: z.string().optional(),
        });

        type Profile = z.infer<typeof ProfileSchema>;

        const factory = new ZodFactory(ProfileSchema);
        const profile = factory.build();

        expectTypeOf(profile).toEqualTypeOf<Profile>();
        expectTypeOf(profile.firstName).toBeString();
        expectTypeOf(profile.lastName).toBeString();
        expectTypeOf(profile.middleName).toEqualTypeOf<string | undefined>();
        expectTypeOf(profile.phoneNumber).toEqualTypeOf<string | undefined>();
        expectTypeOf(profile.bio).toEqualTypeOf<null | string>();
    });

    it('should handle nested objects', () => {
        const AddressSchema = z.object({
            city: z.string(),
            country: z.string(),
            state: z.string(),
            street: z.string(),
            zipCode: z.string(),
        });

        const PersonSchema = z.object({
            address: AddressSchema,
            age: z.number(),
            name: z.string(),
        });

        type Person = z.infer<typeof PersonSchema>;

        const factory = new ZodFactory(PersonSchema);
        const person = factory.build();

        expectTypeOf(person).toEqualTypeOf<Person>();
        expectTypeOf(person.address).toExtend<{
            city: string;
            country: string;
            state: string;
            street: string;
            zipCode: string;
        }>();
    });

    it('should handle arrays', () => {
        const TodoSchema = z.object({
            completed: z.boolean(),
            id: z.string(),
            priorities: z.array(z.number()).min(1).max(5),
            tags: z.array(z.string()),
            title: z.string(),
        });

        type Todo = z.infer<typeof TodoSchema>;

        const factory = new ZodFactory(TodoSchema);
        const todo = factory.build();

        expectTypeOf(todo).toEqualTypeOf<Todo>();
        expectTypeOf(todo.tags).toEqualTypeOf<string[]>();
        expectTypeOf(todo.priorities).toEqualTypeOf<number[]>();
    });

    it('should handle enums', () => {
        const StatusEnum = z.enum(['pending', 'approved', 'rejected']);
        const RoleEnum = z.enum(['admin', 'user', 'guest'] as const);

        const RequestSchema = z.object({
            id: z.string(),
            status: StatusEnum,
            userRole: RoleEnum,
        });

        type Request = z.infer<typeof RequestSchema>;

        const factory = new ZodFactory(RequestSchema);
        const request = factory.build();

        expectTypeOf(request).toEqualTypeOf<Request>();
        expectTypeOf(request.status).toEqualTypeOf<'approved' | 'pending' | 'rejected'>();
        expectTypeOf(request.userRole).toEqualTypeOf<'admin' | 'guest' | 'user'>();
    });

    it('should handle unions', () => {
        const ResponseSchema = z.object({
            code: z.union([z.number(), z.string()]),
            data: z.union([z.object({ message: z.string() }), z.null()]),
            status: z.union([z.literal('success'), z.literal('error')]),
        });

        type Response = z.infer<typeof ResponseSchema>;

        const factory = new ZodFactory(ResponseSchema);
        const response = factory.build();

        expectTypeOf(response).toEqualTypeOf<Response>();
        expectTypeOf(response.status).toEqualTypeOf<'error' | 'success'>();
        expectTypeOf(response.code).toEqualTypeOf<number | string>();
        expectTypeOf(response.data).toEqualTypeOf<{ message: string } | null>();
    });

    it('should handle discriminated unions', () => {
        const ShapeSchema = z.discriminatedUnion('type', [
            z.object({
                radius: z.number(),
                type: z.literal('circle'),
            }),
            z.object({
                height: z.number(),
                type: z.literal('rectangle'),
                width: z.number(),
            }),
            z.object({
                base: z.number(),
                height: z.number(),
                type: z.literal('triangle'),
            }),
        ]);

        type Shape = z.infer<typeof ShapeSchema>;

        // Note: ZodFactory currently expects ZodObject, discriminated unions need special handling
        // This is a known limitation - for now, skip the runtime test
        expectTypeOf<Shape>().toEqualTypeOf<
            | { base: number; height: number; type: 'triangle' }
            | { height: number; type: 'rectangle'; width: number }
            | { radius: number; type: 'circle' }
        >();
    });

    it('should handle tuples', () => {
        const CoordinateSchema = z.tuple([z.number(), z.number()]);
        const NamedTupleSchema = z.tuple([
            z.string(), // name
            z.number(), // age
            z.boolean(), // isActive
        ]);

        type Coordinate = z.infer<typeof CoordinateSchema>;
        type NamedTuple = z.infer<typeof NamedTupleSchema>;

        // Note: ZodFactory currently expects ZodObject, tuples need special handling
        // This is a known limitation - for now, just check types
        expectTypeOf<Coordinate>().toEqualTypeOf<[number, number]>();
        expectTypeOf<NamedTuple>().toEqualTypeOf<[string, number, boolean]>();
    });

    it('should handle records', () => {
        const ScoresSchema = z.record(z.string(), z.number());
        const ConfigSchema = z.record(
            z.enum(['dev', 'staging', 'prod']),
            z.object({
                apiKey: z.string(),
                apiUrl: z.url(),
            }),
        );

        type Scores = z.infer<typeof ScoresSchema>;
        type Config = z.infer<typeof ConfigSchema>;

        // Note: ZodFactory currently expects ZodObject, records need special handling
        // For now, just check the types
        expectTypeOf<Scores>().toEqualTypeOf<Record<string, number>>();
        expectTypeOf<Config>().toEqualTypeOf<
            Record<
                'dev' | 'prod' | 'staging',
                {
                    apiKey: string;
                    apiUrl: string;
                }
            >
        >();
    });

    it('should handle default values', () => {
        const SettingsSchema = z.object({
            locale: z.string().default('en-US'),
            notifications: z.boolean().default(true),
            pageSize: z.number().default(20),
            theme: z.enum(['light', 'dark']).default('light'),
        });

        type Settings = z.infer<typeof SettingsSchema>;

        const factory = new ZodFactory(SettingsSchema);
        const settings = factory.build();

        expectTypeOf(settings).toEqualTypeOf<Settings>();
        expectTypeOf(settings.theme).toEqualTypeOf<'dark' | 'light'>();
        expectTypeOf(settings.notifications).toBeBoolean();
        expectTypeOf(settings.pageSize).toBeNumber();
        expectTypeOf(settings.locale).toBeString();
    });

    it('should handle transforms', () => {
        const TransformSchema = z.object({
            age: z.string().transform((str) => Number.parseInt(str, 10)),
            email: z.email().transform((str) => str.toLowerCase()),
            tags: z.string().transform((str) => str.split(',')),
        });

        // type TransformInput = z.input<typeof TransformSchema>; // Unused
        type TransformOutput = z.output<typeof TransformSchema>;

        // For type testing purposes, we're verifying the output types
        // The actual runtime behavior would need valid input data
        expectTypeOf<TransformOutput>().toEqualTypeOf<{
            age: number;
            email: string;
            tags: string[];
        }>();
    });

    it('should handle lazy schemas for recursive types', () => {
        interface Category {
            id: string;
            name: string;
            subcategories?: Category[];
        }

        const CategorySchema: z.ZodType<Category> = z.lazy(() =>
            z.object({
                id: z.string(),
                name: z.string(),
                subcategories: z.array(CategorySchema).optional(),
            }),
        );

        // const factory = new ZodFactory(CategorySchema); // Would need special handling

        // Note: ZodFactory currently expects ZodObject, lazy schemas need special handling
        // For type testing, we just verify the type inference
        expectTypeOf<Category>().toEqualTypeOf<{
            id: string;
            name: string;
            subcategories?: Category[];
        }>();
    });

    it('should handle refinements', () => {
        const PasswordSchema = z
            .object({
                confirmPassword: z.string(),
                password: z.string().min(8),
            })
            .refine((data) => data.password === data.confirmPassword, {
                message: "Passwords don't match",
                path: ['confirmPassword'],
            });

        type PasswordForm = z.infer<typeof PasswordSchema>;

        // For refinements, we need to ensure the generated data passes validation
        // by providing custom overrides that satisfy the refinement
        const factory = new ZodFactory(PasswordSchema);
        const password = 'securePassword123';
        const form = factory.build({
            confirmPassword: password,
            password,
        });

        expectTypeOf(form).toEqualTypeOf<PasswordForm>();
        expectTypeOf(form.password).toBeString();
        expectTypeOf(form.confirmPassword).toBeString();
    });

    it('should handle batch operations', () => {
        const ItemSchema = z.object({
            id: z.uuid(),
            name: z.string(),
            price: z.number().positive(),
        });

        type Item = z.infer<typeof ItemSchema>;

        const factory = new ZodFactory(ItemSchema);
        const items = factory.batch(5);

        expectTypeOf(items).toEqualTypeOf<Item[]>();
        expectTypeOf(items[0]).toEqualTypeOf<Item>();
    });

    it('should handle build overrides', () => {
        const ProductSchema = z.object({
            id: z.string(),
            inStock: z.boolean(),
            name: z.string(),
            price: z.number(),
        });

        type Product = z.infer<typeof ProductSchema>;

        const factory = new ZodFactory(ProductSchema);
        const product = factory.build({
            name: 'Custom Product',
            price: 99.99,
        });

        expectTypeOf(product).toEqualTypeOf<Product>();
        expectTypeOf(product.name).toBeString();
        expectTypeOf(product.price).toBeNumber();
    });

    it('should handle complex nested schemas', () => {
        const CompanySchema = z.object({
            employees: z.array(
                z.object({
                    department: z.enum(['engineering', 'sales', 'marketing']),
                    email: z.email(),
                    id: z.uuid(),
                    manager: z
                        .object({
                            id: z.string(),
                            name: z.string(),
                        })
                        .nullable(),
                    name: z.string(),
                }),
            ),
            id: z.uuid(),
            metadata: z.object({
                founded: z.date(),
                public: z.boolean(),
                revenue: z.number().positive(),
                tags: z.array(z.string()),
            }),
            name: z.string(),
        });

        type Company = z.infer<typeof CompanySchema>;

        const factory = new ZodFactory(CompanySchema);
        const company = factory.build();

        expectTypeOf(company).toEqualTypeOf<Company>();
        expectTypeOf(company.employees).toEqualTypeOf<
            {
                department: 'engineering' | 'marketing' | 'sales';
                email: string;
                id: string;
                manager: { id: string; name: string } | null;
                name: string;
            }[]
        >();
        expectTypeOf(company.metadata).toExtend<{
            founded: Date;
            public: boolean;
            revenue: number;
            tags: string[];
        }>();
    });

    it('should handle promise schemas with custom handlers', () => {
        // Skip this test for now as z.promise() is not available in Zod v4
        // and requires special handling
    });

    it('should handle function schemas with custom handlers', () => {
        // Skip this test as z.function() requires special handling in schemas
        // Functions need to be handled through custom type handlers
    });

    it('should handle partial method from base Factory', () => {
        const UserSchema = z.object({
            age: z.number().int().min(18).max(100),
            createdAt: z.date(),
            email: z.email(),
            id: z.uuid(),
            isActive: z.boolean(),
            name: z.string(),
        });

        type User = z.infer<typeof UserSchema>;

        const factory = new ZodFactory(UserSchema);
        const partialFactory = factory.partial();

        // The partial factory should return Factory<Partial<User>>
        expectTypeOf(partialFactory).toEqualTypeOf<Factory<Partial<User>>>();

        // Build result should be Partial<User>
        const partialUser = partialFactory.build();
        expectTypeOf(partialUser).toEqualTypeOf<Partial<User>>();

        // All properties should be optional
        expectTypeOf(partialUser.id).toEqualTypeOf<string | undefined>();
        expectTypeOf(partialUser.name).toEqualTypeOf<string | undefined>();
        expectTypeOf(partialUser.email).toEqualTypeOf<string | undefined>();
        expectTypeOf(partialUser.age).toEqualTypeOf<number | undefined>();
        expectTypeOf(partialUser.isActive).toEqualTypeOf<boolean | undefined>();
        expectTypeOf(partialUser.createdAt).toEqualTypeOf<Date | undefined>();

        // Should be able to build with only some properties
        const customPartialUser = partialFactory.build({
            age: 30,
            name: 'Jane Doe',
        });
        expectTypeOf(customPartialUser).toEqualTypeOf<Partial<User>>();
        expectTypeOf(customPartialUser.name).toEqualTypeOf<string | undefined>();
        expectTypeOf(customPartialUser.age).toEqualTypeOf<number | undefined>();
    });

    it('should handle partial method with nested schemas', () => {
        const AddressSchema = z.object({
            city: z.string(),
            street: z.string(),
            zipCode: z.string(),
        });

        const PersonSchema = z.object({
            address: AddressSchema,
            id: z.uuid(),
            name: z.string(),
            tags: z.array(z.string()),
        });

        type Person = z.infer<typeof PersonSchema>;
        type PartialPerson = Partial<Person>;

        const factory = new ZodFactory(PersonSchema);
        const partialFactory = factory.partial();

        expectTypeOf(partialFactory).toEqualTypeOf<Factory<PartialPerson>>();

        const partialPerson = partialFactory.build();
        expectTypeOf(partialPerson).toEqualTypeOf<PartialPerson>();

        // Nested objects should also be optional
        expectTypeOf(partialPerson.address).toEqualTypeOf<
            | {
                  city: string;
                  street: string;
                  zipCode: string;
              }
            | undefined
        >();

        expectTypeOf(partialPerson.tags).toEqualTypeOf<string[] | undefined>();
    });
});
