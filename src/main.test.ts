import dotenv from 'dotenv';

dotenv.config();

import { expect, test } from '@jest/globals';
import { run } from './gops.js';

test('test validate command', async () => {
  const output = await run('DevOptixNL', 'validate', '.github/gops.yml', process.env.GITHUB_TOKEN || '');
  expect(output.valid).toBeTruthy();
});
