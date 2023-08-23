import fs from 'fs';
import yaml from 'js-yaml';
import { Organization } from './organizations.js';
import { Member } from './members.js';
import { Team } from './teams.js';
import { Repository } from './repositories.js';
import { get as getOrg, apply as applyOrg } from './organizations.js';
import { get as getOrgMembers, apply as applyMembers } from './members.js';
import { get as getOrgTeams, apply as applyTeams } from './teams.js';
import { get as getOrgRepos, apply as applyRepos } from './repositories.js';
import Ajv, { ValidationError } from 'ajv';
import { logger } from './logger.js';

export interface Gops {
  org: Organization;
  members: Member[];
  teams: Team[];
  repos: Repository[];
}

export function removeEmpty(obj: any) {
  Object.keys(obj).forEach(function (key) {
    (obj[key] && typeof obj[key] === 'object' && removeEmpty(obj[key])) ||
      ((obj[key] === '' || obj[key] === null) && delete obj[key]);
  });
  return obj;
}

const gops: Gops = yaml.load(fs.readFileSync('.github/gops.yml', { encoding: 'utf8' })) as Gops;

export const init = async (organization: string) => {
  logger.info('Initializing gops.yml');
  gops.org = await getOrg(organization);
  gops.members = await getOrgMembers(organization);
  gops.teams = await getOrgTeams(organization);
  gops.repos = await getOrgRepos(organization);

  removeEmpty(gops);
  logger.info('Writing gops.yml');
  fs.writeFileSync('.github/gops.yml', yaml.dump(gops), { encoding: 'utf8' });
  return gops;
};

/**
 * Validate the gops.yml file against the schema
 */
export const validate = async (): Promise<boolean> => {
  logger.info('Validating gops.yml');
  const ajv = new Ajv();
  const schema = JSON.parse(fs.readFileSync('gops-schema.json', { encoding: 'utf8' }));
  const validate = ajv.compile(schema);
  const valid = validate(gops);

  if (!valid && validate.errors) {
    logger.error(validate.errors);
    throw new ValidationError(validate.errors);
  } else {
    logger.info('Gops config is valid');
  }

  return valid;
};

export const apply = async (organization: string, dryRun = true): Promise<Gops> => {
  let updated: Gops = { org: {}, members: [], teams: [], repos: [] };

  // handle changes
  updated.org = await applyOrg(organization, dryRun, gops.org);
  updated.members = await applyMembers(organization, dryRun, gops.members);
  updated.teams = await applyTeams(organization, dryRun, gops.teams);
  updated.repos = await applyRepos(organization, dryRun, gops.repos);

  return updated;
};
