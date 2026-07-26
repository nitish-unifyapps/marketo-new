import type { ContentAsset } from '../../types/content'

const iconByType: Record<ContentAsset['type'], string> = {
  Email: '✉',
  'Landing Page': '▤',
  Form: '☷',
  Snippet: '❝',
  Template: '▦',
  Image: '◇',
  File: '▱',
}

interface AssetCardProps {
  asset: ContentAsset
  onOpen: (asset: ContentAsset) => void
}

export function AssetCard({ asset, onOpen }: AssetCardProps) {
  return (
    <article className='assetCard' tabIndex={0} onDoubleClick={() => onOpen(asset)}>
      <button
        type='button'
        className={`assetThumbnail tone-${asset.thumbnailTone}`}
        onClick={() => onOpen(asset)}
        aria-label={`Open ${asset.name}`}
      >
        {asset.type === 'Email' || asset.type === 'Landing Page' ? (
          <span className='thumbnailMockup' aria-hidden='true'>
            <i />
            <b />
            <i />
            <i />
          </span>
        ) : (
          <span className='thumbnailTypeIcon' aria-hidden='true'>{iconByType[asset.type]}</span>
        )}
      </button>

      <div className='assetCardBody'>
        <div className='assetCardTitleRow'>
          <span className='assetTypeIcon' aria-hidden='true'>{iconByType[asset.type]}</span>
          <button type='button' className='assetName' onClick={() => onOpen(asset)}>
            {asset.name}
          </button>
          <button type='button' className='assetMore' aria-label={`More actions for ${asset.name}`}>•••</button>
        </div>
        <div className='assetMeta'>
          <span>{asset.type}</span>
          <span>Modified {asset.modified}</span>
        </div>
        <div className='assetCardFooter'>
          <span className={`assetStatus status-${asset.status.toLowerCase()}`}>{asset.status}</span>
          <div className='assetTags' aria-label='Tags'>
            {asset.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </div>
      </div>
    </article>
  )
}
