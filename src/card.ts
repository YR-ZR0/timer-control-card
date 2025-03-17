import {
  CSSResultGroup,
  LitElement,
  TemplateResult,
  css,
  html,
  nothing,
} from "lit";
import { property, state } from "lit/decorators.js";

import { HomeAssistant, LovelaceCardConfig } from "custom-card-helpers";
import { HassEntity } from "home-assistant-js-websocket";

interface config extends LovelaceCardConfig {
  header: string;
  entity: string;
}

export class TimerCard extends LitElement {
  @state() private _header: string | typeof nothing;
  @state() private _entity: string;
  @state() private _name: string;
  @state() private _state: HassEntity;
  @property({ type: Object }) timerDuration: TimerDuration = {
    hours: 0,
    minutes: 0,
    seconds: 0,
  };
  @property({ type: Boolean }) isTimerActive = false;
  @property({ type: String }) remainingTime = "00:00:00";
  @property({ type: String }) durationInput = "00:00:00";

  private timerUpdateInterval: number | undefined;
  private _hass;

  setConfig(config: config) {
    this._header = config.header === "" ? nothing : config.header;
    this._entity = config.entity;
    if (this._hass) {
      this.hass = this._hass;
    }
  }

  set hass(hass: HomeAssistant) {
    this._hass = hass;
    this._state = hass.states[this._entity];
    if (this._state) {
      let fn = this._state.attributes.friendly_name;
      this._name = fn ? fn : this._entity;
      
      // Update timer state and duration
      this.updateTimerStateFromEntity();
    }
  }

  // New method to update timer state from entity
  updateTimerStateFromEntity() {
    if (!this._state) return;
    
    // Update active state
    this.isTimerActive = this._state.state === "active";
    
    // Get current duration from attributes
    if (this._state.attributes.duration) {
      const duration = this._state.attributes.duration;
      // Only update the input if not currently focused
      const activeElement = this.shadowRoot?.activeElement;
      const inputField = this.shadowRoot?.querySelector(".single-time-field");
      if (activeElement !== inputField) {
        this.durationInput = duration;
        this.updateTimerDurationFromString(duration, false);
      }
    }
    
    // Update remaining time
    if (this.isTimerActive && this._state.attributes.finishes_at) {
      this.remainingTime = this.calculateRemainingTimeFromTimestamp(
        this._state.attributes.finishes_at
      );
    } else if (this._state.attributes.duration) {
      // If not active but has duration, show the duration as remaining time
      this.remainingTime = this._state.attributes.duration;
    }
  }

  updateTime(value: string) {
    // Store the input value directly without immediate reformatting
    this.durationInput = value;
    
    // Only attempt to parse complete input formats
    if (value.includes(':') || (!isNaN(Number(value)) && value.length > 0)) {
      this.updateTimerDurationFromString(value, false);
    }
  }
  
  updateTimerDurationFromString(value: string, updateInput = true) {
    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    
    // Parse time based on format
    if (value.includes(':')) {
      const timeParts = value.split(':');
      
      if (timeParts.length === 3) {
        // HH:MM:SS format
        hours = parseInt(timeParts[0], 10) || 0;
        minutes = parseInt(timeParts[1], 10) || 0;
        seconds = parseInt(timeParts[2], 10) || 0;
      } else if (timeParts.length === 2) {
        // MM:SS format
        minutes = parseInt(timeParts[0], 10) || 0;
        seconds = parseInt(timeParts[1], 10) || 0;
      }
    } else if (!isNaN(Number(value))) {
      // Single number interpreted as seconds
      const totalSeconds = parseInt(value, 10) || 0;
      hours = Math.floor(totalSeconds / 3600);
      minutes = Math.floor((totalSeconds % 3600) / 60);
      seconds = totalSeconds % 60;
    }
    
    // Update timer duration object
    this.timerDuration = { hours, minutes, seconds };
    
    // Update the input field if requested
    if (updateInput) {
      this.durationInput = this.formatTimeValue();
    }
  }
  
  // Format when leaving the input field or when submitting
  handleBlur() {
    // Format the input properly when the field loses focus
    this.durationInput = this.formatTimeValue();
  }
  
