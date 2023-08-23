import dotenv from 'dotenv';

dotenv.config();
import core from '@actions/core';
import github from '@actions/github';
import { apply, Gops, init, validate } from './gops.js';
import { logger } from './logger.js';

try {
  const organization: string = core.getInput('organization');
  logger.info(`Org ${organization}!`);
  if (!organization) throw new Error('Organization is required!');

  const commands: string[] = core.getInput('command').split(',');
  logger.info(`Commands to run ${commands}!`);

  // loop over commands
  let output: { org: string; gops?: Gops; valid?: boolean; errors?: any } = { org: organization };

  for (const command of commands) {
    try {
      switch (command) {
        case 'init':
          output.gops = await init(organization);
          break;
        case 'validate':
          output.valid = await validate();
          break;
        case 'dry-run':
          output.gops = await apply(organization, true);
          break;
        case 'apply':
          output.gops = await apply(organization, false);
          break;
        default:
          throw new Error(`Unknown command ${command}`);
      }
    } catch (err) {
      output.errors = err;
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
