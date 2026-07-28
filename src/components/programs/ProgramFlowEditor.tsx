import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Modal } from '../common/Modal'
import { createProgramFlowStep, defaultFlowStepsForProgramType, flowStepPalette, flowStepSummary, flowTokenGroups } from '../../data/programFlowData'
import type { ProgramFlowBranch, ProgramFlowStep, ProgramFlowStepType, ProgramRecord, ProgramStreamTransitionRule, ProgramToken } from '../../types/programs'

interface ProgramFlowEditorProps {
  program: ProgramRecord
  onChange: (steps: ProgramFlowStep[]) => void
  onConvertToNurture: () => void
  onEditAsset: (assetId: string) => void
}

type FlowContextMenu = { kind: 'stream' | 'email'; stepId: string; x: number; y: number }

function findStep(steps: ProgramFlowStep[], stepId: string): ProgramFlowStep | undefined {
  for (const step of steps) {
    if (step.id === stepId) return step
    const child = findStep(step.children ?? [], stepId)
    if (child) return child
    for (const branch of step.branches ?? []) {
      const nested = findStep(branch.steps, stepId)
      if (nested) return nested
    }
  }
  return undefined
}

function updateStepTree(steps: ProgramFlowStep[], stepId: string, updater: (step: ProgramFlowStep) => ProgramFlowStep): ProgramFlowStep[] {
  return steps.map((step) => {
    if (step.id === stepId) return updater(step)
    return {
      ...step,
      children: step.children ? updateStepTree(step.children, stepId, updater) : step.children,
      branches: step.branches?.map((branch) => ({ ...branch, steps: updateStepTree(branch.steps, stepId, updater) })),
    }
  })
}

function deleteStepTree(steps: ProgramFlowStep[], stepId: string): ProgramFlowStep[] {
  return steps.filter((step) => step.id !== stepId).map((step) => ({ ...step, children: step.children ? deleteStepTree(step.children, stepId) : step.children, branches: step.branches?.map((branch) => ({ ...branch, steps: deleteStepTree(branch.steps, stepId) })) }))
}

function moveStepTree(steps: ProgramFlowStep[], stepId: string, direction: -1 | 1): ProgramFlowStep[] {
  const index = steps.findIndex((step) => step.id === stepId)
  if (index >= 0) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= steps.length) return steps
    const next = [...steps]
    const [moved] = next.splice(index, 1)
    next.splice(nextIndex, 0, moved)
    return next
  }
  return steps.map((step) => ({ ...step, children: step.children ? moveStepTree(step.children, stepId, direction) : step.children, branches: step.branches?.map((branch) => ({ ...branch, steps: moveStepTree(branch.steps, stepId, direction) })) }))
}

function reorderStepTree(steps: ProgramFlowStep[], draggedId: string, targetId: string): { steps: ProgramFlowStep[]; moved: boolean } {
  const draggedIndex = steps.findIndex((step) => step.id === draggedId)
  const targetIndex = steps.findIndex((step) => step.id === targetId)
  if (draggedIndex >= 0 && targetIndex >= 0) {
    const next = [...steps]
    const [moved] = next.splice(draggedIndex, 1)
    next.splice(targetIndex, 0, moved)
    return { steps: next, moved: true }
  }

  let moved = false
  const next = steps.map((step) => {
    if (moved) return step
    if (step.children) {
      const childResult = reorderStepTree(step.children, draggedId, targetId)
      if (childResult.moved) {
        moved = true
        return { ...step, children: childResult.steps }
      }
    }
    if (!step.branches) return step
    const branches = step.branches.map((branch) => {
      if (moved) return branch
      const result = reorderStepTree(branch.steps, draggedId, targetId)
      moved = result.moved
      return result.moved ? { ...branch, steps: result.steps } : branch
    })
    return moved ? { ...step, branches } : step
  })
  return { steps: next, moved }
}

function collectBranchIds(steps: ProgramFlowStep[]): string[] {
  return steps.flatMap((step) => [...collectBranchIds(step.children ?? []), ...(step.branches?.map((branch) => branch.id) ?? []), ...(step.branches?.flatMap((branch) => collectBranchIds(branch.steps)) ?? [])])
}

function insertBeforeEnd(steps: ProgramFlowStep[], step: ProgramFlowStep) {
  const endIndex = steps.findIndex((item) => item.type === 'End')
  if (endIndex < 0) return [...steps, step]
  const next = [...steps]
  next.splice(endIndex, 0, step)
  return next
}

function flattenFlowSteps(steps: ProgramFlowStep[]): ProgramFlowStep[] {
  return steps.flatMap((step) => [step, ...flattenFlowSteps(step.children ?? []), ...(step.branches?.flatMap((branch) => flattenFlowSteps(branch.steps)) ?? [])])
}

function cloneFlowStepWithIds(step: ProgramFlowStep, makeId: () => string): ProgramFlowStep {
  return {
    ...structuredClone(step),
    id: makeId(),
    children: step.children?.map((child) => cloneFlowStepWithIds(child, makeId)),
    branches: step.branches?.map((branch) => ({ ...structuredClone(branch), id: makeId(), steps: branch.steps.map((child) => cloneFlowStepWithIds(child, makeId)) })),
    transitionRules: step.transitionRules?.map((rule) => ({ ...rule, id: makeId() })),
  }
}

