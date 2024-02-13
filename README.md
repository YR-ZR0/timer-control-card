# :clock12: Timer Control Card (:warning:WIP)
![card_screenshot](assets/card.png)

Timer Control is a simple card that lets you target a timer entity in Home assistant and set it's time attributes from your dashboard

This card is in a extremely alpha state, thus should not be used for things that are mission critical.

I am not responsible for:

- Burnt Toast
- Burnt Houses
- Dead Plants

or anything else that may casue harm if a timer is missed.

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

## TODO

- [ ] Better styling
- [x] Use the entity picker to select your timer entity
- [x] Fix editor issues with state not updating
  - [ ] Handle user pressing enter to accept the dialog
