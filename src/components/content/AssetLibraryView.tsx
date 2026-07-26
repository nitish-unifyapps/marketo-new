import { useMemo, useRef, useState } from 'react'
import { contentAssets } from '../../data/contentData'
import type { AssetType, BuilderKind, ContentAsset, ContentTabKey } from '../../types/content'
import { WireframeIcon } from '../common/WireframeIcon'
import { AssetCard } from './AssetCard'

const createOptions = ['Email', 'Landing Page', 'Form', 'Snippet', 'Template', 'Upload File'] as const

const typeByTab: Partial<Record<ContentTabKey, AssetType[]>> = {
  emails: ['Email'],
  'landing-pages': ['Landing Page'],
  forms: ['Form'],
  snippets: ['Snippet'],
  templates: ['Template'],
  files: ['Image', 'File'],
}

const titleByTab: Record<ContentTabKey, string> = {
  'all-assets': 'All Assets',
  emails: 'Emails',
  'landing-pages': 'Landing Pages',
  forms: 'Forms',
  snippets: 'Snippets',
  templates: 'Templates',
  files: 'Images & Files',
}

interface AssetLibraryViewProps {
  activeTab: ContentTabKey
  onOpenBuilder: (builder: BuilderKind) => void
}

export function AssetLibraryView({ activeTab, onOpenBuilder }: AssetLibraryViewProps) {
  const [query, setQuery] = useState('')
  const [assetType, setAssetType] = useState('All types')
  const [createdBy, setCreatedBy] = useState('Anyone')
  const [status, setStatus] = useState('Any status')
  const [createOpen, setCreateOpen] = useState(false)
  const [draggingFile, setDraggingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const assets = useMemo(() => {
    const allowedTypes = typeByTab[activeTab]
    const normalizedQuery = query.trim().toLowerCase()

    return contentAssets.filter((asset) => {
      const matchesTab = !allowedTypes || allowedTypes.includes(asset.type)
      const matchesQuery = !normalizedQuery || [asset.name, asset.type, ...asset.tags]
        .some((value) => value.toLowerCase().includes(normalizedQuery))
      const matchesType = assetType === 'All types' || asset.type === assetType
      const matchesCreator = createdBy === 'Anyone' || asset.createdBy === createdBy
      const matchesStatus = status === 'Any status' || asset.status === status
      return matchesTab && matchesQuery && matchesType && matchesCreator && matchesStatus
    })
  }, [activeTab, assetType, createdBy, query, status])

  function openAsset(asset: ContentAsset) {
    if (asset.type === 'Email') onOpenBuilder('email')
    if (asset.type === 'Landing Page') onOpenBuilder('landing-page')
    if (asset.type === 'Form') onOpenBuilder('form')
  }

  function handleCreate(option: typeof createOptions[number]) {
    setCreateOpen(false)
    if (option === 'Email') onOpenBuilder('email')
    if (option === 'Landing Page') onOpenBuilder('landing-page')
    if (option === 'Form') onOpenBuilder('form')
    if (option === 'Upload File') fileInputRef.current?.click()
  }

  return (
    <section className='contentLibrary viewWrap'>
      <div className='contentLibraryHeader'>
        <div>
          <h2>{titleByTab[activeTab]}</h2>
          <p>{assets.length} assets in this view</p>
        </div>
        <div className='assetCreateWrap'>
          <button type='button' className='button solid' onClick={() => setCreateOpen((value) => !value)}>
            <WireframeIcon name='plus' className='iconSmall' />
            Create New Asset
          </button>
          {createOpen && (
            <div className='menuDropdown assetCreateMenu'>
              {createOptions.map((option) => (
                <button key={option} type='button' className='menuItem' onClick={() => handleCreate(option)}>
                  {option}
                </button>
              ))}
            </div>
          )}
          <input ref={fileInputRef} type='file' hidden multiple />
        </div>
      </div>

      <div className='assetFilterBar'>
        <label className='searchInputWrap assetSearch'>
          <WireframeIcon name='search' className='iconSmall muted' />
          <input className='searchInput' value={query} onChange={(event) => setQuery(event.target.value)} placeholder='Search assets and tags...' />
        </label>
        <select value={assetType} onChange={(event) => setAssetType(event.target.value)} aria-label='Filter by asset type'>
          <option>All types</option><option>Email</option><option>Landing Page</option><option>Form</option><option>Snippet</option><option>Template</option><option>Image</option>
        </select>
        <select value={createdBy} onChange={(event) => setCreatedBy(event.target.value)} aria-label='Filter by creator'>
          <option>Anyone</option><option>Maya Chen</option><option>Rita Nair</option><option>Liam Ortiz</option>
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label='Filter by status'>
          <option>Any status</option><option>Draft</option><option>Published</option><option>Approved</option>
        </select>
        <button type='button' className='sortButton'>Last modified ↓</button>
      </div>

      <div className='assetWorkspace'>
        <div className='assetResults'>
          {activeTab === 'files' && (
            <button
              type='button'
              className={`fileDropzone ${draggingFile ? 'dragging' : ''}`}
              onDragOver={(event) => { event.preventDefault(); setDraggingFile(true) }}
              onDragLeave={() => setDraggingFile(false)}
              onDrop={(event) => { event.preventDefault(); setDraggingFile(false) }}
              onClick={() => fileInputRef.current?.click()}
            >
              <span className='uploadGlyph'>↑</span>
              <strong>Drop files here or browse</strong>
              <small>Images, PDFs and documents up to 25 MB</small>
              <span className='button solid'>Upload</span>
            </button>
          )}
          <div className='assetGrid'>
            {assets.map((asset) => <AssetCard key={asset.id} asset={asset} onOpen={openAsset} />)}
          </div>
          {assets.length === 0 && <div className='assetEmpty'>No assets match these filters.</div>}
        </div>
      </div>
    </section>
  )
}
