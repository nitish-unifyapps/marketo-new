import type { ProgramAssetFolderKey, ProgramEventDetails, ProgramFolderRecord, ProgramRecord, ProgramScheduleConfig, ProgramSegmentConfig, ProgramToken, ProgramType } from '../types/programs'
import { defaultFlowStepsForProgramType } from './programFlowData'

export const programAssetFolderLabels: Record<ProgramAssetFolderKey, string> = {
  emails: 'Emails',
  'landing-pages': 'Landing Pages',
  forms: 'Forms',
  files: 'Files',
}

export const programTypeDefaults: Record<ProgramType, ProgramAssetFolderKey[]> = {
  'Automated Campaign': [],
  'Simple Email': ['emails'],
  Nurture: ['emails'],
  Event: ['emails', 'landing-pages', 'forms', 'files'],
  Container: [],
}

export const programFlowTemplates: Record<ProgramType, string[]> = {
  'Automated Campaign': ['Evaluate audience', 'Apply qualification rules', 'Update lead data'],
  'Simple Email': ['Build audience', 'Send email', 'Wait 2 days', 'Track engagement'],
  Nurture: ['Segment audience', 'Add to nurture stream', 'Send nurture email', 'Wait 7 days'],
  Event: ['Process registration', 'Send confirmation email', 'Send event reminder', 'Send follow-up'],
  Container: [],
}

export function defaultSegmentForProgramType(type: ProgramType): ProgramSegmentConfig {
  if (type === 'Event') {
    return {
      mode: 'trigger',
      groups: [{ id: 'event-filter-group', logic: 'AND', conditions: [] }],
      triggers: [{ id: 'event-registration-trigger', type: 'Fills Out Registration Form', source: 'Event Registration Form', constraints: [] }],
    }
  }

  return {
    mode: 'filter',
    groups: [{ id: `default-${type.toLowerCase().replaceAll(' ', '-')}-group`, logic: 'AND', conditions: [] }],
    triggers: [],
  }
}

export function defaultScheduleForProgramType(type: ProgramType): ProgramScheduleConfig {
  return {
    mode: type === 'Event' ? 'trigger' : 'batch',
    startAt: '2026-07-29T09:00',
    recurrence: 'None (once)',
    cron: '0 9 * * 1-5',
    timezone: 'America/Los_Angeles',
    qualificationMode: 'new-only',
    allowReentry: false,
    reentryMode: 'Once per person',
    active: false,
  }
}

export function defaultTokensForProgramType(type: ProgramType, programName: string): ProgramToken[] {
  const base: ProgramToken[] = [
    { id: `token-program-name-${programName}`, name: 'ProgramName', type: 'Text', defaultValue: programName, automatic: true },
    { id: `token-owner-email-${programName}`, name: 'OwnerEmail', type: 'Text', defaultValue: 'marketingops@example.com' },
  ]
  if (type !== 'Event') return base
  return [...base,
    { id: `token-event-name-${programName}`, name: 'EventName', type: 'Text', defaultValue: programName, automatic: true },
    { id: `token-event-date-${programName}`, name: 'EventDate', type: 'DateTime', defaultValue: '2026-09-18T10:00', automatic: true },
    { id: `token-event-end-${programName}`, name: 'EventEndDate', type: 'DateTime', defaultValue: '2026-09-18T16:00', automatic: true },
    { id: `token-event-venue-${programName}`, name: 'EventVenue', type: 'Text', defaultValue: 'San Francisco, CA', automatic: true },
  ]
}

export function defaultEventDetails(programName: string): ProgramEventDetails {
  return { eventName: programName, startAt: '2026-09-18T10:00', endAt: '2026-09-18T16:00', timezone: 'America/Los_Angeles', capacity: 500, waitlist: true, venueDescription: 'San Francisco Conference Center\nAnnual revenue leadership summit.' }
}

export const initialProgramFolders: ProgramFolderRecord[] = [
  { id: 'pf-demand', name: 'Demand Generation', parentId: null },
  { id: 'pf-q3', name: 'Q3 Campaigns', parentId: 'pf-demand' },
  { id: 'pf-events', name: 'Events', parentId: null },
  { id: 'pf-customer', name: 'Customer Marketing', parentId: null },
]

