import React, { useState } from 'react'

// 资产类型枚举
export enum AssetType {
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  ERC1155 = 'erc1155'
}

// 资产类型配置
export const ASSET_TYPE_CONFIG = {
  [AssetType.ERC20]: {
    label: 'ERC20',
    icon: '🪙',
    description: '同质化代币'
  },
  [AssetType.ERC721]: {
    label: 'ERC721',
    icon: '🖼️',
    description: 'NFT收藏品'
  },
  [AssetType.ERC1155]: {
    label: 'ERC1155',
    icon: '🎮',
    description: '多代币标准'
  }
}

// 价格 Tab 类型
export type PriceTabType = 'price' | 'floor_price' | 'collection'

// 价格 Tab 配置
export const PRICE_TAB_CONFIG = {
  price: {
    label: '价格',
    key: 'price' as PriceTabType
  },
  floor_price: {
    label: '地板价',
    key: 'floor_price' as PriceTabType
  },
  collection: {
    label: 'collection',
    key: 'collection' as PriceTabType
  }
}

// 数量统计接口
export interface AssetCounts {
  erc20: number
  erc721: number
  erc1155: number
}

// 组件 Props 接口
export interface AssetCategoryTabsProps {
  // 当前选中的资产类型
  selectedAssetType?: AssetType
  // 当前选中的价格 Tab
  selectedPriceTab?: PriceTabType
  // 资产类型切换回调
  onAssetTypeChange?: (type: AssetType) => void
  // 价格 Tab 切换回调
  onPriceTabChange?: (tab: PriceTabType) => void
  // 是否显示价格 Tab (ERC721/ERC1155 才显示)
  showPriceTabs?: boolean
  // 自定义样式
  className?: string
  // 禁用状态
  disabled?: boolean
  // 资产数量统计
  assetCounts?: AssetCounts
}

// 资产分类和价格 Tab 组件
export const AssetCategoryTabs: React.FC<AssetCategoryTabsProps> = ({
  selectedAssetType = AssetType.ERC20,
  selectedPriceTab = 'price',
  onAssetTypeChange,
  onPriceTabChange,
  showPriceTabs = true,
  className = '',
  disabled = false,
  assetCounts = { erc20: 0, erc721: 0, erc1155: 0 }
}) => {
  const [currentAssetType, setCurrentAssetType] = useState<AssetType>(selectedAssetType)
  const [currentPriceTab, setCurrentPriceTab] = useState<PriceTabType>(selectedPriceTab)

  // 处理资产类型切换
  const handleAssetTypeChange = (type: AssetType) => {
    if (disabled) return

    setCurrentAssetType(type)
    onAssetTypeChange?.(type)

    // 切换到 NFT 类型时，自动切换到对应的价格 Tab
    if ((type === AssetType.ERC721 || type === AssetType.ERC1155) && showPriceTabs) {
      const newPriceTab = type === AssetType.ERC721 ? 'floor_price' : 'price'
      setCurrentPriceTab(newPriceTab)
      onPriceTabChange?.(newPriceTab)
    }
  }

  // 处理价格 Tab 切换
  const handlePriceTabChange = (tab: PriceTabType) => {
    if (disabled) return

    setCurrentPriceTab(tab)
    onPriceTabChange?.(tab)
  }

  // 判断当前是否为 NFT 类型
  const isNFTType = currentAssetType === AssetType.ERC721 || currentAssetType === AssetType.ERC1155

  return (
    <div className={`asset-category-tabs ${className}`} style={{
      width: '100%',
      backgroundColor: '#ffffff'
    }}>
      {/* 资产类型选择器 */}
      <div style={{
        display: 'flex',
        backgroundColor: '#f3f4f6',
        borderRadius: '8px',
        padding: '4px',
        marginBottom: '12px'
      }}>
        {Object.values(AssetType).map((type) => {
          const config = ASSET_TYPE_CONFIG[type]
          const isActive = currentAssetType === type

          // 获取对应类型的数量
          const getCount = () => {
            switch (type) {
              case AssetType.ERC20: return assetCounts.erc20
              case AssetType.ERC721: return assetCounts.erc721
              case AssetType.ERC1155: return assetCounts.erc1155
              default: return 0
            }
          }

          const count = getCount()

          return (
            <button
              key={type}
              onClick={() => handleAssetTypeChange(type)}
              disabled={disabled}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 12px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: disabled ? 'not-allowed' : 'pointer',
                backgroundColor: isActive ? '#ffffff' : 'transparent',
                color: isActive ? '#1f2937' : '#6b7280',
                boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (!disabled && !isActive) {
                  e.currentTarget.style.backgroundColor = '#e5e7eb'
                }
              }}
              onMouseOut={(e) => {
                if (!disabled && !isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              <span style={{ fontSize: '16px' }}>{config.icon}</span>
              <span>{config.label}</span>
              {count > 0 && (
                <span style={{
                  backgroundColor: isActive ? '#3b82f6' : '#9ca3af',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  minWidth: '18px',
                  textAlign: 'center'
                }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 价格 Tab (仅在 NFT 类型且启用时显示) */}
      {showPriceTabs && isNFTType && (
        <div style={{
          display: 'flex',
          backgroundColor: '#f9fafb',
          borderRadius: '6px',
          padding: '2px'
        }}>
          {Object.values(PRICE_TAB_CONFIG).map((tab) => {
            const isActive = currentPriceTab === tab.key

            return (
              <button
                key={tab.key}
                onClick={() => handlePriceTabChange(tab.key)}
                disabled={disabled}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  backgroundColor: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? '#059669' : '#6b7280',
                  boxShadow: isActive ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  if (!disabled && !isActive) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6'
                  }
                }}
                onMouseOut={(e) => {
                  if (!disabled && !isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      )}

      {/* 当前选择描述 */}
      <div style={{
        marginTop: '8px',
        fontSize: '12px',
        color: '#6b7280',
        textAlign: 'center'
      }}>
        {ASSET_TYPE_CONFIG[currentAssetType].description}
        {showPriceTabs && isNFTType && (
          <span style={{ marginLeft: '4px' }}>
            • {PRICE_TAB_CONFIG[currentPriceTab]?.label}
          </span>
        )}
      </div>
    </div>
  )
}

export default AssetCategoryTabs