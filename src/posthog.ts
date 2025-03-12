import { PostHog } from 'posthog-node';

const client = new PostHog('phc_QA5vkh1LnITsEmIhDeSZ2cE8veaBdpUKceWa3b9X3K9', {
  host: 'https://us.i.posthog.com',
});

export { client };
