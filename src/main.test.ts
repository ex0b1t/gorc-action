import { expect, test } from '@jest/globals';
import { run } from './gops.js';

test('test validate command', async () => {
  const output = await run('DevOptixNL', 'validate', '.github/gops.yml');
  expect(output.valid).toBeTruthy();
});
