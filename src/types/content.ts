export type ContentTabKey =
  | 'all-assets'
  | 'emails'
  | 'landing-pages'
  | 'forms'
  | 'snippets'
  | 'templates'
  | 'files'

export type AssetType =
  | 'Email'
  | 'Landing Page'
  | 'Form'
  | 'Snippet'
  | 'Template'
  | 'Image'
  | 'File'

export type AssetStatus = 'Draft' | 'Published' | 'Approved'

export type BuilderKind = 'email' | 'landing-page' | 'form'

export interface ContentAsset {
  id: string
  name: string
  type: AssetType
  status: AssetStatus
  modified: string
  createdBy: string
  folder: string
  tags: string[]
  thumbnailTone: 'warm' | 'blue' | 'green' | 'violet' | 'gray'
}

export interface AssetFilters {
  query: string
  type: string
  createdBy: string
  status: string
}