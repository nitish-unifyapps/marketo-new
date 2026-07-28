import { useRef, useState, type DragEvent, type ReactNode } from 'react'
import type { ProgramAssetEditorBlock, ProgramAssetEditorState, ProgramAssetRecord, ProgramRecord } from '../../types/programs'

type TokenTab = 'program' | 'person' | 'system' | 'trigger'

interface ProgramAssetEditorProps {
  program: ProgramRecord
  asset: ProgramAssetRecord
  onSave: (asset: ProgramAssetRecord) => void
  onCancel: () => void
}

const personTokens = ['{{lead.FirstName}}', '{{lead.LastName}}', '{{lead.Email}}', '{{lead.Company}}', '{{lead.JobTitle}}']
const systemTokens = ['{{system.date}}', '{{system.time}}', '{{system.unsubscribeLink}}', '{{system.viewAsWebPage}}']
const triggerTokens = ['{{trigger.name}}', '{{trigger.formName}}', '{{trigger.link}}', '{{trigger.webPage}}']

function defaultEditorState(asset: ProgramAssetRecord): ProgramAssetEditorState {
  return {
    subject: asset.type === 'Email' ? 'A smarter way to grow, {{lead.FirstName}}' : '',
    preheader: asset.type === 'Email' ? 'See what is new in {{my.ProgramName}}' : '',
    emailBlocks: [
      { id: 'email-brand', type: 'Brand', content: 'MARKETO NEXT' },
      { id: 'email-heading', type: 'Heading', content: 'Turn every signal into your next best action.' },
      { id: 'email-text', type: 'Text', content: 'Hi {{lead.FirstName}}, connect your data, content, and journeys in one workspace.' },
      { id: 'email-button', type: 'Button', content: 'Explore what’s new' },
      { id: 'email-dynamic', type: 'Dynamic Content', content: 'A tailored offer for high-intent prospects.', condition: 'Lead Score > 70' },
    ],
    pageSections: [
      { id: 'page-hero', type: 'Hero', content: 'Build pipeline that moves with your buyers.' },
      { id: 'page-form', type: 'Form', content: 'Request your personalized demo' },
      { id: 'page-proof', type: 'Social Proof', content: 'Trusted by modern revenue teams.' },
    ],
    formFields: ['Work Email', 'First Name', 'Last Name', 'Company'],
    progressiveProfiling: true,
    thankYouMode: 'page',
    thankYouValue: 'https://marketonext.com/thank-you',
    seoTitle: `${asset.name} | Marketo Next`,
    seoDescription: 'A personalized experience built with Marketo Next.',
    slug: asset.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-'),
    formDefaultValue: '{{lead.Company}}',
  }
}

function tokenValue(token: string, program: ProgramRecord) {
  const programToken = program.tokens?.find((item) => `{{my.${item.name}}}` === token)
  if (programToken) return programToken.defaultValue || `Sample ${programToken.name}`
  const samples: Record<string, string> = {
    '{{lead.FirstName}}': 'Sophia', '{{lead.LastName}}': 'Kim', '{{lead.Email}}': 'sophia.kim@northlane.com', '{{lead.Company}}': 'Northlane Systems', '{{lead.JobTitle}}': 'Revenue Operations Director',
    '{{system.date}}': 'July 28, 2026', '{{system.time}}': '10:24 AM', '{{system.unsubscribeLink}}': 'Unsubscribe', '{{system.viewAsWebPage}}': 'View online',
    '{{trigger.name}}': 'Fills Out Form', '{{trigger.formName}}': 'Demo Request Form', '{{trigger.link}}': 'Learn More', '{{trigger.webPage}}': '/pricing',
  }
  return samples[token] ?? token
}

function resolveTokens(value: string, program: ProgramRecord) {
  return value.replace(/{{[^}]+}}/g, (token) => tokenValue(token, program))
}

