# react-typace
**Forget about your 300ms search debounce in favour of adaptive debounce based on real data!**

This minimal, privacy-focused React library collects data as the user typing to leverage the power of statistics to determine when the search should fire. It resolves the problem of 300ms debounce where slow typers trigger search with every character they type, but fast typers are punished by the non-adaptive logic. This algorithm collects anonymised data about typing behaviour, such as typing speed, fire tolerance (how much this user prefers early fires), how often the user edits, and thinking (pause) times, all stored in a signle cookie. Implementation is minimal, with configs to come in the beta stage of development.

## LEGAL: EU & UK GDPR & ePrivacy Compliance (typing biometrics)
This library measures **keystroke dynamics** (typing cadence, edit rate, pause times, fire tolerance). Under GDPR and the ePrivacy directive, this data is classified as **Behavioural Biometric Data** and constitutes **Personally Identifiable Information** (PII).

**Storing this data persistently (cookies, localStorage, IndexedDB, etc.) requires prior, *granular*, opt-in consent.**

#### The "Strictly Necessary" exemption does NOT apply
Since search suggestions may act perfectly without profiling (the world existed before this library), you **cannot** rely on "Legitimate Interest" or hide this under "Functional/ Preferences" cookies.

### What this means for me and my website?

If you enable the `persistentStorage: true` flag in production, you **MUST** implement the following before deploying your app:

- In your Cookie Consent Banner, add a **separate, unchceked** toggle category named *Experience* or *Adaptive Search Response*.
- **DO NOT** bundle this consent with "Necessary" or "Statistics" cookies.
- Update your Privacy Policy to list "Keystroke dynamics/ Typing Behavioural Patterns" under the section "Data we collect automatically" or similar.
- If a user withdraws consent, you must call the library's `destroy()` method or manually clear the stored profile.

You may also choose between storing this data within `localStorage` or opt for a cookie by enabling the `useCookie: true` flag. Enabling a cookie is different legally as it is sent to the backend with every request.

At the bottom of this text, you may find suggested entries to add to your cookie consent banner and privacy policy for both pathways.

## Usage

```ts
import { useAdaptiveDebounce } from 'react-typace'

const InputComponent: React.FC = () => {
  const { bind } = useAdaptiveDebounce(handleFire(value));

  const handleFire = (value: string) => {
    // your fire logic goes here
  }

  return <input {...bind}/>
} 
```

Implementing typace has been made as easy as possible. Into your input element, simply spread `bind` received from the hook.

### Configuration

Features to do with writing and saving of data are restricted by default unless there is an overriding configuration. To supply an overriding configuration, put it as an argument into `useAdaptiveDebounce`:

```ts
const config: Config = {
  persistentStorage: true,
  useCookie: false,
  cookieMaxAgeDays: 30,
  minFireLength: 8,
  fireOnEnter: true,
  fireOnPaste: true,
  compositionBuffer: 5000,
  minFireDelay: 100,
  maxWait: 0
}

const { bind } = useAdaptiveDebounce(handeFire(value), config)
```

If a configuration is not specified, the *default configuration* will be used instead. See variable type configurations for their default values.

### Debugging variables

`useAdaptiveDebounce` will also expose debug typing session data if needed. It contains all the variables in use by a running session:

```ts
const { bing, debug } = useAdaptiveDebounce(handleFire(value));

var typingEvents = debug.timestamps; // all typing events currently stored within session
```

The structure of the debug data is located within TypeScript type declarations.
Please refrain from saving debug data in a deployed app unless prior user consent is given.

## Legal entries
**IMPORTANT:** Beacuse I live in a country where GDPR applies, I know that consent it definitely required have some knowledge to be able to put something into the legal section, yet **I am NOT a lawyer, and as such, the entries below are AI-generated**.

### Storage in `localStorage`:
This is the lower-risk, privacy-forward implementation. Data remains on the user's device and is never automatically transmitted to your infrastructure.

#### Cookie Banner Toggle Text:
> Adaptive Search Response: Stores a profile of your typing rhythm locally on your device to adjust search suggestion speed. This data never leaves your browser and is not accessible to us or third parties.

#### Privacy Policy Entry:
> Local Typing Profile: With your explicit consent, we store an anonymous profile of your typing and searching behaviour (characters per second, edit rate, mean time between stopping input and next input, and tolerance for early results) locally in your browser's storage. This data is used solely to adjust the timing of search suggestions to match your input style. This information is **not transmitted to our servers** and is not accessible to any third party. You may clear this data at any time by clearing your browser storage for this site.

### Storage in cookies

Using cookies for this data causes the profile to be trasmitted in HTTP headers with every request to your domain. By implementing cookies in a deployed app, you acknowledge:

1. The data will appear in your server access logs.
2. You are now collecting biometric-adjacent data centrally (triggering stricter GDPR Article 9)
3. You **MUST** define a retention period for server logs containing this data.

#### Cookie Banner Toggle Text:
> Adaptive Search Response: Stores a profile of your typing rhythm in a browser cookie. This data is transmitted to our servers with your search activity to optimize responsiveness. It is [not] used for advertising, and is retained in server logs for [X Days].

#### Privacy Policy Entry:
> Typing Profile Cookie: With your explicit consent, we place a cookie on your device that records your typing and searching behaviour (characters per second, edit rate, mean time between stopping input and next input, and tolerance for early results). This cookie is transmitted to our servers alongside your search queries to calibrate real-time response delays. We retain this data in raw server logs for a maximum of [X] days before automated deletion. This data is [not] shared with third-party analytics or advertising networks.