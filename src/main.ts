import dotenv from 'dotenv';
dotenv.config();
import core from '@actions/core';
import github from '@actions/github';
import { apply, Gops, init, validate } from './gops.js';
import { logger } from './logger.js';

try {
  const organisation: string = core.getInput('organisation');
  logger.info(`Org ${organisation}!`);

  const commands: string[] = core.getInput('command').split(',');
  logger.info(`Commands to run ${commands}!`);

  // loop over commands
  let output: { org: string; gops?: Gops; valid?: boolean; errors?: any } = { org: organisation };

  for (const command of commands) {
    switch (command) {
      case 'init':
        await init(organisation)
          .then((gops) => {
            output.gops = gops;
          })
          .catch((err) => {
            output.errors = err;
          });
        break;
      case 'validate':
        await validate()
          .then((valid) => {
            output.valid = valid;
          })
          .catch((err) => {
            output.errors = err;
          });
        break;
      case 'dry-run':
        await apply(organisation, true)
          .then((gops) => {
            output.gops = gops;
          })
          .catch((err) => {
            output.errors = err;
          });
        break;
      case 'apply':
        await apply(organisation, false)
          .then((gops) => {
            output.gops = gops;
          })
          .catch((err) => {
            output.errors = err;
          });
        break;
      default:
        output.errors = new Error(`Unknown command ${command}`);
        break;
    }
  }

  logger.verbose(`Output ${JSON.stringify(output)}`);
  core.setOutput('org', output.org);
  core.setOutput('gops', output.gops);
  core.setOutput('valid', output.valid);
  core.setOutput('errors', output.errors);

  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2);
  logger.debug(`The event payload: ${payload}`);
} catch (error) {
  if (error instanceof Error) core.setFailed(error.message);
}
