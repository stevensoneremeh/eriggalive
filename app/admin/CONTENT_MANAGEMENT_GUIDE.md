
```markdown
# Content Management System Guide

## Overview
The Content Manager allows you to dynamically manage content for all pages on the Erigga Live platform without touching code.

## How to Use

### 1. Access the Content Manager
Navigate to `/admin/content-manager` in your admin dashboard.

### 2. Managing Content

#### Adding New Content
1. Click the "Add Content" button
2. Select the target page (Homepage, About, Events, etc.)
3. Choose a section type (Hero, Featured, CTA, etc.)
4. Fill in the content fields
5. Upload or link media (images/videos)
6. Set display order (lower numbers appear first)
7. Toggle active/inactive status
8. Click "Add Content"

#### Editing Content
1. Navigate to the page tab you want to edit
2. Click the edit icon on any content row
3. Modify the fields as needed
4. Click "Update"

#### Deleting Content
1. Click the delete icon on any content row
2. Confirm the deletion

### 3. Section Types

- **Hero**: Large banner sections with background images
- **Featured**: Highlighted content with centered layout
- **About**: Information cards with optional images
- **Services**: Service or feature listings
- **Gallery**: Image galleries
- **CTA**: Call-to-action sections with prominent buttons
- **Testimonials**: User testimonials and reviews
- **FAQ**: Frequently asked questions
- **Custom**: Flexible custom sections

### 4. Using Content on Pages

To display managed content on any page:

```typescript
import { useDynamicContent } from '@/hooks/use-dynamic-content'
import { DynamicContentList } from '@/components/dynamic-content-renderer'

export default function MyPage() {
  const { content, loading } = useDynamicContent('mypage')
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      <DynamicContentList content={content} />
    </div>
  )
}
```

### 5. Advanced Features

#### Custom CSS
Add custom styling to individual sections using the Custom CSS field in the Settings tab.

#### Metadata
Store additional structured data in JSON format for advanced use cases.

#### Preview Mode
Use the Preview button in the editor to see how your content will look before saving.

## Best Practices

1. **Use Descriptive Titles**: Make titles clear and SEO-friendly
2. **Optimize Images**: Keep images under 5MB for best performance
3. **Set Proper Order**: Use section_order to control content flow
4. **Test Before Publishing**: Use inactive status to prepare content before going live
5. **Keep Content Fresh**: Regularly update content to keep users engaged

## Troubleshooting

- **Content not showing**: Check that `is_active` is enabled
- **Wrong order**: Adjust `section_order` values
- **Image not loading**: Verify the URL is accessible
- **Styling issues**: Use browser dev tools to inspect and adjust custom CSS
```
