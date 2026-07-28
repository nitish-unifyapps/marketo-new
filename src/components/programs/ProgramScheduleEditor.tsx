import { useState } from 'react'
import { defaultScheduleForProgramType } from '../../data/programsData'
import type { ProgramRecord, ProgramScheduleConfig, ProgramScheduleMode } from '../../types/programs'

interface ProgramScheduleEditorProps {
  program: ProgramRecord
  onChange: (schedule: ProgramScheduleConfig) => void
  onActivate: () => void
}

const timezones = ['America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York', 'Europe/London', 'Europe/Madrid', 'Asia/Kolkata', 'Asia/Singapore', 'Australia/Sydney', 'UTC']

export function ProgramScheduleEditor({ program, onChange, onActivate }: ProgramScheduleEditorProps) {
  const [qualificationOpen, setQualificationOpen] = useState(true)
  const schedule = program.schedule ?? defaultScheduleForProgramType(program.type)
  const batchOnly = program.type === 'Simple Email' || program.type === 'Nurture' || program.convertedToNurture
  const availableModes: ProgramScheduleMode[] = batchOnly ? ['batch'] : ['trigger', 'batch']

  function update(updates: Partial<ProgramScheduleConfig>) {
    onChange({ ...schedule, ...updates })
  }

  return <div className='programScheduleEditor'>
    <header className='programScheduleHeader'>
      <div><h2>Schedule</h2><p>Control when this program runs and how people can qualify again.</p></div>
      {!batchOnly ? <div className='programScheduleMode' role='group' aria-label='Schedule mode'>{availableModes.map((mode) => <button type='button' key={mode} className={schedule.mode === mode ? 'active' : ''} onClick={() => update({ mode })} aria-pressed={schedule.mode === mode}>{mode === 'trigger' ? 'Trigger' : 'Batch'}</button>)}</div> : <span className='programScheduleFixedMode'>Batch campaign</span>}
    </header>

    {schedule.mode === 'batch' || batchOnly ? <div className='programScheduleCards'>
      <section className='programScheduleCard'>
        <header><span>◷</span><div><strong>Run Schedule</strong><small>Choose a start time and recurrence.</small></div></header>
        <div className='programScheduleFields'>
          <label>Start Date & Time<input type='datetime-local' value={schedule.startAt} onChange={(event) => update({ startAt: event.target.value })} /></label>
          <label>Recurrence<select value={schedule.recurrence} onChange={(event) => update({ recurrence: event.target.value as ProgramScheduleConfig['recurrence'] })}><option>None (once)</option><option>Daily</option><option>Weekly</option><option>Monthly</option><option>Custom (cron)</option></select></label>
          {schedule.recurrence === 'Custom (cron)' && <label className='scheduleCronField'>Cron Expression<input value={schedule.cron} onChange={(event) => update({ cron: event.target.value })} placeholder='0 9 * * 1-5' /><small>Minute Hour Day Month Weekday</small></label>}
          <label>Timezone<select value={schedule.timezone} onChange={(event) => update({ timezone: event.target.value })}>{timezones.map((timezone) => <option key={timezone}>{timezone}</option>)}</select></label>
        </div>
      </section>

      <section className={`programScheduleCard qualificationCard ${qualificationOpen ? 'open' : ''}`}>
        <button type='button' className='scheduleCardToggle' onClick={() => setQualificationOpen((open) => !open)}><span>✓</span><div><strong>Qualification Rules</strong><small>Determine who is included on each run.</small></div><i title='Qualification is evaluated immediately before each Batch run.'>?</i><em>{qualificationOpen ? '⌃' : '⌄'}</em></button>
        {qualificationOpen && <div className='qualificationOptions'>
          <label><input type='radio' name='qualification' checked={schedule.qualificationMode === 'new-only'} onChange={() => update({ qualificationMode: 'new-only' })} /><span><strong>Only include new people who meet the entry criteria</strong><small>People already processed by this program are excluded.</small></span></label>
          <label><input type='radio' name='qualification' checked={schedule.qualificationMode === 'all-each-run'} onChange={() => update({ qualificationMode: 'all-each-run' })} /><span><strong>Include all people each time the campaign runs</strong><small>Everyone matching Segment criteria is eligible on every run.</small></span></label>
        </div>}
      </section>
    </div> : <div className='programScheduleCards triggerScheduleCards'>
      <section className='programScheduleCard reentryCard'>
        <header><span>↻</span><div><strong>Re-entry Rules</strong><small>Control whether a person can enter this trigger campaign again.</small></div></header>
        <div className='reentryControl'>
          <label><span><strong>Allow re-entry</strong><small>Let qualified people enter again after their first run.</small></span><input type='checkbox' checked={schedule.allowReentry} onChange={(event) => update({ allowReentry: event.target.checked })} /></label>
          {schedule.allowReentry && <label className='reentryModeField'>Re-entry Frequency<select value={schedule.reentryMode} onChange={(event) => update({ reentryMode: event.target.value as ProgramScheduleConfig['reentryMode'] })}><option>Once per person</option><option>Once per trigger event</option><option>Unlimited</option></select><small>Use “Once per trigger event” to process separate qualifying activities independently.</small></label>}
          {!schedule.allowReentry && <p>Each person can enter this program only once. Turn on re-entry to configure repeat qualification.</p>}
        </div>
      </section>
      <div className='triggerScheduleNote'><span>⚡</span><div><strong>This program runs when a Segment trigger fires.</strong><p>No date, recurrence, or timezone fields are required for Trigger mode.</p></div></div>
    </div>}

    <footer className='programScheduleFooter'><div><span className={schedule.active || program.status === 'Active' ? 'active' : ''} /><div><strong>{schedule.active || program.status === 'Active' ? 'Program is active' : 'Ready to activate?'}</strong><small>{schedule.mode === 'trigger' && !batchOnly ? 'People enter as trigger events occur.' : schedule.recurrence === 'None (once)' ? `Runs once on ${schedule.startAt || 'the selected date'}.` : `Runs ${schedule.recurrence.toLowerCase()} in ${schedule.timezone}.`}</small></div></div><button type='button' className='button solid' disabled={schedule.active || program.status === 'Active'} onClick={onActivate}>{schedule.active || program.status === 'Active' ? 'Active' : 'Activate'}</button></footer>
  </div>
}
