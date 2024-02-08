import {
  html,
  LitElement,
  TemplateResult,
  nothing,
  PropertyValues,
  CSSResultGroup,
  css,
} from "lit";
import { state, property } from "lit/decorators.js";

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
  @property({ type: Number }) hours = 0;
  @property({ type: Number }) minutes = 0;
  @property({ type: Number }) seconds = 0;
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
  handleInput(e) {
    const inputId = e.target.id;
    const inputValue = e.target.value;
    this[inputId] = inputValue;
  }

  updateTimerDuration() {
    const newDuration = `${String(this.hours).padStart(2, "0")}:${String(
      this.minutes
    ).padStart(2, "0")}:${String(this.seconds).padStart(2, "0")}`;

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
        <div>Timer: ${this._name}</div>
        <div class="horizontal layout">
          <div class="input-container">
            <input
              id="hours"
              type="number"
              .value=${this.hours}
              @input=${this.handleInput}
            />
          </div>
          <div class="input-container">
            <input
              id="minutes"
              type="number"
              .value=${this.minutes}
              @input=${this.handleInput}
            />
          </div>
          <div class="input-container">
            <input
              id="seconds"
              type="number"
              .value=${this.seconds}
              @input=${this.handleInput}
            />
          </div>
        </div>
        ${this.isTimerActive
          ? html`<div>Remaining Time: ${this.remainingTime}</div>`
          : ""}
        <button @click=${this.updateTimerDuration}>Apply</button>
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
        input {
          width: 60px;
          padding: 4px;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-sizing: border-box;
        }

        button {
          margin-top: 5px;
          padding: 8px;
          background-color: #4caf50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .layout.horizontal,
        .layout.vertical {
          display: flex;
        }

        .layout.horizontal {
          flex-direction: row;
        }

        button:hover {
          background-color: #45a049;
        }
      `,
    ];
  }

  getCardSize() {
    return 3;
  }

  static getConfigElement() {
    return document.createElement("timer-card-editor");
  }

  static getStubConfig() {
    return { header: "Timer Card", entity: "timer.testing" };
  }
}
