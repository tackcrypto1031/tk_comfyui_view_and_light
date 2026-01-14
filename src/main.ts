import { app } from '../../../scripts/app.js'
import { api } from '../../../scripts/api.js'
import { CameraWidget } from './CameraWidget'
import type { CameraState, QwenMultiangleNode, DOMWidget } from './types'

const widgetInstances = new Map<number, CameraWidget>()

function createCameraWidget(node: QwenMultiangleNode): { widget: DOMWidget } {
  const container = document.createElement('div')
  container.id = `tk-viewlight-widget-${node.id}`
  container.style.width = '100%'
  container.style.height = '100%'
  container.style.minHeight = '350px'

  const getWidgetValue = (name: string, defaultValue: number): number => {
    const widget = node.widgets?.find(w => w.name === name)
    return widget ? Number(widget.value) : defaultValue
  }

  const getBoolValue = (name: string, defaultValue: boolean): boolean => {
    const widget = node.widgets?.find(w => w.name === name)
    return widget ? Boolean(widget.value) : defaultValue
  }

  const getStringValue = (name: string, defaultValue: string): string => {
    const widget = node.widgets?.find(w => w.name === name)
    return widget ? String(widget.value) : defaultValue
  }

  const initialState: Partial<CameraState> = {
    azimuth: getWidgetValue('horizontal_angle', 0),
    elevation: getWidgetValue('vertical_angle', 0),
    distance: getWidgetValue('zoom', 5.0),
    enableLight: getBoolValue('enable_light', false),
    lightAzimuth: getWidgetValue('light_horizontal', 45),
    lightElevation: getWidgetValue('light_vertical', 45),
    lightColor: getStringValue('light_color', '#FFFFFF')
  }

  const widget = node.addDOMWidget(
    'camera_preview',
    'tk-view-light',
    container,
    {
      getMinHeight: () => 370,
      hideOnZoom: false,
      serialize: false
    }
  ) as DOMWidget

  setTimeout(() => {
    const cameraWidget = new CameraWidget({
      node,
      container,
      initialState,
      onStateChange: (state: CameraState) => {
        const hWidget = node.widgets?.find(w => w.name === 'horizontal_angle')
        const vWidget = node.widgets?.find(w => w.name === 'vertical_angle')
        const zWidget = node.widgets?.find(w => w.name === 'zoom')
        const lhWidget = node.widgets?.find(w => w.name === 'light_horizontal')
        const lvWidget = node.widgets?.find(w => w.name === 'light_vertical')
        const lcWidget = node.widgets?.find(w => w.name === 'light_color')

        if (hWidget) hWidget.value = state.azimuth
        if (vWidget) vWidget.value = state.elevation
        if (zWidget) zWidget.value = state.distance
        if (lhWidget) lhWidget.value = state.lightAzimuth
        if (lvWidget) lvWidget.value = state.lightElevation
        if (lcWidget) lcWidget.value = state.lightColor

        app.graph?.setDirtyCanvas(true, true)
      }
    })

    widgetInstances.set(node.id, cameraWidget)

    // Sync ComfyUI widgets -> 3D widget
    const setupWidgetSync = (widgetName: string, cam: CameraWidget) => {
      const w = node.widgets?.find(widget => widget.name === widgetName)
      if (w) {
        const origCallback = w.callback
        w.callback = (value: unknown) => {
          if (origCallback) origCallback.call(w, value)

          if (widgetName === 'horizontal_angle') cam.setState({ azimuth: Number(value) })
          else if (widgetName === 'vertical_angle') cam.setState({ elevation: Number(value) })
          else if (widgetName === 'zoom') cam.setState({ distance: Number(value) })
          else if (widgetName === 'enable_light') cam.setState({ enableLight: Boolean(value) })
          else if (widgetName === 'light_horizontal') cam.setState({ lightAzimuth: Number(value) })
          else if (widgetName === 'light_vertical') cam.setState({ lightElevation: Number(value) })
          else if (widgetName === 'light_color') cam.setState({ lightColor: String(value) })
        }
      }
    }

    setupWidgetSync('horizontal_angle', cameraWidget)
    setupWidgetSync('vertical_angle', cameraWidget)
    setupWidgetSync('zoom', cameraWidget)
    setupWidgetSync('enable_light', cameraWidget)
    setupWidgetSync('light_horizontal', cameraWidget)
    setupWidgetSync('light_vertical', cameraWidget)
    setupWidgetSync('light_color', cameraWidget)

    // Special handler for light_color: open picker on click
    const lcWidget = node.widgets?.find(w => w.name === 'light_color')
    if (lcWidget && lcWidget.element) {
      // The widget element might be the container, find the input inside
      const inputEl = lcWidget.element.querySelector ? lcWidget.element.querySelector('input') : lcWidget.element;
      if (inputEl) {
        inputEl.addEventListener('click', (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          cameraWidget.openColorPicker();
        });
      }
    }
  }, 100)

  widget.onRemove = () => {
    const cameraWidget = widgetInstances.get(node.id)
    if (cameraWidget) {
      cameraWidget.dispose()
      widgetInstances.delete(node.id)
    }
  }

  return { widget }
}

function setupImageInput(node: QwenMultiangleNode): void {
  const originalOnConnectionsChange = node.onConnectionsChange

  node.onConnectionsChange = function (slotType, slotIndex, isConnected, link, ioSlot) {
    if (originalOnConnectionsChange) {
      originalOnConnectionsChange.call(this, slotType, slotIndex, isConnected, link, ioSlot)
    }

    if (slotType === 1 && slotIndex === 0) {
      const cameraWidget = widgetInstances.get(node.id)
      if (cameraWidget && !isConnected) {
        cameraWidget.updateImage(null)
      }
    }
  }
}

app.registerExtension({
  name: 'ComfyUI.TKViewAndLight',

  nodeCreated(node: QwenMultiangleNode) {
    if (node.constructor?.comfyClass !== 'TK_View_And_Light') {
      return
    }

    const [oldWidth, oldHeight] = node.size
    node.setSize([Math.max(oldWidth, 350), Math.max(oldHeight, 520)])
    createCameraWidget(node)
    setupImageInput(node)
  }
})

api.addEventListener('executed', (event: CustomEvent) => {
  const detail = event.detail
  if (!detail?.node || !detail?.output) return

  const nodeId = parseInt(detail.node, 10)
  const cameraWidget = widgetInstances.get(nodeId)
  if (!cameraWidget) return

  const imageBase64 = detail.output?.image_base64 as string[] | undefined
  if (imageBase64 && imageBase64.length > 0 && imageBase64[0]) {
    cameraWidget.updateImage(imageBase64[0])
  }
})

export { CameraWidget }
