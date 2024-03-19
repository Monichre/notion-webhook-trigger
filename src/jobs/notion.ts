// import { eventTrigger } from '@trigger.dev/sdk'
// import { Client } from '@notionhq/client'
import { client } from '@/trigger'

// import { OpenAI } from '@trigger.dev/openai'
// // secret_foafg7aBxPOjegjeQTw1VgrvAzbDnTyKqpqxFG0di52
// const notionSubscription = client.defineHttpEndpoint({
//   //this should be unique inside your project
//   id: 'tools-fdba68db4cdc4fbc97810f9cc044e65e',
//   //usually you'd use the domain name of the service
//   source: 'https://www.notion.so/fdba68db4cdc4fbc97810f9cc044e65e',
//   //the icon is optional, it displays in the dashboard
//   icon: ' ',
//   //this function is called when a webhook is received
//   verify: async (request) => {
//     console.log('request: ', request)
//     //this is a useful helper function that can verify sha256 signatures
//     //each API has a different header name
//     return await verifyRequestSignature({
//       request,
//       //you can find the header name in the API's documentation
//       headerName: 'X-Cal-Signature-256',
//       //you can find the secret in the Trigger.dev dashboard, on the HTTP endpoint page
//       secret: process.env.NOTION_SECRET!,
//       algorithm: 'sha256',
//     })
//   },
// })

// const notion: any = new Client({
//   auth: process.env.NOTION_SECRET!,
// })

// const openai = new OpenAI({
//   id: 'openai',
//   apiKey: process.env.OPENAI_API_KEY!,
// })

// client.defineJob({
//   id: 'notion-create-page',
//   name: 'Notion Page Created',
//   version: '1.0.0',
//   trigger: notionSubscription.onRequest(),
//   // trigger: eventTrigger({
//   //   name: 'notion-create-page',
//   // }),
//   integrations: {
//     openai,
//   },
//   run: async (payload, io: any, ctx) => {
//     console.log('ctx: ', ctx)
//     console.log('payload: ', payload)
//     const { page }: any = payload
//     console.log('page: ', page)
//     const {
//       properties_value: { Name, Link, Description },
//       id,
//     } = page
//     console.log('Link: ', Link)
//     console.log('Name: ', Name)
//     const [name] = Name
//     console.log('name: ', name)
//     const { plain_text } = name
//     console.log('plain_text: ', plain_text)
//     const message = `Name: ${plain_text}, Link: ${Link}, Description: ${Description}`
//     console.log('message: ', message)

//     console.log('page: ', page)

//     const run = await io.openai.beta.threads.createAndRunUntilCompletion(
//       'create-thread',
//       {
//         assistant_id: process.env.NOTION_ASSISTANT_ID || '',
//         thread: {
//           messages: [
//             {
//               role: 'user',
//               content: message,
//             },
//           ],
//         },
//       }
//     )
//     console.log('run: ', run)

//     if (run.status !== 'completed') {
//       throw new Error(
//         `Run finished with status ${run.status}: ${JSON.stringify(
//           run.last_error
//         )}`
//       )
//     }

//     // List all messages in the thread
//     const messages: any = await io.openai.beta.threads.messages.list(
//       'list-messages',
//       run.thread_id
//     )
//     const res = messages.find((message: any) => message.role === 'assistant')
//     console.log('messages: ', messages)
//     console.log('res: ', res)
//     const { content }: any = res
//     console.log('content: ', content)
//     const [tagMetaData] = content
//     console.log('tagMetaData: ', tagMetaData)
//     const {
//       text: { value },
//     } = tagMetaData
//     console.log('value: ', value)

//     const tags = value.split(',').map((tag: string) => ({
//       name: tag,
//     }))

//     // await io.logger.info('choices', response.choices)
//     const updated = await notion.pages.update({
//       page_id: id,
//       properties: {
//         Tags: {
//           multi_select: tags,
//         },
//       },
//     })
//     console.log('updated: ', updated)
//     return updated
//   },
// })

import { TriggerClient, eventTrigger } from '@trigger.dev/sdk'
import { Client } from '@notionhq/client'
import z from 'zod'

// Initialize Notion client with your integration token
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

// Initialize Trigger.dev client

// Define a job in Trigger.dev to listen for Notion page creation events
// This is a conceptual example; you may need to adjust it based on Trigger.dev's capabilities and your specific use case
client.defineJob({
  id: 'listen-for-notion-page-creations',
  name: 'Listen for Notion Page Creations',
  version: '1.0.0',
  trigger: eventTrigger({
    name: 'page-created',
    schema: z.object({
      databaseId: z.string(), // The ID of the Notion database
    }),
  }),
  run: async (payload: any, io, ctx) => {
    // This function is triggered when a new page is created in the specified Notion database
    // The payload should include the database ID from which the page creation event is expected
    // Since the Trigger.dev SDK and API does not directly support listening to Notion events as of the last update,
    // you would need an intermediary service or method to push this event to Trigger.dev

    // As an example, this code block is where you would process the event
    // For instance, logging the new page creation or performing another action
    console.log(
      `A new page was created in the database with ID: ${payload.databaseId}`
    )

    // Here you might call Notion's API to get more details about the newly created page or perform other actions
    // This step is optional and depends on your specific needs
    const newPageDetails = await notion.pages.retrieve({
      page_id: payload.pageId,
    })
    console.log(newPageDetails)

    // Return any relevant information or confirmation that the job was processed
    return { message: 'New Notion page creation processed' }
  },
})

// Start the Trigger.dev client to listen for events
