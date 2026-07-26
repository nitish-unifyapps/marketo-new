import { useState } from 'react'
import type { BuilderKind } from '../../types/content'

interface VisualBuilderProps {
  kind: Exclude<BuilderKind, 'form'>
  onBack: () => void
}

const emailComponents = [
  { icon: 'T', label: 'Text' },
  { icon: '◇', label: 'Image' },
  { icon: '▰', label: 'Button' },
  { icon: '—', label: 'Divider' },
  { icon: '</>', label: 'HTML' },
  { icon: '⚡', label: 'Dynamic Content' },
]

const pageComponents = [
  { icon: '▣', label: 'Hero' },
  { icon: '☷', label: 'Form' },
  { icon: 'T', label: 'Text' },
  { icon: '◇', label: 'Image' },
]

export function VisualBuilder({ kind, onBack }: VisualBuilderProps) {
  const isEmail = kind === 'email'
  const components = isEmail ? emailComponents : pageComponents
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [selected, setSelected] = useState(isEmail ? 'Button' : 'Form')
  const [subject, setSubject] = useState('A smarter way to grow your pipeline')
  const [preheader, setPreheader] = useState('See what is new in Marketo Next')
  const [slug, setSlug] = useState('enterprise-demo')
  const [activeRightTab, setActiveRightTab] = useState<'component' | 'settings'>('component')

  return (
    <section className='visualBuilder'>
      <header className='builderActionBar'>
        <div className='builderIdentity'>
          <button type='button' className='backButton' onClick={onBack} aria-label='Back to assets'>←</button>
          <div><strong>{isEmail ? 'Q3 Product Launch' : 'Enterprise Demo Request'}</strong><small>{isEmail ? 'Email' : 'Landing Page'} · Draft saved just now</small></div>
        </div>
        <div className='builderActions'>
          <button type='button' className='historyButton' title='Version history'>◴</button>
          <button type='button' className='button outline accent'>Save Draft</button>
          <button type='button' className='button outline accent'>Preview</button>
          {isEmail && <button type='button' className='button outline accent'>Test Send</button>}
          <button type='button' className='button solid'>{isEmail ? 'Submit for Approval' : 'Publish'}</button>
        </div>
      </header>

      <div className='builderLayout'>
        <aside className='builderSidebar builderComponents'>
          <div className='builderPanelHeading'><strong>{isEmail ? 'Components' : 'Sections'}</strong><button type='button'>⌕</button></div>
          <p className='builderHint'>Drag a block onto the canvas</p>
          <div className='componentLibrary'>
            {components.map((component) => (
              <button
                key={component.label}
                type='button'
                draggable
                className={`componentTile ${selected === component.label ? 'selected' : ''}`}
                onClick={() => { setSelected(component.label); setActiveRightTab('component') }}
              >
                <span>{component.icon}</span>{component.label}
              </button>
            ))}
          </div>
          {isEmail && (
            <div className='mergeTagSection'>
              <h4>Merge Tags</h4>
              <p>Click to insert a personalized token</p>
              <div><button type='button'>{'{{First Name}}'}</button><button type='button'>{'{{Company}}'}</button><button type='button'>{'{{Owner.Name}}'}</button></div>
            </div>
          )}
          {!isEmail && (
            <div className='pageStructure'>
              <h4>Page Structure</h4>
              <button type='button'><span>⋮⋮</span> Hero Section</button>
              <button type='button' className='active'><span>⋮⋮</span> Lead Form</button>
              <button type='button'><span>⋮⋮</span> Social Proof</button>
            </div>
          )}
        </aside>

        <main className='builderStage'>
          <div className='canvasToolbar'>
            <span>Canvas</span>
            <div className='deviceToggle' role='group' aria-label='Preview size'>
              <button type='button' className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')}>▰ Desktop</button>
              <button type='button' className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')}>▯ Mobile</button>
            </div>
            <span>100%⌄</span>
          </div>
          <div className='canvasSurface'>
            <div className={`contentCanvas ${device} ${isEmail ? 'emailCanvas' : 'pageCanvas'}`}>
              <div className='canvasHero'>
                <div className='canvasBrand'>MARKETO NEXT</div>
                <span className='eyebrow'>{isEmail ? 'PRODUCT UPDATE' : 'B2B GROWTH, UNIFIED'}</span>
                <h1>{isEmail ? 'Turn every signal into your next best action.' : 'Build pipeline that moves with your buyers.'}</h1>
                <p>{isEmail ? 'Connect your data, content, and customer journeys in one intelligent workspace.' : 'See how modern revenue teams orchestrate personalized experiences at scale.'}</p>
                <button type='button' className={selected === 'Button' ? 'canvasSelected' : ''} onClick={() => setSelected('Button')}>{isEmail ? 'Explore what’s new' : 'Get a personalized demo'}</button>
              </div>
              {isEmail ? (
                <div className='canvasColumns'><div><span>01</span><strong>Unified profiles</strong><p>Bring every buyer signal together.</p></div><div><span>02</span><strong>Smarter journeys</strong><p>Adapt experiences in real time.</p></div></div>
              ) : (
                <div className={`embeddedForm ${selected === 'Form' ? 'canvasSelected' : ''}`} onClick={() => setSelected('Form')}>
                  <h3>Request your demo</h3><label>Work email<input placeholder='you@company.com' /></label><label>Company<input placeholder='Company name' /></label><button type='button'>Get started</button>
                </div>
              )}
            </div>
          </div>
        </main>

        <aside className='builderSidebar builderSettings'>
          <div className='settingsTabs'>
            <button type='button' className={activeRightTab === 'component' ? 'active' : ''} onClick={() => setActiveRightTab('component')}>Component</button>
            <button type='button' className={activeRightTab === 'settings' ? 'active' : ''} onClick={() => setActiveRightTab('settings')}>{isEmail ? 'Email' : 'Page'} Settings</button>
          </div>
          {activeRightTab === 'component' ? (
            isEmail ? <EmailProperties selected={selected} /> : <FormProperties />
          ) : isEmail ? (
            <div className='propertyPanel'>
              <Property label='Subject' value={subject} onChange={setSubject} />
              <Property label='Preheader' value={preheader} onChange={setPreheader} />
              <Property label='From Name' value='Maya at Marketo Next' />
              <Property label='Reply-to Email' value='hello@marketonext.com' />
              <label className='propertyField'>Audience<select><option>Q3 Launch Audience</option><option>All MQLs</option></select></label>
              <button type='button' className='scheduleLink'>◷ Schedule Send</button>
            </div>
          ) : (
            <div className='propertyPanel'>
              <Property label='URL Slug' value={slug} onChange={setSlug} prefix='marketonext.com/' />
              <label className='propertyField'>Domain<select><option>www.marketonext.com</option><option>go.marketonext.com</option></select></label>
              <Property label='SEO Title' value='Enterprise Marketing Automation Demo' />
              <label className='propertyField'>Meta Description<textarea defaultValue='See how Marketo Next unifies data, content, and customer journeys.' /></label>
              <label className='toggleProperty'><span>Allow search indexing</span><input type='checkbox' className='toggleSwitch' defaultChecked /></label>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}

function Property({ label, value, onChange, prefix }: { label: string; value: string; onChange?: (value: string) => void; prefix?: string }) {
  return <label className='propertyField'>{label}<div className='propertyInput'>{prefix && <span>{prefix}</span>}<input value={value} onChange={(event) => onChange?.(event.target.value)} readOnly={!onChange} /></div></label>
}

function EmailProperties({ selected }: { selected: string }) {
  return <div className='propertyPanel'><div className='selectedComponentLabel'><span>▰</span><div><strong>{selected}</strong><small>Content block</small></div></div><Property label='Button Text' value='Explore what’s new' /><Property label='Link URL' value='https://marketo.com/product' /><label className='propertyField'>Alignment<select><option>Center</option><option>Left</option><option>Right</option></select></label><div className='propertySplit'><Property label='Width' value='180 px' /><Property label='Radius' value='6 px' /></div><label className='colorProperty'>Background color<span><i />#D97757</span></label><label className='propertyField'>Spacing<input type='range' min='0' max='48' defaultValue='24' /></label></div>
}

function FormProperties() {
  const [progressive, setProgressive] = useState(true)
  return <div className='propertyPanel formProperties'><div className='selectedComponentLabel'><span>☷</span><div><strong>Lead Form</strong><small>4 fields · CRM connected</small></div></div><h4>Form Fields</h4>{['Work Email', 'First Name', 'Company', 'Job Title'].map((field, index) => <div className='mappedField' key={field}><span>⋮⋮</span><div><strong>{field}</strong><small>{index === 0 ? 'Required' : 'Optional'}</small></div><em>CRM linked</em></div>)}<button type='button' className='addFieldButton'>+ Add field</button><label className='toggleProperty'><span><strong>Progressive profiling</strong><small>Show fields based on known data</small></span><input type='checkbox' className='toggleSwitch' checked={progressive} onChange={(event) => setProgressive(event.target.checked)} /></label><button type='button' className='button outline accent fullButton'>+ Add profiling rule</button><h4>CRM Field Mapping</h4><label className='propertyField'>Email<select><option>Person.Email</option></select></label><label className='propertyField'>Company<select><option>Account.Name</option></select></label><label className='colorProperty'>Submit button color<span><i />#D97757</span></label></div>
}
