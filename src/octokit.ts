import { Octokit } from 'octokit';

export const getOrg = async (octokit: Octokit, org: string) => {
  return octokit.request('GET /orgs/{org}', {
    org: org,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
};

export const getOrgMembers = async (octokit: Octokit, org: string, role: 'all' | 'admin' | 'member' = 'all') => {
  return await octokit
    .paginate('GET /orgs/{org}/members?role={role}', {
      org: org,
      role: role,
      per_page: 100
    })
    .catch((error) => {
      throw error;
    });
};

export const getOrgCollaborators = async (octokit: Octokit, org: string) => {
  return await octokit
    .paginate('GET /orgs/{org}/outside_collaborators', {
      org: org,
      per_page: 100
    })
    .catch((error) => {
      throw error;
    });
};

export const getUser = async (octokit: Octokit, username: string) => {
  return await octokit
    .request('GET /users/{username}', {
      username: username
    })
    .catch((error) => {
      throw error;
    });
};

export const getOrgTeams = async (octokit: Octokit, org: string) => {
  return await octokit.paginate('GET /orgs/{org}/teams', {
    org: org,
    per_page: 100
  });
};

export const getTeamMembers = async (octokit: Octokit, org: string, slug: string, role: string = 'all') => {
  return await octokit
    .paginate('GET /orgs/{org}/teams/{slug}/members?role={role}', {
      org: org,
      slug: slug,
      role: role,
      per_page: 100
    })
    .catch((error) => {
      throw error;
    });
};

export const getOrgRepos = async (octokit: Octokit, org: string) => {
  return await octokit
    .paginate('GET /orgs/{org}/repos', {
      org: org,
      per_page: 100
    })
    .catch((error) => {
      throw error;
    });
};

export const getRepoCollaborators = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  affiliation: 'all' | 'direct' | 'outside' = 'direct'
) => {
  return await octokit
    .paginate('GET /repos/{owner}/{repo}/collaborators?affiliation={affiliation}', {
      owner: owner,
      repo: repo,
      affiliation: affiliation,
      per_page: 100
    })
    .catch((error) => {
      throw error;
    });
};

export const getRepoTeams = async (octokit: Octokit, owner: string, repo: string) => {
  return await octokit
    .paginate('GET /repos/{owner}/{repo}/teams', {
      owner: owner,
      repo: repo,
      per_page: 100
    })
    .catch((error) => {
      throw error;
    });
};
