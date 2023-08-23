import dotenv from 'dotenv';

dotenv.config();

import core from '@actions/core';
import { run } from './gops.js';

const organization: string = core.getInput('organization');
if (!organization) core.setFailed('Organization is required!');
const command: string = core.getInput('command');
if (!command) core.setFailed('Command is required!');
const configFile: string = core.getInput('gops-config');
if (!configFile) core.setFailed('Gops config is required!');

try {
  const output = await run(organization, command, configFile);

  core.setOutput('org', organization);
  core.setOutput('command', command);

  core.setOutput('gops', output.gops);
  core.setOutput('valid', output.valid);
  core.setOutput('errors', output.errors);
} catch (error) {
  if (error instanceof Error) core.setFailed(error.message);
}
