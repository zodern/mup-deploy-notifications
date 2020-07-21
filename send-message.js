const axios = require('axios');

const color = process.argv[2]
const message = process.argv[3]
const endpoint = process.argv[4]
const channel = process.argv[5]

async function send() {
  axios.post(endpoint, {
    "channel": channel,
    "text": "",
    attachments: [{
      color: color === 'none' ? undefined : color,
      mrkdwn_in: 'text',
      text: message
    }]
  })
}

send()
