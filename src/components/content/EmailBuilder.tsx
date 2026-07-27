import { useMemo, useState } from 'react'
import { Modal } from '../common/Modal'

interface EmailBuilderProps {
  onBack: () => void
  emailName?: string
}

type EmailBlockType =
  | 'heading'
  | 'text'
  | 'image'
  | 'button'
  | 'divider'
  | 'spacer'
  | 'columns'
  | 'social'
  | 'video'
  | 'html'
  | 'dynamic'

type StudioPanel = 'content' | 'styles' | 'settings'
type StudioMode = 'design' | 'html' | 'css'
type LibraryTab = 'blocks' | 'layouts' | 'variables'

interface EmailBlock {
  id: string
  type: EmailBlockType
  label: string
  content: string
  secondary?: string
  url?: string
  alt?: string
  align?: 'left' | 'center' | 'right'
  background?: string
  color?: string
  padding?: number
}

interface EmailVariable {
  id: string
  name: string
  reference: string
  defaultValue: string
  type: 'Text' | 'Number' | 'Date' | 'URL'
}

const blockCatalog: Array<{ type: EmailBlockType; icon: string; label: string; description: string }> = [
  { type: 'heading', icon: 'H', label: 'Heading', description: 'Section title' },
  { type: 'text', icon: 'T', label: 'Text', description: 'Rich text block' },
  { type: 'image', icon: '◇', label: 'Image', description: 'Upload or library' },
  { type: 'button', icon: '▰', label: 'Button', description: 'Call to action' },
  { type: 'columns', icon: '▥', label: 'Columns', description: 'Two-column layout' },
  { type: 'divider', icon: '—', label: 'Divider', description: 'Horizontal line' },
  { type: 'spacer', icon: '↕', label: 'Spacer', description: 'Vertical spacing' },
  { type: 'social', icon: '◎', label: 'Social', description: 'Social links' },
  { type: 'video', icon: '▶', label: 'Video', description: 'Linked thumbnail' },
  { type: 'html', icon: '</>', label: 'HTML', description: 'Custom markup' },
  { type: 'dynamic', icon: '⚡', label: 'Dynamic', description: 'Conditional content' },
]

const initialBlocks: EmailBlock[] = [
  { id: 'brand', type: 'text', label: 'Brand', content: 'MARKETO NEXT', align: 'center', color: '#D97757', padding: 22 },
  { id: 'eyebrow', type: 'text', label: 'Eyebrow', content: 'PRODUCT UPDATE', align: 'center', color: '#D97757', padding: 8 },
  { id: 'hero-heading', type: 'heading', label: 'Hero Heading', content: 'Turn every signal into your next best action.', align: 'center', color: '#20252D', padding: 12 },
  { id: 'hero-copy', type: 'text', label: 'Hero Copy', content: 'Hi {{Person.FirstName}}, connect your data, content, and customer journeys in one intelligent workspace.', align: 'center', color: '#6B7280', padding: 10 },
  { id: 'hero-cta', type: 'button', label: 'Primary CTA', content: "Explore what’s new", url: 'https://marketo.com/product', align: 'center', background: '#D97757', color: '#FFFFFF', padding: 18 },
  { id: 'feature-columns', type: 'columns', label: 'Feature Columns', content: 'Unified profiles', secondary: 'Smarter journeys', color: '#20252D', padding: 28 },
  { id: 'footer-divider', type: 'divider', label: 'Footer Divider', content: '', color: '#E5E7EB', padding: 12 },
  { id: 'footer-copy', type: 'text', label: 'Footer', content: 'You received this email because you subscribed to Marketo Next updates. {{System.UnsubscribeLink}}', align: 'center', color: '#8A9099', padding: 18 },
]

const defaultVariables: EmailVariable[] = [
  { id: 'v-1', name: 'Offer Name', reference: '{{my.OfferName}}', defaultValue: 'Summer 2026 Release', type: 'Text' },
  { id: 'v-2', name: 'Event Date', reference: '{{my.EventDate}}', defaultValue: 'August 15, 2026', type: 'Date' },
]

const personVariables = [
  { name: 'First Name', reference: '{{Person.FirstName}}', sample: 'John' },
  { name: 'Last Name', reference: '{{Person.LastName}}', sample: 'Smith' },
  { name: 'Company', reference: '{{Person.Company}}', sample: 'Northlane Systems' },
  { name: 'Job Title', reference: '{{Person.JobTitle}}', sample: 'VP of Marketing' },
  { name: 'Email', reference: '{{Person.Email}}', sample: 'john@northlane.com' },
]

const systemVariables = [
  { name: 'Unsubscribe Link', reference: '{{System.UnsubscribeLink}}' },
  { name: 'View as Web Page', reference: '{{System.ViewAsWebPageLink}}' },
  { name: 'Current Year', reference: '{{System.Year}}' },
  { name: 'Sender Name', reference: '{{System.SenderName}}' },
]

