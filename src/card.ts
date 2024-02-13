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
  @property({ type: String }) remainingTime = "";

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
    }
  }

  updateTime(unit: "hours" | "minutes" | "seconds", value: string) {
    this.timerDuration[unit] = parseInt(value, 10);
  }

  updateTimerDuration() {
    const newDuration = `${this.timerDuration.hours
      .toString()
      .padStart(2, "0")}:${this.timerDuration.minutes
      .toString()
      .padStart(2, "0")}:${this.timerDuration.seconds
      .toString()
      .padStart(2, "0")}`;
    const serviceData = {
      entity_id: this._entity,
      duration: newDuration,
    };

    this._hass.callService("timer", "start", serviceData);
  }

  protected render() {
    let content: TemplateResult;
    if (!this._state) {
      content = html` entity: ${this._entity} not available <br />`;
    } else {
      content = html`
        <div class="card-content">
          <div class="timer-duration">
            <div>Timer: ${this._name}</div>
            ${this.isTimerActive
              ? html`<div>Remaining: ${this.remainingTime}</div>`
              : ""}
            <form id="time-inputs">
              <div>
                <label>Hours</label>
                <input
                  type="number"
                  min="00"
                  .value=${this.timerDuration.hours}
                  @input=${(e: Event) =>
                    this.updateTime(
                      "hours",
                      (e.target as HTMLInputElement).value
                    )}
                />
              </div>
              <span>:</span>
              <div>
                <label>Minutes</label>
                <input
                  type="number"
                  min="00"
                  max="59"
                  .value=${this.timerDuration.minutes}
                  @input=${(e: Event) =>
                    this.updateTime(
                      "minutes",
                      (e.target as HTMLInputElement).value
                    )}
                />
              </div>
              <span>:</span>
              <div>
                <label>Seconds</label>
                <input
                  type="number"
                  min="00"
                  max="59"
                  .value=${this.timerDuration.seconds}
                  @input=${(e: Event) =>
                    this.updateTime(
                      "seconds",
                      (e.target as HTMLInputElement).value
                    )}
                />
              </div>
            </form>
            <div class="timer-controls">
              <mwc-button @click=${this.updateTimerDuration}>Start</mwc-button>
            </div>
          </div>
        </div>
      `;
    }
    return html`
      <ha-card header="${this._header}">
        <div class="card-content">${content}</div>
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
    const timerState = this._state;

    if (timerState) {
      this.isTimerActive = timerState.attributes.remaining !== undefined;

      if (this.isTimerActive) {
        // Check if the timer has a finishes_at attribute
        if (timerState.attributes.finishes_at) {
          this.remainingTime = this.calculateRemainingTimeFromTimestamp(
            timerState.attributes.finishes_at
          );
        }
      }
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
        .timer-duration {
          align-items: center;
          display: flex;
          justify-content: space-between;
        }

        #time-inputs {
          align-items: center;
          display: flex;
          justify-content: space-between;
        }

        #time-inputs > div {
          align-items: center;
          display: flex;
          flex-direction: column-reverse;
          margin: 0 10px;
        }

        .timer-controls mwc-button {
          --mdc-theme-primary: white; /* This will change the text color */
          --mdc-theme-on-primary: green; /* This will change the background color */
        }

        input {
          width: 60px;
          padding: 4px;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-sizing: border-box;
          text-align: center;
        }

        #time-inputs > div > input {
          border: none;
          border-bottom: 1px solid black;
        }

        /* Hide arrows on number inputs for Chrome, Safari, Edge, Opera */
        #time-inputs > div > input[type="number"]::-webkit-inner-spin-button,
        #time-inputs > div > input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        /* Hide arrows on number inputs for Firefox */
        #time-inputs > div > input[type="number"] {
          -moz-appearance: textfield;
        }

        button:hover {
          background-color: #45a049;
        }
      `,
    ];
  }
  //TODO: make this dynamic
  getCardSize() {
    return 4;
  }

  static getConfigElement() {
    return document.createElement("timer-card-editor");
  }

  static getStubConfig() {
    return { header: "Timer Card", entity: "timer.testing" };
  }
}
