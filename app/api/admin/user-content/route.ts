
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { sql } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'

    let content

    switch (type) {
      case 'homepage':
        content = await db.execute(sql`
          SELECT id, title, content, media_type, media_url, display_order, is_active
          FROM homepage_content
          ORDER BY display_order ASC
        `)
        break

      case 'media':
        content = await db.execute(sql`
          SELECT id, title, description, media_type, media_url, thumbnail_url, created_at
          FROM media_vault
          WHERE is_public = true
          ORDER BY created_at DESC
          LIMIT 50
        `)
        break

      case 'events':
        content = await db.execute(sql`
          SELECT id, title, description, event_date, location, ticket_price, max_attendees
          FROM events
          WHERE event_date >= NOW()
          ORDER BY event_date ASC
        `)
        break

      case 'merchandise':
        content = await db.execute(sql`
          SELECT id, name, description, price, stock_quantity, image_url
          FROM products
          WHERE is_active = true
          ORDER BY created_at DESC
        `)
        break

      default:
        content = await db.execute(sql`
          SELECT 'homepage' as content_type, COUNT(*) as count FROM homepage_content
          UNION ALL
          SELECT 'media' as content_type, COUNT(*) as count FROM media_vault
          UNION ALL
          SELECT 'events' as content_type, COUNT(*) as count FROM events
          UNION ALL
          SELECT 'merchandise' as content_type, COUNT(*) as count FROM products
        `)
    }

    return NextResponse.json(Array.isArray(content) ? content : [])
  } catch (error) {
    console.error('Error fetching user content:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, id, data } = body

    let result

    switch (type) {
      case 'homepage':
        result = await db.execute(sql`
          UPDATE homepage_content
          SET title = ${data.title}, content = ${data.content}, media_url = ${data.media_url}, is_active = ${data.is_active}, updated_at = NOW()
          WHERE id = ${id}
          RETURNING *
        `)
        break

      case 'media':
        result = await db.execute(sql`
          UPDATE media_vault
          SET title = ${data.title}, description = ${data.description}, is_public = ${data.is_public}, updated_at = NOW()
          WHERE id = ${id}
          RETURNING *
        `)
        break

      case 'events':
        result = await db.execute(sql`
          UPDATE events
          SET title = ${data.title}, description = ${data.description}, ticket_price = ${data.ticket_price}, max_attendees = ${data.max_attendees}
          WHERE id = ${id}
          RETURNING *
        `)
        break

      case 'merchandise':
        result = await db.execute(sql`
          UPDATE products
          SET name = ${data.name}, description = ${data.description}, price = ${data.price}, stock_quantity = ${data.stock_quantity}
          WHERE id = ${id}
          RETURNING *
        `)
        break

      default:
        return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
    }

    return NextResponse.json(Array.isArray(result) && result.length > 0 ? result[0] : {})
  } catch (error) {
    console.error('Error updating content:', error)
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    )
  }
}
