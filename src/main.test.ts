import dotenv from 'dotenv';

dotenv.config();

import { expect, test } from '@jest/globals';
import { run } from './gops.js';

test('test validate command', async () => {
  const output = await run('DevOptixNL', 'validate', '.github/gops.yml', process.env.GITHUB_TOKEN || '');
  expect(output.valid).toBeTruthy();
});

test('dry run', async () => {
  const output = await run(
    'Backbase',
    'apply',
    '/Users/jaco/code/backbase/self-service/.github/gops.yml',
    process.env.GITHUB_TOKEN || ''
  );
});