const starterCss = `/* Email-safe styles */
body {
  margin: 0;
  background: #f3f4f6;
  font-family: Arial, Helvetica, sans-serif;
  color: #20252d;
}
.email-wrapper { width: 100%; background: #f3f4f6; }
.email-container {
  width: 640px;
  max-width: 100%;
  margin: 0 auto;
  background: #ffffff;
}
.email-button {
  display: inline-block;
  padding: 14px 24px;
  border-radius: 6px;
  background: #d97757;
  color: #ffffff !important;
  text-decoration: none;
}
@media only screen and (max-width: 600px) {
  .email-container { width: 100% !important; }
  .email-column { display: block !important; width: 100% !important; }
}`

function createBlock(type: EmailBlockType, sequence: number): EmailBlock {
  const catalog = blockCatalog.find((item) => item.type === type)
  const defaults: Record<EmailBlockType, Partial<EmailBlock>> = {
    heading: { content: 'Your new heading', align: 'left', color: '#20252D', padding: 16 },
    text: { content: 'Add your email copy here. Use variables to personalize it for every recipient.', align: 'left', color: '#4B5563', padding: 16 },
    image: { content: 'Product hero image', alt: 'Describe this image', url: '', align: 'center', padding: 16 },
    button: { content: 'Call to action', url: 'https://', align: 'center', background: '#D97757', color: '#FFFFFF', padding: 16 },
    divider: { content: '', color: '#E5E7EB', padding: 12 },
    spacer: { content: '32', padding: 0 },
    columns: { content: 'Column one', secondary: 'Column two', color: '#20252D', padding: 18 },
    social: { content: 'LinkedIn · X · YouTube', align: 'center', color: '#D97757', padding: 16 },
    video: { content: 'Watch the product overview', url: 'https://', align: 'center', padding: 16 },
    html: { content: '<div style="padding:16px">Custom HTML block</div>', padding: 0 },
    dynamic: { content: 'Content for high-intent prospects', secondary: 'Score is greater than 70', padding: 16 },
  }
  return { id: `block-${sequence}`, type, label: catalog?.label ?? type, content: '', ...defaults[type] }
}

