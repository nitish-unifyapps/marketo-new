import { useState } from 'react'
import type { ActivityNode, ProgramStatus } from '../MarketingActivitiesPhaseOne'
import { DefaultProgramAssets, DefaultProgramMembers, DefaultProgramOverview } from './DefaultProgramViews'
import { EmailProgramEmailTab } from './EmailProgramEmailTab'
import { FlowEditor } from './FlowEditor'
import { ResultsView } from './ResultsView'
import { ScheduleEditor } from './ScheduleEditor'
import { SmartListEditor } from './SmartListEditor'

type SmartCampaignTab = 'smart-list' | 'flow' | 'schedule' | 'results'
type EmailProgramTab = 'smart-list' | 'email' | 'schedule' | 'results'
type DefaultProgramTab = 'overview' | 'assets' | 'members'
type ProgramTab = SmartCampaignTab | EmailProgramTab | DefaultProgramTab

interface ProgramEditorProps {
  node: ActivityNode
  onRename: (name: string) => void
  onStatusChange: (status: ProgramStatus) => void
}

const typeLabels: Partial<Record<ActivityNode['type'], string>> = {
  'smart-campaign': 'Smart Campaign',
  'email-program': 'Email Program',
  'default-program': 'Default Program',
}

export function ProgramEditor({ node, onRename, onStatusChange }: ProgramEditorProps) {
  const tabs: Array<{ key: ProgramTab; label: string }> = node.type === 'smart-campaign'
    ? [{ key: 'smart-list', label: 'Smart List' }, { key: 'flow', label: 'Flow' }, { key: 'schedule', label: 'Schedule' }, { key: 'results', label: 'Results' }]
    : node.type === 'email-program'
      ? [{ key: 'smart-list', label: 'Smart List' }, { key: 'email', label: 'Email' }, { key: 'schedule', label: 'Schedule' }, { key: 'results', label: 'Results' }]
      : [{ key: 'overview', label: 'Overview' }, { key: 'assets', label: 'Assets' }, { key: 'members', label: 'Members' }]
  const [activeTab, setActiveTab] = useState<ProgramTab>(tabs[0].key)
  const [name, setName] = useState(node.name)
  const [status, setStatus] = useState<ProgramStatus>(node.status ?? 'draft')
  const [settingsOpen, setSettingsOpen] = useState(false)

  function toggleActive() {
    const nextStatus: ProgramStatus = status === 'active' ? 'paused' : 'active'
    setStatus(nextStatus)
    onStatusChange(nextStatus)
  }

  function saveName() {
    if (name.trim() && name.trim() !== node.name) onRename(name.trim())
  }

  return <section className='phase2ProgramEditor'>
    <header className='programEditorHeader'>
      <div className='programTitleGroup'><input value={name} onChange={(event) => setName(event.target.value)} onBlur={saveName} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }} aria-label='Program name' /><span className='programTypeTag'>{typeLabels[node.type]}</span><span className={`editorProgramStatus status-${status}`}><i />{status[0].toUpperCase() + status.slice(1)}</span></div>
      <div className='programHeaderActions'><button type='button' className='programSettingsButton' title='Program Settings' onClick={() => setSettingsOpen(true)}>⚙</button><button type='button' className={`button ${status === 'active' ? 'deactivateButton' : 'solid'}`} onClick={toggleActive}>{status === 'active' ? 'Deactivate' : 'Activate'}</button></div>
    </header>
    <nav className='programEditorTabs' aria-label={`${typeLabels[node.type]} sections`}>{tabs.map((tab) => <button type='button' key={tab.key} className={activeTab === tab.key ? 'active' : ''} onClick={() => setActiveTab(tab.key)}>{tab.label}</button>)}</nav>
    <main className='programEditorBody'>{node.type === 'smart-campaign' ? <SmartCampaignContent tab={activeTab as SmartCampaignTab} active={status === 'active'} onActivate={toggleActive} /> : node.type === 'email-program' ? <EmailProgramContent tab={activeTab as EmailProgramTab} active={status === 'active'} onActivate={toggleActive} /> : <DefaultProgramContent tab={activeTab as DefaultProgramTab} name={name} onNameChange={(value) => { setName(value); onRename(value) }} />}</main>
    {settingsOpen && <ProgramSettingsPanel node={node} name={name} onClose={() => setSettingsOpen(false)} />}
  </section>
}

function SmartCampaignContent({ tab, active, onActivate }: { tab: SmartCampaignTab; active: boolean; onActivate: () => void }) {
  if (tab === 'smart-list') return <SmartListEditor />
  if (tab === 'flow') return <FlowEditor />
  if (tab === 'schedule') return <ScheduleEditor variant='smart-campaign' active={active} onActivate={onActivate} />
  return <ResultsView variant='smart-campaign' />
}

function EmailProgramContent({ tab, active, onActivate }: { tab: EmailProgramTab; active: boolean; onActivate: () => void }) {
  if (tab === 'smart-list') return <SmartListEditor filterOnly />
  if (tab === 'email') return <EmailProgramEmailTab />
  if (tab === 'schedule') return <ScheduleEditor variant='email-program' active={active} onActivate={onActivate} />
  return <ResultsView variant='email-program' />
}

function DefaultProgramContent({ tab, name, onNameChange }: { tab: DefaultProgramTab; name: string; onNameChange: (name: string) => void }) {
  if (tab === 'overview') return <DefaultProgramOverview name={name} onNameChange={onNameChange} />
  if (tab === 'assets') return <DefaultProgramAssets />
  return <DefaultProgramMembers />
}

function ProgramSettingsPanel({ node, name, onClose }: { node: ActivityNode; name: string; onClose: () => void }) {
  return <><div className='programSettingsScrim' onClick={onClose} /><aside className='phase2ProgramSettings'><header><div><span>⚙</span><div><strong>Program Settings</strong><small>{name}</small></div></div><button type='button' onClick={onClose}>×</button></header><div className='phase2SettingsBody'><section><h4>General</h4><label>Program ID<input value={`PRG-${node.id.replace(/\D/g, '') || '10482'}`} readOnly /></label><label>Workspace<select><option>Default Workspace</option><option>Enterprise Marketing</option></select></label><label>Folder<select><option>Marketing Activities / Lifecycle</option><option>Marketing Activities / Demand Generation</option></select></label></section><section><h4>Communication Limits</h4><label className='phase2ToggleRow'><span><strong>Respect communication limits</strong><small>Skip people who exceeded frequency limits</small></span><input type='checkbox' className='toggleSwitch' defaultChecked /></label><label>Priority<select><option>Normal</option><option>Operational — ignore limits</option><option>Low</option></select></label></section><section><header><h4>Program Tokens</h4><button type='button'>＋ Add</button></header>{['{{my.ProgramName}}', '{{my.OwnerName}}', '{{my.ReplyTo}}'].map((token) => <div className='settingsTokenRow' key={token}><code>{token}</code><button type='button'>✎</button></div>)}</section><section><h4>Advanced</h4><label className='phase2ToggleRow'><span><strong>Block non-operational emails</strong><small>Honor unsubscribe and marketing suspension</small></span><input type='checkbox' className='toggleSwitch' defaultChecked /></label><button type='button' className='button outline accent fullButton'>Manage Custom Statuses</button></section></div><footer><button type='button' className='button ghost' onClick={onClose}>Cancel</button><button type='button' className='button solid' onClick={onClose}>Save Settings</button></footer></aside></>
}
