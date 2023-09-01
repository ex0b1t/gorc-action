# Gorc Action

This action is used to administer a GitHub organization. You can manage users, teams, repos, and more. Have a look at the [JSON Schema](gorc-schema.json) for configuration options.

## Inputs

### `command`

**Required** Command to execute.

| Command  | Description                                                   |
| -------- | ------------------------------------------------------------- |
| init     | Read the existing config and create a `.github/gorc.yml` file |
| validate | Validate your `.github/gorc.yml` file against schema          |
| dry-run  | Do a dry run of what will change and log changes to be made   |
| apply    | Execute the changes identified in your `.github/gorc.yml`     |

### `organization`

**Optional** The name of your GitHub organization to apply the changes to. Default `${{ github.repository_owner }}`.

### `gorc-config`

**Optional** The path to your gorc config file. Default `.github/gorc.yml`.

### `github-token`

**Optional** The credentials to use to apply changes to organization. Default `GITHUB_TOKEN`.

## Example usage

```yaml
name: Apply gorc config
uses: ex0b1t/gorc-action@main
with:
  command: 'apply'
```
