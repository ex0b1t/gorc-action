import dotenv from 'dotenv';

dotenv.config();

import core from '@actions/core';
import { run } from './gops.js';

const organization: string = core.getInput('organization', { required: true });
const command: string = core.getInput('command', { required: true });
const configFile: string = core.getInput('gops-config', { required: true });
const githubToken: string = core.getInput('github-token', { required: true });

try {
  const output = await run(organization, command, configFile, githubToken);

  core.setOutput('org', organization);
  core.setOutput('command', command);

  core.setOutput('gops', output.gops);
  core.setOutput('valid', output.valid);
  core.setOutput('errors', output.errors);
} catch (error) {
  if (error instanceof Error) core.setFailed(error.message);
}
