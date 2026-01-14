import type { LGraphNode } from '@comfyorg/comfyui-frontend-types'

export interface CameraState {
  // Camera
  azimuth: number
  elevation: number
  distance: number
  imageUrl: string | null

  // Light
  enableLight: boolean
  lightAzimuth: number
  lightElevation: number
  lightColor: string
}

export interface CameraWidgetOptions {
  node: LGraphNode
  container: HTMLElement
  initialState?: Partial<CameraState>
  onStateChange?: (state: CameraState) => void
}

export interface QwenMultiangleNode extends LGraphNode {
  widgets?: Array<{
    name: string
    value: unknown
    callback?: (value: unknown) => void
  }>
}

export interface DOMWidgetOptions {
  getMinHeight?: () => number
  hideOnZoom?: boolean
  serialize?: boolean
}

export interface DOMWidget {
  name: string
  type: string
  element: HTMLElement
  options: DOMWidgetOptions
  onRemove?: () => void
  serializeValue?: () => Promise<string> | string
}
