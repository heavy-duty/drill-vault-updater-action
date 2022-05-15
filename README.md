# Drill Vault Updater Action

This action goes through each of the issues with the `drill:bounty:enabled` label, fetches each of the vaults and updates the bounty amount in the issue's comment.

## Inputs

## `program-id`

**Required** The programId of the Drill Program.

## Outputs

## `result`

The result of running the action.

## Example usage

uses: actions/drill-vault-updater-action@v1.1
with:
program-id: '2fg324Gf51Nrp1jzxXETvJmXPEiHz9ybNY1r575MtijW'
