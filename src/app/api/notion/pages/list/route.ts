import { notion } from '@/jobs/notion'
import { parseJsonList } from '@/lib/utils'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(request: any) {
  const { results: pages } = await notion.databases.query({
    database_id: process.env.NOTION_TOOLS_DATABASE_ID,
    filter: {
      or: [
        {
          property: 'Tags',
          multi_select: {
            is_empty: true,
          },
        },
      ],
    },
  })
  const payload = pages.map(({ id, properties }: any) => {
    const {
      Name: {
        title: [placeholder],
      },
      Link: { url: link },
    } = properties

    const {
      text: { content: name },
    } = placeholder
    return {
      id,
      name,
      link,
    }
  })
  const payloadFormatted = payload.map(
    ({ name, link, id }: any) => `Name: ${name}, Link: ${link}, id: ${id} \n`
  )

  const sentences = payloadFormatted.join(', ')

  const assistant_id = process.env.NOTION_ASSISTANT_ID || ''
  const thread = await openai.beta.threads.create()

  const message = await openai.beta.threads.messages.create(thread.id, {
    role: 'user',
    content: `Add tags to these notion pages: ${sentences}`,
  })
  console.log('message: ', message)

  let run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id,
  })
  while (['queued', 'in_progress', 'cancelling'].includes(run.status)) {
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait for 1 second
    run = await openai.beta.threads.runs.retrieve(run.thread_id, run.id)
  }
  if (run.status === 'completed') {
    const messages = await openai.beta.threads.messages.list(run.thread_id)
    console.log('messages: ', messages)

    for (const message of messages.data.reverse()) {
      console.log('message: ', message)
      if (message.role === 'assistant') {
        const { content }: any = message
        console.log('content: ', content)
        const [tagMetaData] = content
        console.log('tagMetaData: ', tagMetaData)
        const {
          text: { value },
        } = tagMetaData
        const tagsFormatted = parseJsonList(value)
        console.log('tagsFormatted: ', tagsFormatted)

        await Promise.all(
          tagsFormatted.map(async ({ tags, page_id }: any) => {
            const tagData = tags.split(',').map((tag: string) => ({
              name: tag,
            }))

            const updated = await notion.pages.update({
              page_id: page_id,
              properties: {
                Tags: {
                  multi_select: tagData,
                },
              },
            })
            console.log('updated: ', updated)
          })
        )
        // await io.logger.info('choices', response.choices)
      }
    }
  } else {
    console.log(run.status)
  }
}