function wrapEmailStep(steps: ProgramFlowStep[], emailId: string, includePrecedingWaits: boolean, streamId: string): { steps: ProgramFlowStep[]; wrapped: boolean } {
  const emailIndex = steps.findIndex((step) => step.id === emailId && step.type === 'Send Email')
  if (emailIndex >= 0) {
    let startIndex = emailIndex
    if (includePrecedingWaits) {
      while (startIndex > 0 && steps[startIndex - 1].type === 'Wait') startIndex -= 1
    }
    const wrappedSteps = steps.slice(startIndex, emailIndex + 1)
    const firstWait = wrappedSteps.find((step) => step.type === 'Wait')
    const stream = createProgramFlowStep('Stream', streamId)
    stream.config = {
      streamName: `${String(wrappedSteps.find((step) => step.type === 'Send Email')?.config.emailName || 'New')} Stream`,
      cadenceInterval: firstWait ? Number(firstWait.config.duration ?? 3) : 0,
      cadenceUnit: firstWait ? String(firstWait.config.unit ?? 'days') : 'immediately',
      cadenceTime: '09:00',
    }
    stream.children = wrappedSteps
    stream.transitionRules = []
    return { steps: [...steps.slice(0, startIndex), stream, ...steps.slice(emailIndex + 1)], wrapped: true }
  }

  let wrapped = false
  const next = steps.map((step) => {
    if (wrapped) return step
    if (step.children) {
      const result = wrapEmailStep(step.children, emailId, includePrecedingWaits, streamId)
      if (result.wrapped) {
        wrapped = true
        return { ...step, children: result.steps }
      }
    }
    if (step.branches) {
      const branches = step.branches.map((branch) => {
        if (wrapped) return branch
        const result = wrapEmailStep(branch.steps, emailId, includePrecedingWaits, streamId)
        if (result.wrapped) wrapped = true
        return result.wrapped ? { ...branch, steps: result.steps } : branch
      })
      if (wrapped) return { ...step, branches }
    }
    return step
  })
  return { steps: next, wrapped }
}

function insertStepAfter(steps: ProgramFlowStep[], targetId: string, newStep: ProgramFlowStep): { steps: ProgramFlowStep[]; inserted: boolean } {
  const index = steps.findIndex((step) => step.id === targetId)
  if (index >= 0) {
    const next = [...steps]
    next.splice(index + 1, 0, newStep)
    return { steps: next, inserted: true }
  }
  let inserted = false
  const next = steps.map((step) => {
    if (inserted) return step
    if (step.children) {
      const result = insertStepAfter(step.children, targetId, newStep)
      if (result.inserted) {
        inserted = true
        return { ...step, children: result.steps }
      }
    }
    if (step.branches) {
      const branches = step.branches.map((branch) => {
        if (inserted) return branch
        const result = insertStepAfter(branch.steps, targetId, newStep)
        if (result.inserted) inserted = true
        return result.inserted ? { ...branch, steps: result.steps } : branch
      })
      if (inserted) return { ...step, branches }
    }
    return step
  })
  return { steps: next, inserted }
}

function precedingWaitCount(steps: ProgramFlowStep[], emailId: string): number {
  const index = steps.findIndex((step) => step.id === emailId)
  if (index >= 0) {
    let count = 0
    for (let cursor = index - 1; cursor >= 0 && steps[cursor].type === 'Wait'; cursor -= 1) count += 1
    return count
  }
  for (const step of steps) {
    const childCount = precedingWaitCount(step.children ?? [], emailId)
    if (childCount) return childCount
    for (const branch of step.branches ?? []) {
      const branchCount = precedingWaitCount(branch.steps, emailId)
      if (branchCount) return branchCount
    }
  }
  return 0
}

function flowStepIcon(type: ProgramFlowStepType) {
  return flowStepPalette.find((item) => item.type === type)?.icon ?? '◇'
}

function routerBranchCondition(branch: ProgramFlowBranch) {
  if (branch.conditionField && branch.conditionOperator && branch.conditionValue) return `${branch.conditionField} ${branch.conditionOperator} ${branch.conditionValue}`
  return branch.condition
}

function TokenPicker({ onSelect, label = 'Insert Token', programTokens = [] }: { onSelect: (token: string) => void; label?: string; programTokens?: ProgramToken[] }) {
  const [open, setOpen] = useState(false)
  const groups = programTokens.length ? [{ name: 'Program Tokens', tokens: programTokens.map((token) => `{{my.${token.name}}}`) }, ...flowTokenGroups.filter((group) => group.name !== 'Program Tokens')] : flowTokenGroups
  return <div className='flowTokenPicker'><button type='button' onClick={() => setOpen((value) => !value)}>{label}</button>{open && <div className='flowTokenPopover'>{groups.map((group) => <section key={group.name}><strong>{group.name}</strong>{group.tokens.map((token) => <button type='button' key={token} onClick={() => { onSelect(token); setOpen(false) }}>{token}</button>)}</section>)}</div>}</div>
}

