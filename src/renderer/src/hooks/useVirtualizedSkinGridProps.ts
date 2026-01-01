import { useMemo } from 'react'
import type { Skin, Champion } from '../App'
import type { SelectedSkin } from '../store/atoms'
import type { DownloadedSkin } from '../store/atoms/skin.atoms'

interface DisplaySkin {
  champion: Champion
  skin: Skin
}

interface VirtualizedSkinGridProps {
  skins: DisplaySkin[]
  viewMode: string
  downloadedSkins: DownloadedSkin[]
  selectedSkins: SelectedSkin[]
  favorites: Set<string>
  loading: boolean
  containerWidth: number
  containerHeight: number
}

export const useVirtualizedSkinGridProps = (props: VirtualizedSkinGridProps) => {
  // Memoize the props object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      skins: props.skins,
      viewMode: props.viewMode,
      downloadedSkins: props.downloadedSkins,
      selectedSkins: props.selectedSkins,
      favorites: props.favorites,
      loading: props.loading,
      containerWidth: props.containerWidth,
      containerHeight: props.containerHeight
    }),
    [
      props.skins,
      props.viewMode,
      props.downloadedSkins,
      props.selectedSkins,
      props.favorites,
      props.loading,
      props.containerWidth,
      props.containerHeight
    ]
  )
}
