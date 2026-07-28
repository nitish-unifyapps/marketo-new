import type { ProgramFlowStep, ProgramFlowStepType, ProgramType } from '../types/programs'

export const flowStepPalette: Array<{ type: ProgramFlowStepType; icon: string; description: string }> = [
  { type: 'Send Email', icon: '✉', description: 'Send a local or global email' },
  { type: 'Wait', icon: '◷', description: 'Pause for a duration or date' },
  { type: 'If/Then', icon: '⑂', description: 'Create a Yes / No split' },
  { type: 'If/Then (Multiple)', icon: '⑃', description: 'Create conditional or weighted branches' },
  { type: 'Router', icon: '⎇', description: 'Route people into paths' },
  { type: 'Stream', icon: '≋', description: 'Add a nurture stream' },
  { type: 'Change Data Value', icon: '✎', description: 'Update a CRM field' },
  { type: 'Add to List', icon: '＋', description: 'Add person to a static list' },
  { type: 'Remove from List', icon: '−', description: 'Remove person from a list' },
  { type: 'Call Webhook', icon: '↗', description: 'Send a webhook request' },
  { type: 'Sync to CRM', icon: '⇄', description: 'Push mapped data to CRM' },
  { type: 'Create Task', icon: '☑', description: 'Create a follow-up task' },
  { type: 'Send Alert', icon: '△', description: 'Notify an owner or user' },
  { type: 'End', icon: '■', description: 'Terminate this flow path' },
]

export const flowTokenGroups = [
  { name: 'Program Tokens', tokens: ['{{my.ProgramName}}', '{{my.EventDate}}', '{{my.EventLocation}}', '{{my.OwnerEmail}}'] },
  { name: 'Person Fields', tokens: ['{{lead.FirstName}}', '{{lead.LastName}}', '{{lead.Email}}', '{{lead.Company}}'] },
  { name: 'System', tokens: ['{{system.date}}', '{{system.time}}', '{{system.unsubscribeLink}}'] },
  { name: 'Trigger', tokens: ['{{trigger.name}}', '{{trigger.link}}', '{{trigger.webPage}}'] },
]

export function createProgramFlowStep(type: ProgramFlowStepType, id: string): ProgramFlowStep {
  if (type === 'Send Email') return { id, type, config: { emailName: '', personalization: '', suppressionList: '' } }
  if (type === 'Wait') return { id, type, config: { waitMode: 'duration', duration: 3, unit: 'days', dateTime: '', token: '{{my.EventDate}}', offset: '' } }
  if (type === 'If/Then') return { id, type, config: { field: 'Lifecycle Stage', operator: 'is', value: 'MQL' }, branches: [{ id: `${id}-yes`, label: 'Yes', condition: 'Condition matches', steps: [] }, { id: `${id}-no`, label: 'No', condition: 'Otherwise', steps: [] }] }
  if (type === 'If/Then (Multiple)') return { id, type, config: { splitMode: 'conditions' }, branches: [{ id: `${id}-a`, label: 'Branch A', condition: '', weight: 50, steps: [] }, { id: `${id}-b`, label: 'Branch B', condition: '', weight: 50, steps: [] }] }
  if (type === 'Router') return { id, type, config: { routerName: 'Router' }, branches: [{ id: `${id}-route`, label: 'Branch A', condition: '', targetStepId: '', steps: [] }] }
  if (type === 'Stream') {
    const wait = createProgramFlowStep('Wait', `${id}-wait`)
    wait.config = { waitMode: 'duration', duration: 7, unit: 'days', dateTime: '', token: '{{my.EventDate}}', offset: '' }
    const email = createProgramFlowStep('Send Email', `${id}-email`)
    return { id, type, config: { streamName: 'New Stream', cadenceInterval: 7, cadenceUnit: 'days', cadenceTime: '09:00' }, children: [wait, email], transitionRules: [] }
  }
  if (type === 'Change Data Value') return { id, type, config: { field: 'Lifecycle Stage', operator: 'set', value: '' } }
  if (type === 'Add to List' || type === 'Remove from List') return { id, type, config: { listName: '' } }
  if (type === 'Call Webhook') return { id, type, config: { webhook: '', payload: '{\n  "email": "{{lead.Email}}"\n}' } }
  if (type === 'Sync to CRM') return { id, type, config: { object: 'Lead', action: 'all', fields: '' } }
  if (type === 'Create Task') return { id, type, config: { subject: '', dueDate: '', assignTo: 'Person Owner' } }
  if (type === 'Send Alert') return { id, type, config: { recipient: 'Person Owner', subject: '', message: '' } }
  return { id, type, config: {} }
}

