const createUtils = require('./utils')

const ACTION_MOVE_TO_SECTION_PREFIX = 'MOVE_TO_SECTION'

module.exports = async (core, github) => {
  const onOpenAction = core.getInput('on_open_action')
  const failOnNoTask = core.getInput('fail_on_no_task')
  const onMergeAction = core.getInput('on_merge_action')

  const isIssue = !!github.context.payload.issue
  const pr = github.context.payload.pull_request || github.context.payload.issue
  const action = github.context.payload.action

  const utils = createUtils(core)

  core.info(
    `Running action for ${isIssue ? 'issue' : 'PR'} #${pr.number}: ${pr.title}`,
  )

  const lookupTasks = async (taskIds) => {
    if (!taskIds || !taskIds.length) {
      core.info('No matching Asana taskIds.')
    } else {
      core.info('Searching for taskIds: ' + taskIds.join(','))
    }

    const tasks = await utils.getMatchingAsanaTasks(taskIds)
    if (tasks && tasks.length > 0) {
      core.info('Found task(s).')
    } else {
      core.error('Did not find matching task(s).')
    }

    return tasks
  }

  const isMoveAction = (onAction) => {
    return onAction.startsWith(ACTION_MOVE_TO_SECTION_PREFIX)
  }

  const getSectionNameFromAction = (onAction) => {
    return onAction
      .substring(ACTION_MOVE_TO_SECTION_PREFIX.length, onAction.length)
      .trim()
  }

  const taskIds = utils.getAsanaIds(pr.body)
  const tasks = await lookupTasks(taskIds)
  if (!tasks || !tasks.length) return

  const doAction = async (onAction) => {
    if (isMoveAction(onAction)) {
      const sectionName = getSectionNameFromAction(onAction)
      await utils.moveTasksToSection(taskIds, sectionName)
      core.info(`Moved tasks to section: ${sectionName}`)
    }
  }

  if (['opened', 'edited'].includes(action) && onOpenAction) {
    await doAction(onOpenAction)
    return
  }

  if (action === 'closed' && (isIssue || pr.merged)) {
    if (onMergeAction) await doAction(onMergeAction)
    await utils.completeAsanaTasks(tasks)
    core.info('Marked task(s) completed')
    return
  }
}