function StepConfigurationPanel({ program, step, streamOptions, onClose, onUpdate, onEditAsset }: { program: ProgramRecord; step: ProgramFlowStep; streamOptions: Array<{ id: string; name: string }>; onClose: () => void; onUpdate: (updater: (step: ProgramFlowStep) => ProgramFlowStep) => void; onEditAsset: (assetId: string) => void }) {
  const localEmails = program.enabledAssetFolders.includes('emails') ? program.assets.filter((asset) => asset.type === 'Email') : []
  const globalEmails = ['Event Reminder', 'Thank You', 'Event Replay', 'Global Newsletter Template', 'Corporate Product Update', 'Customer Success Digest']
  const [emailMenuOpen, setEmailMenuOpen] = useState(false)
  const selectedEmailName = String(step.config.emailName ?? '')
  const hasSelectedEmail = Boolean(selectedEmailName && selectedEmailName !== 'Select an email')
  const selectedLocalEmail = localEmails.find((email) => email.name === selectedEmailName)

  function updateConfig(updates: Record<string, string | number | boolean>) {
    onUpdate((current) => ({ ...current, config: { ...current.config, ...updates } }))
  }

  function updateBranches(updater: (branches: ProgramFlowBranch[]) => ProgramFlowBranch[]) {
    onUpdate((current) => ({ ...current, branches: updater(current.branches ?? []) }))
  }

  function updateTransitions(updater: (rules: ProgramStreamTransitionRule[]) => ProgramStreamTransitionRule[]) {
    onUpdate((current) => ({ ...current, transitionRules: updater(current.transitionRules ?? []) }))
  }

  return <aside className='flowConfigPanel'>
    <header><div><span>{flowStepIcon(step.type)}</span><div><strong>{step.type}</strong><small>Step configuration</small></div></div><button type='button' onClick={onClose} aria-label='Close configuration'>×</button></header>
    <div className='flowConfigBody'>
      {step.type === 'Send Email' && <>
        <div className='flowConfigField'>Email<div className='flowEmailPicker'><button type='button' className='flowEmailPickerButton' onClick={() => setEmailMenuOpen((open) => !open)}><span>✉</span><div><strong>{hasSelectedEmail ? selectedEmailName : 'Select an email'}</strong><small>{localEmails.some((email) => email.name === selectedEmailName) ? 'Local program asset' : hasSelectedEmail ? 'Global Content' : 'Local Assets or Global Content'}</small></div><em>⌄</em></button>{emailMenuOpen && <div className='flowEmailPickerMenu'>{localEmails.length > 0 && <section><strong>Local Assets</strong>{localEmails.map((email) => <button type='button' key={email.id} onClick={() => { updateConfig({ emailName: email.name }); setEmailMenuOpen(false) }}><span>✉</span><div><b>{email.name}</b><small>Local email</small></div></button>)}</section>}<section><strong>Global Content</strong>{globalEmails.map((email) => <button type='button' key={email} onClick={() => { updateConfig({ emailName: email }); setEmailMenuOpen(false) }}><span>✉</span><div><b>{email}</b><small>Global email</small></div></button>)}</section></div>}</div></div>
        {selectedLocalEmail && <button type='button' className='flowEditSelectedAsset' onClick={() => onEditAsset(selectedLocalEmail.id)}>✎ Edit selected email</button>}
        <label className='flowConfigField'>Personalization<input value={String(step.config.personalization ?? '')} onChange={(event) => updateConfig({ personalization: event.target.value })} placeholder='Optional token or note' /></label>
        <TokenPicker programTokens={program.tokens} onSelect={(token) => updateConfig({ personalization: `${String(step.config.personalization ?? '')}${String(step.config.personalization ?? '') ? ' ' : ''}${token}` })} />
        <label className='flowConfigField'>Suppression List <span>Optional</span><select value={String(step.config.suppressionList ?? '')} onChange={(event) => updateConfig({ suppressionList: event.target.value })}><option value=''>No suppression list</option><option>Global Unsubscribes</option><option>Competitors</option><option>Internal Employees</option></select></label>
      </>}

      {step.type === 'Wait' && <div className='flowWaitModes'>
        <label><input type='radio' name={`wait-${step.id}`} checked={step.config.waitMode === 'duration'} onChange={() => updateConfig({ waitMode: 'duration' })} /><span><strong>For a set duration</strong><small>Pause for a fixed amount of time</small></span></label>{step.config.waitMode === 'duration' && <div className='flowInlineFields'><input type='number' min='1' value={Number(step.config.duration ?? 3)} onChange={(event) => updateConfig({ duration: Number(event.target.value) })} /><select value={String(step.config.unit ?? 'days')} onChange={(event) => updateConfig({ unit: event.target.value })}><option>minutes</option><option>hours</option><option>days</option><option>weeks</option></select></div>}
        <label><input type='radio' name={`wait-${step.id}`} checked={step.config.waitMode === 'date'} onChange={() => updateConfig({ waitMode: 'date' })} /><span><strong>Until specific date/time</strong><small>Resume on a calendar date</small></span></label>{step.config.waitMode === 'date' && <input type='datetime-local' value={String(step.config.dateTime ?? '')} onChange={(event) => updateConfig({ dateTime: event.target.value })} />}
        <label><input type='radio' name={`wait-${step.id}`} checked={step.config.waitMode === 'dynamic'} onChange={() => updateConfig({ waitMode: 'dynamic' })} /><span><strong>Until dynamic date (token)</strong><small>Use a program or event token</small></span></label>{step.config.waitMode === 'dynamic' && <><label className='flowConfigField'>Date Token<input value={String(step.config.token ?? '{{my.EventDate}}')} onChange={(event) => updateConfig({ token: event.target.value })} /></label><TokenPicker programTokens={program.tokens} label='Choose Date Token' onSelect={(token) => updateConfig({ token })} /><label className='flowConfigField'>Offset<input value={String(step.config.offset ?? '')} onChange={(event) => updateConfig({ offset: event.target.value })} placeholder='e.g. minus 1 hour' /></label></>}
      </div>}

      {step.type === 'If/Then' && <><div className='flowPanelIntro'><strong>Binary condition</strong><p>People follow the Yes branch when this condition matches; otherwise they follow No.</p></div><div className='flowConditionBuilder'><select value={String(step.config.field ?? 'Lifecycle Stage')} onChange={(event) => updateConfig({ field: event.target.value })}><option>Lifecycle Stage</option><option>Program Status</option><option>Lead Score</option><option>Country</option><option>Member of Smart List</option></select><select value={String(step.config.operator ?? 'is')} onChange={(event) => updateConfig({ operator: event.target.value })}><option>is</option><option>is not</option><option>contains</option><option>greater than</option><option>less than</option></select><input value={String(step.config.value ?? '')} onChange={(event) => updateConfig({ value: event.target.value })} placeholder='Value' /></div><div className='flowBranchSummary'>{step.branches?.map((branch) => <div key={branch.id}><span>{branch.label}</span><strong>{branch.steps.length} steps</strong><small>{branch.condition}</small></div>)}</div></>}

      {step.type === 'If/Then (Multiple)' && <><label className='flowConfigField'>Split Mode<select value={String(step.config.splitMode ?? 'conditions')} onChange={(event) => updateConfig({ splitMode: event.target.value })}><option value='conditions'>Conditions</option><option value='weights'>A/B weights</option></select></label><div className='flowMultipleBranches'>{step.branches?.map((branch) => <div key={branch.id}><input value={branch.label} onChange={(event) => updateBranches((branches) => branches.map((item) => item.id === branch.id ? { ...item, label: event.target.value } : item))} aria-label='Branch label' /><input value={branch.condition} onChange={(event) => updateBranches((branches) => branches.map((item) => item.id === branch.id ? { ...item, condition: event.target.value } : item))} placeholder='Optional condition' aria-label='Branch condition' />{step.config.splitMode === 'weights' && <label><input type='number' min='0' max='100' value={branch.weight ?? 0} onChange={(event) => updateBranches((branches) => branches.map((item) => item.id === branch.id ? { ...item, weight: Number(event.target.value) } : item))} />%</label>}<button type='button' onClick={() => updateBranches((branches) => branches.filter((item) => item.id !== branch.id))}>×</button></div>)}</div><button type='button' className='flowPanelAddButton' onClick={() => updateBranches((branches) => [...branches, { id: `${step.id}-branch-${branches.length + 1}`, label: `Branch ${branches.length + 1}`, condition: '', weight: 0, steps: [] }])}>+ Add Branch</button></>}

      {step.type === 'Change Data Value' && <><label className='flowConfigField'>CRM Field<select value={String(step.config.field ?? 'Lifecycle Stage')} onChange={(event) => updateConfig({ field: event.target.value })}><option>Lifecycle Stage</option><option>Lead Score</option><option>Person Owner</option><option>Account Tier</option><option>Country</option></select></label><label className='flowConfigField'>Operator<select value={String(step.config.operator ?? 'set')} onChange={(event) => updateConfig({ operator: event.target.value })}><option value='set'>Set</option><option value='increment'>Increment</option><option value='decrement'>Decrement</option><option value='clear'>Clear</option></select></label>{step.config.operator !== 'clear' && <label className='flowConfigField'>Value<input value={String(step.config.value ?? '')} onChange={(event) => updateConfig({ value: event.target.value })} /></label>}</>}

      {(step.type === 'Add to List' || step.type === 'Remove from List') && <label className='flowConfigField'>Static List<select value={String(step.config.listName ?? '')} onChange={(event) => updateConfig({ listName: event.target.value })}><option value=''>Select a list</option><option>Sales Follow-up</option><option>Event Attendees</option><option>Product Interest</option><option>Customer Newsletter</option></select></label>}

      {step.type === 'Call Webhook' && <><label className='flowConfigField'>Webhook<select value={String(step.config.webhook ?? '')} onChange={(event) => updateConfig({ webhook: event.target.value })}><option value=''>Select webhook</option><option>Enrich Person</option><option>Notify Sales Platform</option><option>Create Support Case</option></select></label><label className='flowConfigField'>Payload Preview<textarea value={String(step.config.payload ?? '')} onChange={(event) => updateConfig({ payload: event.target.value })} /></label><TokenPicker programTokens={program.tokens} onSelect={(token) => updateConfig({ payload: `${String(step.config.payload ?? '')}${token}` })} /></>}

      {step.type === 'Sync to CRM' && <><label className='flowConfigField'>Object<select value={String(step.config.object ?? 'Lead')} onChange={(event) => updateConfig({ object: event.target.value })}><option>Lead</option><option>Contact</option><option>Account</option></select></label><label className='flowConfigField'>Action<select value={String(step.config.action ?? 'all')} onChange={(event) => updateConfig({ action: event.target.value })}><option value='all'>Push all mapped fields</option><option value='specific'>Push specific fields</option></select></label>{step.config.action === 'specific' && <label className='flowConfigField'>Fields<input value={String(step.config.fields ?? '')} onChange={(event) => updateConfig({ fields: event.target.value })} placeholder='Email, Lifecycle Stage, Score' /></label>}</>}

      {step.type === 'Create Task' && <><label className='flowConfigField'>Subject<input value={String(step.config.subject ?? '')} onChange={(event) => updateConfig({ subject: event.target.value })} placeholder='Follow up with lead' /></label><label className='flowConfigField'>Due Date<input type='date' value={String(step.config.dueDate ?? '')} onChange={(event) => updateConfig({ dueDate: event.target.value })} /></label><label className='flowConfigField'>Assign To<select value={String(step.config.assignTo ?? 'Person Owner')} onChange={(event) => updateConfig({ assignTo: event.target.value })}><option>Person Owner</option><option>Account Owner</option><option>Maya Chen</option><option>Rita Nair</option></select></label></>}

      {step.type === 'Send Alert' && <><label className='flowConfigField'>Recipient<select value={String(step.config.recipient ?? 'Person Owner')} onChange={(event) => updateConfig({ recipient: event.target.value })}><option>Person Owner</option><option>Account Owner</option><option>Maya Chen</option><option>Marketing Operations</option></select></label><label className='flowConfigField'>Subject<input value={String(step.config.subject ?? '')} onChange={(event) => updateConfig({ subject: event.target.value })} /></label><label className='flowConfigField'>Message<textarea value={String(step.config.message ?? '')} onChange={(event) => updateConfig({ message: event.target.value })} /></label><TokenPicker programTokens={program.tokens} onSelect={(token) => updateConfig({ message: `${String(step.config.message ?? '')}${token}` })} /></>}

      {step.type === 'Router' && <><label className='flowConfigField'>Router Name<input value={String(step.config.routerName ?? '')} onChange={(event) => updateConfig({ routerName: event.target.value })} /></label><div className='flowPanelIntro'><strong>Ordered routing</strong><p>The first matching branch is used. If none match, the first branch without a condition becomes the default.</p></div><div className='flowRouterConfig'>{step.branches?.map((branch, index) => <section key={branch.id}><header><span>{index + 1}</span><input value={branch.label} onChange={(event) => updateBranches((branches) => branches.map((item) => item.id === branch.id ? { ...item, label: event.target.value } : item))} aria-label='Branch label' /><button type='button' onClick={() => updateBranches((branches) => branches.filter((item) => item.id !== branch.id))}>×</button></header><div className='flowRouterCondition'><select value={branch.conditionField ?? ''} onChange={(event) => updateBranches((branches) => branches.map((item) => item.id === branch.id ? { ...item, conditionField: event.target.value, condition: event.target.value ? `${event.target.value} ${item.conditionOperator || 'is'} ${item.conditionValue || ''}`.trim() : '' } : item))}><option value=''>Default (no condition)</option><option>Lead Score</option><option>Lifecycle Stage</option><option>Country</option><option>Program Status</option><option>Member of Smart List</option></select>{branch.conditionField && <><select value={branch.conditionOperator ?? 'is'} onChange={(event) => updateBranches((branches) => branches.map((item) => item.id === branch.id ? { ...item, conditionOperator: event.target.value, condition: `${item.conditionField} ${event.target.value} ${item.conditionValue || ''}`.trim() } : item))}><option>is</option><option>is not</option><option>greater than</option><option>less than</option><option>contains</option></select><input value={branch.conditionValue ?? ''} onChange={(event) => updateBranches((branches) => branches.map((item) => item.id === branch.id ? { ...item, conditionValue: event.target.value, condition: `${item.conditionField} ${item.conditionOperator || 'is'} ${event.target.value}`.trim() } : item))} placeholder='Value' /></>}</div><label>Target<select value={branch.targetStepId ?? ''} onChange={(event) => updateBranches((branches) => branches.map((item) => item.id === branch.id ? { ...item, targetStepId: event.target.value } : item))}><option value=''>Select subsequent Stream</option>{streamOptions.map((stream) => <option key={stream.id} value={stream.id}>Stream: {stream.name}</option>)}</select></label><small>{routerBranchCondition(branch) || 'Default branch'}</small></section>)}</div><button type='button' className='flowPanelAddButton' onClick={() => updateBranches((branches) => [...branches, { id: `${step.id}-branch-${Date.now()}`, label: `Branch ${String.fromCharCode(65 + branches.length)}`, condition: '', targetStepId: '', steps: [] }])}>+ Add Branch</button></>}
      {step.type === 'Stream' && <><label className='flowConfigField'>Stream Name<input value={String(step.config.streamName ?? '')} onChange={(event) => updateConfig({ streamName: event.target.value })} /></label><div className='flowPanelSection'><header><strong>Default Cadence</strong><small>New Wait steps inherit this duration.</small></header><div className='flowCadenceFields'><input type='number' min='0' value={Number(step.config.cadenceInterval ?? 7)} onChange={(event) => updateConfig({ cadenceInterval: Number(event.target.value) })} /><select value={String(step.config.cadenceUnit ?? 'days')} onChange={(event) => updateConfig({ cadenceUnit: event.target.value })}><option>days</option><option>weeks</option><option>months</option><option>immediately</option></select><input type='time' value={String(step.config.cadenceTime ?? '09:00')} onChange={(event) => updateConfig({ cadenceTime: event.target.value })} /></div></div><div className='flowPanelSection flowTransitionBuilder'><header><strong>Transition Out Rules</strong><small>Without rules, people remain in this Stream.</small></header>{(step.transitionRules ?? []).map((rule, index) => <section key={rule.id}><div><span>{index + 1}</span><select value={rule.logic} onChange={(event) => updateTransitions((rules) => rules.map((item) => item.id === rule.id ? { ...item, logic: event.target.value as 'AND' | 'OR' } : item))}><option>AND</option><option>OR</option></select><button type='button' onClick={() => updateTransitions((rules) => rules.filter((item) => item.id !== rule.id))}>×</button></div><select value={rule.field} onChange={(event) => updateTransitions((rules) => rules.map((item) => item.id === rule.id ? { ...item, field: event.target.value } : item))}><option>Activity</option><option>Lead Score</option><option>Lifecycle Stage</option><option>Program Status</option></select><select value={rule.operator} onChange={(event) => updateTransitions((rules) => rules.map((item) => item.id === rule.id ? { ...item, operator: event.target.value } : item))}><option>is</option><option>is not</option><option>greater than</option><option>less than</option><option>contains</option></select><input value={rule.value} onChange={(event) => updateTransitions((rules) => rules.map((item) => item.id === rule.id ? { ...item, value: event.target.value } : item))} placeholder='Condition value' /><label>Move to<select value={rule.targetStepId} onChange={(event) => updateTransitions((rules) => rules.map((item) => item.id === rule.id ? { ...item, targetStepId: event.target.value } : item))}><option value='end'>End (exit nurture)</option>{streamOptions.filter((stream) => stream.id !== step.id).map((stream) => <option key={stream.id} value={stream.id}>Stream: {stream.name}</option>)}</select></label></section>)}{(step.transitionRules ?? []).length === 0 && <div className='flowStayInStream'>Stay in stream (no transition rules)</div>}<button type='button' className='flowPanelAddButton' onClick={() => updateTransitions((rules) => [...rules, { id: `transition-${Date.now()}`, logic: 'AND', field: 'Activity', operator: 'is', value: '', targetStepId: 'end' }])}>+ Add Transition Rule</button></div></>}
      {step.type === 'End' && <div className='flowEndConfiguration'><span>■</span><strong>End of flow</strong><p>People stop progressing through this path when they reach this step.</p></div>}
    </div>
    <footer><button type='button' className='button solid' onClick={onClose}>Done</button></footer>
  </aside>
}