export function EmailBuilder({ onBack, emailName = 'Q3 Product Launch' }: EmailBuilderProps) {
  const [blocks, setBlocks] = useState<EmailBlock[]>(initialBlocks)
  const [selectedId, setSelectedId] = useState('hero-cta')
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [studioMode, setStudioMode] = useState<StudioMode>('design')
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('blocks')
  const [activePanel, setActivePanel] = useState<StudioPanel>('content')
  const [subject, setSubject] = useState('A smarter way to grow your pipeline')
  const [preheader, setPreheader] = useState('See what is new in Marketo Next')
  const [variables, setVariables] = useState<EmailVariable[]>(defaultVariables)
  const [addVariableOpen, setAddVariableOpen] = useState(false)
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false)
  const [htmlCode, setHtmlCode] = useState('')
  const [cssCode, setCssCode] = useState(starterCss)
  const [htmlDirty, setHtmlDirty] = useState(false)
  const [nextBlockId, setNextBlockId] = useState(1)
  const [saved, setSaved] = useState(true)

  const selectedBlock = blocks.find((block) => block.id === selectedId)
  const generatedHtml = useMemo(() => generateEmailHtml(blocks, subject, preheader), [blocks, subject, preheader])
  const displayedHtml = htmlCode || generatedHtml

  function updateBlock(updates: Partial<EmailBlock>) {
    setBlocks((current) => current.map((block) => block.id === selectedId ? { ...block, ...updates } : block))
    setSaved(false)
  }

  function addBlock(type: EmailBlockType) {
    const block = createBlock(type, nextBlockId)
    setNextBlockId((value) => value + 1)
    setBlocks((current) => [...current.slice(0, -1), block, current[current.length - 1]])
    setSelectedId(block.id)
    setActivePanel('content')
    setStudioMode('design')
    setSaved(false)
  }

  function removeBlock(id: string) {
    setBlocks((current) => current.filter((block) => block.id !== id))
    if (selectedId === id) setSelectedId(blocks[0]?.id ?? '')
    setSaved(false)
  }

  function duplicateBlock(id: string) {
    const index = blocks.findIndex((block) => block.id === id)
    if (index < 0) return
    const duplicate = { ...blocks[index], id: `block-${nextBlockId}`, label: `${blocks[index].label} copy` }
    setNextBlockId((value) => value + 1)
    setBlocks((current) => [...current.slice(0, index + 1), duplicate, ...current.slice(index + 1)])
    setSelectedId(duplicate.id)
    setSaved(false)
  }

  function moveBlock(id: string, direction: -1 | 1) {
    setBlocks((current) => {
      const index = current.findIndex((block) => block.id === id)
      const destination = index + direction
      if (index < 0 || destination < 0 || destination >= current.length) return current
      const next = [...current]
      const [item] = next.splice(index, 1)
      next.splice(destination, 0, item)
      return next
    })
    setSaved(false)
  }

  function insertVariable(reference: string) {
    if (!selectedBlock || !['heading', 'text', 'button', 'columns', 'dynamic'].includes(selectedBlock.type)) return
    updateBlock({ content: `${selectedBlock.content}${selectedBlock.content ? ' ' : ''}${reference}` })
  }

  function openCodeMode(mode: 'html' | 'css') {
    if (mode === 'html' && !htmlCode) setHtmlCode(generatedHtml)
    setStudioMode(mode)
  }

  return <section className='emailStudio'>
    <header className='emailStudioActionBar'>
      <div className='builderIdentity'><button type='button' className='backButton' onClick={onBack} aria-label='Back to program'>←</button><div><strong>{emailName}</strong><small>Email Draft · {saved ? 'All changes saved' : 'Unsaved changes'}</small></div></div>
      <div className='emailDraftHealth'><span>Draft completeness</span><i><b style={{ width: '84%' }} /></i><strong>84%</strong></div>
      <div className='builderActions'><button type='button' className='historyButton' title='Version history'>◴</button><button type='button' className='button outline accent' onClick={() => setSaved(true)}>Save Draft</button><button type='button' className='button outline accent'>Preview</button><button type='button' className='button outline accent'>Test Send</button><button type='button' className='button solid'>Submit for Approval</button></div>
    </header>

    <div className='emailStudioLayout'>
      <aside className='emailStudioLibrary'>
        <div className='emailLibraryTabs'><button type='button' className={libraryTab === 'blocks' ? 'active' : ''} onClick={() => setLibraryTab('blocks')}>Blocks</button><button type='button' className={libraryTab === 'layouts' ? 'active' : ''} onClick={() => setLibraryTab('layouts')}>Layouts</button><button type='button' className={libraryTab === 'variables' ? 'active' : ''} onClick={() => setLibraryTab('variables')}>Variables</button></div>
        {libraryTab === 'blocks' && <div className='emailLibraryContent'><header><div><strong>Content Blocks</strong><small>Click or drag onto the email</small></div><button type='button'>⌕</button></header><div className='emailBlockCatalog'>{blockCatalog.map((item) => <button type='button' draggable key={item.type} onClick={() => addBlock(item.type)}><span>{item.icon}</span><div><strong>{item.label}</strong><small>{item.description}</small></div><b>＋</b></button>)}</div><section className='savedBlocksSection'><header><strong>Saved Blocks</strong><button type='button'>Manage</button></header><button type='button'><span>▤</span><div><strong>Standard Footer</strong><small>Global · Updated yesterday</small></div></button><button type='button'><span>★</span><div><strong>Product CTA</strong><small>Shared · 3 variants</small></div></button></section></div>}
        {libraryTab === 'layouts' && <div className='emailLibraryContent'><header><div><strong>Layouts</strong><small>Responsive, email-safe structures</small></div></header><div className='layoutCatalog'>{[{ icon: '▯', name: '1 Column' }, { icon: '▥', name: '2 Columns' }, { icon: '▦', name: '3 Columns' }, { icon: '▣', name: 'Hero + CTA' }, { icon: '▤', name: 'Image + Text' }, { icon: '═', name: 'Header + Footer' }].map((layout) => <button type='button' key={layout.name}><span>{layout.icon}</span><strong>{layout.name}</strong><small>Drag to canvas</small></button>)}</div><section className='emailStructureList'><header><strong>Email Structure</strong><span>{blocks.length} blocks</span></header>{blocks.map((block, index) => <button type='button' className={selectedId === block.id ? 'active' : ''} key={block.id} onClick={() => { setSelectedId(block.id); setActivePanel('content') }}><span>⋮⋮</span><b>{index + 1}</b><strong>{block.label}</strong><small>{block.type}</small></button>)}</section></div>}
        {libraryTab === 'variables' && <VariableLibrary variables={variables} onInsert={insertVariable} onAdd={() => setAddVariableOpen(true)} />}
      </aside>

      <main className='emailStudioStage'>
        <div className='emailStudioToolbar'>
          <div className='studioModeTabs'><button type='button' className={studioMode === 'design' ? 'active' : ''} onClick={() => setStudioMode('design')}>Design</button><button type='button' className={studioMode === 'html' ? 'active' : ''} onClick={() => openCodeMode('html')}>{'</>'} HTML</button><button type='button' className={studioMode === 'css' ? 'active' : ''} onClick={() => openCodeMode('css')}>{'{ }'} CSS</button></div>
          {studioMode === 'design' ? <div className='deviceToggle'><button type='button' className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')}>▰ Desktop</button><button type='button' className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')}>▯ Mobile</button></div> : <div className='codeModeActions'><span>{studioMode === 'html' ? 'email.html' : 'email.css'}</span><button type='button' onClick={() => { if (studioMode === 'html') { setHtmlCode(generatedHtml); setHtmlDirty(false) } }}>Sync from Design</button><button type='button'>Format Code</button></div>}
          <div className='canvasZoom'><button type='button'>−</button><span>100%</span><button type='button'>＋</button><button type='button'>⌗</button></div>
        </div>
        {studioMode === 'design' ? <div className='emailCanvasSurface'><div className={`emailDocument ${device}`}><div className='emailInboxPreview'><span>Subject</span><strong>{subject}</strong><small>{preheader}</small></div>{blocks.map((block, index) => <EmailCanvasBlock key={block.id} block={block} index={index} selected={selectedId === block.id} onSelect={() => { setSelectedId(block.id); setActivePanel('content') }} onMove={(direction) => moveBlock(block.id, direction)} onDuplicate={() => duplicateBlock(block.id)} onDelete={() => removeBlock(block.id)} />)}<button type='button' className='emailCanvasAdd' onClick={() => addBlock('text')}>＋ Add content block</button></div></div> : <CodeEditor mode={studioMode} code={studioMode === 'html' ? displayedHtml : cssCode} dirty={studioMode === 'html' && htmlDirty} onChange={(value) => { if (studioMode === 'html') { setHtmlCode(value); setHtmlDirty(true) } else setCssCode(value); setSaved(false) }} />}
      </main>

      <aside className='emailStudioSettings'>
        <div className='emailSettingsTabs'><button type='button' className={activePanel === 'content' ? 'active' : ''} onClick={() => setActivePanel('content')}>Content</button><button type='button' className={activePanel === 'styles' ? 'active' : ''} onClick={() => setActivePanel('styles')}>Styles</button><button type='button' className={activePanel === 'settings' ? 'active' : ''} onClick={() => setActivePanel('settings')}>Email Settings</button></div>
        {activePanel === 'content' ? <BlockProperties block={selectedBlock} onChange={updateBlock} onOpenMedia={() => setMediaLibraryOpen(true)} variables={variables} onInsertVariable={insertVariable} /> : activePanel === 'styles' ? <GlobalEmailStyles /> : <EmailDraftSettings subject={subject} preheader={preheader} onSubjectChange={(value) => { setSubject(value); setSaved(false) }} onPreheaderChange={(value) => { setPreheader(value); setSaved(false) }} variables={variables} />}
      </aside>
    </div>

    {addVariableOpen && <AddEmailVariableModal onClose={() => setAddVariableOpen(false)} onSave={(variable) => { setVariables((current) => [...current, variable]); setAddVariableOpen(false) }} />}
    <MediaLibraryModal open={mediaLibraryOpen} onClose={() => setMediaLibraryOpen(false)} onSelect={(url) => { updateBlock({ url, alt: 'Selected campaign image' }); setMediaLibraryOpen(false) }} />
  </section>
}

