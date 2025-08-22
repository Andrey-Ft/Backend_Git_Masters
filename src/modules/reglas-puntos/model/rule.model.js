export const rules = [
  {
    id: 'commit_rule',
    description: 'Otorga puntos por hacer un commit',
    type: 'commit',
    condition: (activity) => activity.type === 'commit',
    action: (user) => ({
      points: 5,
      badge: null
    })
  },
  {
    id: 'pr_rule',
    description: 'Otorga más puntos por PR',
    type: 'pull_request',
    condition: (activity) => activity.type === 'pull_request',
    action: (user) => ({
      points: 10,
      badge: 'primer-pr'
    })
  }
]