  // Handle key press for Enter key
  handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      this.durationInput = this.formatTimeValue();
      this.updateTimerDuration();
    }
  }

  formatTimeValue(): string {
    return `${this.timerDuration.hours.toString().padStart(2, '0')}:${
      this.timerDuration.minutes.toString().padStart(2, '0')}:${
      this.timerDuration.seconds.toString().padStart(2, '0')}`;
  }

  updateTimerDuration() {
    const newDuration = this.formatTimeValue();
    const serviceData = {
      entity_id: this._entity,
      duration: newDuration,
    };

    this._hass.callService("timer", "start", serviceData);
  }

  pauseTimer() {
    this._hass.callService("timer", "pause", {
      entity_id: this._entity
    });
  }

  cancelTimer() {
    this._hass.callService("timer", "cancel", {
      entity_id: this._entity
    });
  }

  protected render() {
    let content: TemplateResult;
    if (!this._state) {
      content = html` entity: ${this._entity} not available <br />`;
    } else {
      content = html`
        <div class="card-content compact">
          <div class="timer-header">
            <span class="timer-name">${this._name}</span>
            <span class="remaining-time ${this.isTimerActive ? 'active' : ''}">${this.remainingTime}</span>
          </div>
          <div class="timer-controls">
            <div class="single-input-container">
              <ha-textfield
                .value=${this.durationInput}
                @input=${(e: Event) => this.updateTime((e.target as HTMLInputElement).value)}
                @blur=${this.handleBlur}
                @keydown=${this.handleKeyDown}
                class="single-time-field"
                placeholder="HH:MM:SS"
              ></ha-textfield>
              ${this.isTimerActive ? html`
                <div class="active-buttons">
                  <ha-icon-button
                    @click=${this.pauseTimer}
                    .path=${"M14,19H18V5H14M6,19H10V5H6V19Z"}
                    title="Pause"
                    class="action-button"
                  ></ha-icon-button>
                  <ha-icon-button
                    @click=${this.cancelTimer}
                    .path=${"M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"}
                    title="Cancel"
                    class="action-button"
                  ></ha-icon-button>
                </div>
              ` : html`
                <ha-button
                  class="start-button"
                  @click=${this.updateTimerDuration}
                  .primary=${true}
                >
                  Start
                </ha-button>
              `}
            </div>
          </div>
        </div>
      `;
    }
    return html`
      <ha-card header="${this._header}">
        ${content}
      </ha-card>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    this.timerUpdateInterval = window.setInterval(
      () => this.fetchTimerState(),
      1000
    ); // Update every second
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.timerUpdateInterval) {
      window.clearInterval(this.timerUpdateInterval);
    }
  }

  async fetchTimerState() {
    if (this._state) {
      this.updateTimerStateFromEntity();
    }
  }

  calculateRemainingTimeFromTimestamp(timestamp: string): string {
    const finishesAt = new Date(timestamp);
    const now = new Date();

    const remainingMilliseconds = Math.max(
      0,
      finishesAt.getTime() - now.getTime()
    );
    return this.calculateRemainingTime(remainingMilliseconds);
  }

  calculateRemainingTime(remainingTime: number): string {
    const seconds = Math.floor(remainingTime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    return `${String(hours).padStart(2, "0")}:${String(minutes % 60).padStart(
      2,
      "0"
    )}:${String(seconds % 60).padStart(2, "0")}`;
  }

  static get styles(): CSSResultGroup {
    return [
      css`
        .card-content.compact {
          padding: 8px;
        }
        
        .timer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 14px;
        }
        
        .timer-name {
          font-weight: 500;
        }
        
        .remaining-time {
          font-weight: bold;
          color: var(--secondary-text-color);
          font-family: var(--paper-font-common-mono);
        }
        
        .remaining-time.active {
          color: var(--primary-color);
        }
        
        .timer-controls {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .single-input-container {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          justify-content: space-between;
        }
        
        .single-time-field {
          --mdc-shape-small: 4px;
          --mdc-text-field-fill-color: var(--card-background-color);
          --mdc-typography-subtitle1-font-size: 16px;
          width: 70%;
          --text-field-text-align: center;
        }
        
        /* Center the text in ha-textfield */
        ha-textfield::part(input) {
          text-align: center;
          font-family: var(--paper-font-common-mono);
          letter-spacing: 0.1em;
        }
        
        .start-button {
          --mdc-theme-primary: var(--primary-color);
          min-width: auto;
          padding: 0 12px;
        }
        
        .active-buttons {
          display: flex;
          gap: 4px;
        }
        
        .action-button {
          color: var(--primary-color);
          --mdc-icon-button-size: 36px;
        }
      `,
    ];
  }

  //TODO: make this dynamic
  getCardSize() {
    return 2; // Reduced from 3 since we made it more compact
  }

  getLayoutOptions() {
    return {
      grid_rows: 2,
      grid_columns: 3,
      grid_min_rows: 2, // Reduced from 3
    };
  }

  static getConfigElement() {
    return document.createElement("timer-card-editor");
  }

  static getStubConfig() {
    return { header: "Timer Card", entity: "timer.testing" };
  }
}
