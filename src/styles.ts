export const WIDGET_STYLES = `
  .qwen-multiangle-container {
    width: 100%;
    height: 100%;
    position: relative;
    background: #0a0a0f;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    border-radius: 8px;
    overflow: hidden;
  }

  .qwen-multiangle-canvas {
    width: 100%;
    height: 100%;
    display: block;
  }

  .tk-tabs {
    position: absolute;
    top: 8px;
    left: 8px;
    right: 8px;
    display: flex;
    gap: 6px;
    z-index: 50;
  }
  
  .tk-tab {
    flex: 1;
    text-align: center;
    background: rgba(20, 20, 25, 0.9);
    border: 1px solid rgba(100, 100, 120, 0.4);
    padding: 6px;
    border-radius: 4px;
    color: #aaa;
    cursor: pointer;
    font-size: 11px;
    transition: all 0.2s;
  }
  
  .tk-tab.active {
    border-color: #E93D82;
    color: #E93D82;
    background: rgba(233, 61, 130, 0.15);
    font-weight: 600;
  }
  
  .tk-tab.disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
  }

  .qwen-multiangle-prompt {
    position: absolute;
    top: 45px;
    left: 8px;
    right: 8px;
    background: rgba(10, 10, 15, 0.9);
    border: 1px solid rgba(233, 61, 130, 0.3);
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 11px;
    color: #E93D82;
    backdrop-filter: blur(4px);
    font-family: 'Consolas', 'Monaco', monospace;
    word-break: break-all;
    line-height: 1.4;
  }

  .qwen-multiangle-info {
    position: absolute;
    bottom: 8px;
    left: 8px;
    right: 8px;
    background: rgba(10, 10, 15, 0.9);
    border: 1px solid rgba(233, 61, 130, 0.3);
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 11px;
    color: #e0e0e0;
    display: flex;
    justify-content: space-around;
    align-items: center;
    backdrop-filter: blur(4px);
  }

  .qwen-multiangle-param {
    text-align: center;
  }

  .qwen-multiangle-param-label {
    color: #888;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .qwen-multiangle-param-value {
    font-weight: 600;
    font-size: 13px;
  }

  .qwen-multiangle-param-value.azimuth { color: #E93D82; }
  .qwen-multiangle-param-value.elevation { color: #00FFD0; }
  .qwen-multiangle-param-value.zoom { color: #FFB800; }
  .qwen-multiangle-param-value.light-azimuth { color: #FFD700; }
  .qwen-multiangle-param-value.light-elevation { color: #FFA500; }

  .qwen-multiangle-reset {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    border: 1px solid rgba(233, 61, 130, 0.4);
    background: rgba(10, 10, 15, 0.8);
    color: #E93D82;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }
  .qwen-multiangle-reset:hover {
    background: rgba(233, 61, 130, 0.2);
    border-color: #E93D82;
  }

  /* Direction Labels */
  .tk-direction-labels {
    position: absolute;
    pointer-events: none;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 10;
  }
  .tk-dir-label {
    position: absolute;
    font-size: 9px;
    color: rgba(255,255,255,0.5);
    padding: 2px 4px;
    background: rgba(0,0,0,0.4);
    border-radius: 3px;
    white-space: nowrap;
  }
  /* Horizontal: positioned around ring edge - Front is lower-left (facing camera) */
  .tk-dir-front { bottom: 30px; left: 15%; }
  .tk-dir-rear { top: 95px; right: 20%; }
  .tk-dir-left { bottom: 25px; right: 15%; }
  .tk-dir-right { top: 95px; left: 15%; }
  .tk-dir-lf { left: 8px; top: 50%; transform: translateY(-50%); }
  .tk-dir-rf { bottom: 20px; left: 50%; transform: translateX(-50%); }
  .tk-dir-lr { right: 8px; top: 50%; transform: translateY(-50%); }
  .tk-dir-rr { top: 85px; left: 50%; transform: translateX(-50%); }
  /* Vertical markers */
  .tk-dir-above { left: 5px; top: 100px; color: rgba(0,255,200,0.5); }
  .tk-dir-below { left: 5px; bottom: 60px; color: rgba(0,255,200,0.5); }

  /* Color Picker Modal */
  .tk-color-picker-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .tk-color-picker-modal {
    background: #1a1a2e;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  
  .tk-color-wheel-container {
    position: relative;
    width: 200px;
    height: 200px;
  }
  
  .tk-hue-ring {
    position: absolute;
    top: 0; left: 0;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: conic-gradient(
      red, yellow, lime, aqua, blue, magenta, red
    );
    cursor: crosshair;
  }
  
  .tk-hue-ring-inner {
    position: absolute;
    top: 25px; left: 25px;
    width: 150px;
    height: 150px;
    border-radius: 50%;
    background: #1a1a2e;
  }
  
  .tk-sv-triangle {
    position: absolute;
    top: 40px;
    left: 40px;
    width: 120px;
    height: 104px; /* equilateral triangle height */
    clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
    background: linear-gradient(to bottom, red, transparent),
                linear-gradient(to bottom right, white, transparent),
                linear-gradient(to bottom left, black, transparent);
    cursor: crosshair;
  }
  
  .tk-hue-cursor {
    position: absolute;
    width: 12px;
    height: 12px;
    border: 2px solid white;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    box-shadow: 0 0 4px rgba(0,0,0,0.5);
  }
  
  .tk-sv-cursor {
    position: absolute;
    width: 10px;
    height: 10px;
    border: 2px solid white;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    box-shadow: 0 0 4px rgba(0,0,0,0.5);
  }
  
  .tk-color-preview {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    border: 2px solid #444;
  }
  
  .tk-color-hex {
    background: #2a2a3e;
    border: 1px solid #444;
    border-radius: 4px;
    padding: 6px 12px;
    color: #fff;
    font-family: monospace;
    font-size: 14px;
    text-align: center;
    width: 100px;
  }
  
  .tk-color-picker-actions {
    display: flex;
    gap: 12px;
  }
  
  .tk-color-picker-btn {
    padding: 8px 20px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
  }
  
  .tk-color-picker-btn.confirm {
    background: #E93D82;
    color: white;
  }
  
  .tk-color-picker-btn.cancel {
    background: #333;
    color: #aaa;
  }
`

export function injectStyles(): void {
  const id = 'tk-view-light-styles';
  if (document.getElementById(id)) return;
  const style = document.createElement('style')
  style.id = id
  style.textContent = WIDGET_STYLES
  document.head.appendChild(style)
}
