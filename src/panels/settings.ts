// Settings Panel - Voice selection with audio samples

import { App } from '../app';
import { APP_ICONS, iconOnly } from '../ui/icons';
import { browserVoiceId, getBrowserSpanishVoices, isBrowserVoiceId, onVoicesChanged } from '../utils/audio';
import { escapeHtml } from '../utils/html';
import { numberToSpanish } from '../utils/numbers';

const SAMPLE_NUMBERS = [7, 21, 115, 1000, 3542, 1000000];

export class SettingsPanel {
  private app: App;
  private container: HTMLElement;

  constructor(app: App, container: HTMLElement) {
    this.app = app;
    this.container = container;
  }

  private voiceOptionsMarkup(): string {
    const selected = this.app.settings.voiceId;
    const browserVoices = getBrowserSpanishVoices();
    const browserIds = new Set(browserVoices.map((voice) => browserVoiceId(voice)));

    const autoOption = `<option value="auto" ${selected === 'auto' ? 'selected' : ''}>Automatic — best Spanish voice on this device</option>`;

    const browserGroup = browserVoices.length > 0 ? `
      <optgroup label="This browser / device (offline)">
        ${browserVoices.map((voice) => {
          const id = browserVoiceId(voice);
          return `<option value="${escapeHtml(id)}" ${id === selected ? 'selected' : ''}>${escapeHtml(`${voice.name} — ${voice.lang}`)}</option>`;
        }).join('')}
      </optgroup>
    ` : '';

    // A previously chosen browser voice that isn't loaded (yet) still needs
    // an entry, otherwise the select silently jumps to the first option.
    const missingSelected = isBrowserVoiceId(selected) && !browserIds.has(selected)
      ? `<option value="${escapeHtml(selected)}" selected>Saved browser voice</option>`
      : '';

    return autoOption + browserGroup + missingSelected;
  }

  render() {
    this.container.innerHTML = `
      <div class="lsn-wrap">
        <h2 class="lsn-title-lg lsn-mb-24">Settings</h2>

        <div class="lsn-card-sm">
          <div class="lsn-label">Spanish voice</div>
          <div class="lsn-example">Voices come from this browser and device, so the list differs between browsers. Your choice is saved in this browser.</div>
          <select id="voice-select" class="lsn-input" aria-label="Spanish voice">
            ${this.voiceOptionsMarkup()}
          </select>

          <div class="lsn-label lsn-mt-16">Hear a sample</div>
          <div class="lsn-example">Tap a number to hear it in the selected voice.</div>
          <div class="lsn-preset-grid lsn-preset-grid-compact">
            ${SAMPLE_NUMBERS.map((num) => `
              <button type="button" class="lsn-preset-btn lsn-preset-btn-compact lsn-sample-btn" data-sample="${num}" title="${escapeHtml(numberToSpanish(num))}">
                <span class="lsn-preset-range">${num.toLocaleString()}</span>
                <span class="lsn-sample-spanish">${escapeHtml(numberToSpanish(num))}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="lsn-footer-actions">
          <div class="lsn-footer-actions-left"></div>
          <button id="btn-home" class="lsn-home-btn-text" aria-label="Home">${iconOnly(APP_ICONS.home)}</button>
        </div>
      </div>
    `;

    const voiceSelect = this.container.querySelector('#voice-select') as HTMLSelectElement | null;

    voiceSelect?.addEventListener('change', () => {
      this.app.settings.voiceId = voiceSelect.value;
      this.app.saveSettings();
      // Preview so the user hears the chosen voice immediately.
      this.app.playAudio('Hola, vamos a practicar los números.', undefined, true);
    });

    // Browser voice lists often load asynchronously; refresh the picker when
    // they arrive (stale callbacks from earlier renders no-op via isConnected).
    onVoicesChanged(() => {
      if (voiceSelect?.isConnected) {
        voiceSelect.innerHTML = this.voiceOptionsMarkup();
      }
    });

    this.container.querySelectorAll('[data-sample]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const num = Number((btn as HTMLElement).dataset.sample);
        if (!Number.isFinite(num)) return;
        this.app.playAudio(numberToSpanish(num), undefined, true);
      });
    });

    this.container.querySelector('#btn-home')?.addEventListener('click', () => {
      this.app.navigate('home');
    });
  }
}
