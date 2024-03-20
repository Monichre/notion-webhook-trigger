import { createAppRoute } from '@trigger.dev/nextjs'
import { client } from '@/trigger'
import '@/jobs'

export const runtime = 'nodejs'
export const { POST, dynamic } = createAppRoute(client)

//uncomment this to set a higher max duration (it must be inside your plan limits). Full docs: https://vercel.com/docs/functions/serverless-functions/runtimes#max-duration
