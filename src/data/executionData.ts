import type { ExecutionRecord, ExecutionTemplate, FlowNode, PaletteTab, ProgramTabKey } from '../types/execution'

export const marketingActivityTabs: Array<{ key: ProgramTabKey; label: string }> = [
  { key: 'all-programs', label: 'All Programs' },
  { key: 'smart-campaigns', label: 'Smart Campaigns' },
  { key: 'engagement-programs', label: 'Engagement Programs' },
  { key: 'event-programs', label: 'Event Programs' },
]

export const executions: ExecutionRecord[] = [
  { id: 'ex-1', name: 'Enterprise Demo Nurture', type: 'Engagement Program', status: 'Active', lastRun: 'Running continuously', folder: 'Lifecycle / Nurture', metrics: { entries: 12842, inFlow: 1847, completed: 9362, goalReached: 1633 }, sparkline: [12, 18, 15, 26, 24, 34, 39, 44, 40, 53] },
  { id: 'ex-2', name: 'Q3 Product Launch Blast', type: 'Smart Campaign', status: 'Active', lastRun: 'Today, 10:30 AM', folder: 'Campaigns / Product Launch', metrics: { entries: 8240, inFlow: 920, completed: 6814, goalReached: 506 }, sparkline: [8, 14, 21, 18, 31, 37, 35, 46, 54, 61] },
  { id: 'ex-3', name: 'Revenue Leaders Webinar', type: 'Event Program', status: 'Paused', lastRun: 'Yesterday, 4:15 PM', folder: 'Events / Webinars', metrics: { entries: 2184, inFlow: 0, completed: 2038, goalReached: 684 }, sparkline: [20, 24, 32, 28, 35, 30, 25, 26, 23, 22] },
  { id: 'ex-4', name: 'Dormant SQL Re-engagement', type: 'Engagement Program', status: 'Draft', lastRun: 'Never activated', folder: 'Lifecycle / Re-engagement', metrics: { entries: 0, inFlow: 0, completed: 0, goalReached: 0 }, sparkline: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2] },
  { id: 'ex-5', name: 'High Intent Score Update', type: 'Smart Campaign', status: 'Active', lastRun: 'Today, 11:04 AM', folder: 'Operational / Scoring', metrics: { entries: 3917, inFlow: 176, completed: 3520, goalReached: 221 }, sparkline: [9, 16, 13, 22, 30, 25, 38, 35, 47, 52] },
  { id: 'ex-6', name: 'Customer Summit 2026', type: 'Event Program', status: 'Draft', lastRun: 'Never activated', folder: 'Events / Live Events', metrics: { entries: 0, inFlow: 0, completed: 0, goalReached: 0 }, sparkline: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2] },
]

export const executionFolders = [
  { name: 'Marketing Activities', count: 32 },
  { name: 'Lifecycle', count: 10, children: ['Nurture', 'Re-engagement', 'Onboarding'] },
  { name: 'Campaigns', count: 8, children: ['Product Launch', 'Email Blasts'] },
  { name: 'Events', count: 9, children: ['Webinars', 'Live Events', 'Virtual Events'] },
  { name: 'Operational', count: 5, children: ['Scoring', 'Data Management'] },
]

export const executionTemplates: ExecutionTemplate[] = [
  { id: 'sc-form', name: 'Form Follow-up', description: 'Respond to form fills, update score, and alert sales.', category: 'Smart Campaign', steps: ['Smart List', 'Change Data Value', 'Send Alert', 'End'], mode: 'Trigger' },
  { id: 'sc-blast', name: 'One-time Email Blast', description: 'Send one approved email to a filtered Smart List.', category: 'Smart Campaign', steps: ['Smart List', 'Send Email', 'End'], mode: 'Filter' },
  { id: 'sc-score', name: 'Score Update', description: 'Change person score when behavioral criteria are met.', category: 'Smart Campaign', steps: ['Smart List', 'Change Data Value', 'End'], mode: 'Trigger' },
  { id: 'ep-nurture', name: 'Lead Nurture 3-Touch', description: 'Three-touch nurture with engagement-based branching.', category: 'Engagement Program', steps: ['Smart List', 'Send Email', 'Wait', 'Choice', 'Send Email'], mode: 'Filter' },
  { id: 'ep-welcome', name: 'Welcome Series', description: 'Welcome new people with a timed onboarding sequence.', category: 'Engagement Program', steps: ['Smart List', 'Send Email', 'Wait', 'Send Email'], mode: 'Filter' },
  { id: 'ep-reengage', name: 'Re-engagement Drip', description: 'Re-activate inactive people using a choice-based stream.', category: 'Engagement Program', steps: ['Smart List', 'Send Email', 'Wait', 'Choice'], mode: 'Filter' },
  { id: 'ev-webinar', name: 'Webinar', description: 'Registration, reminder, attendance, and follow-up flows.', category: 'Event Program', steps: ['Smart List', 'Wait', 'Send Email', 'Choice'], mode: 'Trigger' },
  { id: 'ev-live', name: 'Live Event', description: 'Manage registration and post-event lifecycle updates.', category: 'Event Program', steps: ['Smart List', 'Wait', 'Send Email', 'Change Data Value'], mode: 'Trigger' },
  { id: 'ev-virtual', name: 'Virtual Event', description: 'Automate reminders and attendance-based follow-up.', category: 'Event Program', steps: ['Smart List', 'Send Email', 'Wait', 'Choice'], mode: 'Trigger' },
]

