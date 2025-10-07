
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'

    let content

    switch (type) {
      case 'homepage':
        content = await db.execute(`
          SELECT id, title, content, media_type, media_url, display_order, is_active
          FROM homepage_content
          ORDER BY display_order ASC
        `)
        break

      case 'media':
        content = await db.execute(`
          SELECT id, title, description, media_type, media_url, thumbnail_url, created_at
          FROM media_vault
          WHERE is_public = true
          ORDER BY created_at DESC
          LIMIT 50
        `)
        break

      case 'events':
        content = await db.execute(`
          SELECT id, title, description, event_date, location, ticket_price, max_attendees
          FROM events
          WHERE event_date >= NOW()
          ORDER BY event_date ASC
        `)
        break

      case 'merchandise':
        content = await db.execute(`
          SELECT id, name, description, price, stock_quantity, image_url
          FROM products
          WHERE is_active = true
          ORDER BY created_at DESC
        `)
        break

      default:
        content = await db.execute(`
          SELECT 'homepage' as content_type, COUNT(*) as count FROM homepage_content
          UNION ALL
          SELECT 'media' as content_type, COUNT(*) as count FROM media_vault
          UNION ALL
          SELECT 'events' as content_type, COUNT(*) as count FROM events
          UNION ALL
          SELECT 'merchandise' as content_type, COUNT(*) as count FROM products
        `)
    }

    return NextResponse.json(content)
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
        result = await db.execute(`
          UPDATE homepage_content
          SET title = $1, content = $2, media_url = $3, is_active = $4, updated_at = NOW()
          WHERE id = $5
          RETURNING *
        `, [data.title, data.content, data.media_url, data.is_active, id])
        break

      case 'media':
        result = await db.execute(`
          UPDATE media_vault
          SET title = $1, description = $2, is_public = $3, updated_at = NOW()
          WHERE id = $4
          RETURNING *
        `, [data.title, data.description, data.is_public, id])
        break

      case 'events':
        result = await db.execute(`
          UPDATE events
          SET title = $1, description = $2, ticket_price = $3, max_attendees = $4
          WHERE id = $5
          RETURNING *
        `, [data.title, data.description, data.ticket_price, data.max_attendees, id])
        break

      case 'merchandise':
        result = await db.execute(`
          UPDATE products
          SET name = $1, description = $2, price = $3, stock_quantity = $4
          WHERE id = $5
          RETURNING *
        `, [data.name, data.description, data.price, data.stock_quantity, id])
        break

      default:
        return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error updating content:', error)
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    )
  }
}
