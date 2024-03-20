import { client } from '@/trigger'
import { NextApiRequest, NextApiResponse } from 'next'
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Handle the POST request here
    // You can access the request body using req.body

    // Example: Log the request body
    console.log(req.body)
    const {
      body: { page },
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
    res.status(200).json({ message: 'POST request handled successfully' })
  } else {
    res.status(405).json({ message: 'Method Not Allowed' })
  }
}
