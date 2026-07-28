import { useState } from 'react'
import { defaultEventDetails, defaultTokensForProgramType } from '../../data/programsData'
import { programAssetFolderLabels } from '../../data/programsData'
import type { ProgramAssetFolderKey, ProgramEventDetails, ProgramRecord, ProgramToken } from '../../types/programs'

interface ProgramSettingsPanelProps {
  program: ProgramRecord
  onClose: () => void
  onSave: (program: ProgramRecord) => void
}

const timezones = ['America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York', 'Europe/London', 'Europe/Madrid', 'Asia/Kolkata', 'Asia/Singapore', 'Australia/Sydney', 'UTC']
const smartLists = ['Global Suppression List', 'Customers', 'Competitors', 'Employees', 'Unsubscribed People', 'Event Attendees']

export function ProgramSettingsPanel({ program, onClose, onSave }: ProgramSettingsPanelProps) {
  const [draft, setDraft] = useState<ProgramRecord>(() => ({
    ...structuredClone(program),
    tags: program.tags ?? [],
    tokens: program.tokens ?? defaultTokensForProgramType(program.type, program.name),
    eventDetails: program.type === 'Event' ? program.eventDetails ?? defaultEventDetails(program.name) : program.eventDetails,
    communicationLimits: program.communicationLimits ?? { perDay: 1, perWeek: 3 },
    exclusionSmartList: program.exclusionSmartList ?? '',
    pauseOnEngagement: program.pauseOnEngagement ?? false,
  }))
  const [newTokenOpen, setNewTokenOpen] = useState(false)
  const [newToken, setNewToken] = useState<Omit<ProgramToken, 'id'>>({ name: '', type: 'Text', defaultValue: '' })
  const supportsCommunicationLimits = draft.type === 'Simple Email' || draft.type === 'Nurture' || draft.convertedToNurture
  const supportsNurtureSettings = draft.type === 'Nurture' || draft.convertedToNurture

  function updateToken(tokenId: string, updates: Partial<ProgramToken>) {
    setDraft((current) => ({ ...current, tokens: current.tokens?.map((token) => token.id === tokenId ? { ...token, ...updates } : token) }))
  }

  function updateAutomaticToken(name: string, defaultValue: string) {
    setDraft((current) => ({ ...current, tokens: (current.tokens ?? []).map((token) => token.name === name ? { ...token, defaultValue } : token) }))
  }

  function updateEvent(field: keyof ProgramEventDetails, value: string | number | boolean) {
    setDraft((current) => ({ ...current, eventDetails: { ...(current.eventDetails ?? defaultEventDetails(current.name)), [field]: value } }))
    if (field === 'eventName') updateAutomaticToken('EventName', String(value))
    if (field === 'startAt') updateAutomaticToken('EventDate', String(value))
    if (field === 'endAt') updateAutomaticToken('EventEndDate', String(value))
    if (field === 'venueDescription') updateAutomaticToken('EventVenue', String(value).split('\n')[0])
  }

  function toggleAssetFolder(folder: ProgramAssetFolderKey, enabled: boolean) {
    setDraft((current) => ({ ...current, enabledAssetFolders: enabled ? [...current.enabledAssetFolders, folder] : current.enabledAssetFolders.filter((value) => value !== folder) }))
  }

  function addToken() {
    if (!newToken.name.trim()) return
    setDraft((current) => ({ ...current, tokens: [...(current.tokens ?? []), { ...newToken, id: `program-token-${Date.now()}`, name: newToken.name.trim() }] }))
    setNewToken({ name: '', type: 'Text', defaultValue: '' })
    setNewTokenOpen(false)
  }

  return <div className='programSettingsScrim' onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <aside className='programSettingsPanel'>
      <header><div><span>⚙</span><div><strong>Program Settings</strong><small>{draft.name}</small></div></div><button type='button' onClick={onClose} aria-label='Close Program Settings'>×</button></header>
      <div className='programSettingsPanelBody'>
        <section className='programSettingsSection'>
          <header><strong>General</strong><small>Identity and organization</small></header>
          <label>Program Name<input value={draft.name} onChange={(event) => { const name = event.target.value; setDraft((current) => ({ ...current, name })); updateAutomaticToken('ProgramName', name) }} /></label>
          <label>Description<textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder='Describe this program…' /></label>
          <label>Tags<input value={(draft.tags ?? []).join(', ')} onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) }))} placeholder='Nurture, Product, Enterprise' /><small>Separate tags with commas.</small></label>
        </section>

        <section className='programSettingsSection tokenSettingsSection'>
          <header><div><strong>Tokens</strong><small>Available in assets and Flow steps as <code>{'{{my.TokenName}}'}</code>.</small></div><button type='button' onClick={() => setNewTokenOpen((open) => !open)}>+ Add Token</button></header>
          {newTokenOpen && <div className='newProgramToken'><input value={newToken.name} onChange={(event) => setNewToken((current) => ({ ...current, name: event.target.value.replaceAll(/\s+/g, '') }))} placeholder='TokenName' /><select value={newToken.type} onChange={(event) => setNewToken((current) => ({ ...current, type: event.target.value as ProgramToken['type'] }))}><option>Text</option><option>Number</option><option>Date</option><option>DateTime</option><option>Boolean</option></select><input value={newToken.defaultValue} onChange={(event) => setNewToken((current) => ({ ...current, defaultValue: event.target.value }))} placeholder='Default value' /><button type='button' disabled={!newToken.name.trim()} onClick={addToken}>Add</button></div>}
          <div className='programTokenList'>{draft.tokens?.map((token) => <div key={token.id}><code>{`{{my.${token.name}}}`}</code><select value={token.type} disabled={token.automatic} onChange={(event) => updateToken(token.id, { type: event.target.value as ProgramToken['type'] })}><option>Text</option><option>Number</option><option>Date</option><option>DateTime</option><option>Boolean</option></select><input value={token.defaultValue} onChange={(event) => updateToken(token.id, { defaultValue: event.target.value })} /><button type='button' disabled={token.automatic} onClick={() => setDraft((current) => ({ ...current, tokens: current.tokens?.filter((item) => item.id !== token.id) }))}>{token.automatic ? 'Auto' : '×'}</button></div>)}</div>
        </section>

        <section className='programSettingsSection assetFolderSettings'>
          <header><strong>Asset Folders</strong><small>Hidden folders are removed from the tree and Flow asset pickers.</small></header>
          {(Object.keys(programAssetFolderLabels) as ProgramAssetFolderKey[]).map((folder) => <label key={folder}><span><strong>{programAssetFolderLabels[folder]}</strong><small>{draft.assets.filter((asset) => asset.folder === folder).length} existing assets</small></span><input type='checkbox' checked={draft.enabledAssetFolders.includes(folder)} onChange={(event) => toggleAssetFolder(folder, event.target.checked)} /></label>)}
        </section>

        {draft.type === 'Event' && draft.eventDetails && <section className='programSettingsSection eventDetailsSettings'>
          <header><strong>Event Details</strong><small>Updates automatic Event tokens used by assets and Flow waits.</small></header>
          <label>Event Name<input value={draft.eventDetails.eventName} onChange={(event) => updateEvent('eventName', event.target.value)} /></label>
          <div className='eventSettingsDates'><label>Start Date & Time<input type='datetime-local' value={draft.eventDetails.startAt} onChange={(event) => updateEvent('startAt', event.target.value)} /></label><label>End Date & Time<input type='datetime-local' value={draft.eventDetails.endAt} onChange={(event) => updateEvent('endAt', event.target.value)} /></label></div>
          <label>Timezone<select value={draft.eventDetails.timezone} onChange={(event) => updateEvent('timezone', event.target.value)}>{timezones.map((timezone) => <option key={timezone}>{timezone}</option>)}</select></label>
          <div className='eventCapacitySettings'><label>Capacity<input type='number' min='1' value={draft.eventDetails.capacity} onChange={(event) => updateEvent('capacity', Number(event.target.value))} /></label><label className='eventWaitlistSetting'><span><strong>Enable Waitlist</strong><small>Hold registrations after capacity is reached.</small></span><input type='checkbox' checked={draft.eventDetails.waitlist} onChange={(event) => updateEvent('waitlist', event.target.checked)} /></label></div>
          <label>Venue / Description<div className='settingsRichToolbar'><button type='button'><strong>B</strong></button><button type='button'><em>I</em></button><button type='button'>• List</button><button type='button'>Link</button></div><textarea className='settingsRichText' value={draft.eventDetails.venueDescription} onChange={(event) => updateEvent('venueDescription', event.target.value)} /></label>
        </section>}

        {supportsCommunicationLimits && <section className='programSettingsSection'>
          <header><strong>Communication Limits</strong><small>Maximum emails sent to each person.</small></header>
          <div className='communicationLimitFields'><label>Per Day<input type='number' min='0' value={draft.communicationLimits?.perDay ?? 1} onChange={(event) => setDraft((current) => ({ ...current, communicationLimits: { ...(current.communicationLimits ?? { perDay: 1, perWeek: 3 }), perDay: Number(event.target.value) } }))} /></label><label>Per Week<input type='number' min='0' value={draft.communicationLimits?.perWeek ?? 3} onChange={(event) => setDraft((current) => ({ ...current, communicationLimits: { ...(current.communicationLimits ?? { perDay: 1, perWeek: 3 }), perWeek: Number(event.target.value) } }))} /></label></div>
        </section>}

        {supportsNurtureSettings && <section className='programSettingsSection nurtureSettingsSection'>
          <header><strong>Nurture Controls</strong><small>Audience exclusion and content exhaustion behavior.</small></header>
          <label>Exclusion Smart List<select value={draft.exclusionSmartList ?? ''} onChange={(event) => setDraft((current) => ({ ...current, exclusionSmartList: event.target.value }))}><option value=''>No exclusion list</option>{smartLists.map((list) => <option key={list}>{list}</option>)}</select></label>
          <label className='pauseEngagementSetting'><span><strong>Pause on person engagement</strong><small>Exhaust content when the person interacts with the Stream.</small></span><input type='checkbox' checked={draft.pauseOnEngagement ?? false} onChange={(event) => setDraft((current) => ({ ...current, pauseOnEngagement: event.target.checked }))} /></label>
        </section>}
      </div>
      <footer><button type='button' className='button ghost' onClick={onClose}>Cancel</button><button type='button' className='button solid' onClick={() => onSave(draft)}>Save Settings</button></footer>
    </aside>
  </div>
}
