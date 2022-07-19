const fetch = require('./fetch')

const stripTaskIds = task => task.gid

const createUtils = core => {
  const asanaToken = core.getInput('asana_token')
  if (!asanaToken) {
    throw { message: 'ASANA_TOKEN not set' }
  }

  const completeAsanaTasks = async (tasks) => {
    if (!tasks && tasks.length === 0) return
    try {
      await Promise.all(
        [...tasks].map((task) =>
          fetch(asanaToken)(`tasks/${task.gid}`).put({
            data: {
              completed: true,
            },
          }),
        ),
      )
      core.info(`completed task(s) (${tasks.map(stripTaskIds)})`)
    } catch (exc) {
      core.error(`Error while completing task(s) (${tasks.map(stripTaskIds)})`)
    }
  }

  const getMatchingAsanaTasks = async (ids) => {
    const responses = await Promise.all(
      ids.map(async (taskId) => fetch(asanaToken)(`tasks/${taskId}`).get()),
    )
    return responses.map(({ data }) => data)
  }

  const getAsanaIds = body => {
    if (!body) return null
    const taskIds = []

    body.split('\n').forEach(line => {
      const reg = /https:\/\/app.asana.com\/[0-9]\/[0-9]*\/([0-9]*)/
      const matches = reg.exec(line)
      if (!matches) return
      const taskId = matches[1]
      if (taskId) taskIds.push(taskId)
    })
    return taskIds
  }

  const getUpdatedTasks = async (taskIds, sectionName) => {
    const tasks = []
    const responses = await Promise.all(
      taskIds.map(async taskId => fetch(asanaToken)(`tasks/${taskId}/projects`).get()),
    )
    responses.forEach((response, i) => {
      (response.data || []).forEach(project => {
        tasks.push({
          taskId: taskIds[i],
          projectId: project.gid,
        })
      })
    })
    return await Promise.all(
      tasks.map(async (task, i) => {
        const { data: sections } = await fetch(asanaToken)(
          `projects/${task.projectId}/sections`
        ).get()
        const section = (sections || []).find(section => section.name.toLowerCase() === sectionName.toLowerCase())
        return { ...task, sectionId: section ? section.gid : null }
      })
    )
  }

  const moveTasks = async updatedTasks => {
    return Promise.all(
      updatedTasks.map(({ taskId, sectionId }) => {
        if (!sectionId) return
        return fetch(asanaToken)(`sections/${sectionId}/addTask`).post({
          data: {
            task: taskId,
          },
        })
      })
    )
  }

  const moveTasksToSection = async (taskIds, sectionName) => {
    const updatedTasks = await getUpdatedTasks(taskIds, sectionName)
    await moveTasks(updatedTasks)
  }

  return {
    completeAsanaTasks,
    getAsanaIds,
    getMatchingAsanaTasks,
    moveTasksToSection,
  }
}

module.exports = createUtils