function EmailCanvasBlock({ block, index, selected, onSelect, onMove, onDuplicate, onDelete }: { block: EmailBlock; index: number; selected: boolean; onSelect: () => void; onMove: (direction: -1 | 1) => void; onDuplicate: () => void; onDelete: () => void }) {
  return <section className={`emailCanvasBlock block-${block.type} emailBlock-${block.id} ${selected ? 'selected' : ''}`} style={{ padding: block.type === 'spacer' ? `${Number(block.content) || 32}px 0` : `${block.padding ?? 16}px 28px`, color: block.color, textAlign: block.align }} onClick={(event) => { event.stopPropagation(); onSelect() }}>
    <span className='blockDragHandle'>⋮⋮</span>
    {selected && <div className='canvasBlockActions'><span>{index + 1}</span><button type='button' title='Move up' onClick={(event) => { event.stopPropagation(); onMove(-1) }}>↑</button><button type='button' title='Move down' onClick={(event) => { event.stopPropagation(); onMove(1) }}>↓</button><button type='button' title='Duplicate' onClick={(event) => { event.stopPropagation(); onDuplicate() }}>▣</button><button type='button' title='Delete' onClick={(event) => { event.stopPropagation(); onDelete() }}>×</button></div>}
    {block.type === 'heading' && <h1>{block.content}</h1>}
    {block.type === 'text' && <p>{block.content}</p>}
    {block.type === 'image' && (block.url ? block.url.startsWith('asset://') ? <div className='emailSelectedMedia'><span>◇</span><strong>{block.content}</strong><small>{block.alt} · Selected from Media Library</small></div> : <img src={block.url} alt={block.alt} /> : <div className='emailImageDrop'><span>◇</span><strong>Add an image</strong><small>Upload, paste a URL, or choose from the library</small></div>)}
    {block.type === 'button' && <a href={block.url} style={{ background: block.background, color: block.color }}>{block.content}</a>}
    {block.type === 'divider' && <hr style={{ borderColor: block.color }} />}
    {block.type === 'spacer' && <span className='spacerLabel'>{block.content}px spacer</span>}
    {block.type === 'columns' && <div className='emailColumns'><div><span>01</span><strong>{block.content}</strong><p>Bring every buyer signal together.</p></div><div><span>02</span><strong>{block.secondary}</strong><p>Adapt every experience in real time.</p></div></div>}
    {block.type === 'social' && <div className='emailSocialLinks'><i>in</i><i>𝕏</i><i>▶</i><span>{block.content}</span></div>}
    {block.type === 'video' && <div className='emailVideoBlock'><span>▶</span><strong>{block.content}</strong><small>Opens linked video in a browser</small></div>}
    {block.type === 'html' && <div className='emailHtmlPreview'><span>{'</>'}</span><code>{block.content}</code></div>}
    {block.type === 'dynamic' && <div className='emailDynamicBlock'><header><span>⚡ Dynamic Content</span><em>{block.secondary}</em></header><p>{block.content}</p></div>}
  </section>
}