export const paletteNodes: Record<PaletteTab, Array<{ icon: string; name: string; description: string }>> = {
  Triggers: [
    { icon: '▤', name: 'Fills Out Form', description: 'Person submits a Marketo form' },
    { icon: '↗', name: 'Clicks Link in Email', description: 'Person clicks a tracked link' },
    { icon: '◎', name: 'Visits Web Page', description: 'Person visits a tracked page' },
    { icon: '⇄', name: 'Data Value Changes', description: 'A person field is updated' },
  ],
  Filters: [
    { icon: '☷', name: 'Member of Smart List', description: 'Matches an existing Smart List' },
    { icon: '≡', name: 'Data Value', description: 'Matches person field criteria' },
    { icon: '◷', name: 'Activity History', description: 'Matches prior activity' },
  ],
  Actions: [
    { icon: '✉', name: 'Send Email', description: 'Send approved Marketo email' },
    { icon: '▤', name: 'Use Form', description: 'Use an approved Marketo form' },
    { icon: '▣', name: 'Landing Page', description: 'Use a published landing page' },
    { icon: '◷', name: 'Wait', description: 'Pause for a duration or date' },
    { icon: '⇄', name: 'Change Data Value', description: 'Update a person field' },
    { icon: '+', name: 'Add to List', description: 'Add person to a static list' },
    { icon: '−', name: 'Remove from List', description: 'Remove person from a list' },
    { icon: '↗', name: 'Call Webhook', description: 'Post to an external service' },
    { icon: '✓', name: 'Create Task', description: 'Create a CRM task' },
    { icon: '!', name: 'Send Alert', description: 'Notify sales or marketing' },
    { icon: '★', name: 'Interesting Moment', description: 'Record a notable activity' },
  ],
  'Flow Control': [
    { icon: '◇', name: 'Choice', description: 'Create Yes and No branches' },
    { icon: '☷', name: 'Smart List Filter', description: 'Branch by multiple filter rules' },
    { icon: '⑂', name: 'Split', description: 'Create an A/B test split' },
    { icon: '⊗', name: 'End', description: 'End this program path' },
  ],
}

const configured = 'Configured'
const configure = 'Configure'

export const programFlows: Record<'smart' | 'engagement' | 'event', FlowNode[]> = {
  smart: [
    { id: 'node-1', kind: 'smart-list', title: 'Smart List', subtitle: 'Trigger · Fills Out Form', x: 0, y: 70 },
    { id: 'node-2', kind: 'change-data', title: 'Change Data Value', subtitle: 'Person Score · +50', x: 0, y: 210 },
    { id: 'node-3', kind: 'alert', title: 'Send Alert', subtitle: 'Notify assigned sales owner', x: 0, y: 350 },
    { id: 'node-4', kind: 'end', title: 'End', subtitle: 'Goal: Sales notified', x: 0, y: 490 },
  ],
  engagement: [
    { id: 'node-1', kind: 'smart-list', title: 'Smart List', subtitle: 'Filter · New MQLs', x: 0, y: 70 },
    { id: 'node-2', kind: 'email', title: 'Send Email', subtitle: `Welcome Email · ${configured}`, x: 0, y: 210 },
    { id: 'node-3', kind: 'wait', title: 'Wait', subtitle: '3 days', x: 0, y: 350 },
    { id: 'node-4', kind: 'choice', title: 'Choice', subtitle: 'Clicked Link A in Email 1', x: 0, y: 490 },
    { id: 'node-5', kind: 'email', title: 'Send Email', subtitle: `High Intent Follow-up · ${configure}`, x: -170, y: 640 },
    { id: 'node-6', kind: 'email', title: 'Send Email', subtitle: `Education Touch 2 · ${configure}`, x: 170, y: 640 },
    { id: 'node-7', kind: 'end', title: 'End', subtitle: 'Nurture stream complete', x: 0, y: 790 },
  ],
  event: [
    { id: 'node-1', kind: 'smart-list', title: 'Smart List', subtitle: 'Trigger · Fills Out Registration Form', x: 0, y: 50 },
    { id: 'node-2', kind: 'wait', title: 'Wait', subtitle: 'Until event date · 1 day before', x: 0, y: 170 },
    { id: 'node-3', kind: 'email', title: 'Send Email', subtitle: `Webinar Reminder · ${configure}`, x: 0, y: 290 },
    { id: 'node-4', kind: 'wait', title: 'Wait', subtitle: '1 hour after event', x: 0, y: 410 },
    { id: 'node-5', kind: 'email', title: 'Send Email', subtitle: `Event Follow-up · ${configure}`, x: 0, y: 530 },
    { id: 'node-6', kind: 'choice', title: 'Choice', subtitle: 'Attended Webinar?', x: 0, y: 650 },
    { id: 'node-7', kind: 'change-data', title: 'Change Data Value', subtitle: 'Lifecycle Status · Attended', x: -170, y: 790 },
    { id: 'node-8', kind: 'email', title: 'Send Email', subtitle: `No-show Recording · ${configure}`, x: 170, y: 790 },
    { id: 'node-9', kind: 'end', title: 'End', subtitle: 'Event program complete', x: 0, y: 930 },
  ],
}

export function flowForTemplate(template?: ExecutionTemplate): FlowNode[] {
  if (template?.category === 'Smart Campaign') return programFlows.smart
  if (template?.category === 'Event Program') return programFlows.event
  return programFlows.engagement
}
