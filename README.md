# GOPS Action

This action is used to administer a GitHub organization. You can manage users, teams, repos, and more. Have a look at the [JSON Schema](gops-schema.json) for configuration options.

## Inputs

### `command`

**Required** Comma seperated list of commands to execute.

| Command  | Description                                                   |
| -------- | ------------------------------------------------------------- |
| init     | Read the existing config and create a `.github/gops.yml` file |
| validate | Validate your `.github/gops.yml` file against schema          |
| dry-run  | Do a dry run of what will change and log changes to be made   |
| apply    | Execute the changes identified in your `.github/gops.yml`     |

### `organization`

**Required** The name of your GitHub organization to apply the changes to. Default `${{ github.repository_owner }}`.

### `github-token`

**Required** The credentials to use to apply changes to organization. Default `GITHUB_TOKEN`.

## Example usage

```yaml
name: Apply gops config
uses: ex0b1t/gops-action@main
with:
  command: 'apply'
```
