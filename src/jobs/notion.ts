import { eventTrigger } from '@trigger.dev/sdk'
import { Client } from '@notionhq/client'
import { client } from '@/trigger'
import zod from 'zod'
import { OpenAI } from '@trigger.dev/openai'
// secret_foafg7aBxPOjegjeQTw1VgrvAzbDnTyKqpqxFG0di52

export const notion: any = new Client({
  auth: process.env.NOTION_SECRET!,
})

export const openAiTrigger = new OpenAI({
  id: 'openai',
  apiKey: process.env.OPENAI_API_KEY!,
})

client.defineJob({
  id: 'notion-create-page',
  name: 'Notion Page Created',
  version: '1.0.0',
  trigger: eventTrigger({
    name: 'notion-create-page',
    schema: zod.object({
      name: zod.string(),
      link: zod.string(),
      id: zod.string(),
    }),
  }),
  integrations: {
    openai: openAiTrigger,
  },
  run: async (payload, io: any, ctx) => {
    const db = await notion.databases.retrieve({
      database_id: process.env.NOTION_TOOLS_DATABASE_ID,
    })
    const {
      properties: {
        Tags: {
          multi_select: { options },
        },
      },
    } = db
    const existingTags = options.map((option: any) => option.name).join(', ')
    console.log('existingTags: ', existingTags)

    const { name, link, id }: any = payload

    const message = `Name: ${name}, Link: ${link}, id: ${id}`
    const instructions = `Analyze this list of existing tags ${existingTags} and be sure to prioritize their use and addition to this notion page before you create any new or original tags`
    console.log('instructions: ', instructions)
    const run = await io.openai.beta.threads.createAndRunUntilCompletion(
      'create-thread',
      {
        assistant_id: process.env.NOTION_ASSISTANT_ID || '',
        instructions,
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