function TokenPicker({ program, open, activeTab, onTabChange, onSelect, onClose }: { program: ProgramRecord; open: boolean; activeTab: TokenTab; onTabChange: (tab: TokenTab) => void; onSelect: (token: string) => void; onClose: () => void }) {
  if (!open) return null
  const programTokens = (program.tokens ?? []).map((token) => `{{my.${token.name}}}`)
  const triggerMode = program.segment?.mode === 'trigger' || (program.type === 'Event' && !program.segment)
  const tabs: Array<{ key: TokenTab; label: string; tokens: string[] }> = [
    { key: 'program', label: 'Program Tokens', tokens: programTokens },
    { key: 'person', label: 'Person Fields', tokens: personTokens },
    { key: 'system', label: 'System Tokens', tokens: systemTokens },
    ...(triggerMode ? [{ key: 'trigger' as const, label: 'Trigger Tokens', tokens: triggerTokens }] : []),
  ]
  const selected = tabs.find((tab) => tab.key === activeTab) ?? tabs[0]
  return <div className='assetTokenPopover'><header><strong>Insert Token</strong><button type='button' onClick={onClose}>×</button></header><nav>{tabs.map((tab) => <button type='button' key={tab.key} className={selected.key === tab.key ? 'active' : ''} onClick={() => onTabChange(tab.key)}>{tab.label}</button>)}</nav><div>{selected.tokens.map((token) => <button type='button' key={token} onClick={() => onSelect(token)}><code>{token}</code><small>{tokenValue(token, program)}</small></button>)}{selected.tokens.length === 0 && <p>No Program Tokens are configured.</p>}</div></div>
}

function TokenTextField({ program, label, value, multiline = false, onChange }: { program: ProgramRecord; label: string; value: string; multiline?: boolean; onChange: (value: string) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TokenTab>('program')
  const parts = value.split(/({{[^}]+}})/g).filter(Boolean)
  return <label className='assetTokenField'><span>{label}<button type='button' onClick={() => setPickerOpen((open) => !open)}>Insert Token</button></span>{multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} /> : <input value={value} onChange={(event) => onChange(event.target.value)} />}<div className='assetTokenRendering'>{parts.map((part, index) => part.startsWith('{{') ? <i key={`${part}-${index}`} title={part}>{part.replace('{{', '').replace('}}', '')}</i> : <span key={`${part}-${index}`}>{part}</span>)}</div><small className='assetTokenResolved'>Preview: {resolveTokens(value, program)}</small><TokenPicker program={program} open={pickerOpen} activeTab={activeTab} onTabChange={setActiveTab} onClose={() => setPickerOpen(false)} onSelect={(token) => { onChange(`${value}${value ? ' ' : ''}${token}`); setPickerOpen(false) }} /></label>
}

