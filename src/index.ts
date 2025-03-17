import { TimerCard } from "./card";
import { TimerCardEditor } from "./editor";

declare global {
  interface Window {
    customCards: Array<Object>;
  }
}

customElements.define("timer-card", TimerCard);
customElements.define("timer-card-editor", TimerCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "timer-card",
  name: "Timer Card",
  configurable: true,
  description: "A simple card to control a timer entity",
});