function BlockProperties({ block, onChange, onOpenMedia, variables, onInsertVariable }: { block?: EmailBlock; onChange: (updates: Partial<EmailBlock>) => void; onOpenMedia: () => void; variables: EmailVariable[]; onInsertVariable: (reference: string) => void }) {
  if (!block) return <div className='emailEmptyProperties'><span>☝</span><h3>Select a block</h3><p>Choose a block on the canvas to edit its content and styles.</p></div>
  const icon = blockCatalog.find((item) => item.type === block.type)?.icon ?? 'T'
  return <div className='emailPropertyPanel'><div className='emailSelectedBlock'><span>{icon}</span><div><strong>{block.label}</strong><small>{block.type.replace('-', ' ')} block</small></div><button type='button'>•••</button></div>
    {['heading', 'text', 'button', 'columns', 'social', 'video', 'dynamic'].includes(block.type) && <section className='emailPropertySection'><header><strong>Content</strong><button type='button' onClick={() => onInsertVariable(variables[0]?.reference ?? '{{Person.FirstName}}')}>{'{{}}'} Variable</button></header>{block.type === 'text' && <RichTextToolbar />}<label className='emailControlLabel'>{block.type === 'button' ? 'Button label' : block.type === 'columns' ? 'Column one title' : 'Content'}{block.type === 'text' || block.type === 'dynamic' ? <textarea value={block.content} onChange={(event) => onChange({ content: event.target.value })} /> : <input value={block.content} onChange={(event) => onChange({ content: event.target.value })} />}</label>{block.type === 'columns' && <label className='emailControlLabel'>Column two title<input value={block.secondary} onChange={(event) => onChange({ secondary: event.target.value })} /></label>}{block.type === 'dynamic' && <label className='emailControlLabel'>Display condition<select value={block.secondary} onChange={(event) => onChange({ secondary: event.target.value })}><option>Score is greater than 70</option><option>Lifecycle Stage is MQL</option><option>Member of Smart List</option><option>Country is United States</option></select></label>}</section>}
    {block.type === 'image' && <ImageProperties block={block} onChange={onChange} onOpenMedia={onOpenMedia} />}
    {block.type === 'html' && <section className='emailPropertySection'><header><strong>Custom HTML</strong><span>Email-safe markup</span></header><label className='emailControlLabel'>HTML<textarea className='inlineCodeEditor' value={block.content} onChange={(event) => onChange({ content: event.target.value })} /></label><p className='emailCodeHint'>Scripts and unsafe elements are removed when the draft is saved.</p></section>}
    {block.type === 'button' && <section className='emailPropertySection'><header><strong>Link</strong></header><label className='emailControlLabel'>Destination URL<input value={block.url} onChange={(event) => onChange({ url: event.target.value })} /></label><div className='emailControlSplit'><label>Open in<select><option>New tab</option><option>Same tab</option></select></label><label>Tracking<select><option>Track clicks</option><option>Do not track</option></select></label></div></section>}
    {block.type === 'video' && <section className='emailPropertySection'><header><strong>Video Link</strong></header><label className='emailControlLabel'>Video URL<input value={block.url} onChange={(event) => onChange({ url: event.target.value })} placeholder='YouTube or Vimeo URL' /></label><button type='button' className='button outline accent fullButton'>Generate Thumbnail</button></section>}
    {block.type === 'divider' && <section className='emailPropertySection'><header><strong>Divider</strong></header><div className='emailControlSplit'><label>Thickness<select><option>1 px</option><option>2 px</option><option>3 px</option></select></label><label>Style<select><option>Solid</option><option>Dashed</option><option>Dotted</option></select></label></div></section>}
    {block.type === 'spacer' && <section className='emailPropertySection'><header><strong>Spacer</strong></header><label className='emailControlLabel'>Height <span>{block.content}px</span><input type='range' min='8' max='120' value={block.content} onChange={(event) => onChange({ content: event.target.value })} /></label></section>}
    {block.type !== 'spacer' && <section className='emailPropertySection'><header><strong>Appearance</strong></header>{block.type !== 'image' && <label className='emailColorControl'>Text color<input type='color' value={block.color ?? '#20252D'} onChange={(event) => onChange({ color: event.target.value })} /><code>{block.color}</code></label>}{block.type === 'button' && <label className='emailColorControl'>Background<input type='color' value={block.background ?? '#D97757'} onChange={(event) => onChange({ background: event.target.value })} /><code>{block.background}</code></label>}<label className='emailControlLabel'>Alignment<div className='emailAlignmentButtons'>{(['left', 'center', 'right'] as const).map((align) => <button type='button' key={align} className={block.align === align ? 'active' : ''} onClick={() => onChange({ align })}>{align === 'left' ? '≡' : align === 'center' ? '≣' : '≡'}</button>)}</div></label><label className='emailControlLabel'>Block padding <span>{block.padding}px</span><input type='range' min='0' max='64' value={block.padding} onChange={(event) => onChange({ padding: Number(event.target.value) })} /></label></section>}
  </div>
}

