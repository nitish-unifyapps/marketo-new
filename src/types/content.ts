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

export type PersonalizableContentType = 'Email' | 'Landing Page' | 'Form'

export interface ContentTemplateVariable {
  key: string
  label: string
  description: string
  defaultMode: 'static' | 'dynamic'
  defaultValue: string
  sampleValue: string
}

export interface ContentTemplateDefinition {
  id: string
  name: string
  type: PersonalizableContentType
  status: 'Approved' | 'Published' | 'Draft'
  modified: string
  variables: ContentTemplateVariable[]
  previewTitle: string
  previewBody: string
}