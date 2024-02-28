import dotenv from 'dotenv';

dotenv.config();

import core from '@actions/core';
import { run } from './gorc.js';
import { logger } from './logger.js';

const organization: string = core.getInput('organization', { required: true });
const command: string = core.getInput('command', { required: true });
const configFile: string = core.getInput('gorc-config', { required: true });
const githubToken: string = core.getInput('github-token', { required: true });

try {
  const output = await run(organization, command, configFile, githubToken);

  core.setOutput('org', organization);
  core.setOutput('command', command);

  core.setOutput('gorc', output.gorc);
  core.setOutput('valid', output.valid);
  core.setOutput('errors', output.errors);

  if (output.errors != undefined && output.errors.length > 0) {
    logger.error('Failing due to errors');
    core.setFailed(output.errors.join('\n'));
  }
} catch (error) {
  logger.error('Failing due to error');
  if (error instanceof Error) core.setFailed(error.message);
}

logger.verbose('Done');