export const initialPrograms: ProgramRecord[] = [
  {
    id: 'program-abm',
    name: 'Enterprise ABM Motion',
    parentId: 'pf-demand',
    type: 'Automated Campaign',
    status: 'Active',
    enabledAssetFolders: ['emails', 'forms'],
    assets: [
      { id: 'asset-abm-email', name: 'Executive Value Email', type: 'Email', folder: 'emails' },
      { id: 'asset-abm-form', name: 'Demo Request Form', type: 'Form', folder: 'forms' },
    ],
    flow: ['Detect target-account activity', 'Increase lead score', 'Notify account owner'],
    flowSteps: defaultFlowStepsForProgramType('Automated Campaign'),
    description: 'Coordinates high-intent engagement across strategic enterprise accounts.',
    createdAt: 'Jul 12, 2026',
    tags: ['ABM', 'Enterprise'],
    tokens: defaultTokensForProgramType('Automated Campaign', 'Enterprise ABM Motion'),
    schedule: { ...defaultScheduleForProgramType('Automated Campaign'), mode: 'trigger', active: true },
  },
  {
    id: 'program-launch',
    name: 'Q3 Product Announcement',
    parentId: 'pf-q3',
    type: 'Simple Email',
    status: 'Draft',
    enabledAssetFolders: ['emails'],
    assets: [{ id: 'asset-launch-email', name: 'Product Announcement', type: 'Email', folder: 'emails' }],
    flow: ['Build audience', 'Send product announcement', 'Wait 2 days', 'Track engagement'],
    flowSteps: defaultFlowStepsForProgramType('Simple Email'),
    description: 'One-time product announcement for active prospects and customers.',
    createdAt: 'Jul 21, 2026',
    tags: ['Product', 'Email'],
    tokens: defaultTokensForProgramType('Simple Email', 'Q3 Product Announcement'),
    schedule: defaultScheduleForProgramType('Simple Email'),
    communicationLimits: { perDay: 1, perWeek: 3 },
  },
  {
    id: 'program-summit',
    name: 'Revenue Leadership Summit',
    parentId: 'pf-events',
    type: 'Event',
    status: 'Active',
    enabledAssetFolders: ['emails', 'landing-pages', 'forms', 'files'],
    assets: [
      { id: 'asset-summit-invite', name: 'Summit Invitation', type: 'Email', folder: 'emails' },
      { id: 'asset-summit-page', name: 'Registration Page', type: 'Landing Page', folder: 'landing-pages' },
      { id: 'asset-summit-form', name: 'Registration Form', type: 'Form', folder: 'forms' },
      { id: 'asset-summit-agenda', name: 'Summit Agenda.pdf', type: 'File', folder: 'files' },
    ],
    flow: ['Process registration', 'Send confirmation email', 'Send event reminder', 'Send follow-up'],
    flowSteps: defaultFlowStepsForProgramType('Event'),
    description: 'Registration, reminders, and post-event follow-up for the annual summit.',
    createdAt: 'Jun 28, 2026',
    tags: ['Event', 'Executive'],
    tokens: defaultTokensForProgramType('Event', 'Revenue Leadership Summit'),
    schedule: { ...defaultScheduleForProgramType('Event'), active: true },
    eventDetails: defaultEventDetails('Revenue Leadership Summit'),
  },
  {
    id: 'program-nurture',
    name: 'New Lead Education Stream',
    parentId: 'pf-demand',
    type: 'Nurture',
    status: 'Paused',
    enabledAssetFolders: ['emails'],
    assets: [
      { id: 'asset-nurture-1', name: 'Welcome to Marketo Next', type: 'Email', folder: 'emails' },
      { id: 'asset-nurture-2', name: 'Revenue Operations Guide', type: 'Email', folder: 'emails' },
    ],
    flow: ['Segment new leads', 'Add to education stream', 'Send nurture email', 'Wait 7 days'],
    flowSteps: defaultFlowStepsForProgramType('Nurture'),
    description: 'Always-on education stream for newly acquired leads.',
    createdAt: 'Jul 3, 2026',
    tags: ['Nurture', 'Always-on'],
    tokens: defaultTokensForProgramType('Nurture', 'New Lead Education Stream'),
    schedule: defaultScheduleForProgramType('Nurture'),
    communicationLimits: { perDay: 1, perWeek: 3 },
    exclusionSmartList: 'Global Suppression List',
    pauseOnEngagement: true,
  },
  {
    id: 'program-customer',
    name: 'Customer Expansion Hub',
    parentId: 'pf-customer',
    type: 'Container',
    status: 'Draft',
    enabledAssetFolders: [],
    assets: [],
    flow: [],
    flowSteps: defaultFlowStepsForProgramType('Container'),
    description: 'Container for customer expansion programs and shared local assets.',
    createdAt: 'Jul 24, 2026',
    tags: ['Customer Marketing'],
    tokens: defaultTokensForProgramType('Container', 'Customer Expansion Hub'),
  },
]
