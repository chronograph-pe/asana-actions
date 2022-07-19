const createUtils = require('./utils')

const ACTION_CLOSE_PREFIX = 'CLOSE'
const ACTION_MOVE_TO_SECTION_PREFIX = 'MOVE_TO_SECTION'

module.exports = async (core, github) => {
  const onOpenAction = core.getInput('on_open_action')
  const failOnNoTask = core.getInput('fail_on_no_task')
  const onMergeAction = core.getInput('on_merge_action') || ACTION_CLOSE_PREFIX

  const isIssue = !!github.context.payload.issue
  const pr = github.context.payload.pull_request || github.context.payload.issue
  const action = github.context.payload.action

  const utils = createUtils(core)

  core.info(
    `Running action for ${isIssue ? 'issue' : 'PR'} #${pr.number}: ${pr.title}`,
  )

  const lookupTasks = async (taskIds) => {
    if (!taskIds || !taskIds.length) {
      core.info('No matching asana short id in: ' + JSON.stringify(pr.body))
      if (failOnNoTask) {
        throw new Error(
          'No matching asana short id in: ' + JSON.stringify(pr.body),
        )
      }
    } else {
      core.info('Searching for short id: ' + taskIds.join(','))
    }

    const tasks = await utils.getMatchingAsanaTasks(taskIds)

    if (tasks && tasks.length > 0) {
      core.info('Found task.')
    } else {
      core.error('Did not find matching task')
      if (failOnNoTask) {
        throw { message: 'Did not find matching task' }
      }
    }

    return tasks
  }

  const isCloseAction = (onAction) => {
    return onAction.startsWith(ACTION_CLOSE_PREFIX)
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

  const doAction = async (tasks, onAction) => {
    if (isCloseAction(onAction)) {
      await utils.completeAsanaTasks(tasks)
      core.info('Marked linked Asana task(s) as completed')
    }
    if (isMoveAction(onAction)) {
      const sectionName = getSectionNameFromAction(onAction)
      await utils.moveTasksToSection(taskIds, sectionName)
      core.info(`Moved tasks to section: ${sectionName}`)
    }
  }

  const tasks = await lookupTasks(taskIds)
  if (!tasks || !tasks.length) return

  if (action === 'opened' && onOpenAction) {
    await doAction(tasks, onOpenAction)
    return
  }

  if (action === 'closed' && (isIssue || pr.merged) && onMergeAction) {
    await doAction(tasks, onMergeAction)
    return
  }
}
