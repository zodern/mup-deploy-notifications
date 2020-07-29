# Mup Deploy Notifications

Sends Slack notifications when a deploy starts and when it succeeds or fails.

Install it with:

```sh
npm install mup-deploy-notifications
```

and add it to your `plugins` array in your mup config:

```js
module.exports = {
  // ... rest of config

  plugins: [ 'mup-deploy-notifications' ]
}
```

Next, add a `deployNotifications` object to your mup config:

```js
module.exports = {
  // ... rest of config

  deployNotifications: {
    // Add the incoming webhooks app (https://slack.com/apps/A0F7XDUAZ-incoming-webhooks)
    // to get a webhook url
    slackWebhookUrl: 'https://hooks.slack.com/services/789/1234345/abcdefg',
    // Name of slack channel to receive the messages
    slackChannel: '#deploys'
  }
}
```
