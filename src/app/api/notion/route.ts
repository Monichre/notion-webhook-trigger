// @ts-nocheck
import { client } from '@/trigger'

export async function POST(request: any) {
  console.log('request: ', request)
  try {
    const req = await request.json()
    const {
      body: {
        payload: { page },
      },
    } = req
    console.log('page: ', page)

    const event = client.sendEvent({
      id: 'notion-create-page',
      name: 'notion-create-page',
      payload: {
        page: {
          page,
        },
      },
    })
    console.log('event: ', event)

    // Example: Send a response
    return Response.json({
      status: 200,
      event,
    })
    // Process the webhook payload
  } catch (error: any) {
    console.log('error: ', error)
  }
}
