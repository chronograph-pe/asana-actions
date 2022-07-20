# asana-actions

This GitHub Action moves Asana tasks to named sections (i.e., 'Pull Request') when various actions are taken within Github (PR opened or merged).

## Usage

For the Action to identify the relevant Asana task, pull requests must contain a link to the Asana task somewhere within the body.  More than one task is supported, and each task may contained within more than one Asana project.

## Setup

This Action requires an Asana Access Token and Workspace ID.

Add the following to your `.github/workflows/asana-actions.yaml`:

```
name: asana-actions
on:
  issues:
    types: [ opened, closed, edited ]
  pull_request:
    types: [ opened, closed, edited ]
jobs:
  asana:
    runs-on: ubuntu-latest
    steps:
    - name: move-asana-task
      uses: chronograph-pe/asana-actions@main
      with:
        asana_token: ${{ secrets.ASANA_TOKEN }}
        workspace: ${{ secrets.ASANA_WORKSPACE_ID }}
        on_open_action: MOVE_TO_SECTION <Section1>
        on_merge_action: MOVE_TO_SECTION <Section2>
```
