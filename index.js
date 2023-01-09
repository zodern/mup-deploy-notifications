const { execSync, execFileSync } = require('child_process');
const joi = require('joi');
const os = require('os');

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
        deployNotifications,
        proxy
      } = api.getConfig();

      if (!deployNotifications) {
        return;
      }

      const appName = app.name;
      const appPath = api.resolvePath(api.getBasePath(), app.path || process.cwd());
      let commitHash = '<unable to retrieve git commit>';
      let commitMessage = '';

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
        if (e.message && e.message.includes('not a git repository')) {
          console.error('Unable to include git details in deploy notification: no .git folder found');
        } else {
          console.error('Unable to retrieve git commit details');
          console.error(e);
        }
      }

      let appUrl;
      if (app.env && app.env.ROOT_URL) {
        appUrl = app.env.ROOT_URL;
      } else if (proxy && proxy.domains) {
        let domain = proxy.domains.split(',')[0].trim();
        appUrl = `https://${domain}`;
      }

      const isCI = process.env.CI === 'true';
      const context = `Deployed commit *${commitHash}* ${commitMessage} from *${isCI ? 'CI' : os.hostname()}*`;

      let appLink = appUrl ? `<${appUrl}}${appName}>` : appName;

      process.on('exit', async (code) => {
        if (code > 0) {
          sendMessage({
            status: 'danger',
            message: `Deploy for ${appLink} failed.`,
            fallback: `Deploy for ${appName} failed.`,
            context,
            endpoint: deployNotifications.slackWebhookUrl,
            channel: deployNotifications.slackChannel
          });
        } else {
          sendMessage({
            status: 'good',
            message: `Deploy for ${appLink} succeeded.`,
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