export function ProgramFlowEditor({ program, onChange, onConvertToNurture, onEditAsset }: ProgramFlowEditorProps) {
  const nextId = useRef(100)
  const steps = program.flowSteps ?? defaultFlowStepsForProgramType(program.type)
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
  const [collapsedBranches, setCollapsedBranches] = useState<Set<string>>(() => new Set())
  const [collapsedStreams, setCollapsedStreams] = useState<Set<string>>(() => new Set())
  const [paletteTarget, setPaletteTarget] = useState<string | null>(null)
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null)
  const [draggedBranch, setDraggedBranch] = useState<{ routerId: string; branchId: string } | null>(null)
  const [cadencePopoverId, setCadencePopoverId] = useState<string | null>(null)
  const [flowContext, setFlowContext] = useState<FlowContextMenu | null>(null)
  const [copiedStream, setCopiedStream] = useState<ProgramFlowStep | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<ProgramFlowStep | null>(null)
  const selectedStep = useMemo(() => selectedStepId ? findStep(steps, selectedStepId) : undefined, [selectedStepId, steps])
  const allFlowSteps = useMemo(() => flattenFlowSteps(steps), [steps])
  const streamOptions = useMemo(() => allFlowSteps.filter((step) => step.type === 'Stream').map((step) => ({ id: step.id, name: String(step.config.streamName || 'New Stream') })), [allFlowSteps])
  const configurationStreamOptions = useMemo(() => {
    if (selectedStep?.type !== 'Router') return streamOptions
    const routerIndex = steps.findIndex((step) => step.id === selectedStep.id)
    return steps.slice(routerIndex + 1).filter((step) => step.type === 'Stream').map((step) => ({ id: step.id, name: String(step.config.streamName || 'New Stream') }))
  }, [selectedStep, steps, streamOptions])
  const incomingLabels = useMemo(() => {
    const labels = new Map<string, string[]>()
    allFlowSteps.forEach((step) => {
      if (step.type === 'Router') step.branches?.forEach((branch) => { if (branch.targetStepId) labels.set(branch.targetStepId, [...(labels.get(branch.targetStepId) ?? []), branch.label]) })
      if (step.type === 'Stream') step.transitionRules?.forEach((rule) => { if (rule.targetStepId && rule.targetStepId !== 'end') labels.set(rule.targetStepId, [...(labels.get(rule.targetStepId) ?? []), String(step.config.streamName || 'Stream')]) })
    })
    return labels
  }, [allFlowSteps])

  useEffect(() => {
    if (!flowContext) return
    const close = () => setFlowContext(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [flowContext])

  function updateStep(stepId: string, updater: (step: ProgramFlowStep) => ProgramFlowStep) {
    onChange(updateStepTree(steps, stepId, updater))
  }

  function addStep(type: ProgramFlowStepType, target: string) {
    const step = createProgramFlowStep(type, `flow-step-${nextId.current++}`)
    if (target === 'root') onChange(insertBeforeEnd(steps, step))
    else if (target.startsWith('stream::')) {
      const streamId = target.slice('stream::'.length)
      const stream = findStep(steps, streamId)
      if (type === 'Wait' && stream) {
        step.config = { ...step.config, waitMode: 'duration', duration: Number(stream.config.cadenceInterval ?? 7), unit: String(stream.config.cadenceUnit ?? 'days') }
      }
      onChange(updateStepTree(steps, streamId, (owner) => ({ ...owner, children: insertBeforeEnd(owner.children ?? [], step) })))
      setCollapsedStreams((current) => { const next = new Set(current); next.delete(streamId); return next })
    }
    else {
      const [, ownerId, branchId] = target.split('::')
      onChange(updateStepTree(steps, ownerId, (owner) => ({ ...owner, branches: owner.branches?.map((branch) => branch.id === branchId ? { ...branch, steps: insertBeforeEnd(branch.steps, step) } : branch) })))
      setCollapsedBranches((current) => { const next = new Set(current); next.delete(branchId); return next })
    }
    setSelectedStepId(step.id)
    setPaletteTarget(null)
  }

  function renderAddStep(target: string, compact = false) {
    const open = paletteTarget === target
    return <div className={`flowAddStepWrap ${compact ? 'compact' : ''}`}><button type='button' className={compact ? '' : 'flowAddStepButton'} onClick={() => setPaletteTarget(open ? null : target)}>+ Add Step</button>{open && <div className='flowStepPalette'>{flowStepPalette.map((item) => <button type='button' key={item.type} onClick={() => addStep(item.type, target)}><span>{item.icon}</span><div><strong>{item.type}</strong><small>{item.description}</small></div></button>)}</div>}</div>
  }

  function renderSequence(sequence: ProgramFlowStep[], depth = 0): React.ReactNode {
    return <div className='programFlowSequence'>{sequence.map((step, index) => <div className={`programFlowNode ${step.type === 'Stream' ? 'programStreamNode' : ''}`} key={step.id}>
      {incomingLabels.has(step.id) && <div className='programFlowIncomingTags'>From {incomingLabels.get(step.id)?.join(', ')}</div>}
      <article
        className={`programFlowCard type-${step.type.toLowerCase().replaceAll(/[^a-z]+/g, '-')} ${step.type === 'Stream' ? 'programStreamHeader' : ''}`}
        style={{ '--flow-depth': depth } as CSSProperties}
        draggable
        onDragStart={() => setDraggedStepId(step.id)}
        onDragEnd={() => setDraggedStepId(null)}
        onDragOver={(event) => { if (draggedStepId) event.preventDefault() }}
        onDrop={(event) => { event.preventDefault(); if (draggedStepId && draggedStepId !== step.id) { const result = reorderStepTree(steps, draggedStepId, step.id); if (result.moved) onChange(result.steps) } }}
        onClick={() => setSelectedStepId(step.id)}
        onContextMenu={(event) => { if (step.type === 'Stream' || step.type === 'Send Email') { event.preventDefault(); setFlowContext({ kind: step.type === 'Stream' ? 'stream' : 'email', stepId: step.id, x: event.clientX, y: event.clientY }) } }}
      >
        <span className='programFlowDrag' title='Drag to reorder'>⠿</span>
        <span className='programFlowCardIcon'>{flowStepIcon(step.type)}</span>
        {step.type === 'Stream' ? <div className='programStreamIdentity'><input value={String(step.config.streamName || 'New Stream')} onClick={(event) => event.stopPropagation()} onChange={(event) => updateStep(step.id, (item) => ({ ...item, config: { ...item.config, streamName: event.target.value } }))} aria-label='Stream name' /><button type='button' onClick={(event) => { event.stopPropagation(); setCadencePopoverId(cadencePopoverId === step.id ? null : step.id) }}>{step.config.cadenceUnit === 'immediately' || Number(step.config.cadenceInterval) === 0 ? 'Immediately' : `Every ${String(step.config.cadenceInterval ?? 7)} ${String(step.config.cadenceUnit ?? 'days')} · ${String(step.config.cadenceTime ?? '09:00')}`}</button></div> : <div><strong>{step.type}</strong><p>{flowStepSummary(step)}</p></div>}
        <div className='programFlowCardActions'><button type='button' onClick={(event) => { event.stopPropagation(); setSelectedStepId(step.id) }} title='Edit'>✎</button>{step.type === 'Stream' && <button type='button' onClick={(event) => { event.stopPropagation(); setCollapsedStreams((current) => { const next = new Set(current); if (next.has(step.id)) next.delete(step.id); else next.add(step.id); return next }) }} title={collapsedStreams.has(step.id) ? 'Expand Stream' : 'Collapse Stream'}>{collapsedStreams.has(step.id) ? '▾' : '▴'}</button>}<button type='button' disabled={index === 0} onClick={(event) => { event.stopPropagation(); onChange(moveStepTree(steps, step.id, -1)) }} title='Move up'>↑</button><button type='button' disabled={index === sequence.length - 1} onClick={(event) => { event.stopPropagation(); onChange(moveStepTree(steps, step.id, 1)) }} title='Move down'>↓</button><button type='button' className='delete' onClick={(event) => { event.stopPropagation(); setDeleteCandidate(step) }} title='Delete'>⌫</button></div>
      </article>
      {step.type === 'Stream' && cadencePopoverId === step.id && <div className='programStreamCadencePopover'><label>Interval<input type='number' min='0' value={Number(step.config.cadenceInterval ?? 7)} onChange={(event) => updateStep(step.id, (item) => ({ ...item, config: { ...item.config, cadenceInterval: Number(event.target.value) } }))} /></label><label>Frequency<select value={String(step.config.cadenceUnit ?? 'days')} onChange={(event) => updateStep(step.id, (item) => ({ ...item, config: { ...item.config, cadenceUnit: event.target.value } }))}><option>days</option><option>weeks</option><option>months</option><option>immediately</option></select></label><label>Time<input type='time' value={String(step.config.cadenceTime ?? '09:00')} onChange={(event) => updateStep(step.id, (item) => ({ ...item, config: { ...item.config, cadenceTime: event.target.value } }))} /></label><button type='button' onClick={() => setCadencePopoverId(null)}>Done</button></div>}
      {step.type === 'Router' && <div className='programRouterBranches'><header><span>Ordered branches</span><small>First match wins · no condition = default</small></header>{step.branches?.map((branch, branchIndex) => <div className='programRouterBranchRow' key={branch.id} draggable onDragStart={(event) => { event.stopPropagation(); setDraggedBranch({ routerId: step.id, branchId: branch.id }) }} onDragOver={(event) => { if (draggedBranch?.routerId === step.id) event.preventDefault() }} onDrop={(event) => { event.preventDefault(); event.stopPropagation(); if (!draggedBranch || draggedBranch.routerId !== step.id || draggedBranch.branchId === branch.id) return; updateStep(step.id, (router) => { const branches = [...(router.branches ?? [])]; const from = branches.findIndex((item) => item.id === draggedBranch.branchId); const to = branches.findIndex((item) => item.id === branch.id); const [moved] = branches.splice(from, 1); branches.splice(to, 0, moved); return { ...router, branches } }); setDraggedBranch(null) }}><span className='programRouterBranchGrip'>⠿</span><em>{branchIndex + 1}</em><input value={branch.label} onChange={(event) => updateStep(step.id, (router) => ({ ...router, branches: router.branches?.map((item) => item.id === branch.id ? { ...item, label: event.target.value } : item) }))} aria-label='Router branch label' /><button type='button' className={`programRouterFunnel ${routerBranchCondition(branch) ? 'active' : ''}`} onClick={() => setSelectedStepId(step.id)} title={routerBranchCondition(branch) || 'Default branch'}>▽</button><select value={branch.targetStepId ?? ''} onChange={(event) => updateStep(step.id, (router) => ({ ...router, branches: router.branches?.map((item) => item.id === branch.id ? { ...item, targetStepId: event.target.value } : item) }))}><option value=''>→ Select target Stream</option>{steps.slice(Math.max(steps.findIndex((item) => item.id === step.id) + 1, 0)).filter((item) => item.type === 'Stream').map((stream) => <option key={stream.id} value={stream.id}>→ Stream: {String(stream.config.streamName || 'New Stream')}</option>)}</select></div>)}<button type='button' onClick={() => updateStep(step.id, (router) => ({ ...router, branches: [...(router.branches ?? []), { id: `${router.id}-branch-${Date.now()}`, label: `Branch ${String.fromCharCode(65 + (router.branches?.length ?? 0))}`, condition: '', targetStepId: '', steps: [] }] }))}>+ Add Branch</button></div>}
      {step.type === 'Stream' && <div className='programStreamContainer'><div className={`programStreamBody ${collapsedStreams.has(step.id) ? 'collapsed' : ''}`}>{!collapsedStreams.has(step.id) && <>{(step.children ?? []).length ? renderSequence(step.children ?? [], depth + 1) : <div className='programStreamEmpty'>No content steps in this Stream.</div>}{renderAddStep(`stream::${step.id}`, true)}</>}</div><footer className='programStreamExit'><button type='button' onClick={() => setSelectedStepId(step.id)} title='Edit transition rules'>↗</button>{(step.transitionRules ?? []).length ? <div>{step.transitionRules?.map((rule) => <span key={rule.id}>{rule.field} {rule.operator} {rule.value || '…'} <strong>→ {rule.targetStepId === 'end' ? 'End' : streamOptions.find((stream) => stream.id === rule.targetStepId)?.name || 'Select target'}</strong></span>)}</div> : <span className='programStreamStay'>Stay in stream (no transition rules)</span>}</footer></div>}
      {step.branches && step.type !== 'Router' && <div className='programFlowBranches'>{step.branches.map((branch) => { const collapsed = collapsedBranches.has(branch.id); return <section className='programFlowBranch' key={branch.id} style={{ '--flow-depth': depth + 1 } as CSSProperties}><header><button type='button' onClick={() => setCollapsedBranches((current) => { const next = new Set(current); if (next.has(branch.id)) next.delete(branch.id); else next.add(branch.id); return next })}>{collapsed ? '›' : '⌄'}</button><span>{branch.label}</span><small>{branch.condition}{branch.weight !== undefined ? ` · ${branch.weight}%` : ''}</small><em>{branch.steps.length} steps</em>{renderAddStep(`branch::${step.id}::${branch.id}`, true)}</header>{!collapsed && (branch.steps.length ? renderSequence(branch.steps, depth + 1) : <div className='programFlowBranchEmpty'>No steps in this branch.</div>)}</section> })}</div>}
    </div>)}</div>
  }

  return <div className='programSequenceFlow'>
    <div className='programFlowCanvas'>
      <div className='programFlowCanvasToolbar'><div className='programFlowStart'>Start</div><div><button type='button' onClick={() => { setCollapsedBranches(new Set()); setCollapsedStreams(new Set()) }}>Expand all</button><button type='button' onClick={() => { setCollapsedBranches(new Set(collectBranchIds(steps))); setCollapsedStreams(new Set(allFlowSteps.filter((step) => step.type === 'Stream').map((step) => step.id))) }}>Collapse all</button></div></div>
      <div className='programFlowStartLine' />
      {steps.length ? renderSequence(steps) : <div className='programFlowBlankState'><span>＋</span><strong>Start building this flow</strong><p>Add the first step after Start.</p></div>}
      {renderAddStep('root')}
    </div>
    {selectedStep && <StepConfigurationPanel program={program} step={selectedStep} streamOptions={configurationStreamOptions} onClose={() => setSelectedStepId(null)} onUpdate={(updater) => updateStep(selectedStep.id, updater)} onEditAsset={onEditAsset} />}
    {flowContext && <div className='flowStepContextMenu' style={{ left: Math.min(flowContext.x, window.innerWidth - 235), top: Math.min(flowContext.y, window.innerHeight - 280) }} onClick={(event) => event.stopPropagation()}>{flowContext.kind === 'stream' ? <><button type='button' onClick={() => { const stream = findStep(steps, flowContext.stepId); if (stream) setCopiedStream(structuredClone(stream)); setFlowContext(null) }}>Copy</button><button type='button' disabled={!copiedStream} onClick={() => { if (!copiedStream) return; const clone = cloneFlowStepWithIds(copiedStream, () => `flow-copy-${nextId.current++}`); clone.config = { ...clone.config, streamName: `Copy of ${String(copiedStream.config.streamName || 'Stream')}` }; const result = insertStepAfter(steps, flowContext.stepId, clone); if (result.inserted) onChange(result.steps); setFlowContext(null) }}>Paste</button><button type='button' onClick={() => { const stream = findStep(steps, flowContext.stepId); if (stream) setDeleteCandidate(stream); setFlowContext(null) }}>Delete</button><button type='button' onClick={() => { setSelectedStepId(flowContext.stepId); setFlowContext(null) }}>Rename</button><button type='button' onClick={() => { setCadencePopoverId(flowContext.stepId); setFlowContext(null) }}>Edit Cadence</button><button type='button' onClick={() => { setSelectedStepId(flowContext.stepId); setFlowContext(null) }}>Edit Transition Rules</button></> : <><button type='button' onClick={() => { const result = wrapEmailStep(steps, flowContext.stepId, false, `wrapped-stream-${nextId.current++}`); if (result.wrapped) { onChange(result.steps); if (program.type === 'Simple Email') onConvertToNurture() } setFlowContext(null) }}>Wrap Email Only in Stream</button><button type='button' onClick={() => { const result = wrapEmailStep(steps, flowContext.stepId, true, `wrapped-stream-${nextId.current++}`); if (result.wrapped) { onChange(result.steps); if (program.type === 'Simple Email') onConvertToNurture() } setFlowContext(null) }}>Wrap in Stream{precedingWaitCount(steps, flowContext.stepId) ? ` with ${precedingWaitCount(steps, flowContext.stepId)} preceding Wait${precedingWaitCount(steps, flowContext.stepId) > 1 ? 's' : ''}` : ''}</button></>}</div>}
    {deleteCandidate && <Modal title='Delete Flow Step' open onClose={() => setDeleteCandidate(null)}><div className='flowDeleteConfirmation'><span>⌫</span><h3>Delete “{deleteCandidate.type}”?</h3><p>This removes the step and any nested branch sequences beneath it. This action cannot be undone.</p><footer><button type='button' className='button ghost' onClick={() => setDeleteCandidate(null)}>Cancel</button><button type='button' className='button solid danger' onClick={() => { onChange(deleteStepTree(steps, deleteCandidate.id)); if (selectedStepId === deleteCandidate.id) setSelectedStepId(null); setDeleteCandidate(null) }}>Delete Step</button></footer></div></Modal>}
  </div>
}
