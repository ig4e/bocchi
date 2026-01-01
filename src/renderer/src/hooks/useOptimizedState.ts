import { useCallback, useMemo } from 'react'
import { useAtomValue } from 'jotai'
import {
  displaySkinsAtom,
  filteredChampionsAtom,
  allChampionTagsAtom,
  skinStatsAtom,
  downloadedCountAtom,
  totalCountAtom
} from '../store/atoms/computed.atoms'

export const useDisplaySkins = () => {
  return useAtomValue(displaySkinsAtom)
}

export const useFilteredChampions = () => {
  return useAtomValue(filteredChampionsAtom)
}

export const useAllChampionTags = () => {
  return useAtomValue(allChampionTagsAtom)
}

export const useSkinStats = () => {
  return useAtomValue(skinStatsAtom)
}

export const useDownloadedCount = () => {
  return useAtomValue(downloadedCountAtom)
}

export const useTotalCount = () => {
  return useAtomValue(totalCountAtom)
}

// Memoized style objects
export const useStyles = () => {
  return useMemo(
    () => ({
      toastStyle: {
        background: 'rgba(var(--color-surface-rgb), 0.8)',
        backdropFilter: 'blur(12px)',
        color: 'var(--color-text-primary)',
        border: '1px solid rgba(var(--color-border-rgb), 0.3)',
        borderRadius: '12px'
      },
      dropOverlay: {
        className:
          'fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 pointer-events-none transition-all duration-300'
      },
      mainContainer: {
        className:
          'flex flex-col h-screen pt-10 bg-background text-text-primary overflow-hidden transition-colors duration-200 relative'
      },
      toolsModalOverlay: {
        className:
          'fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300'
      },
      toolsModalContent: {
        className:
          'bg-surface/90 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-border/30 animate-in zoom-in-95 duration-300'
      },
      progressBar: {
        className: 'w-full bg-secondary-100/50 dark:bg-secondary-700/50 rounded-full h-3 overflow-hidden border border-border/20'
      },
      downloadButton: {
        className:
          'w-full px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 active:scale-[0.98]'
      },
      searchInput: {
        className:
          'flex-1 px-4 py-2.5 text-sm bg-surface/50 backdrop-blur-sm border border-border/50 rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200'
      },
      skinSearchInput: {
        className:
          'flex-1 px-5 py-3 bg-surface/50 backdrop-blur-sm border border-border/50 rounded-2xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200 shadow-lg shadow-black/5'
      },
      manageButton: {
        className:
          'px-4 py-2.5 text-sm bg-surface/50 backdrop-blur-sm hover:bg-primary-500/10 text-text-primary font-semibold rounded-xl transition-all duration-200 border border-border/50 hover:border-primary-500/50 shadow-sm hover:shadow-md flex items-center gap-2'
      },
      collapseButton: {
        className:
          'px-2 py-2.5 text-sm bg-surface/50 backdrop-blur-sm hover:bg-secondary-100 dark:hover:bg-secondary-800 text-text-primary rounded-xl transition-all duration-200 border border-border/50 hover:border-border-strong'
      }
    }),
    []
  )
}

// Memoized className generators
export const useClassNames = () => {
  const getChampionColumnClass = useCallback((collapsed: boolean) => {
    return `${collapsed ? 'w-24' : 'w-80'} bg-surface/30 backdrop-blur-md border-r border-border/50 flex flex-col transition-all duration-500 ease-in-out z-10`
  }, [])

  const getChampionHeaderClass = useCallback((collapsed: boolean) => {
    return `${collapsed ? 'p-3' : 'p-6'} flex items-center ${collapsed ? 'justify-center' : 'gap-3'} border-b border-border/30`
  }, [])

  const getProgressBarFillStyle = useCallback(
    (progress: number) => ({
      width: `${progress}%`
    }),
    []
  )

  return {
    getChampionColumnClass,
    getChampionHeaderClass,
    getProgressBarFillStyle
  }
}

// Stable filter reset object
export const DEFAULT_FILTERS = {
  downloadStatus: 'all' as const,
  chromaStatus: 'all' as const,
  championTags: [] as string[],
  sortBy: 'name-asc' as const,
  rarity: 'all' as const
}
