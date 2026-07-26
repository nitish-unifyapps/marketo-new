import { useState } from 'react'
import type { BuilderKind, ContentTabKey } from '../../types/content'
import { AssetLibraryView } from './AssetLibraryView'
import { EmailBuilder } from './EmailBuilder'
import { FormBuilder } from './FormBuilder'
import { VisualBuilder } from './VisualBuilder'

interface ContentModuleProps {
  activeTab: ContentTabKey
  onBuilderStateChange?: (isOpen: boolean) => void
}

export function ContentModule({ activeTab, onBuilderStateChange }: ContentModuleProps) {
  const [builder, setBuilder] = useState<BuilderKind | null>(null)

  function openBuilder(nextBuilder: BuilderKind) {
    setBuilder(nextBuilder)
    onBuilderStateChange?.(true)
  }

  function closeBuilder() {
    setBuilder(null)
    onBuilderStateChange?.(false)
  }

  if (builder === 'form') return <FormBuilder onBack={closeBuilder} />
  if (builder === 'email') return <EmailBuilder onBack={closeBuilder} />
  if (builder === 'landing-page') {
    return <VisualBuilder kind='landing-page' onBack={closeBuilder} />
  }

  return <AssetLibraryView activeTab={activeTab} onOpenBuilder={openBuilder} />
}
