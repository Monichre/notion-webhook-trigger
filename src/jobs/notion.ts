import { eventTrigger } from '@trigger.dev/sdk'
import { Client } from '@notionhq/client'
import { client } from '@/trigger'

import { OpenAI } from '@trigger.dev/openai'
// secret_foafg7aBxPOjegjeQTw1VgrvAzbDnTyKqpqxFG0di52

const notion: any = new Client({
  auth: process.env.NOTION_SECRET!,
})

const openai = new OpenAI({
  id: 'openai',
  apiKey: process.env.OPENAI_API_KEY!,
})

client.defineJob({
  id: 'notion-create-page',
  name: 'Notion Page Created',
  version: '1.0.0',

  trigger: eventTrigger({
    name: 'notion-create-page',
  }),
  integrations: {
    openai,
  },
  run: async (payload, io: any, ctx) => {
    console.log('ctx: ', ctx)
    console.log('payload: ', payload)
    const {
      page: { name, link, id },
    }: any = payload

    const message = `Name: ${name}, Link: ${link}, id: ${id}`
    console.log('message: ', message)

    const run = await io.openai.beta.threads.createAndRunUntilCompletion(
      'create-thread',
      {
        assistant_id: process.env.NOTION_ASSISTANT_ID || '',
        thread: {
          messages: [
            {
              role: 'user',
              content: message,
            },
          ],
        },
      }
    )
    console.log('run: ', run)

    if (run.status !== 'completed') {
      throw new Error(
        `Run finished with status ${run.status}: ${JSON.stringify(
          run.last_error
        )}`
      )
    }

    // List all messages in the thread
    const messages: any = await io.openai.beta.threads.messages.list(
      'list-messages',
      run.thread_id
    )
    const res = messages.find((message: any) => message.role === 'assistant')
    console.log('messages: ', messages)
    console.log('res: ', res)
    const { content }: any = res
    console.log('content: ', content)
    const [tagMetaData] = content
    console.log('tagMetaData: ', tagMetaData)
    const {
      text: { value },
    } = tagMetaData
    console.log('value: ', value)

    const tags = value.split(',').map((tag: string) => ({
      name: tag,
    }))

    // await io.logger.info('choices', response.choices)
    const updated = await notion.pages.update({
      page_id: id,
      properties: {
        Tags: {
          multi_select: tags,
        },
      },
    })
    console.log('updated: ', updated)
    return updated
  },
})
