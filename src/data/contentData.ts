import type { ContentAsset, ContentTabKey } from '../types/content'

export const contentTabs: Array<{ key: ContentTabKey; label: string }> = [
  { key: 'all-assets', label: 'All Assets' },
  { key: 'emails', label: 'Emails' },
  { key: 'landing-pages', label: 'Landing Pages' },
  { key: 'forms', label: 'Forms' },
  { key: 'snippets', label: 'Snippets' },
  { key: 'templates', label: 'Templates' },
  { key: 'files', label: 'Images & Files' },
]

export const contentAssets: ContentAsset[] = [
  { id: 'as-1', name: 'Q3 Product Launch', type: 'Email', status: 'Approved', modified: 'Today, 9:42 AM', createdBy: 'Maya Chen', folder: 'Campaigns / Q3 Launch', tags: ['product', 'launch'], thumbnailTone: 'warm' },
  { id: 'as-2', name: 'Enterprise Demo Request', type: 'Landing Page', status: 'Published', modified: 'Yesterday, 4:18 PM', createdBy: 'Rita Nair', folder: 'Web / Conversion', tags: ['demo', 'enterprise'], thumbnailTone: 'blue' },
  { id: 'as-3', name: 'Contact Sales Form', type: 'Form', status: 'Published', modified: 'Jul 25, 2026', createdBy: 'Maya Chen', folder: 'Forms / Core', tags: ['sales', 'lead capture'], thumbnailTone: 'green' },
  { id: 'as-4', name: 'Customer Quote — FinArc', type: 'Snippet', status: 'Approved', modified: 'Jul 24, 2026', createdBy: 'Liam Ortiz', folder: 'Shared / Social Proof', tags: ['testimonial'], thumbnailTone: 'violet' },
  { id: 'as-5', name: 'Monthly Newsletter Base', type: 'Template', status: 'Approved', modified: 'Jul 22, 2026', createdBy: 'Rita Nair', folder: 'Templates / Email', tags: ['newsletter'], thumbnailTone: 'gray' },
  { id: 'as-6', name: 'Attribution Guide Follow-up', type: 'Email', status: 'Draft', modified: 'Jul 21, 2026', createdBy: 'Maya Chen', folder: 'Nurture / Guides', tags: ['nurture', 'content'], thumbnailTone: 'blue' },
  { id: 'as-7', name: 'Webinar Registration', type: 'Landing Page', status: 'Draft', modified: 'Jul 20, 2026', createdBy: 'Liam Ortiz', folder: 'Events / Webinars', tags: ['webinar', 'event'], thumbnailTone: 'violet' },
  { id: 'as-8', name: 'marketo-next-hero.png', type: 'Image', status: 'Approved', modified: 'Jul 18, 2026', createdBy: 'Rita Nair', folder: 'Files / Brand', tags: ['brand', 'hero'], thumbnailTone: 'warm' },
  { id: 'as-9', name: 'Event Registration Form', type: 'Form', status: 'Draft', modified: 'Jul 17, 2026', createdBy: 'Maya Chen', folder: 'Forms / Events', tags: ['event'], thumbnailTone: 'green' },
]

export const folderTree = [
  { name: 'All Content', count: 48 },
  { name: 'Campaigns', count: 16, children: ['Q3 Launch', 'Product Updates'] },
  { name: 'Nurture', count: 9, children: ['Guides', 'Re-engagement'] },
  { name: 'Events', count: 11, children: ['Webinars', 'Field Events'] },
  { name: 'Shared', count: 7, children: ['Brand', 'Social Proof'] },
  { name: 'Archive', count: 5 },
]