# Amaco

TypeScript-first CSS animation library — zero polyfills, Promise-based, fully typed.

## Install

```bash
npm install amaco
```

## Quick start

```typescript
import amaco from 'amaco';

await amaco(element)
  .from({ width: '100px', opacity: '0' })
  .to({ width: '300px', opacity: '1' })
  .duration(600)
  .easing('ease-out')
  .play();
```

## API

### Builder

| Method | Description |
|--------|-------------|
| `.target(el)` | Set the DOM element to animate |
| `.from(props)` | Set initial CSS state (optional) |
| `.to(props)` | Add an animation step |
| `.duration(ms)` | Duration for preceding `.to()` step(s) |
| `.easing(input)` | Easing for the last `.to()`, or global default if called before any `.to()` |
| `.loop(n?)` | Repeat `n` times (default `0` = infinite) |
| `.yoyo()` | Play forward then reverse each iteration |
| `.onStart(cb)` | Called when animation begins |
| `.onComplete(cb)` | Called when animation ends |
| `.onUpdate(cb)` | Called every frame with `(progress, step, element)` |
| `.condition(arr)` | Array of `{ if, do }` callbacks fired once when condition is met |

### Control

| Method | Returns | Description |
|--------|---------|-------------|
| `.play()` | `Promise<void>` | Start animation, resolves on completion |
| `.pause()` | `this` | Pause mid-animation |
| `.resume()` | `this` | Resume from pause position |
| `.cancel()` | `this` | Stop immediately |

### Easing

Built-in names: `'linear'` `'ease'` `'ease-in'` `'ease-out'` `'ease-in-out'` `'u-speed'`

```typescript
.easing('ease-in-out')
.easing([0.17, 0.67, 0.83, 0.67])  // cubic-bezier
.easing((t) => t * t)               // custom function
```

### Supported CSS properties

**Length** (px, %, vw, vh, em, rem):
`width` `height` `top` `left` `right` `bottom` `margin*` `padding*` `border*Width` `fontSize` `lineHeight` `borderRadius` `letterSpacing` `wordSpacing`

**Color** (any CSS color format):
`backgroundColor` `color` `borderColor` `outlineColor` `textDecorationColor` `border*Color`

**Number** (unitless):
`opacity` `zIndex` `flexGrow` `flexShrink` `fontWeight`

## Multi-step example

```typescript
await amaco(element)
  .to({ width: '200px' }).duration(400).easing('ease-in')
  .to({ width: '100px', opacity: '0' }).duration(300).easing('ease-out')
  .play();
```

## Loop + yoyo example

```typescript
amaco(element)
  .to({ translateY: '-20px' })  // see note below
  .duration(500)
  .easing('ease-in-out')
  .loop(3)
  .yoyo()
  .play();
```

## Pause / resume

```typescript
const anim = amaco(element).to({ width: '500px' }).duration(1000);
void anim.play();

setTimeout(() => anim.pause(), 400);
setTimeout(() => anim.resume(), 1000);
```

## Backwards-compatible aliases

`time()` → `duration()` · `speed()` → `easing()` · `start()` → `onStart()` · `end()` → `onComplete()` · `when()` → `onUpdate()` · `run()` → `play()` · `over()` → `cancel()`

## License

MIT
