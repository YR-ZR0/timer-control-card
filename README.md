# :clock12: Timer Control Card (:warning:WIP)

![card_screenshot](assets/card.png)

Timer Control is a simple card that lets you target a timer entity in Home assistant and set it's time attributes from your dashboard

This card is in a extremely alpha state, thus should not be used for things that are mission critical.

I am not responsible for:

- Burnt Toast
- Burnt Houses
- Dead Plants

or anything else that may cause harm if a timer is missed.

## Usage

run

```bash
npm i
npm run build
```

then copy the card.js from dist to

```bash
config/www/
```

then follow the instructions here about adding a custom resource [Registering Resources](https://developers.home-assistant.io/docs/frontend/custom-ui/registering-resources).

to configure the card add the following to your dashboard

```yaml
- type: custom:timer-card
  entity: timer.testing
  header: "My Testing Timer"
```

or use the UI to configure a timer entity
