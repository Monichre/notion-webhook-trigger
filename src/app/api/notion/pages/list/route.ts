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
  console.log({pages})
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
    ({ name, link, id }: any) => `Name: ${name}, Link: ${link}, id: ${id}`
  )

  const sentences = payloadFormatted.join(',')
console.log({sentences})
  const assistant_id = process.env.NOTION_ASSISTANT_ID || ''
  const thread = await openai.beta.threads.create()

  const message = await openai.beta.threads.messages.create(thread.id, {
    role: 'user',
    content: `Here is a list of existing tags: ${existingTags}. Use these before you create any new or original tags. Otherwise add tags to these notion pages: \n ${sentences}`,
  })

  let run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id,
  })
  while (['queued', 'in_progress', 'cancelling'].includes(run.status)) {
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait for 1 second
    run = await openai.beta.threads.runs.retrieve(run.thread_id, run.id)
  }
  if (run.status === 'completed') {
    const messages = await openai.beta.threads.messages.list(run.thread_id)

    for (const message of messages.data.reverse()) {
      if (message.role === 'assistant') {
        const { content }: any = message

        const [tagMetaData] = content

        const {
          text: { value },
        } = tagMetaData
        const tagsFormatted = parseJsonList(value)
console.log({tagsFormatted})
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
          })
        )
        // await io.logger.info('choices', response.choices)
      }
    }
    // @ts-ignore
    return Response.json({
      status: 200,
    })
  } else {
    // @ts-ignore
    return Response.json({
      status: 400,
    })
  }
}
