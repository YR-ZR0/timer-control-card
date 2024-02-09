import { HomeAssistant } from "custom-card-helpers";
import { css, html, LitElement } from "lit";
import { property } from "lit/decorators";
import { state } from "lit/decorators/state.js";

export class TimerCardEditor extends LitElement {
  @state() _config;

  setConfig(config) {
    this._config = config;
  }

  @property({ attribute: false }) public hass!: HomeAssistant;

  render() {
    if (!this.hass) return html``;
    return html`
      <div class="card-config">
        <div>
          <ha-textfield
            id="header"
            label="Header"
            .value="${this._config.header}"
            .configValue="${"header"}"
            @change="${this.handleChangedEvent}"
          ></ha-textfield>
        </div>
        <div>
          <ha-textfield
            id="entity"
            label="Entity"
            .configValue=${"entity"}
            .value="${this._config.entity}"
            @change="${this.handleChangedEvent}"
          ></ha-textfield>
        </div>
      </div>
    `;
  }

  handleChangedEvent(changedEvent: Event) {
    const target = changedEvent.target as HTMLInputElement;
    // this._config is readonly, copy needed
    const newConfig = Object.assign({}, this._config);
    console.log(newConfig);
    if (target.id == "header") {
      newConfig.header = target.value;
    } else if (target.id == "entity") {
      newConfig.entity = target.value;
    }
    const messageEvent = new CustomEvent("config-changed", {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(messageEvent);
  }
}
