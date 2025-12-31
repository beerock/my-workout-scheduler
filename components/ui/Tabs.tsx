'use client'

import React, { useState } from 'react'

export interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
}

export interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  onChange?: (tabId: string) => void
  className?: string
  children?: React.ReactNode
}

export interface TabPanelProps {
  tabId: string
  activeTab: string
  children: React.ReactNode
  className?: string
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  onChange,
  className = '',
  children,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    onChange?.(tabId)
  }

  return (
    <div className={className}>
      {/* Tab list */}
      <div className="flex gap-1 border-b border-gray-200" role="tablist">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              disabled={tab.disabled}
              onClick={() => handleTabChange(tab.id)}
              className={`
                relative px-4 py-3 font-dm-sans font-medium text-sm
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:ring-inset
                ${isActive
                  ? 'text-primary-500'
                  : 'text-gray-500 hover:text-gray-700'}
                ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Tab content */}
              <span className="flex items-center gap-2">
                {tab.icon}
                {tab.label}
              </span>

              {/* Active indicator - diagonal underline */}
              {isActive && (
                <div
                  className="absolute bottom-0 left-2 right-2 h-[3px] bg-gradient-primary"
                  style={{
                    clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)',
                  }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Tab panels */}
      {children && (
        <div className="mt-4">
          {React.Children.map(children, (child) => {
            if (React.isValidElement<TabPanelProps>(child)) {
              return React.cloneElement(child, { activeTab })
            }
            return child
          })}
        </div>
      )}
    </div>
  )
}

export const TabPanel: React.FC<TabPanelProps> = ({
  tabId,
  activeTab,
  children,
  className = '',
}) => {
  if (tabId !== activeTab) return null

  return (
    <div
      role="tabpanel"
      id={`panel-${tabId}`}
      aria-labelledby={tabId}
      className={`animate-fade-in-up ${className}`}
    >
      {children}
    </div>
  )
}

Tabs.displayName = 'Tabs'
TabPanel.displayName = 'TabPanel'