function ImageProperties({ block, onChange, onOpenMedia }: { block: EmailBlock; onChange: (updates: Partial<EmailBlock>) => void; onOpenMedia: () => void }) {
  return <><section className='emailPropertySection'><header><strong>Image Source</strong></header><button type='button' className='emailImageUpload' onClick={onOpenMedia}><span>↑</span><strong>Upload or choose image</strong><small>PNG, JPG, GIF, or WebP up to 5 MB</small></button><button type='button' className='button outline accent fullButton' onClick={onOpenMedia}>Browse Media Library</button><label className='emailControlLabel'>Image URL<input value={block.url} onChange={(event) => onChange({ url: event.target.value })} placeholder='https://...' /></label><label className='emailControlLabel'>Alt text<input value={block.alt} onChange={(event) => onChange({ alt: event.target.value })} placeholder='Describe the image' /></label></section><section className='emailPropertySection'><header><strong>Image Link</strong></header><label className='emailControlLabel'>Click-through URL<input placeholder='https://...' /></label><div className='emailControlSplit'><label>Width<select><option>Full width</option><option>Original</option><option>Custom</option></select></label><label>Mobile<select><option>Responsive</option><option>Hide</option></select></label></div></section></>
}

function RichTextToolbar() {
  return <div className='richTextToolbar'><button type='button'><b>B</b></button><button type='button'><i>I</i></button><button type='button'><u>U</u></button><i /><button type='button'>≡</button><button type='button'>☷</button><button type='button'>↗</button><button type='button'>{'{{}}'}</button></div>
}

function VariableLibrary({ variables, onInsert, onAdd }: { variables: EmailVariable[]; onInsert: (reference: string) => void; onAdd: () => void }) {
  const [query, setQuery] = useState('')
  const filter = (value: string) => value.toLowerCase().includes(query.toLowerCase())
  return <div className='emailVariableLibrary'><header><div><strong>Variables</strong><small>Insert into the selected text block</small></div><button type='button' onClick={onAdd}>＋</button></header><label><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder='Search variables...' /></label><section><h4>Program Variables</h4>{variables.filter((variable) => filter(`${variable.name} ${variable.reference}`)).map((variable) => <button type='button' key={variable.id} onClick={() => onInsert(variable.reference)}><span>{variable.reference}</span><small>{variable.defaultValue || 'No default value'}</small><b>＋</b></button>)}<button type='button' className='addVariableRow' onClick={onAdd}>＋ Add custom variable</button></section><section><h4>Person Fields</h4>{personVariables.filter((variable) => filter(`${variable.name} ${variable.reference}`)).map((variable) => <button type='button' key={variable.reference} onClick={() => onInsert(variable.reference)}><span>{variable.reference}</span><small>Sample: {variable.sample}</small><b>＋</b></button>)}</section><section><h4>System Variables</h4>{systemVariables.filter((variable) => filter(`${variable.name} ${variable.reference}`)).map((variable) => <button type='button' key={variable.reference} onClick={() => onInsert(variable.reference)}><span>{variable.reference}</span><b>＋</b></button>)}</section></div>
}

