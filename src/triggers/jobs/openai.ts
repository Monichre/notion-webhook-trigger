import { logger, task, wait } from '@trigger.dev/sdk/v3'
import { streamObject, generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
//1. Official OpenAI SDK
import OpenAI from 'openai'
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

import zod from 'zod'

import { parseJsonList } from '@/lib/utils'
// secret_foafg7aBxPOjegjeQTw1VgrvAzbDnTyKqpqxFG0di52

export const newToolAddedSchema = zod.object({
  name: zod.string(),
  link: zod.string(),
  id: zod.string(),
})

export const aiTaggedResourceSchema = zod.object({
  page_id: zod.string(),
  properties: zod.object({
    Description: zod.string(),
    Tags: zod.object({
      multi_select: zod.array(zod.string()),
    }),
  }),
})
export const openaiTagNotionResourceTask = task({
  id: 'tag-notion-resource',
  name: 'Tag Notion Resource',
  version: '3.0.0',
  //3. Retries happen if a task throws an error that isn't caught
  //   The default settings are in your trigger.config.ts (used if not overriden here)
  retry: {
    maxAttempts: 3,
  },
  run: async ({ name, link, id, existingTags, tagId, descriptionId }: any) => {
    const prompt = `Here is a list of existing tags: ${existingTags} already in use in this database, if appropriate use these before you create any new and original tags. Otherwise, create one or two concise, two word max tags for this entry. Here are the page details - Name: ${name}, Link: ${link}, id: ${id}. Navigate to the url provided and generate a description of this latest addition to the Tools database.`
    const system = `
    “You are an assistant designed to help organize and tag items in a Notion database. When a new item is added, your task is to identify relevant tags based on the content of the item and the context provided. Tags should be concise, relevant, and help in categorizing the item effectively within the database.

Instructions:

	•	Analyze the content and context of the new item.
	•	Generate 3-5 relevant tags that accurately describe the item.
	•	Consider the broader categorization and how these tags will help in filtering and searching for this item later.

Examples:

	1.	Item Content: ‘Research on machine learning algorithms for image recognition.’
Tags: ‘Machine Learning’, ‘Image Recognition’, ‘Research’, ‘Algorithms’
	2.	Item Content: ‘Meeting notes from the marketing strategy session for Q3 2024.’
Tags: ‘Marketing’, ‘Strategy’, ‘Q3 2024’, ‘Meeting Notes’

Provide the tags based on the content you receive.”
    `

    const {
      object: { resource },
    } = await generateObject({
      model: openai('gpt-4o'),
      system,
      prompt,
      schema: zod.object({
        resource: aiTaggedResourceSchema,
      }),
    })

    const {
      page_id,
      properties: {
        Description,
        Tags: { multi_select },
      },
    }: any = resource
    console.log('multi_select: ', multi_select)

    return {
      page_id,
      Description: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: `${Description}`, // The new description text
              link: null,
            },
            annotations: {
              bold: false,
              italic: false,
              strikethrough: false,
              underline: false,
              code: false,
              color: 'default',
            },
            plain_text: `${Description}`,
            href: null,
          },
        ],
      },
      Tags: [
        ...multi_select.map((tag) => ({
          name: tag,
        })),
      ],
    }

    //   // List all messages in the thread
  },
})
export const openaiBulkTagNotionResourceTask = task({
  id: 'bulk-tag-notion-resource',
  name: 'Bulk Tag Notion Resource',
  version: '3.0.0',
  //3. Retries happen if a task throws an error that isn't caught
  //   The default settings are in your trigger.config.ts (used if not overriden here)
  retry: {
    maxAttempts: 3,
  },

  run: async ({ pages, existingTags }: any) => {
    const formatCommand = (pages) =>
      pages
        .map(
          ({ name, id, link }: any, i: number) =>
            `## Page ${i + 1} ${name} - Link: ${link}, id: ${id}.
          `
        )
        .join(' \n')

    const prompt = `
    Here is a list of existing tags: ${existingTags} already in use in this database, if appropriate use these before you create any new and original tags. Otherwise, create one or two concise, two word max tags for each of the following pages. \n

    --- \n

    Pages: \n
    *For each of the following pages navigate to the url provided by the link content and generate a description of this resource.* \n
    ${formatCommand(pages)}
    
    `
    const system = `
    “You are an assistant designed to help organize and tag items in a Notion database. When a new item is added, your task is to identify relevant tags based on the content of the item and the context provided. Tags should be concise, relevant, and help in categorizing the item effectively within the database.

      Instructions:

        •	Analyze the content and context of the new item.
        •	Generate 3-5 relevant tags that accurately describe the item.
        •	Consider the broader categorization and how these tags will help in filtering and searching for this item later.

      Examples:

        1.	Item Content: ‘Research on machine learning algorithms for image recognition.’
      Tags: ‘Machine Learning’, ‘Image Recognition’, ‘Research’, ‘Algorithms’
        2.	Item Content: ‘Meeting notes from the marketing strategy session for Q3 2024.’
      Tags: ‘Marketing’, ‘Strategy’, ‘Q3 2024’, ‘Meeting Notes’

      Provide the tags based on the content you receive.”
    `

    const {
      object: { resources },
    } = await generateObject({
      model: openai('gpt-4o'),
      system,
      prompt,
      schema: zod.object({
        resources: zod.array(aiTaggedResourceSchema),
      }),
    })

    console.log('resources: ', resources)
    const enrichedNotionResources = resources.map((resource) => {
      const {
        page_id,
        properties: {
          Description,
          Tags: { multi_select },
        },
      }: any = resource
      return {
        page_id,
        Description: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: `${Description}`, // The new description text
                link: null,
              },
              annotations: {
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
                color: 'default',
              },
              plain_text: `${Description}`,
              href: null,
            },
          ],
        },
        Tags: [
          ...multi_select.map((tag) => ({
            name: tag,
          })),
        ],
      }
    })

    console.log('enrichedNotionResources: ', enrichedNotionResources)
    return enrichedNotionResources

    //   // List all messages in the thread
  },
})
