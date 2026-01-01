import { useAtom, useSetAtom } from 'jotai'
import {
  ChevronDown,
  Gamepad2,
  Package,
  Settings,
  Monitor,
  RefreshCw,
  Trash2,
  Wrench,
  Download,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { showUpdateDialogAtom, appVersionAtom } from '../store/atoms/game.atoms'
import { isCheckingForUpdatesAtom } from '../store/atoms/ui.atoms'
import { Button } from './ui/button'
import { Input } from './ui/input'
import {
  autoAcceptEnabledAtom,
  autoRandomFavoriteSkinEnabledAtom,
  autoRandomRaritySkinEnabledAtom,
  autoRandomHighestWinRateSkinEnabledAtom,
  autoRandomHighestPickRateSkinEnabledAtom,
  autoRandomMostPlayedSkinEnabledAtom,
  autoViewSkinsEnabledAtom
} from '../store/atoms/lcu.atoms'
import {
  autoApplyEnabledAtom,
  autoApplyTriggerTimeAtom,
  championDetectionEnabledAtom,
  leagueClientEnabledAtom,
  smartApplyEnabledAtom
} from '../store/atoms/settings.atoms'
import { AutoBanPickSettings } from './AutoBanPickSettings'
import { RepositorySettings } from './RepositorySettings'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog'
import { Label } from './ui/label'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Slider } from './ui/slider'
import { Switch } from './ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  onLeagueClientChange?: (enabled: boolean) => void
  onChampionDetectionChange?: (enabled: boolean) => void
}

