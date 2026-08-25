import { OfficeSceneManager } from './scene-manager';

describe('OfficeSceneManager lifecycle', () => {
  it('dispose is safe before init and clears state', () => {
    const host = document.createElement('div');
    host.style.width = '640px';
    host.style.height = '360px';
    document.body.appendChild(host);

    const manager = new OfficeSceneManager(host);
    expect(() => manager.dispose()).not.toThrow();

    // Second dispose after first must also be safe
    expect(() => manager.dispose()).not.toThrow();
    document.body.removeChild(host);
  });

  it('exposes focus/dispose API used by AI Office page', () => {
    const host = document.createElement('div');
    const manager = new OfficeSceneManager(host);
    expect(typeof manager.dispose).toBe('function');
    expect(typeof manager.focusAgent).toBe('function');
    expect(typeof manager.focusCeo).toBe('function');
    expect(typeof manager.onTooltip).toBe('function');
    expect(typeof manager.applySceneAppearance).toBe('function');
    expect(typeof manager.setCeoOfficeState).toBe('function');
    manager.dispose();
  });
});
