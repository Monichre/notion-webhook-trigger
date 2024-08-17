import { bulkUpdateToolResourceTags } from '@/triggers'

//uncomment this to set a higher max duration (it must be inside your plan limits). Full docs: https://vercel.com/docs/functions/serverless-functions/runtimes#max-duration
// triggerAndWait''=

export async function POST(request: Request) {
  const res = await bulkUpdateToolResourceTags.trigger()
  console.log('res: ', res)

  //return a success response with the handle
  return Response.json(res)
}
