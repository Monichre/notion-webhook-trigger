import type { TriggerConfig } from '@trigger.dev/sdk/v3'

export const config = {
  project: 'proj_pnhchrcgzxesspdijxfy',
  logLevel: 'log',
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  triggerDirectories: ['src/triggers/jobs'],
  onSuccess: async (payload: any, output: any, { ctx }: any) => {
    console.log('Task succeeded', ctx.task.id, output)
  },
}
