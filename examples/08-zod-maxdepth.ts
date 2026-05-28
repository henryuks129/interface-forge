/**
 * Example: MaxDepth Behavior with Zod Schemas
 *
 * This example demonstrates how to properly use the maxDepth option
 * with ZodFactory to control recursion depth in nested schemas.
 */

import { z } from 'zod/v4';
import { ZodFactory } from 'interface-forge/zod';

// Example 1: Understanding the Problem
// When maxDepth is reached, the factory returns empty objects {}
// This can cause validation errors with required fields
console.log('=== Example 1: MaxDepth Problem ===');

const problematicSchema = z.object({
    data: z.object({
        nested: z.object({
            deeper: z.object({
                deepest: z.object({
                    value: z.string(), // Required field
                }),
            }),
        }),
    }),
});

try {
    const factory = new ZodFactory(problematicSchema, { maxDepth: 2 });
    factory.build();
    console.log('This should not print - validation should fail');
} catch {
    console.log('Expected error: Schema validation failed at depth limit');
    console.log('Reason: Required fields in objects beyond maxDepth');
}

// Example 2: Solution with Optional Fields
console.log('\n=== Example 2: Using Optional Fields ===');

const optionalSchema = z.object({
    data: z.object({
        nested: z.object({
            deeper: z
                .object({
                    deepest: z
                        .object({
                            value: z.string(),
                        })
                        .optional(), // Make deep nesting optional
                })
                .optional(), // Make intermediate levels optional too
        }),
    }),
});

const optionalFactory = new ZodFactory(optionalSchema, { maxDepth: 2 });
const optionalResult = optionalFactory.build();
console.log('Generated with optional fields:');
console.log(JSON.stringify(optionalResult, null, 2));

// Example 3: Recursive Schemas with Depth Control
console.log('\n=== Example 3: Recursive Schemas ===');

// Category tree with self-referencing schema
interface Category {
    description: string;
    id: string;
    name: string;
    subcategories?: Category[];
}

const CategorySchema: z.ZodType<Category> = z.lazy(() =>
    z.object({
        description: z.string().max(200),
        id: z.uuid(),
        name: z.string().min(3).max(50),
        subcategories: z.array(CategorySchema).optional(), // Optional to handle depth limits
    }),
);

const categoryFactory = new ZodFactory(CategorySchema as any, { maxDepth: 3 });
const categoryTree = categoryFactory.build() as Category;

// Helper to count depth
function countDepth(category: Category, currentDepth = 0): number {
    if (!category.subcategories || category.subcategories.length === 0) {
        return currentDepth;
    }
    return Math.max(...category.subcategories.map((sub) => countDepth(sub, currentDepth + 1)));
}

console.log('Generated category tree:');
console.log(`Root: ${categoryTree.name}`);
console.log(`Total depth: ${countDepth(categoryTree)}`);

// Example 4: Different MaxDepth Values
console.log('\n=== Example 4: Different MaxDepth Values ===');

interface TreeNode {
    left?: TreeNode;
    right?: TreeNode;
    value: number;
}

const treeSchema: z.ZodType<TreeNode> = z.lazy(() =>
    z.object({
        left: treeSchema.optional(),
        right: treeSchema.optional(),
        value: z.number().int().min(1).max(100),
    }),
);

// Test different depths
[1, 2, 3, 5].forEach((depth) => {
    const factory = new ZodFactory(treeSchema as any, { maxDepth: depth });
    const tree = factory.build() as TreeNode;

    function getMaxDepth(node: TreeNode | undefined, current = 0): number {
        if (!node) {
            return current;
        }
        const leftDepth = node.left ? getMaxDepth(node.left, current + 1) : current;
        const rightDepth = node.right ? getMaxDepth(node.right, current + 1) : current;
        return Math.max(leftDepth, rightDepth);
    }

    console.log(`maxDepth=${depth}: Actual depth=${getMaxDepth(tree)}`);
});

// Example 5: Practical Use Case - Comment Thread
console.log('\n=== Example 5: Comment Thread with MaxDepth ===');

interface Comment {
    author: string;
    content: string;
    id: string;
    replies?: Comment[];
    timestamp: Date;
}

const CommentSchema: z.ZodType<Comment> = z.lazy(() =>
    z.object({
        author: z.string(),
        content: z.string().min(1).max(500),
        id: z.uuid(),
        replies: z.array(CommentSchema).max(5).optional(), // Limit replies and make optional
        timestamp: z.date(),
    }),
);

// Create a comment thread with limited depth
const commentFactory = new ZodFactory(CommentSchema as any, {
    maxDepth: 4, // Allows for main comment + 3 levels of replies
});

const commentThread = commentFactory.build() as Comment;

function printCommentThread(comment: Comment, indent = ''): void {
    console.log(`${indent}[${comment.author}]: ${comment.content.slice(0, 50)}...`);
    if (comment.replies) {
        comment.replies.forEach((reply) => {
            printCommentThread(reply, `${indent}  `);
        });
    }
}

console.log('Generated comment thread:');
printCommentThread(commentThread);

// Example 6: Best Practices Summary
console.log('\n=== Best Practices for MaxDepth ===');
console.log('1. Always use .optional() for nested objects that might hit depth limits');
console.log('2. Design schemas with natural termination points');
console.log('3. Consider the total depth needed for your use case');
console.log('4. Test with different maxDepth values to ensure proper behavior');
console.log('5. Use lazy schemas (z.lazy) for true recursive structures');
