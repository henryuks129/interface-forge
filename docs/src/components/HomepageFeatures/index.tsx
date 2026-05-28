import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
    title: string;
    icon: string;
    description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
    {
        title: 'Type-Safe Mock Generation',
        icon: '🔒',
        description: (
            <>
                Generate mock data that perfectly matches your TypeScript interfaces. Get full IntelliSense support and
                compile-time type checking for all your factories.
            </>
        ),
    },
    {
        title: 'Powered by Faker.js',
        icon: '🎭',
        description: (
            <>
                Built on top of the popular Faker.js library, giving you access to realistic fake data for names,
                addresses, dates, and more out of the box.
            </>
        ),
    },
    {
        title: 'Schema Integration',
        icon: '⚡',
        description: (
            <>
                Optional Zod schema integration allows you to generate mock data directly from your runtime validation
                schemas with zero additional configuration.
            </>
        ),
    },
];

function Feature({ title, icon, description }: FeatureItem) {
    return (
        <div className={clsx('col col--4')}>
            <div className="text--center">
                <div className={styles.featureIcon}>{icon}</div>
            </div>
            <div className="text--center padding-horiz--md">
                <Heading as="h3">{title}</Heading>
                <p>{description}</p>
            </div>
        </div>
    );
}

export default function HomepageFeatures(): JSX.Element {
    return (
        <section className={styles.features}>
            <div className="container">
                <div className="row">
                    {FeatureList.map((props, idx) => (
                        <Feature key={idx} {...props} />
                    ))}
                </div>
            </div>
        </section>
    );
}
