/**
 * Circular References Example
 *
 * This example demonstrates how to handle circular references
 * using the use() method for lazy evaluation.
 */

import { Factory } from 'interface-forge';

interface Department {
    employees: Employee[];
    id: string;
    manager: Employee;
    name: string;
}

interface Employee {
    department: Department;
    id: string;
    name: string;
    subordinates: Employee[];
    supervisor?: Employee;
}

interface Post {
    author: User;
    content: string;
    id: string;
    relatedPosts: Post[];
    title: string;
}

interface User {
    favoritePost?: Post;
    id: string;
    name: string;
    posts: Post[];
}

const UserFactory: Factory<User> = new Factory<User>((faker) => ({
    favoritePost: faker.use(() => PostFactory.build()),
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    posts: faker.use(() => PostFactory.batch(3)),
}));

const PostFactory: Factory<Post> = new Factory<Post>((faker) => ({
    author: faker.use(() => UserFactory.build()),
    content: faker.lorem.paragraphs(2),
    id: faker.string.uuid(),
    relatedPosts: faker.use(() => PostFactory.batch(2)),
    title: faker.lorem.sentence(),
}));

const user = UserFactory.build();
console.log('User:', user.name);
console.log('Posts by user:', user.posts.length);
console.log('Favorite post:', user.favoritePost?.title);

const DepartmentFactory: Factory<Department> = new Factory<Department>((faker) => ({
    employees: faker.use(() => EmployeeFactory.batch(5)),
    id: faker.string.uuid(),
    manager: faker.use(() => EmployeeFactory.build()),
    name: faker.commerce.department(),
}));

const EmployeeFactory: Factory<Employee> = new Factory<Employee>((faker) => ({
    department: faker.use(() => DepartmentFactory.build()),
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    subordinates: faker.use(() => EmployeeFactory.batch(faker.number.int({ max: 3, min: 0 }))),
    supervisor: faker.datatype.boolean({ probability: 0.8 }) ? faker.use(() => EmployeeFactory.build()) : undefined,
}));

const LimitedUserFactory: Factory<User> = new Factory<User>(
    (faker) => ({
        favoritePost: undefined,
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        posts: faker.use(() => LimitedPostFactory.batch(2)),
    }),
    { maxDepth: 3 },
);

const LimitedPostFactory: Factory<Post> = new Factory<Post>(
    (faker) => ({
        author: faker.use(() => LimitedUserFactory.build()),
        content: faker.lorem.paragraphs(2),
        id: faker.string.uuid(),
        relatedPosts: faker.use(() => LimitedPostFactory.batch(1)),
        title: faker.lorem.sentence(),
    }),
    { maxDepth: 3 },
);

const limitedUser = LimitedUserFactory.build();
console.log('Limited depth user:', limitedUser);

const createUserWithOwnPosts = () => {
    const user = UserFactory.build({ favoritePost: undefined, posts: [] });

    const posts = PostFactory.batch(3, { author: user });

    user.posts = posts;
    [user.favoritePost] = posts;

    return user;
};

const userWithOwnPosts = createUserWithOwnPosts();
console.log(
    'User owns all posts:',
    userWithOwnPosts.posts.every((post: Post) => post.author.id === userWithOwnPosts.id),
);

interface GraphNode {
    connections: GraphNode[];
    id: string;
    value: number;
}

const GraphNodeFactory: Factory<GraphNode> = new Factory<GraphNode>((faker) => ({
    connections: faker.use(() => GraphNodeFactory.batch(faker.number.int({ max: 3, min: 0 }))),
    id: faker.string.uuid(),
    value: faker.number.int({ max: 100, min: 1 }),
}));

const graphRoot = new Factory<GraphNode>(
    (faker) => ({
        connections: faker.use(() => GraphNodeFactory.batch(3)),
        id: faker.string.uuid(),
        value: faker.number.int({ max: 100, min: 1 }),
    }),
    { maxDepth: 2 },
).build();

console.log('Graph root node:', graphRoot.id);
console.log('Direct connections:', graphRoot.connections.length);
