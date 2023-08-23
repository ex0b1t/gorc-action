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

export const init = async (gops: Gops, organization: string, configFile: string) => {
  logger.info('Initializing gops.yml');
  gops.org = await getOrg(organization);
  gops.members = await getOrgMembers(organization);
  gops.teams = await getOrgTeams(organization);
  gops.repos = await getOrgRepos(organization);

  removeEmpty(gops);
  logger.info(`Writing gops.yml at path '${configFile}'`);
  fs.writeFileSync(configFile, yaml.dump(gops), { encoding: 'utf8' });
  logger.debug('gops.yml written');
  return gops;
};

/**
 * Validate the gops.yml file against the schema
 */
export const validate = async (gops: Gops): Promise<boolean> => {
  logger.info('Validating gops.yml');
  const ajv = new Ajv();
  const schema = JSON.parse(fs.readFileSync('gops-schema.json', { encoding: 'utf8' }));
  const validate = ajv.compile(schema);
  const valid = validate(gops);

  if (!valid && validate.errors) {
    logger.error(validate.errors);
    throw new ValidationError(validate.errors);
  }

  logger.info(`Gops config is ${valid ? 'valid' : 'invalid'}}`);
  return valid;
};

export const apply = async (gops: Gops, organization: string, dryRun = true): Promise<Gops> => {
  logger.info(`${dryRun ? 'Dry-running' : 'Applying'} gops.yml`);
  let updated: Gops = { org: {}, members: [], teams: [], repos: [] };

  // handle changes
  updated.org = await applyOrg(organization, dryRun, gops.org);
  updated.members = await applyMembers(organization, dryRun, gops.members);
  updated.teams = await applyTeams(organization, dryRun, gops.teams);
  updated.repos = await applyRepos(organization, dryRun, gops.repos);

  return updated;
};

export const run = async (org: string, cmd: string, configFile: string): Promise<any> => {
  logger.info(`Running gops with org '${org}' and command '${cmd}' and configFile '${configFile}'!`);

  const gops: Gops = (yaml.load(fs.readFileSync(configFile, { encoding: 'utf8' })) as Gops) || {};
  logger.debug(`Gops config file read successfully!`);
  logger.silly(JSON.stringify(gops));

  let output: { org: string; gops?: Gops; valid?: boolean; errors?: any[] } = { org: org, errors: [] };

  try {
    switch (cmd) {
      case 'init':
        output.gops = await init(gops, org, configFile);
        break;
      case 'validate':
        output.valid = await validate(gops);
        break;
      case 'dry-run':
        output.gops = await apply(gops, org, true);
        break;
      case 'apply':
        output.gops = await apply(gops, org, false);
        break;
      default:
        output.errors?.push(new Error(`Unknown command ${cmd}`));
    }
  } catch (err) {
    output.errors?.push(err);
  }

  logger.verbose(`Output ${JSON.stringify(output)}`);
  return output;
};
