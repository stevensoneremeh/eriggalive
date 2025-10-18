
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== "info@eriggalive.com") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: allContent, error } = await supabase
      .from("page_content")
      .select("*")

    if (error) throw error

    const stats = {
      totalSections: allContent?.length || 0,
      activeSections: allContent?.filter(c => c.is_active).length || 0,
      inactiveSections: allContent?.filter(c => !c.is_active).length || 0,
      withImages: allContent?.filter(c => c.image_url).length || 0,
      pagesCount: new Set(allContent?.map(c => c.page_name)).size,
      
      byPage: Object.entries(
        allContent?.reduce((acc: any, item) => {
          acc[item.page_name] = (acc[item.page_name] || 0) + 1
          return acc
        }, {}) || {}
      ).map(([page, count]) => ({ page, count })),
      
      byType: Object.entries(
        allContent?.reduce((acc: any, item) => {
          acc[item.section_type] = (acc[item.section_type] || 0) + 1
          return acc
        }, {}) || {}
      ).map(([name, count]) => ({ name, count })),
    }

    return NextResponse.json(stats)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
