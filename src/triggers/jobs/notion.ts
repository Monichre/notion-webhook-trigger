import { logger, task, wait } from '@trigger.dev/sdk/v3'
import { Client } from '@notionhq/client'
import zod from 'zod'
import {
  openaiBulkTagNotionResourceTask,
  openaiTagNotionResourceTask,
} from '@/triggers/jobs/openai'

// API Reference: https://developers.notion.com/reference/intro
// Create a new integration and access your token at https://www.notion.so/my-integrations
// The integration needs to be added as a 'connection' to the page
// Here is how you do it:
// 1. Click on three dots at the top right corner of your parent notion page
// 2. Click on 'Add connection' and choose your integration and confirm
// 3. Now it will have access to page and all the child pages too

export const notion: any = new Client({
  auth: process.env.NOTION_SECRET,
})

export const retrieveNotionResource = task({
  id: 'notion-tool-added',
  name: 'Notion Tool Added',
  version: '1.0.0',

  run: async ({ name, link, id }: any) => {
    const pageId = id.replace(/-/g, '')

    const page = await notion.pages.retrieve({ page_id: pageId })
    console.log('page: ', page)

    const {
      properties: {
        Description: { id: descriptionId },
      },
    } = page

    const db = await notion.databases.retrieve({
      database_id: process.env.NOTION_TOOLS_DATABASE_ID,
    })

    const {
      properties: {
        Tags: {
          id: tagId,
          multi_select: { options },
        },
      },
    } = db

    const existingTags = options.map((option: any) => option.name).join(', ')

    const { page_id, Description, Tags } =
      await openaiTagNotionResourceTask.triggerAndWait({
        name,
        link,
        id,
        existingTags,
        tagId,
        descriptionId,
      })

    const updated = await notion.pages.update({
      page_id: page.id,
      properties: {
        Description,
        Tags,
      },
    })
    console.log('updated: ', updated)
    return updated
  },
})
// 2cf896ad-de1e-4949-9e33-f13147d77e7c

export const bulkUpdateToolResourceTags = task({
  id: 'bulk-update-tool-resources',
  name: 'Bulk Update Tool Resources',
  version: '1.0.0',

  run: async (payload) => {
    const { results: pages } = await notion.databases.query({
      database_id: process.env.NOTION_TOOLS_DATABASE_ID,
      page_size: 50,
      sorts: [
        {
          property: 'Created',
          direction: 'descending',
        },
      ],
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
    console.log('pages: ', pages)

    const db = await notion.databases.retrieve({
      database_id: process.env.NOTION_TOOLS_DATABASE_ID,
    })

    const {
      properties: {
        Tags: {
          id: tagId,
          multi_select: { options },
        },
      },
    } = db

    const existingTags = options.map((option: any) => option.name).join(', ')

    const pagesCriticalData = pages.map(
      ({
        properties: {
          Link: { url },
          Name: { title },
        },
        id,
      }: any) => {
        const [{ plain_text: name }] = title
        console.log('name: ', name)
        return {
          name,
          id,
          link: url,
        }
      }
    )

    const { enrichedNotionResources } =
      await openaiBulkTagNotionResourceTask.triggerAndWait({
        pages: pagesCriticalData,
        existingTags,
      })

    const bulkComplete = await Promise.all(
      enrichedNotionResources.map(async (resource: any) => {
        const updated = await notion.pages.update({
          ...resource,
        })
        console.log('updated: ', updated)
        return updated
      })
    )
    console.log('bulkComplete: ', bulkComplete)
    return bulkComplete
  },
})
// 2cf896ad-de1e-4949-9e33-f13147d77e7c