export function defaultFlowStepsForProgramType(type: ProgramType): ProgramFlowStep[] {
  if (type === 'Simple Email') {
    const email = createProgramFlowStep('Send Email', 'simple-email-send')
    return [email, createProgramFlowStep('End', 'simple-email-end')]
  }

  if (type === 'Event') {
    const beforeWait = createProgramFlowStep('Wait', 'event-wait-before')
    beforeWait.config = { waitMode: 'dynamic', duration: 3, unit: 'days', dateTime: '', token: '{{my.EventDate}}', offset: 'minus 1 hour' }
    const reminder = createProgramFlowStep('Send Email', 'event-reminder')
    reminder.config.emailName = 'Event Reminder'
    const afterWait = createProgramFlowStep('Wait', 'event-wait-after')
    afterWait.config = { waitMode: 'dynamic', duration: 3, unit: 'days', dateTime: '', token: '{{my.EventDate}}', offset: 'plus 1 hour' }
    const attendance = createProgramFlowStep('If/Then', 'event-attendance')
    attendance.config = { field: 'Program Status', operator: 'is', value: 'Attended' }
    const thankYou = createProgramFlowStep('Send Email', 'event-thank-you')
    thankYou.config.emailName = 'Thank You'
    const replay = createProgramFlowStep('Send Email', 'event-replay')
    replay.config.emailName = 'Event Replay'
    attendance.branches = [
      { id: 'event-attendance-yes', label: 'Yes', condition: 'Status is Attended', steps: [thankYou, createProgramFlowStep('End', 'event-attended-end')] },
      { id: 'event-attendance-no', label: 'No', condition: 'Status is not Attended', steps: [replay, createProgramFlowStep('End', 'event-replay-end')] },
    ]
    return [beforeWait, reminder, afterWait, attendance]
  }

  if (type === 'Nurture') {
    const router = createProgramFlowStep('Router', 'nurture-router')
    router.branches = [
      { id: 'nurture-general-branch', label: 'Default', condition: '', targetStepId: 'nurture-general-stream', steps: [] },
      { id: 'nurture-engaged-branch', label: 'Engaged', condition: 'Score > 80', conditionField: 'Lead Score', conditionOperator: 'greater than', conditionValue: '80', targetStepId: 'nurture-engaged-stream', steps: [] },
    ]

    const general = createProgramFlowStep('Stream', 'nurture-general-stream')
    general.config = { streamName: 'General Nurture', cadenceInterval: 7, cadenceUnit: 'days', cadenceTime: '09:00' }
    const generalWaitOne = createProgramFlowStep('Wait', 'nurture-general-wait-1')
    generalWaitOne.config = { waitMode: 'duration', duration: 7, unit: 'days', dateTime: '', token: '{{my.EventDate}}', offset: '' }
    const generalEmailOne = createProgramFlowStep('Send Email', 'nurture-general-email-1')
    generalEmailOne.config.emailName = 'Nurture 1'
    const generalWaitTwo = createProgramFlowStep('Wait', 'nurture-general-wait-2')
    generalWaitTwo.config = { waitMode: 'duration', duration: 7, unit: 'days', dateTime: '', token: '{{my.EventDate}}', offset: '' }
    const generalEmailTwo = createProgramFlowStep('Send Email', 'nurture-general-email-2')
    generalEmailTwo.config.emailName = 'Nurture 2'
    general.children = [generalWaitOne, generalEmailOne, generalWaitTwo, generalEmailTwo]
    general.transitionRules = [{ id: 'general-to-engaged', logic: 'AND', field: 'Activity', operator: 'is', value: 'Clicked any email in this stream', targetStepId: 'nurture-engaged-stream' }]

    const engaged = createProgramFlowStep('Stream', 'nurture-engaged-stream')
    engaged.config = { streamName: 'Engaged', cadenceInterval: 7, cadenceUnit: 'days', cadenceTime: '09:00' }
    const engagedWait = createProgramFlowStep('Wait', 'nurture-engaged-wait')
    engagedWait.config = { waitMode: 'duration', duration: 7, unit: 'days', dateTime: '', token: '{{my.EventDate}}', offset: '' }
    const engagedEmail = createProgramFlowStep('Send Email', 'nurture-engaged-email')
    engagedEmail.config.emailName = 'High Intent Offer'
    engaged.children = [engagedWait, engagedEmail]
    engaged.transitionRules = [{ id: 'engaged-to-general', logic: 'AND', field: 'Lead Score', operator: 'less than', value: '80', targetStepId: 'nurture-general-stream' }]
    return [router, general, engaged]
  }

  return []
}

