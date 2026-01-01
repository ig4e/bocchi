import React, { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { VariableSizeList as List } from 'react-window'
import type { Champion } from '../App'
import { getChampionDisplayName, getRomanizedFirstLetter } from '../utils/championUtils'
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger
} from './ui/tooltip'

interface VirtualizedChampionListProps {
  champions: Champion[]
  selectedChampion: Champion | null
  selectedChampionKey: string | null
  onChampionSelect: (champion: Champion | null, key: string) => void
  height: number
  width: number
  isCollapsed?: boolean
}

export interface VirtualizedChampionListRef {
  scrollToLetter: (letter: string) => void
  getAvailableLetters: () => Set<string>
}

const VirtualizedChampionListComponent = forwardRef<
  VirtualizedChampionListRef,
  VirtualizedChampionListProps
>(
  (
    {
      champions,
      selectedChampion,
      selectedChampionKey,
      onChampionSelect,
      height,
      width,
      isCollapsed = false
    },
    ref
  ) => {
    const { t } = useTranslation()
    const listRef = useRef<List>(null)

    // Group champions by first letter and create letter indices
    const { groupedChampions, letterIndices, availableLetters } = React.useMemo(() => {
      const items: Array<{
        type: 'all' | 'custom' | 'divider' | 'letter' | 'champion'
        data?: Champion | string
      }> = []
      const indices: Record<string, number> = {}
      const letters = new Set<string>()

      // Add "All Champions" option
      items.push({ type: 'all' })
      items.push({ type: 'custom' })
      items.push({ type: 'divider' })

      if (isCollapsed) {
        // In collapsed mode, just add all champions without letter headers
        champions.forEach((champion) => {
          items.push({ type: 'champion', data: champion })
          const firstLetter = getRomanizedFirstLetter(champion)
          letters.add(firstLetter)
        })
      } else {
        // In expanded mode, group by letter
        let lastLetter = ''
        champions.forEach((champion) => {
          const firstLetter = getRomanizedFirstLetter(champion)
          if (firstLetter !== lastLetter) {
            indices[firstLetter] = items.length
            items.push({ type: 'letter', data: firstLetter })
            lastLetter = firstLetter
            letters.add(firstLetter)
          }
          items.push({ type: 'champion', data: champion })
        })
      }

      return { groupedChampions: items, letterIndices: indices, availableLetters: letters }
    }, [champions, isCollapsed])

    // Expose methods via ref
    useImperativeHandle(
      ref,
      () => ({
        scrollToLetter: (letter: string) => {
          if (!isCollapsed && letterIndices[letter] !== undefined && listRef.current) {
            listRef.current.scrollToItem(letterIndices[letter], 'start')
          }
        },
        getAvailableLetters: () => availableLetters
      }),
      [letterIndices, availableLetters, isCollapsed]
    )

    const getItemHeight = (index: number) => {
      const item = groupedChampions[index]
      switch (item.type) {
        case 'all':
        case 'custom':
          return 64 // Same height for both modes
        case 'divider':
          return 17 // Height for divider
        case 'letter':
          return 36 // Height for letter header (not shown in collapsed)
        case 'champion':
          return 64 // Same height for both modes
        default:
          return 0
      }
    }

    const Row = useCallback(
      ({ index, style }) => {
        const item = groupedChampions[index]

        switch (item.type) {
          case 'all':
            return (
              <div style={style}>
                {isCollapsed ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`flex items-center justify-center px-3 py-3 cursor-pointer transition-all duration-300 mx-2 my-1 rounded-xl border
                        ${
                          selectedChampion === null && selectedChampionKey === 'all'
                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 border-primary-400 scale-[1.05]'
                            : 'hover:bg-primary-500/10 text-text-primary border-transparent hover:border-primary-500/30'
                        }`}
                          onClick={() => onChampionSelect(null, 'all')}
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                            <span className="text-lg font-bold text-primary-500">A</span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipPortal>
                        <TooltipContent side="right" sideOffset={5} className="bg-surface/90 backdrop-blur-md border-border/50">
                          <p className="font-semibold">{t('champion.allChampions')}</p>
                        </TooltipContent>
                      </TooltipPortal>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <div
                    className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-all duration-300 mx-3 my-1 rounded-xl border
                  ${
                    selectedChampion === null && selectedChampionKey === 'all'
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 border-primary-400 scale-[1.02]'
                      : 'hover:bg-primary-500/10 text-text-primary border-transparent hover:border-primary-500/30'
                  }`}
                    onClick={() => onChampionSelect(null, 'all')}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedChampion === null && selectedChampionKey === 'all' ? 'bg-white/20' : 'bg-primary-500/10'
                    }`}>
                      <span className={`text-lg font-bold ${
                        selectedChampion === null && selectedChampionKey === 'all' ? 'text-white' : 'text-primary-500'
                      }`}>A</span>
                    </div>
                    <span className="text-sm font-bold">{t('champion.allChampions')}</span>
                  </div>
                )}
              </div>
            )

          case 'custom':
            return (
              <div style={style}>
                {isCollapsed ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`flex items-center justify-center px-3 py-3 cursor-pointer transition-all duration-300 mx-2 my-1 rounded-xl border
                        ${
                          selectedChampion === null && selectedChampionKey === 'custom'
                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 border-primary-400 scale-[1.05]'
                            : 'hover:bg-primary-500/10 text-text-primary border-transparent hover:border-primary-500/30'
                        }`}
                          onClick={() => onChampionSelect(null, 'custom')}
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                            <span className="text-lg font-bold text-primary-500">C</span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipPortal>
                        <TooltipContent side="right" sideOffset={5} className="bg-surface/90 backdrop-blur-md border-border/50">
                          <p className="font-semibold">{t('champion.customMods')}</p>
                        </TooltipContent>
                      </TooltipPortal>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <div
                    className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-all duration-300 mx-3 my-1 rounded-xl border
                  ${
                    selectedChampion === null && selectedChampionKey === 'custom'
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 border-primary-400 scale-[1.02]'
                      : 'hover:bg-primary-500/10 text-text-primary border-transparent hover:border-primary-500/30'
                  }`}
                    onClick={() => onChampionSelect(null, 'custom')}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedChampion === null && selectedChampionKey === 'custom' ? 'bg-white/20' : 'bg-primary-500/10'
                    }`}>
                      <span className={`text-lg font-bold ${
                        selectedChampion === null && selectedChampionKey === 'custom' ? 'text-white' : 'text-primary-500'
                      }`}>C</span>
                    </div>
                    <span className="text-sm font-bold">{t('champion.customMods')}</span>
                  </div>
                )}
              </div>
            )

          case 'divider':
            return (
              <div style={style}>
                <div className="mx-6 my-2 border-b border-border"></div>
              </div>
            )

          case 'letter':
            return (
              <div style={style}>
                <div className="px-6 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">
                  {item.data as string}
                </div>
              </div>
            )

          case 'champion': {
            const champion = item.data as Champion
            return (
              <div style={style}>
                {isCollapsed ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`flex items-center justify-center px-3 py-3 cursor-pointer transition-all duration-300 mx-2 my-1 rounded-xl border
                        ${
                          selectedChampion?.key === champion.key
                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 border-primary-400 scale-[1.05]'
                            : 'hover:bg-primary-500/10 text-text-primary border-transparent hover:border-primary-500/30'
                        }`}
                          onClick={() => onChampionSelect(champion, champion.key)}
                        >
                          <img
                            src={champion.image}
                            alt={getChampionDisplayName(champion)}
                            className="w-10 h-10 rounded-lg object-cover shadow-sm"
                            loading="lazy"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipPortal>
                        <TooltipContent side="right" sideOffset={5} className="bg-surface/90 backdrop-blur-md border-border/50">
                          <p className="font-bold">{champion.name}</p>
                          <p className="text-[10px] text-text-muted uppercase tracking-wider">{champion.title}</p>
                        </TooltipContent>
                      </TooltipPortal>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <div
                    className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-all duration-300 mx-3 my-1 rounded-xl border
                  ${
                    selectedChampion?.key === champion.key
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 border-primary-400 scale-[1.02]'
                      : 'hover:bg-primary-500/10 text-text-primary border-transparent hover:border-primary-500/30'
                  }`}
                    onClick={() => onChampionSelect(champion, champion.key)}
                  >
                    <img
                      src={champion.image}
                      alt={getChampionDisplayName(champion)}
                      className="w-10 h-10 rounded-lg shadow-md"
                      loading="lazy"
                    />
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-bold truncate">{champion.name}</span>
                      <span className={`text-[10px] uppercase tracking-wider font-bold truncate ${
                        selectedChampion?.key === champion.key ? 'text-white/70' : 'text-text-muted'
                      }`}>
                        {champion.title}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          }

          default:
            return null
        }
      },
      [groupedChampions, selectedChampion, selectedChampionKey, t, onChampionSelect, isCollapsed]
    )

    // Calculate total height based on dynamic item heights
    const totalHeight = groupedChampions.reduce((sum, _, index) => sum + getItemHeight(index), 0)

    return (
      <List
        ref={listRef}
        height={Math.min(height, totalHeight)}
        itemCount={groupedChampions.length}
        itemSize={getItemHeight}
        width={width}
        className="scrollbar-thin scrollbar-thumb-charcoal-300 dark:scrollbar-thumb-charcoal-700 scrollbar-track-transparent"
        style={{ overflow: 'auto' }}
      >
        {Row}
      </List>
    )
  }
)

// Add display name for debugging
VirtualizedChampionListComponent.displayName = 'VirtualizedChampionList'

// Export the component
export const VirtualizedChampionList = VirtualizedChampionListComponent
