/**
 * Advanced Composition Example
 *
 * This example shows how to compose multiple factories together
 * to create complex object graphs with relationships.
 */

import { Factory } from 'interface-forge';

interface Author {
    bio: string;
    email: string;
    id: string;
    name: string;
}

interface BlogPost {
    author: Author;
    comments: Comment[];
    content: string;
    id: string;
    publishedAt: Date;
    tags: string[];
    title: string;
    viewCount: number;
}

interface Comment {
    authorName: string;
    content: string;
    createdAt: Date;
    id: string;
}

const AuthorFactory = new Factory<Author>((faker) => ({
    bio: faker.lorem.paragraph(),
    email: faker.internet.email(),
    id: faker.string.uuid(),
    name: faker.person.fullName(),
}));

const CommentFactory = new Factory<Comment>((faker) => ({
    authorName: faker.person.fullName(),
    content: faker.lorem.sentences(2),
    createdAt: faker.date.recent(),
    id: faker.string.uuid(),
}));

const BlogPostFactory = new Factory<BlogPost>((faker) => ({
    author: AuthorFactory.build(),
    comments: CommentFactory.batch(faker.number.int({ max: 10, min: 0 })),
    content: faker.lorem.paragraphs(3),
    id: faker.string.uuid(),
    publishedAt: faker.date.past(),
    tags: faker.helpers.multiple(() => faker.lorem.word(), {
        count: { max: 5, min: 2 },
    }),
    title: faker.lorem.sentence(),
    viewCount: faker.number.int({ max: 10_000, min: 0 }),
}));

const blogPost = BlogPostFactory.build();
console.log('Blog post:', blogPost.title);
console.log('Author:', blogPost.author.name);
console.log('Comments:', blogPost.comments.length);

const specificAuthor = AuthorFactory.build({ name: 'Jane Smith' });
const authoredPost = BlogPostFactory.build({
    author: specificAuthor,
    tags: ['typescript', 'testing', 'mocking'],
});
console.log('Post by Jane:', authoredPost);

const CompositeBlogFactory = BlogPostFactory.compose({
    author: AuthorFactory,
    comments: CommentFactory.batch(3),
});

const composedPost = CompositeBlogFactory.build();
console.log('Composed post:', composedPost);

const progressivePosts = Array.from({ length: 5 }, (_, index) =>
    BlogPostFactory.build({
        comments: CommentFactory.batch(index * 2),
        title: `Blog Post #${index + 1}`,
        viewCount: index * 1000,
    }),
);

progressivePosts.forEach((post: BlogPost, i: number) => {
    console.log(`Post ${i + 1}: ${post.comments.length} comments, ${post.viewCount} views`);
});