export function flowStepSummary(step: ProgramFlowStep) {
  if (step.type === 'Send Email') return `Send: “${String(step.config.emailName || 'Select an email')}”`
  if (step.type === 'Wait') {
    if (step.config.waitMode === 'date') return `Wait until ${String(step.config.dateTime || 'specific date/time')}`
    if (step.config.waitMode === 'dynamic') return `Wait until ${String(step.config.token || '{{my.EventDate}}')} ${String(step.config.offset || '')}`.trim()
    if (step.config.unit === 'immediately' || Number(step.config.duration) === 0) return 'Wait immediately'
    return `Wait ${String(step.config.duration || 3)} ${String(step.config.unit || 'days')}`
  }
  if (step.type === 'If/Then') return `If ${String(step.config.field || 'field')} ${String(step.config.operator || 'is')} ${String(step.config.value || 'value')}`
  if (step.type === 'If/Then (Multiple)') return `${step.branches?.length ?? 0} conditional branches`
  if (step.type === 'Router') return `${step.branches?.length ?? 0} ordered branches`
  if (step.type === 'Stream') return `${String(step.config.streamName || 'New Stream')} · ${step.config.cadenceUnit === 'immediately' || Number(step.config.cadenceInterval) === 0 ? 'Immediately' : `Every ${String(step.config.cadenceInterval || 7)} ${String(step.config.cadenceUnit || 'days')}`}`
  if (step.type === 'Change Data Value') return `${String(step.config.operator || 'set')} ${String(step.config.field || 'field')} ${String(step.config.value || '')}`.trim()
  if (step.type === 'Add to List') return `Add to: ${String(step.config.listName || 'Select list')}`
  if (step.type === 'Remove from List') return `Remove from: ${String(step.config.listName || 'Select list')}`
  if (step.type === 'Call Webhook') return `Call: ${String(step.config.webhook || 'Select webhook')}`
  if (step.type === 'Sync to CRM') return `Sync ${String(step.config.object || 'Lead')} to CRM`
  if (step.type === 'Create Task') return `Task: ${String(step.config.subject || 'Add subject')}`
  if (step.type === 'Send Alert') return `Alert: ${String(step.config.recipient || 'Person Owner')}`
  return 'End flow'
}

export function countFlowSteps(steps: ProgramFlowStep[]): number {
  return steps.reduce((total, step) => total + 1 + countFlowSteps(step.children ?? []) + (step.branches?.reduce((branchTotal, branch) => branchTotal + countFlowSteps(branch.steps), 0) ?? 0), 0)
}
