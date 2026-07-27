import { useMemo, useState } from 'react'
import { Modal } from '../../common/Modal'
import type { ActivityNode, ActivityNodeType } from '../MarketingActivitiesPhaseOne'

export type FolderImportKind = 'email' | 'form' | 'landing-page' | 'program' | 'smart-campaign'

export interface FolderImportResult {
  kind: FolderImportKind
  name: string
  destinationId: string
  mode: 'template' | 'blank'
  template?: string
  programType?: ActivityNodeType
  campaignMode?: ActivityNode['campaignMode']
  channel?: string
  description?: string
}

interface FolderDetailViewProps {
  folder: ActivityNode
  breadcrumbs: ActivityNode[]
  programs: ActivityNode[]
  onOpenNode: (id: string) => void
  onNewFolder: () => void
  onImport: (result: FolderImportResult) => void
}

const importOptions: Array<{ kind: FolderImportKind; label: string; description: string }> = [
  { kind: 'email', label: 'Email', description: 'Import or create a local email asset' },
  { kind: 'form', label: 'Form', description: 'Import or create a local form asset' },
  { kind: 'landing-page', label: 'Landing Page', description: 'Import or create a local landing page' },
  { kind: 'program', label: 'Program', description: 'Create a program with the correct local structure' },
  { kind: 'smart-campaign', label: 'Smart Campaign', description: 'Create a trigger, batch, or executable campaign' },
]

const assetTemplates = {
  email: ['Product Announcement', 'Newsletter', 'Event Reminder', 'Lead Nurture Touch'],
  form: ['Contact Sales', 'Event Registration', 'Content Download', 'Preference Center'],
  'landing-page': ['Product Launch', 'Webinar Registration', 'Thank You Page', 'Content Download'],
}

const programTemplates: Record<string, string[]> = {
  'email-program': ['One-time Email Send', 'Newsletter Send', 'Product Announcement'],
  'event-program': ['Webinar Follow-up', 'Tradeshow Program', 'Virtual Event'],
  'engagement-program': ['Lead Nurture 3-Touch', 'Welcome Series', 'Re-engagement'],
  'default-program': ['Blank Container', 'ABM Program', 'Web Content Program'],
}

const campaignTemplates: Record<string, string[]> = {
  trigger: ['Form Follow-up', 'Lead Scoring', 'Interesting Moment', 'CRM Alert'],
  batch: ['One-time Email Send', 'Data Normalization', 'Add to Static List'],
  executable: ['On-demand Lead Routing', 'Reusable Data Update', 'Request Campaign'],
}

const programTypeLabels: Partial<Record<ActivityNodeType, string>> = {
  'smart-campaign': 'Smart Campaign',
  'email-program': 'Email Program',
  'event-program': 'Event Program',
  'engagement-program': 'Engagement Program',
  'default-program': 'Default Program',
  folder: 'Folder',
  'assets-folder': 'Assets Folder',
  'asset-category': 'Asset Folder',
  'members-folder': 'Members Folder',
  asset: 'Asset',
}

