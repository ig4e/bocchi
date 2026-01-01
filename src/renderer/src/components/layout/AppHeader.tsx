import { memo } from 'react'
import { Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAtom, useAtomValue } from 'jotai'
import { gamePathAtom } from '../../store/atoms/game.atoms'
import { championDataAtom } from '../../store/atoms/champion.atoms'
import { showFavoritesOnlyAtom } from '../../store/atoms'
import { showSettingsDialogAtom } from '../../store/atoms/ui.atoms'
import {
  leagueClientEnabledAtom,
  championDetectionEnabledAtom
} from '../../store/atoms/settings.atoms'
import { lcuConnectedAtom, isInChampSelectAtom } from '../../store/atoms/lcu.atoms'
import { useGameDetection } from '../../hooks/useGameDetection'
import { useChampionData } from '../../hooks/useChampionData'
import { LCUStatusIndicator } from '../LCUStatusIndicator'
import { RoomPanel } from '../RoomPanel'

export const AppHeader = memo(() => {
  const { t } = useTranslation()
  const gamePath = useAtomValue(gamePathAtom)
  const championData = useAtomValue(championDataAtom)
  const [showFavoritesOnly, setShowFavoritesOnly] = useAtom(showFavoritesOnlyAtom)
  const [, setShowSettingsDialog] = useAtom(showSettingsDialogAtom)
  const leagueClientEnabled = useAtomValue(leagueClientEnabledAtom)
  const championDetectionEnabled = useAtomValue(championDetectionEnabledAtom)
  const lcuConnected = useAtomValue(lcuConnectedAtom)
  const isInChampSelect = useAtomValue(isInChampSelectAtom)

  const { browseForGame } = useGameDetection()
  const { fetchChampionData, isLoadingChampionData } = useChampionData()

  const loading = isLoadingChampionData

  return (
    <div className="flex items-center justify-between px-8 py-6 bg-background/50 backdrop-blur-sm border-b border-border/40 shadow-sm relative z-40">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-2 flex-1 max-w-md group">
          <div className="relative flex-1">
            <input
              type="text"
              value={gamePath}
              placeholder="Game path not set"
              readOnly
              className="w-full pl-4 pr-10 py-2.5 text-sm bg-surface/50 border border-border/50 rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all duration-300"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className={`w-2 h-2 rounded-full ${gamePath ? 'bg-success' : 'bg-warning'} shadow-sm`} />
            </div>
          </div>
          <button
            className="px-5 py-2.5 text-sm bg-surface hover:bg-primary-500/10 text-text-primary hover:text-primary-500 font-bold rounded-xl transition-all duration-300 border border-border/50 hover:border-primary-500/30 shadow-sm active:scale-95 disabled:opacity-50"
            onClick={browseForGame}
            disabled={loading}
          >
            {t('actions.browse')}
          </button>
        </div>
        <div className="h-8 w-[1px] bg-border/30 mx-2" />

        <button
          className={`px-5 py-2.5 text-sm rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center gap-2.5 font-bold shadow-sm active:scale-95
            ${
              showFavoritesOnly
                ? 'bg-error/10 text-error border border-error/20'
                : 'bg-surface text-text-primary hover:bg-error/5 hover:text-error border border-border/50 hover:border-error/20'
            }`}
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          disabled={loading}
          aria-pressed={showFavoritesOnly}
        >
          <Heart
            className={`w-4 h-4 ${
              showFavoritesOnly ? 'fill-error' : 'fill-none'
            } transition-all duration-300`}
            strokeWidth={2.5}
          />
          {t('nav.favorites')}
        </button>
        {!championData && (
          <button
            className="px-6 py-2.5 text-sm bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-primary-500/20 active:scale-95 disabled:opacity-50"
            onClick={fetchChampionData}
            disabled={loading}
          >
            {t('champion.downloadData')}
          </button>
        )}
        <LCUStatusIndicator
          connected={lcuConnected}
          inChampSelect={isInChampSelect}
          enabled={leagueClientEnabled && championDetectionEnabled}
        />
        <button
          className="p-2.5 bg-surface hover:bg-primary-500/10 text-text-secondary hover:text-primary-500 rounded-xl transition-all duration-300 border border-border/50 hover:border-primary-500/30 shadow-sm active:scale-95"
          onClick={() => setShowSettingsDialog(true)}
          title={t('settings.title')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
        <RoomPanel />
      </div>
    </div>
  )
})

AppHeader.displayName = 'AppHeader'