function GlobalEmailStyles() {
  return <div className='emailPropertyPanel'><section className='emailPropertySection'><header><strong>Canvas</strong></header><label className='emailColorControl'>Page background<input type='color' defaultValue='#F3F4F6' /><code>#F3F4F6</code></label><label className='emailColorControl'>Content background<input type='color' defaultValue='#FFFFFF' /><code>#FFFFFF</code></label><label className='emailControlLabel'>Content width<select defaultValue='640'><option value='600'>600 px</option><option value='640'>640 px</option><option value='700'>700 px</option></select></label></section><section className='emailPropertySection'><header><strong>Typography</strong></header><label className='emailControlLabel'>Font family<select><option>Arial, Helvetica, sans-serif</option><option>Georgia, serif</option><option>Verdana, sans-serif</option></select></label><div className='emailControlSplit'><label>Body size<select><option>16 px</option><option>15 px</option><option>14 px</option></select></label><label>Line height<select><option>1.6</option><option>1.5</option><option>1.4</option></select></label></div><label className='emailColorControl'>Link color<input type='color' defaultValue='#D97757' /><code>#D97757</code></label></section><section className='emailPropertySection'><header><strong>Mobile Defaults</strong></header><label className='toggleProperty'><span><strong>Stack columns</strong><small>Convert columns to full width on mobile</small></span><input type='checkbox' className='toggleSwitch' defaultChecked /></label><label className='toggleProperty'><span><strong>Full-width buttons</strong><small>Expand CTAs on small screens</small></span><input type='checkbox' className='toggleSwitch' /></label></section></div>
}

function EmailDraftSettings({ subject, preheader, onSubjectChange, onPreheaderChange, variables }: { subject: string; preheader: string; onSubjectChange: (value: string) => void; onPreheaderChange: (value: string) => void; variables: EmailVariable[] }) {
  return <div className='emailPropertyPanel'><section className='emailPropertySection'><header><strong>Message Details</strong><span>Required</span></header><label className='emailControlLabel'>Subject line <small>{subject.length}/150</small><input value={subject} onChange={(event) => onSubjectChange(event.target.value)} /></label><label className='emailControlLabel'>Preheader <small>{preheader.length}/150</small><textarea value={preheader} onChange={(event) => onPreheaderChange(event.target.value)} /></label><div className='emailSettingsVariableChips'>{variables.slice(0, 2).map((variable) => <button type='button' key={variable.id}>{variable.reference}</button>)}<button type='button'>{'{{Person.FirstName}}'}</button></div></section><section className='emailPropertySection'><header><strong>Sender</strong></header><label className='emailControlLabel'>From name<input defaultValue='Maya at Marketo Next' /></label><label className='emailControlLabel'>From email<input defaultValue='hello@marketonext.com' /></label><label className='emailControlLabel'>Reply-to<input defaultValue='hello@marketonext.com' /></label></section><section className='emailPropertySection'><header><strong>Tracking & Compliance</strong></header><label className='toggleProperty'><span><strong>Track opens</strong><small>Add a tracking pixel</small></span><input type='checkbox' className='toggleSwitch' defaultChecked /></label><label className='toggleProperty'><span><strong>Track clicks</strong><small>Rewrite links for attribution</small></span><input type='checkbox' className='toggleSwitch' defaultChecked /></label><label className='toggleProperty'><span><strong>Append UTM parameters</strong><small>Use campaign defaults</small></span><input type='checkbox' className='toggleSwitch' defaultChecked /></label><label className='emailControlLabel'>Subscription category<select><option>Product Updates</option><option>Marketing Newsletter</option><option>Event Communications</option></select></label><label className='emailControlLabel'>Unsubscribe behavior<select><option>Global unsubscribe</option><option>Category only</option></select></label></section><section className='emailPropertySection emailValidationCard'><header><strong>Draft Validation</strong><span>3 of 4 passed</span></header><p className='passed'>✓ Unsubscribe link included</p><p className='passed'>✓ Images have alt text</p><p className='passed'>✓ Subject line is valid</p><p className='warning'>! Plain-text version needs review</p><button type='button' className='button outline accent fullButton'>Edit Plain-Text Version</button></section></div>
}

function CodeEditor({ mode, code, dirty, onChange }: { mode: 'html' | 'css'; code: string; dirty: boolean; onChange: (value: string) => void }) {
  const lineCount = code.split('\n').length
  return <div className='emailCodeWorkspace'><header><div><span>{mode === 'html' ? '</>' : '{ }'}</span><div><strong>{mode === 'html' ? 'HTML Source' : 'Email CSS'}</strong><small>{mode === 'html' ? 'Edit table-safe email markup directly' : 'Styles are automatically inlined when sent'}</small></div></div><div>{dirty && <em>Unsynced manual edits</em>}<button type='button'>Find</button><button type='button'>Validate</button><button type='button'>Copy</button></div></header><div className='emailCodeEditor'><pre aria-hidden='true'>{Array.from({ length: lineCount }, (_, index) => index + 1).join('\n')}</pre><textarea spellCheck={false} value={code} onChange={(event) => onChange(event.target.value)} /></div><footer><span>UTF-8</span><span>{lineCount} lines</span><span>Email-safe mode</span><strong>✓ No blocking errors</strong></footer></div>
}