function EmailAssetBuilder({ program, state, onChange }: { program: ProgramRecord; state: ProgramAssetEditorState; onChange: (state: ProgramAssetEditorState) => void }) {
  const nextId = useRef(1)
  const [selectedId, setSelectedId] = useState(state.emailBlocks[1]?.id ?? state.emailBlocks[0]?.id)
  const [preview, setPreview] = useState<'desktop' | 'mobile'>('desktop')
  const [draggedId, setDraggedId] = useState('')
  const selected = state.emailBlocks.find((block) => block.id === selectedId)
  const catalog = ['Heading', 'Text', 'Image', 'Button', 'Divider', 'Dynamic Content']

  function updateBlock(updates: Partial<ProgramAssetEditorBlock>) {
    onChange({ ...state, emailBlocks: state.emailBlocks.map((block) => block.id === selectedId ? { ...block, ...updates } : block) })
  }

  function addBlock(type: string) {
    const block = { id: `email-block-added-${nextId.current++}`, type, content: type === 'Dynamic Content' ? 'Personalized content' : `New ${type}`, condition: type === 'Dynamic Content' ? 'Lifecycle Stage is MQL' : undefined }
    onChange({ ...state, emailBlocks: [...state.emailBlocks, block] })
    setSelectedId(block.id)
  }

  function dropBlock(event: DragEvent, targetId?: string) {
    event.preventDefault()
    const catalogType = event.dataTransfer.getData('application/x-email-block')
    if (catalogType) { addBlock(catalogType); return }
    if (!draggedId || draggedId === targetId) return
    const next = [...state.emailBlocks]
    const from = next.findIndex((block) => block.id === draggedId)
    const to = next.findIndex((block) => block.id === targetId)
    const [moved] = next.splice(from, 1)
    next.splice(to < 0 ? next.length : to, 0, moved)
    onChange({ ...state, emailBlocks: next })
  }

  return <div className='programEmailAssetBuilder'>
    <aside className='assetBuilderLibrary'><header><strong>Content Blocks</strong><small>Drag onto the email</small></header>{catalog.map((type) => <button type='button' draggable key={type} onDragStart={(event) => event.dataTransfer.setData('application/x-email-block', type)} onClick={() => addBlock(type)}><span>{type === 'Heading' || type === 'Text' ? 'T' : type === 'Image' ? '◇' : type === 'Button' ? '▰' : type === 'Dynamic Content' ? '⚡' : '—'}</span>{type}</button>)}</aside>
    <main className='assetBuilderCanvas'><header><div><button type='button' className={preview === 'desktop' ? 'active' : ''} onClick={() => setPreview('desktop')}>Desktop</button><button type='button' className={preview === 'mobile' ? 'active' : ''} onClick={() => setPreview('mobile')}>Mobile</button></div><span>Drag-drop email canvas</span></header><div className={`programEmailDocument ${preview}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropBlock(event)}><div className='programInboxPreview'><span>Subject</span><strong>{resolveTokens(state.subject, program)}</strong><small>{resolveTokens(state.preheader, program)}</small></div>{state.emailBlocks.map((block) => <section draggable key={block.id} className={`programEmailBlock type-${block.type.toLowerCase().replaceAll(' ', '-')} ${selectedId === block.id ? 'selected' : ''}`} onDragStart={() => { setDraggedId(block.id) }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropBlock(event, block.id)} onClick={() => setSelectedId(block.id)}><span>⋮⋮</span>{block.type === 'Heading' ? <h1>{resolveTokens(block.content, program)}</h1> : block.type === 'Button' ? <button type='button'>{resolveTokens(block.content, program)}</button> : block.type === 'Image' ? <div className='assetImagePlaceholder'>◇ Image</div> : block.type === 'Divider' ? <hr /> : block.type === 'Dynamic Content' ? <div className='assetDynamicContent'><em>⚡ {block.condition}</em><p>{resolveTokens(block.content, program)}</p></div> : <p>{resolveTokens(block.content, program)}</p>}</section>)}</div></main>
    <aside className='assetBuilderProperties'><header><strong>Email Settings</strong><button type='button' onClick={() => setPreview(preview === 'desktop' ? 'mobile' : 'desktop')}>Preview</button></header><TokenTextField program={program} label='Subject' value={state.subject} onChange={(subject) => onChange({ ...state, subject })} /><TokenTextField program={program} label='Preheader' value={state.preheader} multiline onChange={(preheader) => onChange({ ...state, preheader })} />{selected && <section><header><strong>{selected.type} Block</strong><button type='button' onClick={() => onChange({ ...state, emailBlocks: state.emailBlocks.filter((block) => block.id !== selected.id) })}>Delete</button></header><TokenTextField program={program} label='Content' value={selected.content} multiline={selected.type === 'Text' || selected.type === 'Dynamic Content'} onChange={(content) => updateBlock({ content })} />{selected.type === 'Dynamic Content' && <label>Display Condition<select value={selected.condition} onChange={(event) => updateBlock({ condition: event.target.value })}><option>Lead Score &gt; 70</option><option>Lifecycle Stage is MQL</option><option>Member of Smart List</option></select></label>}</section>}</aside>
  </div>
}

function LandingPageAssetBuilder({ program, state, onChange }: { program: ProgramRecord; state: ProgramAssetEditorState; onChange: (state: ProgramAssetEditorState) => void }) {
  const nextId = useRef(1)
  const [selectedId, setSelectedId] = useState(state.pageSections[0]?.id)
  const [rightTab, setRightTab] = useState<'content' | 'seo'>('content')
  const selected = state.pageSections.find((section) => section.id === selectedId)
  const catalog = ['Hero', 'Text', 'Image', 'Form', 'Columns', 'Social Proof']

  function addSection(type: string) {
    const section = { id: `page-section-added-${nextId.current++}`, type, content: `New ${type} section` }
    onChange({ ...state, pageSections: [...state.pageSections, section] })
    setSelectedId(section.id)
  }

  function updateSection(content: string) {
    onChange({ ...state, pageSections: state.pageSections.map((section) => section.id === selectedId ? { ...section, content } : section) })
  }

  return <div className='programLandingAssetBuilder'>
    <aside className='assetBuilderLibrary'><header><strong>Page Sections</strong><small>Build the page structure</small></header>{catalog.map((type) => <button type='button' draggable key={type} onClick={() => addSection(type)}><span>{type === 'Form' ? '☷' : type === 'Image' ? '◇' : type === 'Hero' ? '▣' : 'T'}</span>{type}</button>)}</aside>
    <main className='assetBuilderCanvas'><header><span>Landing Page Canvas</span><div><button type='button' className='active'>Desktop</button><button type='button'>Mobile</button></div></header><div className='programLandingDocument'>{state.pageSections.map((section) => <section key={section.id} className={`pageSection type-${section.type.toLowerCase().replaceAll(' ', '-')} ${selectedId === section.id ? 'selected' : ''}`} onClick={() => { setSelectedId(section.id); setRightTab('content') }}><span>⋮⋮</span>{section.type === 'Hero' ? <div><small>MARKETO NEXT</small><h1>{resolveTokens(section.content, program)}</h1><p>Turn every buyer signal into meaningful pipeline.</p><button type='button'>Get Started</button></div> : section.type === 'Form' ? <div className='landingEmbeddedForm'><h3>{section.content}</h3><label>Work Email<input placeholder='you@company.com' /></label><label>Company<input /></label><button type='button'>Submit</button></div> : section.type === 'Image' ? <div className='assetImagePlaceholder'>◇ Drop image here</div> : <div><h2>{resolveTokens(section.content, program)}</h2><p>Personalized content for {'{{lead.Company}}'}.</p></div>}</section>)}</div></main>
    <aside className='assetBuilderProperties'><header className='assetPropertyTabs'><button type='button' className={rightTab === 'content' ? 'active' : ''} onClick={() => setRightTab('content')}>Content</button><button type='button' className={rightTab === 'seo' ? 'active' : ''} onClick={() => setRightTab('seo')}>SEO Settings</button></header>{rightTab === 'content' && selected ? <section><header><strong>{selected.type} Section</strong><button type='button' onClick={() => onChange({ ...state, pageSections: state.pageSections.filter((section) => section.id !== selected.id) })}>Delete</button></header><TokenTextField program={program} label='Content' value={selected.content} multiline onChange={updateSection} />{selected.type === 'Form' && <label>Form Asset<select><option>Registration Form</option><option>Demo Request Form</option><option>Contact Sales Form</option></select></label>}</section> : <section><label>URL Slug<input value={state.slug} onChange={(event) => onChange({ ...state, slug: event.target.value })} /></label><TokenTextField program={program} label='SEO Title' value={state.seoTitle} onChange={(seoTitle) => onChange({ ...state, seoTitle })} /><TokenTextField program={program} label='Meta Description' value={state.seoDescription} multiline onChange={(seoDescription) => onChange({ ...state, seoDescription })} /><label className='assetToggleRow'><span>Allow search indexing</span><input type='checkbox' defaultChecked /></label></section>}</aside>
  </div>
}

function FormAssetBuilder({ program, state, onChange }: { program: ProgramRecord; state: ProgramAssetEditorState; onChange: (state: ProgramAssetEditorState) => void }) {
  const [selectedField, setSelectedField] = useState(state.formFields[0])
  const fieldCatalog = ['First Name', 'Last Name', 'Work Email', 'Company', 'Job Title', 'Company Size', 'Product Interest', 'UTM Source']
  return <div className='programFormAssetBuilder'>
    <aside className='assetBuilderLibrary'><header><strong>Field Library</strong><small>Click to add fields</small></header>{fieldCatalog.map((field) => <button type='button' draggable key={field} disabled={state.formFields.includes(field)} onClick={() => onChange({ ...state, formFields: [...state.formFields, field] })}><span>⋮⋮</span>{field}</button>)}</aside>
    <main className='assetBuilderCanvas'><header><span>Form Preview</span><div><button type='button' className='active'>Desktop</button></div></header><div className='programFormDocument'><div><small>LET’S TALK</small><h2>See Marketo Next in action</h2><p>Tell us a little about yourself.</p></div>{state.formFields.map((field, index) => <section key={field} className={selectedField === field ? 'selected' : ''} onClick={() => setSelectedField(field)}><span>⋮⋮</span><label>{field}{index < 2 && <em>*</em>}<input placeholder={field === 'Work Email' ? 'you@company.com' : resolveTokens(state.formDefaultValue, program)} /></label><i>✓ CRM</i><button type='button' onClick={(event) => { event.stopPropagation(); onChange({ ...state, formFields: state.formFields.filter((item) => item !== field) }) }}>×</button></section>)}<button type='button' className='formAssetSubmit'>Submit</button></div></main>
    <aside className='assetBuilderProperties'><header><strong>Form Settings</strong></header><section><label>Selected Field<input value={selectedField ?? ''} onChange={(event) => { const value = event.target.value; onChange({ ...state, formFields: state.formFields.map((field) => field === selectedField ? value : field) }); setSelectedField(value) }} /></label><TokenTextField program={program} label='Default Value' value={state.formDefaultValue} onChange={(formDefaultValue) => onChange({ ...state, formDefaultValue })} /><label className='assetToggleRow'><span><strong>Progressive Profiling</strong><small>Show fields based on known CRM data</small></span><input type='checkbox' checked={state.progressiveProfiling} onChange={(event) => onChange({ ...state, progressiveProfiling: event.target.checked })} /></label></section><section><header><strong>Thank-you Settings</strong></header><label>After Submission<select value={state.thankYouMode} onChange={(event) => onChange({ ...state, thankYouMode: event.target.value as ProgramAssetEditorState['thankYouMode'] })}><option value='page'>Redirect to thank-you page</option><option value='message'>Show confirmation message</option></select></label><TokenTextField program={program} label={state.thankYouMode === 'page' ? 'Thank-you Page URL' : 'Confirmation Message'} value={state.thankYouValue} multiline={state.thankYouMode === 'message'} onChange={(thankYouValue) => onChange({ ...state, thankYouValue })} /></section></aside>
  </div>
}

function DiscardChangesPrompt({ onDiscard, onKeep }: { onDiscard: () => void; onKeep: () => void }) {
  return <div className='assetDiscardScrim'><div className='assetDiscardDialog'><span>!</span><h3>Discard unsaved changes?</h3><p>Your latest edits will not be saved. This action cannot be undone.</p><footer><button type='button' className='button outline' onClick={onKeep}>Keep Editing</button><button type='button' className='button solid' onClick={onDiscard}>Discard Changes</button></footer></div></div>
}

export function ProgramAssetEditor({ program, asset, onSave, onCancel }: ProgramAssetEditorProps) {
  const [name, setName] = useState(asset.name)
  const [state, setState] = useState<ProgramAssetEditorState>(() => structuredClone(asset.editorState ?? defaultEditorState(asset)))
  const [dirty, setDirty] = useState(false)
  const [discardPrompt, setDiscardPrompt] = useState(false)

  function update(next: ProgramAssetEditorState) {
    setState(next)
    setDirty(true)
  }

  function requestExit() {
    if (dirty || name !== asset.name) setDiscardPrompt(true)
    else onCancel()
  }

  const builder: ReactNode = asset.type === 'Email'
    ? <EmailAssetBuilder program={program} state={state} onChange={update} />
    : asset.type === 'Landing Page'
      ? <LandingPageAssetBuilder program={program} state={state} onChange={update} />
      : <FormAssetBuilder program={program} state={state} onChange={update} />

  return <div className='programAssetEditor'>
    <header className='programAssetEditorTopbar'><button type='button' onClick={requestExit}>← Back to Program</button><input value={name} onChange={(event) => { setName(event.target.value); setDirty(true) }} aria-label='Asset name' /><div><button type='button' className='button solid' disabled={!name.trim()} onClick={() => onSave({ ...asset, name: name.trim(), editorState: state })}>Save</button><button type='button' className='button outline' onClick={requestExit}>Cancel</button></div></header>
    <main className='programAssetEditorBody'>{builder}</main>
    {discardPrompt && <DiscardChangesPrompt onKeep={() => setDiscardPrompt(false)} onDiscard={onCancel} />}
  </div>
}
