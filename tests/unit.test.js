const createUtils = require('../utils')
describe('Unit tests for creating new body', () => {
  const utils = createUtils()
  it('Should get new PR body for one task', () => {
    const body = '## Summary\nThis PR blah blah\ncloses: https://asana.com/foo'
    const commentPrefix = 'closes: '
    const tasks = [
      {
        permalink_url: 'https://asana.com/foo',
      },
    ]

    const newBody = utils.getNewPRBody(body, tasks, commentPrefix)
    expect(newBody).toBe(
      `## Summary\nThis PR blah blah\n${commentPrefix}[this Asana task](${tasks[0].permalink_url}).`,
    )
  })

  it('Should get new PR body for multiple tasks', () => {
    const body =
      '## Summary\nThis PR blah blah\ncloses: https://asana.com/foo https://asana.com/bar'
    const commentPrefix = 'closes: '
    const tasks = [
      {
        permalink_url: 'https://asana.com/foo',
      },
      {
        permalink_url: 'https://asana.com/bar',
      },
    ]

    const newBody = utils.getNewPRBody(body, tasks, commentPrefix)
    expect(newBody).toBe(
      `## Summary\nThis PR blah blah\n${commentPrefix}[this Asana task](${tasks[0].permalink_url}) & [this Asana task](${tasks[1].permalink_url}).`,
    )
  })

  it('Should get new PR body for multiple tasks in nested body', () => {
    const body =
      '## Summary\nThis PR blah blah\ncloses: https://asana.com/foo https://asana.com/bar\n\n## Further Comments\nSomething great here!'
    const commentPrefix = 'closes: '
    const tasks = [
      {
        permalink_url: 'https://asana.com/foo',
      },
      {
        permalink_url: 'https://asana.com/bar',
      },
    ]

    const newBody = utils.getNewPRBody(body, tasks, commentPrefix)
    expect(newBody).toBe(
      `## Summary\nThis PR blah blah\n${commentPrefix}[this Asana task](${tasks[0].permalink_url}) & [this Asana task](${tasks[1].permalink_url}).\n\n## Further Comments\nSomething great here!`,
    )
  })
})

describe('Unit tests for getting short ids', () => {
  const utils = createUtils()
  it('Should return empty list when body has no asana link', () => {
    const commentPrefix = 'closes:'
    const body = '## Summary\nFooo'
    const asanaIds = utils.getAsanaShortIds(body, commentPrefix)
    expect(asanaIds).toEqual([])
  })

  it('Should return id when body has one asana link', () => {
    const commentPrefix = 'closes:'
    const body =
      '## Summary\nFooo\ncloses: https://app.asana.com/0/120000000/123456789'
    const asanaIds = utils.getAsanaShortIds(body, commentPrefix)
    expect(asanaIds).toEqual(['123456789'])
  })

  it('Should return ids when body has multiple asana link', () => {
    const commentPrefix = 'closes:'
    const body =
      '## Summary\nFooo\ncloses: https://app.asana.com/0/120000000/123456789 https://app.asana.com/0/120000001/123456780 https://app.asana.com/0/120000002/123456781'
    const asanaIds = utils.getAsanaShortIds(body, commentPrefix)
    expect(asanaIds).toEqual(['123456789', '123456780', '123456781'])
  })
})