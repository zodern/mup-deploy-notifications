const axios = require('axios');

const [
  status,
  message,
  fallback,
  context,
  endpoint,
  channel
] = process.argv.slice(2);

async function send() {
  axios.post(endpoint, {
    channel: channel,
    attachments: [{
      // When using blocks, slack only shows the color if it is a hex code
      color: status === 'danger' ? '#D63232' : '#36A64F',
      fallback: fallback,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message,
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: context
            }
          ]
        }
      ]
    }]
  });
}

send();
