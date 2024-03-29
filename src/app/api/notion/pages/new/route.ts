// @ts-nocheck
import { client } from '@/trigger'

export async function POST(request: any) {
  try {
    const req = await request.json()

    const { id, link, name } = req

    const event = await client.sendEvent({
      name: 'notion-create-page',
      payload: {
        id,
        link,
        name,
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
    return Response.json({
      status: 404,
      message: 'Error',
    })
  }
}