export function SettingsDialog({
  isOpen,
  onClose,
  onLeagueClientChange,
  onChampionDetectionChange
}: SettingsDialogProps) {
  const { t } = useTranslation()
  const appVersion = useAtom(appVersionAtom)[0]
  const setShowUpdateDialog = useSetAtom(showUpdateDialogAtom)
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useAtom(isCheckingForUpdatesAtom)
  const [leagueClientEnabled, setLeagueClientEnabled] = useState(true)
  const [championDetection, setChampionDetection] = useState(true)
  const [autoViewSkinsEnabled, setAutoViewSkinsEnabled] = useState(false)
  const [smartApplyEnabled, setSmartApplyEnabled] = useState(true)
  const [autoApplyEnabled, setAutoApplyEnabled] = useState(true)
  const [autoApplyTriggerTime, setAutoApplyTriggerTime] = useState(15)
  const [autoRandomSkinEnabled, setAutoRandomSkinEnabled] = useState(false)
  const [autoRandomRaritySkinEnabled, setAutoRandomRaritySkinEnabled] = useState(false)
  const [autoRandomFavoriteSkinEnabled, setAutoRandomFavoriteSkinEnabled] = useState(false)
  const [autoRandomHighestWinRateSkinEnabled, setAutoRandomHighestWinRateSkinEnabled] =
    useState(false)
  const [autoRandomHighestPickRateSkinEnabled, setAutoRandomHighestPickRateSkinEnabled] =
    useState(false)
  const [autoRandomMostPlayedSkinEnabled, setAutoRandomMostPlayedSkinEnabled] = useState(false)
  const [allowMultipleSkinsPerChampion, setAllowMultipleSkinsPerChampion] = useState(false)
  const [inGameOverlayEnabled, setInGameOverlayEnabled] = useState(false)
  const [autoAcceptEnabled, setAutoAcceptEnabled] = useState(false)
  const [autoFixModIssues, setAutoFixModIssues] = useState(false)
  const [minimizeToTray, setMinimizeToTray] = useState(false)
  const [autoExtractImages, setAutoExtractImages] = useState(false)
  const [modToolsTimeout, setModToolsTimeout] = useState(300) // Default 300 seconds
  const [loading, setLoading] = useState(true)
  const [cacheInfo, setCacheInfo] = useState<{
    exists: boolean
    modCount: number
    sizeInMB: number
  } | null>(null)
  const [isClearingCache, setIsClearingCache] = useState(false)

  // CSLoL Tools state
  const [cslolVersion, setCslolVersion] = useState<string>('')
  const [latestCslolVersion, setLatestCslolVersion] = useState<string | null>(null)
  const [isCheckingCslolUpdate, setIsCheckingCslolUpdate] = useState(false)
  const [isUpdatingCslol, setIsUpdatingCslol] = useState(false)
  const [cslolDownloadProgress, setCslolDownloadProgress] = useState(0)

  // Atom setters for immediate updates
  const setLeagueClientEnabledAtom = useSetAtom(leagueClientEnabledAtom)
  const setChampionDetectionEnabledAtom = useSetAtom(championDetectionEnabledAtom)
  const setAutoViewSkinsEnabledAtom = useSetAtom(autoViewSkinsEnabledAtom)
  const setAutoRandomRaritySkinEnabledAtom = useSetAtom(autoRandomRaritySkinEnabledAtom)
  const setAutoRandomFavoriteSkinEnabledAtom = useSetAtom(autoRandomFavoriteSkinEnabledAtom)
  const setAutoRandomHighestWinRateSkinEnabledAtom = useSetAtom(
    autoRandomHighestWinRateSkinEnabledAtom
  )
  const setAutoRandomHighestPickRateSkinEnabledAtom = useSetAtom(
    autoRandomHighestPickRateSkinEnabledAtom
  )
  const setAutoRandomMostPlayedSkinEnabledAtom = useSetAtom(autoRandomMostPlayedSkinEnabledAtom)
  const setSmartApplyEnabledAtom = useSetAtom(smartApplyEnabledAtom)
  const setAutoApplyEnabledAtom = useSetAtom(autoApplyEnabledAtom)
  const setAutoApplyTriggerTimeAtom = useSetAtom(autoApplyTriggerTimeAtom)
  const setAutoAcceptEnabledAtom = useSetAtom(autoAcceptEnabledAtom)

  useEffect(() => {
    if (isOpen) {
      loadSettings()
      loadCacheInfo()
      loadCslolVersion()
    }
  }, [isOpen])

  useEffect(() => {
    const unsubscribeProgress = window.api.onToolsDownloadProgress((progress) => {
      setCslolDownloadProgress(progress)
    })

    return () => {
      unsubscribeProgress()
    }
  }, [])

  const loadCslolVersion = async () => {
    try {
      const result = await window.api.getCslolToolsVersion()
      if (result.success && result.version) {
        setCslolVersion(result.version)
      }
    } catch (error) {
      console.error('Failed to load CSLoL version:', error)
    }
  }

  const handleSaveCslolVersion = async () => {
    try {
      const result = await window.api.setCslolToolsVersion(cslolVersion)
      if (result.success) {
        toast.success(t('settings.cslol.versionSaved', 'Version saved successfully'))
      } else {
        toast.error(t('settings.cslol.versionSaveError', 'Failed to save version'))
      }
    } catch (error) {
      console.error('Failed to save CSLoL version:', error)
      toast.error(t('settings.cslol.versionSaveError', 'Failed to save version'))
    }
  }

  const handleCheckCslolUpdate = async () => {
    setIsCheckingCslolUpdate(true)
    try {
      const result = await window.api.checkCslolToolsUpdate()
      if (result.success) {
        setLatestCslolVersion(result.latestVersion || null)
        if (result.updateAvailable) {
          toast.info(t('settings.cslol.updateAvailable', 'Update available!'))
        } else {
          toast.success(t('settings.cslol.upToDate', 'CSLoL tools are up to date'))
        }
      }
    } catch (error) {
      console.error('Failed to check CSLoL update:', error)
    } finally {
      setIsCheckingCslolUpdate(false)
    }
  }

  const handleUpdateCslol = async (version?: string) => {
    setIsUpdatingCslol(true)
    setCslolDownloadProgress(0)
    try {
      const result = await window.api.downloadTools(version)
      if (result.success) {
        toast.success('CSLoL tools updated successfully!')
        loadCslolVersion()
      } else {
        toast.error(result.error || 'Failed to update CSLoL tools')
      }
    } catch (error) {
      console.error('Failed to update CSLoL tools:', error)
      toast.error('Failed to update CSLoL tools')
    } finally {
      setIsUpdatingCslol(false)
    }
  }

  // Listen for settings changes from tray menu
  useEffect(() => {
    const handleSettingsChanged = (key: string, value: unknown) => {
      const boolValue = typeof value === 'boolean' ? value : false
      switch (key) {
        case 'leagueClientEnabled':
          setLeagueClientEnabled(boolValue)
          setLeagueClientEnabledAtom(boolValue)
          onLeagueClientChange?.(boolValue)
          break
        case 'autoAcceptEnabled':
          setAutoAcceptEnabled(boolValue)
          setAutoAcceptEnabledAtom(boolValue)
          break
        case 'championDetection':
          setChampionDetection(boolValue)
          setChampionDetectionEnabledAtom(boolValue)
          onChampionDetectionChange?.(boolValue)
          break
        case 'autoViewSkinsEnabled':
          setAutoViewSkinsEnabled(boolValue)
          setAutoViewSkinsEnabledAtom(boolValue)
          break
        case 'smartApplyEnabled':
          setSmartApplyEnabled(boolValue)
          setSmartApplyEnabledAtom(boolValue)
          break
        case 'autoApplyEnabled':
          setAutoApplyEnabled(boolValue)
          setAutoApplyEnabledAtom(boolValue)
          break
        case 'minimizeToTray':
          setMinimizeToTray(boolValue)
          break
        case 'autoExtractImages':
          setAutoExtractImages(boolValue)
          break
      }
    }

    const unsubscribe = window.api.onSettingsChanged(handleSettingsChanged)
    return () => unsubscribe()
  }, [
    setLeagueClientEnabledAtom,
    setChampionDetectionEnabledAtom,
    setAutoViewSkinsEnabledAtom,
    setAutoAcceptEnabledAtom,
    setSmartApplyEnabledAtom,
    setAutoApplyEnabledAtom,
    onLeagueClientChange,
    onChampionDetectionChange
  ])

  const loadSettings = async () => {
    try {
      const settingsData = await window.api.getSettings()
      // Cast to record type for safe property access
      const settings = settingsData as Record<string, unknown>
      // Default to true if not set (except autoViewSkins which defaults to false)
      setLeagueClientEnabled((settings.leagueClientEnabled as boolean | undefined) !== false)
      setChampionDetection((settings.championDetection as boolean | undefined) !== false)
      setAutoViewSkinsEnabled((settings.autoViewSkinsEnabled as boolean | undefined) === true)
      setSmartApplyEnabled((settings.smartApplyEnabled as boolean | undefined) !== false)
      setAutoApplyEnabled((settings.autoApplyEnabled as boolean | undefined) !== false)
      setAutoApplyTriggerTime((settings.autoApplyTriggerTime as number | undefined) || 15)
      setAutoRandomSkinEnabled((settings.autoRandomSkinEnabled as boolean | undefined) === true)
      setAutoRandomRaritySkinEnabled(
        (settings.autoRandomRaritySkinEnabled as boolean | undefined) === true
      )
      setAutoRandomFavoriteSkinEnabled(
        (settings.autoRandomFavoriteSkinEnabled as boolean | undefined) === true
      )
      setAutoRandomHighestWinRateSkinEnabled(
        (settings.autoRandomHighestWinRateSkinEnabled as boolean | undefined) === true
      )
      setAutoRandomHighestPickRateSkinEnabled(
        (settings.autoRandomHighestPickRateSkinEnabled as boolean | undefined) === true
      )
      setAutoRandomMostPlayedSkinEnabled(
        (settings.autoRandomMostPlayedSkinEnabled as boolean | undefined) === true
      )
      setAllowMultipleSkinsPerChampion(
        (settings.allowMultipleSkinsPerChampion as boolean | undefined) === true
      )
      setInGameOverlayEnabled((settings.inGameOverlayEnabled as boolean | undefined) === true)
      setAutoAcceptEnabled((settings.autoAcceptEnabled as boolean | undefined) === true)
      setAutoFixModIssues((settings.autoFixModIssues as boolean | undefined) === true)
      setMinimizeToTray((settings.minimizeToTray as boolean | undefined) === true)
      setAutoExtractImages((settings.autoExtractImages as boolean | undefined) === true)
      setModToolsTimeout((settings.modToolsTimeout as number | undefined) || 300) // Default 300 seconds
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLeagueClientChange = async (checked: boolean) => {
    setLeagueClientEnabled(checked)
    setLeagueClientEnabledAtom(checked) // Update atom immediately
    try {
      await window.api.setSettings('leagueClientEnabled', checked)

      // If disabling League Client, disable all sub-features
      if (!checked) {
        setChampionDetection(false)
        setAutoViewSkinsEnabled(false)
        setSmartApplyEnabled(false)
        setAutoApplyEnabled(false)
        setAutoRandomSkinEnabled(false)
        setAutoRandomRaritySkinEnabled(false)
        setAutoRandomFavoriteSkinEnabled(false)
        setAutoRandomHighestWinRateSkinEnabled(false)
        setAutoRandomHighestPickRateSkinEnabled(false)
        setAutoRandomMostPlayedSkinEnabled(false)
        setInGameOverlayEnabled(false)
        setAutoAcceptEnabled(false)

        // Update atoms immediately
        setChampionDetectionEnabledAtom(false)
        setAutoViewSkinsEnabledAtom(false)
        setAutoRandomRaritySkinEnabledAtom(false)
        setAutoRandomFavoriteSkinEnabledAtom(false)
        setAutoRandomHighestWinRateSkinEnabledAtom(false)
        setAutoRandomHighestPickRateSkinEnabledAtom(false)
        setAutoRandomMostPlayedSkinEnabledAtom(false)
        setAutoAcceptEnabledAtom(false)

        await window.api.setSettings('championDetection', false)
        await window.api.setSettings('autoViewSkinsEnabled', false)
        await window.api.setSettings('smartApplyEnabled', false)
        await window.api.setSettings('autoApplyEnabled', false)
        await window.api.setSettings('autoRandomSkinEnabled', false)
        await window.api.setSettings('autoRandomRaritySkinEnabled', false)
        await window.api.setSettings('autoRandomFavoriteSkinEnabled', false)
        await window.api.setSettings('autoRandomHighestWinRateSkinEnabled', false)
        await window.api.setSettings('autoRandomHighestPickRateSkinEnabled', false)
        await window.api.setSettings('autoRandomMostPlayedSkinEnabled', false)
        await window.api.setSettings('inGameOverlayEnabled', false)
        await window.api.setSettings('autoAcceptEnabled', false)

        // Disconnect LCU
        await window.api.lcuDisconnect()

        // Notify parent about changes
        onLeagueClientChange?.(false)
        onChampionDetectionChange?.(false)
      } else {
        // Reconnect LCU
        await window.api.lcuConnect()

        // Notify parent about change
        onLeagueClientChange?.(true)
      }
    } catch (error) {
      console.error('Failed to save League Client setting:', error)
    }
  }

  const handleChampionDetectionChange = async (checked: boolean) => {
    setChampionDetection(checked)
    setChampionDetectionEnabledAtom(checked) // Update atom immediately
    try {
      await window.api.setSettings('championDetection', checked)

      // If disabling champion detection, also disable dependent features
      if (!checked) {
        setAutoViewSkinsEnabled(false)
        setAutoRandomSkinEnabled(false)
        setAutoRandomRaritySkinEnabled(false)
        setAutoRandomFavoriteSkinEnabled(false)
        setInGameOverlayEnabled(false)

        // Update atoms immediately
        setAutoViewSkinsEnabledAtom(false)
        setAutoRandomRaritySkinEnabledAtom(false)
        setAutoRandomFavoriteSkinEnabledAtom(false)
        await window.api.setSettings('autoViewSkinsEnabled', false)
        await window.api.setSettings('autoRandomSkinEnabled', false)
        await window.api.setSettings('autoRandomRaritySkinEnabled', false)
        await window.api.setSettings('autoRandomFavoriteSkinEnabled', false)
        await window.api.setSettings('inGameOverlayEnabled', false)

        // Destroy overlay if it exists
        await window.api.destroyOverlay()
      }

      // Notify the parent component
      onChampionDetectionChange?.(checked)
    } catch (error) {
      console.error('Failed to save champion detection setting:', error)
    }
  }

  const handleAutoViewSkinsChange = async (checked: boolean) => {
    setAutoViewSkinsEnabled(checked)
    setAutoViewSkinsEnabledAtom(checked) // Update atom immediately
    try {
      await window.api.setSettings('autoViewSkinsEnabled', checked)
    } catch (error) {
      console.error('Failed to save auto view skins setting:', error)
    }
  }

  const handleSmartApplyChange = async (checked: boolean) => {
    setSmartApplyEnabled(checked)
    setSmartApplyEnabledAtom(checked) // Update atom immediately
    try {
      await window.api.setSettings('smartApplyEnabled', checked)

      // If disabling smart apply, also disable auto apply
      if (!checked && autoApplyEnabled) {
        setAutoApplyEnabled(false)
        setAutoApplyEnabledAtom(false)
        await window.api.setSettings('autoApplyEnabled', false)
      }
    } catch (error) {
      console.error('Failed to save smart apply setting:', error)
    }
  }

  const handleAutoApplyChange = async (checked: boolean) => {
    setAutoApplyEnabled(checked)
    setAutoApplyEnabledAtom(checked) // Update atom immediately
    try {
      await window.api.setSettings('autoApplyEnabled', checked)
    } catch (error) {
      console.error('Failed to save auto apply setting:', error)
    }
  }

  const handleAutoApplyTriggerTimeChange = async (value: number[]) => {
    const time = value[0]
    setAutoApplyTriggerTime(time)
    setAutoApplyTriggerTimeAtom(time)
    try {
      await window.api.setSettings('autoApplyTriggerTime', time)
    } catch (error) {
      console.error('Failed to save auto apply trigger time setting:', error)
    }
  }

  const handleAllowMultipleSkinsPerChampionChange = async (checked: boolean) => {
    setAllowMultipleSkinsPerChampion(checked)
    try {
      await window.api.setSettings('allowMultipleSkinsPerChampion', checked)
    } catch (error) {
      console.error('Failed to save allow multiple skins per champion setting:', error)
    }
  }

  const handleInGameOverlayChange = async (checked: boolean) => {
    setInGameOverlayEnabled(checked)
    try {
      await window.api.setSettings('inGameOverlayEnabled', checked)

      // If enabling, create and attach overlay immediately
      if (checked) {
        await window.api.createOverlay()
      } else {
        // If disabling, destroy overlay
        await window.api.destroyOverlay()
      }
    } catch (error) {
      console.error('Failed to save in-game overlay setting:', error)
    }
  }

  const handleAutoAcceptChange = async (checked: boolean) => {
    setAutoAcceptEnabled(checked)
    setAutoAcceptEnabledAtom(checked) // Update atom immediately
    try {
      await window.api.setSettings('autoAcceptEnabled', checked)
    } catch (error) {
      console.error('Failed to save auto accept setting:', error)
    }
  }

  // Determine which random skin option is selected
  const getRandomSkinValue = () => {
    if (autoRandomFavoriteSkinEnabled) return 'favorite'
    if (autoRandomRaritySkinEnabled) return 'rarity'
    if (autoRandomHighestWinRateSkinEnabled) return 'winrate'
    if (autoRandomHighestPickRateSkinEnabled) return 'pickrate'
    if (autoRandomMostPlayedSkinEnabled) return 'mostplayed'
    if (autoRandomSkinEnabled) return 'random'
    return 'none'
  }

  const handleRandomSkinChange = async (value: string) => {
    // First, disable all options
    setAutoRandomSkinEnabled(false)
    setAutoRandomRaritySkinEnabled(false)
    setAutoRandomFavoriteSkinEnabled(false)
    setAutoRandomHighestWinRateSkinEnabled(false)
    setAutoRandomHighestPickRateSkinEnabled(false)
    setAutoRandomMostPlayedSkinEnabled(false)
    setAutoRandomRaritySkinEnabledAtom(false)
    setAutoRandomFavoriteSkinEnabledAtom(false)
    setAutoRandomHighestWinRateSkinEnabledAtom(false)
    setAutoRandomHighestPickRateSkinEnabledAtom(false)
    setAutoRandomMostPlayedSkinEnabledAtom(false)

    await window.api.setSettings('autoRandomSkinEnabled', false)
    await window.api.setSettings('autoRandomRaritySkinEnabled', false)
    await window.api.setSettings('autoRandomFavoriteSkinEnabled', false)
    await window.api.setSettings('autoRandomHighestWinRateSkinEnabled', false)
    await window.api.setSettings('autoRandomHighestPickRateSkinEnabled', false)
    await window.api.setSettings('autoRandomMostPlayedSkinEnabled', false)

    // Then enable the selected option
    switch (value) {
      case 'random':
        setAutoRandomSkinEnabled(true)
        await window.api.setSettings('autoRandomSkinEnabled', true)
        break
      case 'rarity':
        setAutoRandomRaritySkinEnabled(true)
        setAutoRandomRaritySkinEnabledAtom(true)
        await window.api.setSettings('autoRandomRaritySkinEnabled', true)
        break
      case 'favorite':
        setAutoRandomFavoriteSkinEnabled(true)
        setAutoRandomFavoriteSkinEnabledAtom(true)
        await window.api.setSettings('autoRandomFavoriteSkinEnabled', true)
        break
      case 'winrate':
        setAutoRandomHighestWinRateSkinEnabled(true)
        setAutoRandomHighestWinRateSkinEnabledAtom(true)
        await window.api.setSettings('autoRandomHighestWinRateSkinEnabled', true)
        break
      case 'pickrate':
        setAutoRandomHighestPickRateSkinEnabled(true)
        setAutoRandomHighestPickRateSkinEnabledAtom(true)
        await window.api.setSettings('autoRandomHighestPickRateSkinEnabled', true)
        break
      case 'mostplayed':
        setAutoRandomMostPlayedSkinEnabled(true)
        setAutoRandomMostPlayedSkinEnabledAtom(true)
        await window.api.setSettings('autoRandomMostPlayedSkinEnabled', true)
        break
      case 'none':
        // Check if we should disable the overlay
        setInGameOverlayEnabled(false)
        await window.api.setSettings('inGameOverlayEnabled', false)
        await window.api.destroyOverlay()
        break
    }
  }

  const handleAutoFixModIssuesChange = async (checked: boolean) => {
    setAutoFixModIssues(checked)
    try {
      await window.api.setSettings('autoFixModIssues', checked)
    } catch (error) {
      console.error('Failed to save auto fix mod issues setting:', error)
    }
  }

  const handleMinimizeToTrayChange = async (checked: boolean) => {
    setMinimizeToTray(checked)
    try {
      await window.api.setSettings('minimizeToTray', checked)
    } catch (error) {
      console.error('Failed to save minimize to tray setting:', error)
    }
  }

  const handleAutoExtractImagesChange = async (checked: boolean) => {
    setAutoExtractImages(checked)
    try {
      await window.api.setSettings('autoExtractImages', checked)
    } catch (error) {
      console.error('Failed to save auto extract images setting:', error)
    }
  }

  const handleCheckForUpdates = useCallback(async () => {
    setIsCheckingForUpdates(true)
    try {
      const result = await window.api.checkForUpdates()
      if (result.success && result.updateInfo) {
        // Update is available, dialog will be shown automatically by the event listener
        setShowUpdateDialog(true)
        onClose() // Close settings dialog to show update dialog
      } else {
        // No update available
        toast.success(t('update.noUpdates', `You're on the latest version (v${appVersion})!`))
      }
    } catch (error) {
      console.error('Failed to check for updates:', error)
      toast.error(t('update.error', 'Failed to check for updates'))
    } finally {
      setIsCheckingForUpdates(false)
    }
  }, [appVersion, t, setIsCheckingForUpdates, setShowUpdateDialog, onClose])

  const handleModToolsTimeoutChange = async (value: number[]) => {
    const timeout = value[0]
    setModToolsTimeout(timeout)
    try {
      await window.api.setSettings('modToolsTimeout', timeout)
    } catch (error) {
      console.error('Failed to save mod tools timeout setting:', error)
    }
  }

  const loadCacheInfo = async () => {
    try {
      const result = await window.api.getCacheInfo()
      if (result.success && result.data) {
        setCacheInfo(result.data)
      }
    } catch (error) {
      console.error('Failed to load cache info:', error)
    }
  }

  const handleClearCache = async () => {
    if (!confirm(t('settings.cacheManagement.confirmClear'))) {
      return
    }

    setIsClearingCache(true)
    try {
      const result = await window.api.clearAllSkinsCache()
      if (result.success) {
        toast.success(t('settings.cacheManagement.clearSuccess'))
        // Reload cache info
        await loadCacheInfo()
      } else {
        toast.error(t('settings.cacheManagement.clearError'))
      }
    } catch (error) {
      console.error('Failed to clear cache:', error)
      toast.error(t('settings.cacheManagement.clearError'))
    } finally {
      setIsClearingCache(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden border border-white/10 bg-surface/40 backdrop-blur-xl shadow-2xl">
        <div className="relative h-32 bg-gradient-to-br from-primary-600/20 via-primary-500/10 to-transparent p-6 flex flex-col justify-end border-b border-border/50">
          <div className="absolute top-6 right-6 opacity-10">
            <Settings className="w-24 h-24 rotate-12" />
          </div>
          <DialogHeader className="relative z-10">
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold tracking-tight text-text-primary">
              <div className="p-2 rounded-xl bg-primary-500/20 text-primary-500">
                <Settings className="w-6 h-6" />
              </div>
              {t('settings.title')}
            </DialogTitle>
            <DialogDescription className="text-text-secondary font-medium ml-12">
              {t('settings.description')}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-surface/50 p-1 rounded-xl border border-border/50">
              <TabsTrigger
                value="general"
                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary-500 data-[state=active]:text-white transition-all duration-200"
              >
                <Monitor className="w-4 h-4" />
                {t('settings.tabs.general')}
              </TabsTrigger>
              <TabsTrigger
                value="league-client"
                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary-500 data-[state=active]:text-white transition-all duration-200"
              >
                <Gamepad2 className="w-4 h-4" />
                {t('settings.tabs.leagueClient')}
              </TabsTrigger>
              <TabsTrigger
                value="skin-management"
                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary-500 data-[state=active]:text-white transition-all duration-200"
              >
                <Package className="w-4 h-4" />
                {t('settings.tabs.skinManagement')}
              </TabsTrigger>
              <TabsTrigger
                value="cslol"
                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary-500 data-[state=active]:text-white transition-all duration-200"
              >
                <Wrench className="w-4 h-4" />
                {t('settings.tabs.cslol', 'CSLoL')}
              </TabsTrigger>
            </TabsList>

            <div className="mt-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              <TabsContent value="general" className="space-y-6 mt-0 outline-none">
                {/* Application Update */}
                <div className="group flex items-center justify-between space-x-4 p-4 rounded-xl bg-surface/30 border border-border/50 hover:border-primary-500/30 transition-all duration-200">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-primary-500" />
                      {t('settings.applicationUpdate.title', 'Application Updates')}
                    </h3>
                    <p className="text-xs text-text-secondary mt-1">
                      {t('settings.applicationUpdate.description', { version: `v${appVersion}` })}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCheckForUpdates}
                    disabled={isCheckingForUpdates || loading}
                    className="flex items-center gap-2 rounded-lg border-border/50 hover:bg-primary-500/10 hover:text-primary-500 hover:border-primary-500/50 transition-all"
                  >
                    {isCheckingForUpdates ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    {t('update.checkForUpdates')}
                  </Button>
                </div>

                {/* Minimize to Tray Setting */}
                <div className="flex items-center justify-between space-x-4 p-4 rounded-xl bg-surface/30 border border-border/50">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-text-primary">
                      {t('settings.minimizeToTray.title')}
                    </h3>
                    <p className="text-xs text-text-secondary mt-1">
                      {t('settings.minimizeToTray.description')}
                    </p>
                  </div>
                  <Switch
                    checked={minimizeToTray}
                    onCheckedChange={handleMinimizeToTrayChange}
                    disabled={loading}
                    className="data-[state=checked]:bg-primary-500"
                  />
                </div>
              </TabsContent>

              <TabsContent value="league-client" className="space-y-6 mt-0 outline-none">
                {/* League Client Master Toggle */}
                <div className="flex items-center justify-between space-x-4 p-5 rounded-xl bg-primary-500/5 border border-primary-500/20 shadow-sm">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                      {t('settings.leagueClient.title')}
                    </h3>
                    <p className="text-xs text-text-secondary mt-1">
                      {t('settings.leagueClient.description')}
                    </p>
                  </div>
                  <Switch
                    checked={leagueClientEnabled}
                    onCheckedChange={handleLeagueClientChange}
                    disabled={loading}
                    className="data-[state=checked]:bg-primary-500"
                  />
                </div>

                {leagueClientEnabled && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Auto Ban/Pick Settings */}
                    <div className="p-4 rounded-xl bg-surface/30 border border-border/50">
                      <AutoBanPickSettings disabled={loading} />
                    </div>

                    {/* Auto Accept Setting */}
                    <div className="flex items-center justify-between space-x-4 p-4 rounded-xl bg-surface/30 border border-border/50">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-text-primary">
                          {t('settings.autoAccept.title')}
                        </h3>
                        <p className="text-xs text-text-secondary mt-1">
                          {t('settings.autoAccept.description')}
                        </p>
                      </div>
                      <Switch
                        checked={autoAcceptEnabled}
                        onCheckedChange={handleAutoAcceptChange}
                        disabled={loading}
                        className="data-[state=checked]:bg-primary-500"
                      />
                    </div>

                    {/* Champion Selection Accordion */}
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem
                        value="champion-selection"
                        className="border border-border/50 rounded-xl overflow-hidden bg-surface/30"
                      >
                        <AccordionTrigger className="hover:no-underline py-4 px-4 [&>svg]:hidden group">
                          <div className="flex items-center justify-between w-full">
                            <div className="text-left">
                              <h3 className="text-sm font-semibold text-text-primary">
                                {t('settings.championDetection.title')}
                              </h3>
                              <p className="text-xs text-text-secondary mt-1">
                                {t('settings.championDetection.description')}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180 text-text-muted" />
                              <Switch
                                checked={championDetection}
                                onCheckedChange={handleChampionDetectionChange}
                                disabled={loading}
                                onClick={(e) => e.stopPropagation()}
                                className="data-[state=checked]:bg-primary-500"
                              />
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-4 p-4 rounded-lg border border-border/30 bg-surface/50">
                            {/* Auto View Skins Setting */}
                            <div className="flex items-center justify-between space-x-4">
                              <div className="flex-1">
                                <h3 className="text-sm font-medium text-text-primary">
                                  {t('settings.autoViewSkins.title')}
                                </h3>
                                <p className="text-xs text-text-secondary mt-1">
                                  {t('settings.autoViewSkins.description')}
                                </p>
                              </div>
                              <Switch
                                checked={autoViewSkinsEnabled}
                                onCheckedChange={handleAutoViewSkinsChange}
                                disabled={loading || !championDetection}
                                className="data-[state=checked]:bg-primary-500"
                              />
                            </div>

                            {/* Random Skin Selection */}
                            <div className="space-y-3 pt-2 border-t border-border/30">
                              <h3 className="text-sm font-medium text-text-primary">
                                {t('settings.randomSkinSelection.title')}
                              </h3>
                              <RadioGroup
                                value={getRandomSkinValue()}
                                onValueChange={handleRandomSkinChange}
                                className="grid grid-cols-1 gap-2"
                              >
                                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-surface/80 transition-colors">
                                  <RadioGroupItem
                                    value="none"
                                    id="none"
                                    disabled={loading || !championDetection}
                                  />
                                  <Label
                                    htmlFor="none"
                                    className="text-sm font-normal cursor-pointer flex-1"
                                  >
                                    {t('settings.randomSkinSelection.none')}
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-surface/80 transition-colors">
                                  <RadioGroupItem
                                    value="random"
                                    id="random"
                                    disabled={loading || !championDetection}
                                  />
                                  <Label
                                    htmlFor="random"
                                    className="text-sm font-normal cursor-pointer flex-1"
                                  >
                                    <div>
                                      <div className="font-medium">
                                        {t('settings.autoRandomSkin.title')}
                                      </div>
                                      <div className="text-xs text-text-secondary">
                                        {t('settings.autoRandomSkin.description')}
                                      </div>
                                    </div>
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-surface/80 transition-colors">
                                  <RadioGroupItem
                                    value="rarity"
                                    id="rarity"
                                    disabled={loading || !championDetection}
                                  />
                                  <Label
                                    htmlFor="rarity"
                                    className="text-sm font-normal cursor-pointer flex-1"
                                  >
                                    <div>
                                      <div className="font-medium">
                                        {t('settings.autoRandomRaritySkin.title')}
                                      </div>
                                      <div className="text-xs text-text-secondary">
                                        {t('settings.autoRandomRaritySkin.description')}
                                      </div>
                                    </div>
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-surface/80 transition-colors">
                                  <RadioGroupItem
                                    value="favorite"
                                    id="favorite"
                                    disabled={loading || !championDetection}
                                  />
                                  <Label
                                    htmlFor="favorite"
                                    className="text-sm font-normal cursor-pointer flex-1"
                                  >
                                    <div>
                                      <div className="font-medium">
                                        {t('settings.autoRandomFavoriteSkin.title')}
                                      </div>
                                      <div className="text-xs text-text-secondary">
                                        {t('settings.autoRandomFavoriteSkin.description')}
                                      </div>
                                    </div>
                                  </Label>
                                </div>
                              </RadioGroup>
                            </div>

                            {/* In-Game Overlay Setting */}
                            {getRandomSkinValue() !== 'none' && (
                              <div className="flex items-center justify-between space-x-4 pt-2 border-t border-border/30">
                                <div className="flex-1">
                                  <h3 className="text-sm font-medium text-text-primary">
                                    {t('settings.inGameOverlay.title')}
                                  </h3>
                                  <p className="text-xs text-text-secondary mt-1">
                                    {t('settings.inGameOverlay.description')}
                                  </p>
                                </div>
                                <Switch
                                  checked={inGameOverlayEnabled}
                                  onCheckedChange={handleInGameOverlayChange}
                                  disabled={loading}
                                  className="data-[state=checked]:bg-primary-500"
                                />
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    {/* Smart Apply Setting */}
                    <div className="flex items-center justify-between space-x-4 p-4 rounded-xl bg-surface/30 border border-border/50">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-text-primary">
                          {t('settings.smartApply.title')}
                        </h3>
                        <p className="text-xs text-text-secondary mt-1">
                          {t('settings.smartApply.description')}
                        </p>
                      </div>
                      <Switch
                        checked={smartApplyEnabled}
                        onCheckedChange={handleSmartApplyChange}
                        disabled={loading}
                        className="data-[state=checked]:bg-primary-500"
                      />
                    </div>

                    {/* Auto Apply Setting */}
                    <div className="flex items-center justify-between space-x-4 p-4 rounded-xl bg-surface/30 border border-border/50">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-text-primary">
                          {t('settings.autoApply.title')}
                        </h3>
                        <p className="text-xs text-text-secondary mt-1">
                          {t('settings.autoApply.description')}
                        </p>
                      </div>
                      <Switch
                        checked={autoApplyEnabled}
                        onCheckedChange={handleAutoApplyChange}
                        disabled={loading || !smartApplyEnabled}
                        className="data-[state=checked]:bg-primary-500"
                      />
                    </div>

                    {/* Auto Apply Trigger Time Setting */}
                    {autoApplyEnabled && (
                      <div className="space-y-4 p-4 rounded-xl bg-surface/30 border border-border/50">
                        <div className="flex items-center justify-between space-x-4">
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-text-primary">
                              {t('settings.autoApplyTriggerTime.title')}
                            </h3>
                            <p className="text-xs text-text-secondary mt-1">
                              {t('settings.autoApplyTriggerTime.description')}
                            </p>
                          </div>
                          <span className="px-2 py-1 rounded bg-primary-500/10 text-primary-500 text-xs font-bold min-w-[3rem] text-center">
                            {autoApplyTriggerTime}s
                          </span>
                        </div>
                        <Slider
                          value={[autoApplyTriggerTime]}
                          onValueChange={handleAutoApplyTriggerTimeChange}
                          min={5}
                          max={30}
                          step={1}
                          disabled={loading || !smartApplyEnabled || !autoApplyEnabled}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="skin-management" className="space-y-6 mt-0 outline-none">
                {/* Repository Settings */}
                <div className="p-4 rounded-xl bg-surface/30 border border-border/50">
                  <RepositorySettings disabled={loading} />
                </div>

                {/* Auto Extract Images Setting */}
                <div className="flex items-center justify-between space-x-4 p-4 rounded-xl bg-surface/30 border border-border/50">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-text-primary">
                      {t('settings.autoExtractImages.title')}
                    </h3>
                    <p className="text-xs text-text-secondary mt-1">
                      {t('settings.autoExtractImages.description')}
                    </p>
                  </div>
                  <Switch
                    checked={autoExtractImages}
                    onCheckedChange={handleAutoExtractImagesChange}
                    disabled={loading}
                    className="data-[state=checked]:bg-primary-500"
                  />
                </div>

                {/* Allow Multiple Skins Per Champion Setting */}
                <div className="flex items-center justify-between space-x-4 p-4 rounded-xl bg-surface/30 border border-border/50">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-text-primary">
                      {t('settings.allowMultipleSkinsPerChampion.title')}
                    </h3>
                    <p className="text-xs text-text-secondary mt-1">
                      {t('settings.allowMultipleSkinsPerChampion.description')}
                    </p>
                  </div>
                  <Switch
                    checked={allowMultipleSkinsPerChampion}
                    onCheckedChange={handleAllowMultipleSkinsPerChampionChange}
                    disabled={loading}
                    className="data-[state=checked]:bg-primary-500"
                  />
                </div>

                {/* Auto Fix Mod Issues Setting */}
                <div className="flex items-center justify-between space-x-4 p-4 rounded-xl bg-surface/30 border border-border/50">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-text-primary">
                      {t('settings.autoFixModIssues.title')}
                    </h3>
                    <p className="text-xs text-text-secondary mt-1">
                      {t('settings.autoFixModIssues.description')}
                    </p>
                  </div>
                  <Switch
                    checked={autoFixModIssues}
                    onCheckedChange={handleAutoFixModIssuesChange}
                    disabled={loading}
                    className="data-[state=checked]:bg-primary-500"
                  />
                </div>

                {/* Mod Tools Timeout Setting */}
                <div className="space-y-4 p-4 rounded-xl bg-surface/30 border border-border/50">
                  <div className="flex items-center justify-between space-x-4">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-text-primary">
                        {t('settings.modToolsTimeout.title')}
                      </h3>
                      <p className="text-xs text-text-secondary mt-1">
                        {t('settings.modToolsTimeout.description')}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded bg-primary-500/10 text-primary-500 text-xs font-bold min-w-[3rem] text-center">
                      {modToolsTimeout}s
                    </span>
                  </div>
                  <Slider
                    value={[modToolsTimeout]}
                    onValueChange={handleModToolsTimeoutChange}
                    min={30}
                    max={600}
                    step={10}
                    disabled={loading}
                    className="w-full"
                  />
                  <p className="text-[10px] text-text-muted italic">
                    {t('settings.modToolsTimeout.hint')}
                  </p>
                </div>

                {/* Cache Management */}
                <div className="space-y-4 p-4 rounded-xl bg-error/5 border border-error/20">
                  <div className="flex items-center justify-between space-x-4">
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-error flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        {t('settings.cacheManagement.title')}
                      </h3>
                      <p className="text-xs text-text-secondary mt-1">
                        {t('settings.cacheManagement.description')}
                      </p>
                      {cacheInfo && cacheInfo.exists && (
                        <div className="mt-2 inline-flex items-center gap-2 px-2 py-0.5 rounded bg-error/10 text-[10px] font-bold text-error uppercase tracking-wider">
                          {t('settings.cacheManagement.info', {
                            count: cacheInfo.modCount,
                            size: cacheInfo.sizeInMB
                          })}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleClearCache}
                      disabled={isClearingCache || loading || !cacheInfo?.exists}
                      className="flex items-center gap-2 rounded-lg shadow-sm shadow-error/20"
                    >
                      {isClearingCache ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          {t('settings.cacheManagement.clearing')}
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          {t('settings.cacheManagement.clearCache')}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="cslol" className="space-y-6 mt-0 outline-none">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface/30 border border-border/50">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-primary-500" />
                        {t('settings.cslol.title', 'CSLoL Tools')}
                      </h3>
                      <p className="text-xs text-text-secondary mt-1">
                        {t(
                          'settings.cslol.description',
                          'Manage the CSLoL tools used for applying skins'
                        )}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCheckCslolUpdate}
                      disabled={isCheckingCslolUpdate || isUpdatingCslol}
                      className="flex items-center gap-2 rounded-lg border-border/50 hover:bg-primary-500/10 hover:text-primary-500 hover:border-primary-500/50 transition-all"
                    >
                      {isCheckingCslolUpdate ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      {t('update.checkForUpdates')}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-surface/30 border border-border/50 group hover:border-primary-500/30 transition-all">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
                        {t('settings.cslol.currentVersion', 'Current Version')}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-text-primary">
                          {cslolVersion || 'Unknown'}
                        </span>
                        {cslolVersion ? (
                          <div className="p-1 rounded-full bg-success/10 text-success">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="p-1 rounded-full bg-warning/10 text-warning">
                            <AlertCircle className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-surface/30 border border-border/50 group hover:border-primary-500/30 transition-all">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
                        {t('settings.cslol.latestVersion', 'Latest Version')}
                      </p>
                      <span className="text-lg font-bold text-text-primary">
                        {latestCslolVersion || '---'}
                      </span>
                    </div>
                  </div>

                  {latestCslolVersion && latestCslolVersion !== cslolVersion && (
                    <div className="p-5 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-between animate-in zoom-in-95 duration-300">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary-500 text-white shadow-lg shadow-primary-500/20">
                          <Download className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary">
                            {t('settings.cslol.updateAvailable', 'Update Available')}
                          </p>
                          <p className="text-xs text-text-secondary mt-0.5">
                            Version {latestCslolVersion} is now available.
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateCslol()}
                        disabled={isUpdatingCslol}
                        className="bg-primary-500 hover:bg-primary-600 text-white rounded-lg px-6 shadow-lg shadow-primary-500/20 transition-all"
                      >
                        {isUpdatingCslol ? (
                          <div className="flex items-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span className="font-bold">{cslolDownloadProgress}%</span>
                          </div>
                        ) : (
                          <span className="font-bold">
                            {t('settings.cslol.update', 'Update Tools')}
                          </span>
                        )}
                      </Button>
                    </div>
                  )}

                  <div className="space-y-4 pt-6 border-t border-border/50">
                    <Label
                      htmlFor="cslol-version"
                      className="text-xs font-bold text-text-muted uppercase tracking-widest"
                    >
                      {t('settings.cslol.setVersion', 'Set Version Manually')}
                    </Label>
                    <div className="flex gap-3">
                      <Input
                        id="cslol-version"
                        value={cslolVersion}
                        onChange={(e) => setCslolVersion(e.target.value)}
                        placeholder={t('settings.cslol.versionPlaceholder', 'e.g. v1.0.0')}
                        className="flex-1 bg-surface/50 border-border/50 focus:border-primary-500/50 rounded-lg h-10"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveCslolVersion}
                          className="bg-surface hover:bg-surface/80 text-text-primary border border-border/50 rounded-lg px-4 h-10 transition-all"
                        >
                          {t('settings.cslol.saveVersion', 'Save')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateCslol(cslolVersion)}
                          disabled={isUpdatingCslol || !cslolVersion}
                          className="bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 border border-primary-500/30 rounded-lg px-4 h-10 transition-all flex items-center gap-2"
                        >
                          {isUpdatingCslol ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          {t('settings.cslol.downloadVersion', 'Download')}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-surface/20 border border-border/30">
                      <AlertCircle className="w-3.5 h-3.5 text-text-muted mt-0.5" />
                      <p className="text-[11px] text-text-muted leading-relaxed">
                        {t(
                          'settings.cslol.versionHint',
                          'Manually setting the version will override the current version info. Use this if you have manually updated the tools.'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="p-6 bg-surface/30 border-t border-border/50">
          <Button
            variant="secondary"
            onClick={onClose}
            className="rounded-lg px-8 font-semibold hover:bg-surface/80 transition-all"
          >
            {t('actions.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
