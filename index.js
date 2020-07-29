const { execSync, execFileSync } = require('child_process');
const joi = require('joi');
const os = require('os');
const fs = require('fs');

// We send the message while the process is exiting, so we can only do synchronous work.
// To work around that, we send the message in a child process using execSync
function sendMessage({
  status,
  message,
  fallback,
  context,
  endpoint,
  channel
}) {
  const output = execSync(`node ${__dirname}/send-message.js ${status} "${message}" "${fallback}" "${context}" "${endpoint}" "${channel}"`);
  console.log(output.toString('utf-8'));
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
        return;
      }

      const appName = app.name;
      const appPath = api.resolvePath(api.getBasePath(), app.path);
      let commitHash = '<unable to retrieve git commit>';
      let commitMessage = '';

      if (fs.existsSync(api.resolvePath(appPath, '.git'))) {
        try {
          const commitHashOutput = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
            cwd: appPath,
          });
          commitHash = commitHashOutput.toString('utf-8').trim();

          const messageOutput = execFileSync("git", ["show", "-s", "--format=%s", commitHash], {
            cwd: appPath,
          });
          commitMessage = `(${messageOutput.toString('utf-8').trim()})`;
        } catch (e) {
          console.error('Unable to retrieve git commit details');
          console.error(e);
        }
      }

      const appUrl = app.env && app.env.ROOT_URL ? app.env.ROOT_URL : '';
      const isCI = process.env.CI === 'true';
      const context = `Deployed commit *${commitHash}* ${commitMessage} from *${isCI ? 'CI' : os.hostname()}*`;

      process.on('exit', async (code) => {
        if (code > 0) {
          sendMessage({
            status: 'danger',
            message: `Deploy for <${appUrl}|${appName}> failed.`,
            fallback: `Deploy for ${appName} failed.`,
            context,
            endpoint: deployNotifications.slackWebhookUrl,
            channel: deployNotifications.slackChannel
          });
        } else {
          sendMessage({
            status: 'good',
            message: `Deploy for <${appUrl}|${appName}> succeeded.`,
            fallback: `Deploy for ${appName} succeeded.`,
            context,
            endpoint: deployNotifications.slackWebhookUrl,
            channel: deployNotifications.slackChannel
          });
        }
      });
    }
  }
};