function AddEmailVariableModal({ onClose, onSave }: { onClose: () => void; onSave: (variable: EmailVariable) => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState<EmailVariable['type']>('Text')
  const [defaultValue, setDefaultValue] = useState('')
  const safeName = name.replace(/[^a-zA-Z0-9_]/g, '')
  return <Modal title='Add Email Variable' open onClose={onClose}><div className='emailVariableModal'><label>Variable name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder='OfferName' /></label><div><span>Reference</span><code>{`{{my.${safeName || 'VariableName'}}}`}</code></div><label>Type<select value={type} onChange={(event) => setType(event.target.value as EmailVariable['type'])}><option>Text</option><option>Number</option><option>Date</option><option>URL</option></select></label><label>Default value<input type={type === 'Date' ? 'date' : type === 'Number' ? 'number' : type === 'URL' ? 'url' : 'text'} value={defaultValue} onChange={(event) => setDefaultValue(event.target.value)} /></label><p>Email variables can be inserted into text, headings, buttons, HTML, subject lines, and preheaders.</p><footer><button type='button' className='button ghost' onClick={onClose}>Cancel</button><button type='button' className='button solid' disabled={!safeName} onClick={() => onSave({ id: `custom-${safeName}`, name: safeName, reference: `{{my.${safeName}}}`, defaultValue, type })}>Add Variable</button></footer></div></Modal>
}

function MediaLibraryModal({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (url: string) => void }) {
  const media = [{ id: 'm1', name: 'Product launch hero', tone: 'warm' }, { id: 'm2', name: 'Revenue dashboard', tone: 'blue' }, { id: 'm3', name: 'Customer story', tone: 'violet' }, { id: 'm4', name: 'Webinar speakers', tone: 'green' }, { id: 'm5', name: 'Integration graphic', tone: 'gray' }, { id: 'm6', name: 'Event banner', tone: 'warm' }]
  return <Modal title='Choose Image' open={open} onClose={onClose}><div className='emailMediaModal'><header><label><span>⌕</span><input placeholder='Search images and files...' /></label><button type='button' className='button solid'>↑ Upload New</button></header><div className='emailMediaGrid'>{media.map((item) => <button type='button' key={item.id} onClick={() => onSelect(`asset://${item.id}`)}><span className={`tone-${item.tone}`}><i>◇</i></span><strong>{item.name}</strong><small>1200 × 630 · PNG</small></button>)}</div><footer><span>6 assets</span><button type='button' className='button ghost' onClick={onClose}>Cancel</button></footer></div></Modal>
}

function generateEmailHtml(blocks: EmailBlock[], subject: string, preheader: string) {
  const markup = blocks.map((block) => {
    const style = `padding:${block.padding ?? 16}px 28px;text-align:${block.align ?? 'left'};color:${block.color ?? '#20252d'};`
    if (block.type === 'heading') return `      <tr><td style="${style}"><h1>${block.content}</h1></td></tr>`
    if (block.type === 'text') return `      <tr><td style="${style}"><p>${block.content}</p></td></tr>`
    if (block.type === 'image') return `      <tr><td style="${style}"><img src="${block.url || 'IMAGE_URL'}" alt="${block.alt || ''}" width="584" style="max-width:100%;height:auto;"></td></tr>`
    if (block.type === 'button') return `      <tr><td style="${style}"><a class="email-button" href="${block.url}">${block.content}</a></td></tr>`
    if (block.type === 'divider') return `      <tr><td style="${style}"><hr style="border:0;border-top:1px solid ${block.color};"></td></tr>`
    if (block.type === 'spacer') return `      <tr><td height="${block.content}" style="font-size:0;line-height:0;">&nbsp;</td></tr>`
    if (block.type === 'columns') return `      <tr><td style="${style}"><table width="100%"><tr><td class="email-column" width="50%">${block.content}</td><td class="email-column" width="50%">${block.secondary}</td></tr></table></td></tr>`
    if (block.type === 'html') return `      <tr><td>${block.content}</td></tr>`
    return `      <tr><td style="${style}">${block.content}</td></tr>`
  }).join('\n')
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
  <style>${starterCss}</style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
  <table class="email-wrapper" role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table class="email-container" role="presentation" width="640" cellpadding="0" cellspacing="0">
${markup}
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
