import { useState } from 'react'

interface ScheduleEditorProps {
  variant: 'smart-campaign' | 'email-program'
  active: boolean
  onActivate: () => void
}

export function ScheduleEditor({ variant, active, onActivate }: ScheduleEditorProps) {
  const isEmail = variant === 'email-program'
  const [mode, setMode] = useState<'trigger' | 'batch'>(isEmail ? 'batch' : 'trigger')
  const [recurrence, setRecurrence] = useState('None')
  const [reentry, setReentry] = useState(false)
  const [batchRule, setBatchRule] = useState('new')

  return <div className='phase2Schedule'>
    <header><div><h3>Campaign Schedule</h3><p>Control when this program runs and how often people can qualify.</p></div>{!isEmail && <div className='phase2ModeToggle'><button type='button' className={mode === 'trigger' ? 'active' : ''} onClick={() => setMode('trigger')}>Trigger</button><button type='button' className={mode === 'batch' ? 'active' : ''} onClick={() => setMode('batch')}>Batch</button></div>} {isEmail && <span className='batchProgramTag'>Batch Email Program</span>}</header>
    <div className='scheduleContentGrid'>
      <section className='schedulePrimaryCard'><header><span>{mode === 'trigger' ? '⚡' : '▦'}</span><div><strong>{mode === 'trigger' ? 'Real-time Trigger' : 'Batch Schedule'}</strong><small>{mode === 'trigger' ? 'Runs whenever a person qualifies' : 'Runs at a configured date and time'}</small></div></header>{mode === 'trigger' ? <div className='triggerScheduleMessage'><span>✓</span><div><strong>This campaign runs in real-time when the trigger event occurs.</strong><p>No schedule is needed. Activate the campaign when the Smart List and Flow are ready.</p></div></div> : <div className='batchScheduleFields'><label>Start Date<input type='date' defaultValue='2026-08-01' /></label><label>Time<input type='time' defaultValue='09:00' /></label><label>Timezone<select><option>America/Los_Angeles (PDT)</option><option>America/New_York (EDT)</option><option>Europe/London (BST)</option><option>Asia/Kolkata (IST)</option></select></label><label>Recurrence<select value={recurrence} onChange={(event) => setRecurrence(event.target.value)}><option>None</option><option>Daily</option><option>Weekly</option><option>Monthly</option><option>Custom</option></select></label>{recurrence !== 'None' && <div className='recurrenceSummary'><span>↻</span><p>Repeats {recurrence.toLowerCase()} beginning August 1, 2026 at 9:00 AM PDT.</p></div>}</div>}</section>
      {!isEmail && <section className='qualificationRulesCard'><header><span>☷</span><div><strong>{mode === 'trigger' ? 'Re-entry Rules' : 'Qualification Rules'}</strong><small>Control whether the same person can qualify again</small></div></header>{mode === 'batch' ? <div className='qualificationRadios'><label className={batchRule === 'new' ? 'selected' : ''}><input type='radio' name='batch-rule' checked={batchRule === 'new'} onChange={() => setBatchRule('new')} /><span><strong>Only include new people who meet the entry criteria</strong><small>People already processed by this campaign will be skipped on future runs.</small></span></label><label className={batchRule === 'all' ? 'selected' : ''}><input type='radio' name='batch-rule' checked={batchRule === 'all'} onChange={() => setBatchRule('all')} /><span><strong>Include all people who meet the criteria each time</strong><small>Qualified people can be processed again on every scheduled run.</small></span></label></div> : <div className='reentrySettings'><label className='phase2ToggleRow'><span><strong>Allow re-entry</strong><small>Let people enter again after completing the campaign</small></span><input type='checkbox' className='toggleSwitch' checked={reentry} onChange={(event) => setReentry(event.target.checked)} /></label>{reentry && <label className='phase2Field'>Frequency<select><option>Once per person</option><option>Once per trigger event</option><option>Unlimited</option></select><small>“Once per trigger event” allows a person to qualify for each unique triggering activity.</small></label>}</div>}</section>}
      {isEmail && <section className='emailScheduleNote'><span>✉</span><div><strong>Email programs run as a batch.</strong><p>Everyone matching the Smart List at send time receives the selected email once.</p></div></section>}
    </div>
    <footer className='scheduleActivationFooter'><div><span className={active ? 'active' : 'draft'} /><p><strong>{active ? 'Program is active' : 'Ready to activate?'}</strong><small>{active ? 'The campaign will run using this schedule.' : 'Validation checks Smart List, Flow, and schedule settings.'}</small></p></div><button type='button' className={`button ${active ? 'deactivateButton' : 'solid'}`} onClick={onActivate}>{active ? 'Deactivate Program' : 'Activate Program'}</button></footer>
  </div>
}
