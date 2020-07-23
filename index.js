const { execSync } = require('child_process');
const joi = require('joi');

function sendMessage(status, message, endpoint, channel) {
  const output = execSync(`node ${__dirname}/send-message.js ${status} "${message}" "${endpoint}" "${channel}"`)
  console.log(output.toString('utf-8'))
}


module.exports = {
  name: 'deploy-notifications',
  description: 'Receive notifications after a deploy',
  commands: {},
  validate: {
    'deployNotifications'(config, utils) {
      const schema = joi.object().keys({
        slackWebhookUrl: joi.string().required(),
        slackChannel: joi.string().required(),
      });

      var details = [];

      var validationErrors = schema.validate(config.deployNotifications, utils.VALIDATE_OPTIONS);
      details = utils.combineErrorDetails(details, validationErrors);
      return utils.addLocation(details, 'deployNotifications');
    }
  },
  hooks: {
    'pre.deploy'(api) {
      const {
        app,
        deployNotifications
      } = api.getConfig();
      if (!deployNotifications) {
        return
      }

      const appName = app.name
      const appUrl = app.env && app.env.ROOT_URL ? app.env.ROOT_URL : ''

      process.on('exit', async (code) => {
        if (code > 0) {
          sendMessage(
            'danger',
            `Deploy for <${appUrl}|${appName}> failed.`,
            deployNotifications.slackWebhookUrl,
            deployNotifications.slackChannel
          )
        } else {
          sendMessage(
            'good',
            `Deploy for <${appUrl}|${appName}> succeeded.`,
            deployNotifications.slackWebhookUrl,
            deployNotifications.slackChannel
          )
        }
      })
    }
  }
}