export function FolderDetailView({ folder, breadcrumbs, programs, onOpenNode, onNewFolder, onImport }: FolderDetailViewProps) {
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [importMenuOpen, setImportMenuOpen] = useState(false)
  const [importKind, setImportKind] = useState<FolderImportKind | null>(null)
  const children = useMemo(() => (folder.children ?? []).filter((node) => node.name.toLowerCase().includes(query.toLowerCase())), [folder.children, query])
  const folderCount = children.filter((node) => ['folder', 'assets-folder', 'asset-category', 'members-folder'].includes(node.type)).length
  const programCount = children.filter((node) => ['smart-campaign', 'email-program', 'event-program', 'engagement-program', 'default-program'].includes(node.type)).length
  const assetCount = children.filter((node) => node.type === 'asset').length

  return <section className='folderDetailView'>
    <header className='folderDetailHeader'><div><nav>{breadcrumbs.map((item, index) => <span key={item.id}><button type='button' onClick={() => onOpenNode(item.id)}>{item.name}</button>{index < breadcrumbs.length - 1 && <i>›</i>}</span>)}</nav><div className='folderDetailTitle'><FolderObjectIcon node={folder} /><div><h2>{folder.name}</h2><p>{programTypeLabels[folder.type]} · {folder.children?.length ?? 0} items</p></div></div></div><div className='folderHeaderActions'><button type='button' className='button outline accent' onClick={onNewFolder}>＋ New Folder</button><div className='folderImportWrap'><button type='button' className='button solid' onClick={() => setImportMenuOpen((value) => !value)}>⇧ Import <span>⌄</span></button>{importMenuOpen && <div className='folderImportMenu'>{importOptions.map((option) => <button type='button' key={option.kind} onClick={() => { setImportKind(option.kind); setImportMenuOpen(false) }}><ImportTypeIcon kind={option.kind} /><span><strong>{option.label}</strong><small>{option.description}</small></span></button>)}</div>}</div></div></header>
    <div className='folderStats'><div><span>Subfolders</span><strong>{folderCount}</strong></div><div><span>Programs & Campaigns</span><strong>{programCount}</strong></div><div><span>Local Assets</span><strong>{assetCount}</strong></div><p>Items created here remain scoped to this folder or parent program.</p></div>
    <div className='folderDetailToolbar'><label><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search within ${folder.name}…`} /></label><select><option>All Types</option><option>Folders</option><option>Programs</option><option>Campaigns</option><option>Assets</option></select><select><option>Last Modified</option><option>Name A–Z</option><option>Type</option></select><div><button type='button' className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}>▦</button><button type='button' className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>☷</button></div></div>
    <div className={`folderContents ${view}`}>{children.map((node) => <button type='button' key={node.id} className={`folderObjectCard type-${node.type}`} onClick={() => onOpenNode(node.id)}><span className='folderObjectVisual'><FolderObjectIcon node={node} /></span><span className='folderObjectInfo'><em>{programTypeLabels[node.type]}{node.campaignMode ? ` · ${node.campaignMode}` : ''}</em><strong>{node.name}</strong><small>{node.children?.length ? `${node.children.length} contained items` : node.type === 'asset' ? 'Local asset' : 'No local items'}</small></span><span className='folderObjectMeta'><i>{node.status ? node.status[0].toUpperCase() + node.status.slice(1) : '—'}</i><small>Modified recently</small></span><span className='folderObjectMore'>•••</span></button>)}</div>
    {children.length === 0 && <div className='folderEmptyState'><span>▱</span><h3>No matching items</h3><p>Create a folder or import a program, campaign, or local asset.</p></div>}
    {importKind && <FolderImportModal kind={importKind} folder={folder} programs={programs} defaultProgramId={[...breadcrumbs].reverse().find((node) => ['email-program', 'event-program', 'engagement-program', 'default-program'].includes(node.type))?.id} onClose={() => setImportKind(null)} onImport={(result) => { onImport(result); setImportKind(null) }} />}
  </section>
}

function FolderImportModal({ kind, folder, programs, defaultProgramId, onClose, onImport }: { kind: FolderImportKind; folder: ActivityNode; programs: ActivityNode[]; defaultProgramId?: string; onClose: () => void; onImport: (result: FolderImportResult) => void }) {
  const [mode, setMode] = useState<'template' | 'blank'>('template')
  const [name, setName] = useState('')
  const destinationPrograms = programs.filter((program) => program.type !== 'smart-campaign')
  const [destinationId, setDestinationId] = useState(defaultProgramId ?? destinationPrograms[0]?.id ?? folder.id)
  const [programType, setProgramType] = useState<ActivityNodeType>('email-program')
  const [campaignMode, setCampaignMode] = useState<ActivityNode['campaignMode']>('trigger')
  const [channel, setChannel] = useState('Email Send')
  const [description, setDescription] = useState('')
  const [template, setTemplate] = useState(kind === 'smart-campaign' ? campaignTemplates.trigger[0] : kind === 'program' ? programTemplates['email-program'][0] : assetTemplates[kind as keyof typeof assetTemplates]?.[0] ?? '')
  const isAsset = ['email', 'form', 'landing-page'].includes(kind)
  const templates = kind === 'smart-campaign' ? campaignTemplates[campaignMode ?? 'trigger'] : kind === 'program' ? programTemplates[programType] ?? [] : assetTemplates[kind as keyof typeof assetTemplates] ?? []
  const title = `Import ${importOptions.find((option) => option.kind === kind)?.label}`

  function updateProgramType(type: ActivityNodeType) {
    setProgramType(type)
    setTemplate(programTemplates[type]?.[0] ?? '')
    setChannel(type === 'event-program' ? 'Webinar' : type === 'engagement-program' ? 'Nurture' : type === 'email-program' ? 'Email Send' : 'Default')
  }

  function updateCampaignMode(nextMode: ActivityNode['campaignMode']) {
    setCampaignMode(nextMode)
    setTemplate(campaignTemplates[nextMode ?? 'trigger'][0])
  }

  return <Modal title={title} open onClose={onClose}><div className='folderImportModal'><div className='importModeToggle'><button type='button' className={mode === 'template' ? 'active' : ''} onClick={() => setMode('template')}>From Template</button><button type='button' className={mode === 'blank' ? 'active' : ''} onClick={() => setMode('blank')}>Blank</button></div><div className='folderImportSummary'><ImportTypeIcon kind={kind} /><div><strong>{importOptions.find((option) => option.kind === kind)?.label}</strong><small>{mode === 'template' ? 'Start from a reusable Marketo-style template.' : 'Start with the minimum valid blank structure.'}</small></div></div><div className='folderImportFields'>{kind === 'program' && <><label>Program Type<select value={programType} onChange={(event) => updateProgramType(event.target.value as ActivityNodeType)}><option value='email-program'>Email Program</option><option value='event-program'>Event Program</option><option value='engagement-program'>Engagement Program</option><option value='default-program'>Default Program</option></select></label><label>Channel<select value={channel} onChange={(event) => setChannel(event.target.value)}>{programType === 'event-program' ? <><option>Webinar</option><option>Tradeshow</option><option>Seminar</option></> : programType === 'email-program' ? <><option>Email Send</option><option>Newsletter</option></> : <option>{channel}</option>}</select></label></>}{kind === 'smart-campaign' && <label>Campaign Type<select value={campaignMode} onChange={(event) => updateCampaignMode(event.target.value as ActivityNode['campaignMode'])}><option value='trigger'>Trigger</option><option value='batch'>Batch</option><option value='executable'>Executable</option></select></label>}{isAsset && <label>Destination Program<select value={destinationId} onChange={(event) => setDestinationId(event.target.value)}>{destinationPrograms.map((program) => <option key={program.id} value={program.id}>{program.name} — {programTypeLabels[program.type]}</option>)}</select></label>}{mode === 'template' && <label>Template<select value={template} onChange={(event) => setTemplate(event.target.value)}>{templates.map((option) => <option key={option}>{option}</option>)}</select><small>One template is selected and copied into the destination.</small></label>}<label>{kind === 'smart-campaign' ? 'Campaign Name' : kind === 'program' ? 'Program Name' : 'Asset Name'}<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder={mode === 'template' ? template : `Untitled ${importOptions.find((option) => option.kind === kind)?.label}`} /></label><label className='folderImportDescription'>Description <span>Optional</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder='Describe the purpose of this item' /></label></div><StructurePreview kind={kind} programType={programType} campaignMode={campaignMode} mode={mode} /><footer><button type='button' className='button ghost' onClick={onClose}>Cancel</button><button type='button' className='button solid' disabled={!name.trim() || (isAsset && !destinationId)} onClick={() => onImport({ kind, name: name.trim(), destinationId, mode, template: mode === 'template' ? template : undefined, programType, campaignMode, channel, description })}>Import & Create</button></footer></div></Modal>
}

function StructurePreview({ kind, programType, campaignMode, mode }: { kind: FolderImportKind; programType: ActivityNodeType; campaignMode?: ActivityNode['campaignMode']; mode: 'template' | 'blank' }) {
  const rows = kind === 'program'
    ? programType === 'email-program' ? ['Assets', 'Emails', 'Landing Pages', 'Forms'] : programType === 'default-program' ? ['Assets', 'Emails', 'Landing Pages', 'Forms', 'Members'] : programType === 'event-program' ? ['Assets', 'Emails', 'Landing Pages', 'Forms', 'Members', 'Event Schedule'] : ['Assets', 'Emails', 'Landing Pages', 'Forms', 'Streams', 'Members']
    : kind === 'smart-campaign' ? [`${campaignMode ?? 'trigger'} Smart List`, 'Flow', 'Schedule', 'Results'] : [kind === 'email' ? 'Email Draft' : kind === 'form' ? 'Form Fields' : 'Page Sections', 'Program Tokens', 'Draft Status']
  return <section className='importStructurePreview'><header><strong>Structure Preview</strong><span>{mode === 'template' ? 'Template included' : 'Blank structure'}</span></header><div>{rows.map((row, index) => <span key={row}><i>{index + 1}</i>{row}</span>)}</div></section>
}

function FolderObjectIcon({ node }: { node: ActivityNode }) {
  const common = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (['folder', 'assets-folder', 'asset-category'].includes(node.type)) return <svg {...common}><path d='M3 6h7l2 2h9v11H3z' /></svg>
  if (node.type === 'engagement-program') return <svg {...common}><path d='M12 21v-9M12 14c-5 0-7-3-7-7 5 0 7 2 7 7ZM12 16c5 0 7-3 7-7-5 0-7 2-7 7Z' /></svg>
  if (node.type === 'email-program' || (node.type === 'asset' && node.assetType === 'email')) return <svg {...common}><rect x='3' y='5' width='18' height='14' rx='2' /><path d='m4 7 8 6 8-6' /></svg>
  if (node.type === 'event-program') return <svg {...common}><rect x='3' y='5' width='18' height='16' rx='2' /><path d='M8 3v4M16 3v4M3 10h18' /></svg>
  if (node.type === 'default-program') return <svg {...common}><rect x='3' y='7' width='18' height='13' rx='2' /><path d='M8 7V4h8v3M3 12h18' /></svg>
  if (node.type === 'smart-campaign') return <svg {...common}><path d={node.campaignMode === 'trigger' ? 'm13 2-8 12h7l-1 8 8-12h-7z' : 'M4 5h16v14H4zM8 9h8M8 13h5'} /></svg>
  if (node.type === 'members-folder') return <svg {...common}><circle cx='9' cy='9' r='3' /><path d='M3.5 19a5.5 5.5 0 0 1 11 0' /></svg>
  return <svg {...common}><path d='M5 3h11l3 3v15H5zM16 3v4h3M8 11h8M8 15h6' /></svg>
}

function ImportTypeIcon({ kind }: { kind: FolderImportKind }) {
  const node: ActivityNode = kind === 'program' ? { id: '', name: '', type: 'default-program' } : kind === 'smart-campaign' ? { id: '', name: '', type: 'smart-campaign', campaignMode: 'trigger' } : { id: '', name: '', type: 'asset', assetType: kind === 'landing-page' ? 'landing-page' : kind }
  return <span className='importTypeIcon'><FolderObjectIcon node={node} /></span>
}
