import { useState } from 'react'
import type { ExecutionRecord, ExecutionTemplate, ProgramTabKey } from '../../types/execution'
import { ExecutionCanvas } from './ExecutionCanvas'
import { ExecutionLibrary } from './ExecutionLibrary'

interface ExecutionModuleProps {
  onDesignerStateChange?: (open: boolean) => void
  activeTab: ProgramTabKey
  createOpen: boolean
  onCreateOpenChange: (open: boolean) => void
}

export function ExecutionModule({ onDesignerStateChange, activeTab, createOpen, onCreateOpenChange }: ExecutionModuleProps) {
  const [activeExecution, setActiveExecution] = useState<ExecutionRecord | null | undefined>(undefined)
  const [activeTemplate, setActiveTemplate] = useState<ExecutionTemplate | undefined>()

  function openDesigner(execution?: ExecutionRecord, template?: ExecutionTemplate) {
    setActiveExecution(execution ?? null)
    setActiveTemplate(template)
    onDesignerStateChange?.(true)
  }

  function closeDesigner() {
    setActiveExecution(undefined)
    onDesignerStateChange?.(false)
  }

  if (activeExecution !== undefined) {
    return <ExecutionCanvas execution={activeExecution ?? undefined} template={activeTemplate} onBack={closeDesigner} />
  }

  return <ExecutionLibrary activeTab={activeTab} onOpenProgram={openDesigner} onStartTemplate={(template) => openDesigner(undefined, template)} createOpen={createOpen} onCreateOpenChange={onCreateOpenChange} />
}
