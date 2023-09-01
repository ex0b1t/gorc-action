import fs from 'fs';
import yaml from 'js-yaml';
import { Organization } from './organizations.js';
import { Member } from './members.js';
import { Team } from './teams.js';
import { get as getOrg, apply as applyOrg } from './organizations.js';
import { get as getOrgMembers, apply as applyMembers } from './members.js';
import { get as getOrgCollaborators, apply as applyCollaborators } from './collaborators.js';
import { get as getOrgTeams, apply as applyTeams } from './teams.js';
import Ajv, { ValidationError } from 'ajv';
import { logger } from './logger.js';
import { Octokit } from 'octokit';

export interface Behaviors {
  unknown_teams: 'remove' | 'warn';
  unknown_members: 'remove' | 'warn' | 'convert_to_outside_collaborator';
  unknown_collaborators: 'remove' | 'warn';
}
export interface Gops {
  org: Organization;
  members: Member[];
  collaborators: string[];
  teams: Team[];
  behaviours: Behaviors;
}

export function removeEmpty(obj: any) {
  Object.keys(obj).forEach(function (key) {
    (obj[key] && typeof obj[key] === 'object' && removeEmpty(obj[key])) ||
      ((obj[key] === '' || obj[key] === null) && delete obj[key]);
  });
  return obj;
}

export const init = async (octokit: Octokit, gops: Gops, organization: string, configFile: string) => {
  logger.verbose('Running init');
  gops.org = await getOrg(octokit, organization);
  gops.members = await getOrgMembers(octokit, organization);
  gops.collaborators = await getOrgCollaborators(octokit, organization);
  gops.teams = await getOrgTeams(octokit, organization);

  removeEmpty(gops);
  logger.verbose(`Writing gops.yml at path '${configFile}'`);
  fs.writeFileSync(configFile, yaml.dump(gops), { encoding: 'utf8' });
  logger.debug('gops.yml written');
  return gops;
};

/**
 * Validate the gops.yml file against the schema
 */
export const validate = async (octokit: Octokit, gops: Gops): Promise<boolean> => {
  logger.verbose('Running validation');
  const ajv = new Ajv();
  const schema = JSON.parse(fs.readFileSync('gops-schema.json', { encoding: 'utf8' }));
  const validate = ajv.compile(schema);
  const valid = validate(gops);

  if (!valid && validate.errors) {
    logger.error(JSON.stringify(validate.errors, null, 2));
    throw new ValidationError(validate.errors);
  }

  logger.info(`Gops config is ${valid ? 'valid' : 'invalid'}}`);
  return valid;
};

export const apply = async (octokit: Octokit, gops: Gops, organization: string, dryRun = true): Promise<Gops> => {
  logger.verbose(`Running ${dryRun ? 'Dry-run' : 'Apply'}`);
  let updated: Gops = { org: {}, members: [], collaborators: [], teams: [], behaviours: gops.behaviours };

  // handle changes
  updated.org = await applyOrg(octokit, organization, dryRun, gops.org);
  updated.members = await applyMembers(octokit, organization, dryRun, gops.members, gops.behaviours);
  updated.collaborators = await applyCollaborators(octokit, organization, dryRun, gops.collaborators, gops.behaviours);
  updated.teams = await applyTeams(octokit, organization, dryRun, gops.teams, gops.behaviours);

  return updated;
};

export const run = async (org: string, cmd: string, configFile: string, githubToken: string): Promise<any> => {
  logger.verbose(`Running gops with org '${org}' and command '${cmd}' and configFile '${configFile}'!`);

  const gops: Gops = (yaml.load(fs.readFileSync(configFile, { encoding: 'utf8' })) as Gops) || {};
  logger.debug(`Gops config file read successfully!`);
  logger.silly('Gops config content', gops);

  const octokit: Octokit = new Octokit({
    auth: githubToken
  });
  logger.debug(`Octokit created successfully!`);

  let output: { org: string; gops?: Gops; valid?: boolean; errors?: any[] } = { org: org, errors: [] };

  try {
    switch (cmd) {
      case 'init':
        output.gops = await init(octokit, gops, org, configFile);
        break;
      case 'validate':
        output.valid = await validate(octokit, gops);
        break;
      case 'dry-run':
        output.gops = await apply(octokit, gops, org, true);
        break;
      case 'apply':
        output.gops = await apply(octokit, gops, org, false);
        break;
      default:
        output.errors?.push(new Error(`Unknown command ${cmd}`));
    }
  } catch (err) {
    output.errors?.push(err);
  }

  logger.debug('Output', output);
  return output;
};
