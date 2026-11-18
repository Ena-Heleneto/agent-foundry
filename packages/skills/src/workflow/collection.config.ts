import { defineCollectionHandle } from '#utils/define-collection-handle'

/**
 * 声明工作流集合的启用技能和交付选项，并开启集合子插件。
 */
export default defineCollectionHandle({
  packageName: 'workflow',
  mcp: false,
  plugin: true,
  script: false,
  skill: {
    'artifact-project-description': { enabled: true },
    'artifact-spec-analysis': { enabled: true },
    'bug-report': { enabled: true },
    'implementation-preparation': { enabled: true },
    'task-increment': { enabled: true },
  },
})
