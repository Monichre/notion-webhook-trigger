import { retrieveNotionResource } from '@/triggers'

//uncomment this to set a higher max duration (it must be inside your plan limits). Full docs: https://vercel.com/docs/functions/serverless-functions/runtimes#max-duration
// triggerAndWait''=

export async function POST(request: Request) {
  //get the JSON from the request
  const data = await request.json()
  console.log('data: ', data)

  const res = await retrieveNotionResource.trigger(data)
  console.log('res: ', res)

  //return a success response with the handle
  return Response.json(res)
}
