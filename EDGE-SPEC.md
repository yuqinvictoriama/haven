# Haven Edge Spec: one-gesture capture on iPhone and Android

## Purpose

Survivors need to start a recording, photo or note in one motion, often while the
phone is in a pocket or face-down. This spec says what an installed Haven web app
(Vite PWA at https://haven-app-ochre.vercel.app) can really do on iOS and Android
today, which OS gestures can reach it, and where the honest limits are. Claims
marked "verified" have a source in the last section; claims marked "unverified"
need a test on a real device before we put them in user-facing copy.

## Entry points Haven implements

| Entry point | Mechanism | iPhone (Home Screen web app) | Android (Chrome WebAPK) |
| --- | --- | --- | --- |
| Record audio now | `/capture?mode=audio&auto=1` starts recording after the mic prompt | Works only when the URL is opened inside the installed app; a link from another app opens Safari instead (see iPhone notes) | Works; in-scope links from other apps open inside Haven |
| Record video now | `/capture?mode=video&auto=1` | Same as above | Works |
| Take photo | `/capture?mode=photo` | Same as above | Works |
| New note | `/capture?mode=note` | Same as above | Works |
| Icon shortcuts | Manifest `shortcuts`: Record audio, Take photo, New note | Not supported on iOS (no long-press menu for web apps) | Chrome shows up to 3; any can be dragged out as its own icon |
| Share into Haven | Web Share Target (GET) -> `/share?title=&text=&url=` -> Analyze | Not supported by WebKit (bug 194593 open since 2019) | Chrome 76+, only after Haven is installed |
| Shake to record | `DeviceMotionEvent`, opt-in in Settings | Needs `requestPermission()` from a tap; foreground only | Foreground only; no prompt in Chrome |
| Record button | Large one-tap button on Home | Works | Works |

## iPhone setup (iOS 17 / 18 / 26)

What we verified:

- Back Tap lives at Settings > Accessibility > Touch > Back Tap, on iPhone 8 or later,
  with Double Tap and Triple Tap slots; a Shortcut can be assigned from the "Shortcuts"
  group at the bottom of the action list. (Apple 111772)
- Shortcuts "Open App": we found no Apple documentation and no credible report that
  Home Screen web apps appear in the Open App picker. The one detailed write-up we found
  (one sec) says Shortcut automations cannot target a web app and that web apps register
  no URL scheme. Treat "Haven appears in Open App" as UNVERIFIED until someone checks on
  an iOS 18 and an iOS 26 device. This is the single most important open test.
- Shortcuts "Open URLs" opens the link in the default browser (Safari), not in the
  installed web app. iOS has no link capturing for web apps: only links clicked inside
  the web app's scope stay in it; links from other apps and "magic links" launch the
  browser. (WWDC23 session 10120) The Safari copy of Haven and the Home Screen copy do not
  share storage (WebKit bug 181849), so a recording made in Safari would not be visible in
  the installed app unless Haven syncs it.
- `webapp://` trick: a June 2025 iOS 26 beta report said `webapp://` + URL opened the
  installed web app; the same users reported in April 2026 that it now gives Safari's
  "cannot open the page" error. Do not build instructions on it.
- Recording is foreground-only. Installed web apps lose the microphone as soon as they
  go to the background or the screen locks (WebKit bug 239602). Screen Wake Lock works in
  Home Screen web apps only from iOS 18.4 (MDN compat data); on older iOS the user must
  keep the screen awake via Settings > Display & Brightness > Auto-Lock.
- Permissions do not persist. Home Screen web apps ask for camera/microphone on every
  launch and have no per-site "Allow" like Safari (WebKit bug 327237, filed Oct 2026,
  status NEW). Hash-only navigation can also reset the grant mid-session (bug 215884), so
  Haven must use path routing and keep one stream alive rather than stop/restart.
- iOS 26: every site added via Share > Add to Home Screen opens as a web app by default;
  the user can turn "Open as Web App" off, which would make Haven a Safari bookmark.
  (WebKit blog, Safari 26.0)

Steps for the user (Back Tap -> Shortcut -> Haven):

1. In Safari open https://haven-app-ochre.vercel.app, tap Share, tap Add to Home Screen.
   You may rename it here. On iOS 26 leave "Open as Web App" on. Tap Add.
2. Open Haven once, tap Record, tap Allow so the mic prompt is familiar.
3. Open the Shortcuts app, tap +, tap Add Action, search "Open App", tap the "App"
   placeholder and look for Haven. If Haven is listed, choose it. If it is not listed,
   use the "Open URLs" action with `https://haven-app-ochre.vercel.app/capture?mode=audio&auto=1`
   instead and accept that it opens in Safari (separate storage; see above).
4. Name the shortcut "Haven Record" and tap Done.
5. Go to Settings > Accessibility > Touch > Back Tap > Double Tap, scroll to the
   Shortcuts group and choose "Haven Record".
6. Test: double-tap the Apple logo. If the phone is locked, Face ID or passcode is
   required first; Haven opens; tap Record; tap Allow.
7. Optional: say "Hey Siri, Haven Record". Siri runs any shortcut by name and asks to
   unlock first if the shortcut opens an app. (Apple Shortcuts guide)

Minimum motion on iPhone is therefore: back tap, unlock, one tap on Record, one tap on
Allow. The `auto=1` entry removes the Record tap only if the Shortcut can open Haven at
that URL, which is exactly the unverified part. Suggested mitigation: a Settings toggle
"Start recording as soon as Haven opens" that makes the plain app launch behave like
`auto=1`; needs a device test that iOS shows the mic prompt without a preceding tap.

## Android setup

Install Haven from Chrome (menu > Add to Home screen > Install). Chrome builds a WebAPK:
a real Android package that appears in the app drawer, in Settings > Apps and in app
pickers, and that registers intent filters for every URL inside Haven's manifest scope,
so in-scope links from other apps open inside Haven. (web.dev WebAPKs) If Haven was added
from Samsung Internet or as a plain Chrome "shortcut" and does not appear in pickers,
reinstall from Chrome.

Pixel (Quick Tap, Pixel 4a 5G and later):

1. Settings > System > Gestures > Quick Tap, turn on "Use Quick Tap". (Google Pixel Help)
2. Choose "Open app", tap the gear next to it, pick Haven. WebAPKs appear as apps, so
   Haven should be in this list (unverified on device).
3. Some apps show a second gear with in-app destinations (Snapchat does). Whether Haven's
   manifest shortcuts show up there is unverified; if they do, pick "Record audio".
4. Quick Tap opens Haven at its start URL; tap Record. Quick Tap cannot be pointed at a
   URL directly. For a true deep link use Tap, Tap, Tasker or MacroDroid (below).

Samsung Galaxy (RegiStar, One UI 5 and later on S22/Z Flip4/Z Fold4 and newer):

1. Install Good Lock from the Galaxy Store, then the RegiStar module (Good Lock > Life up).
2. Open RegiStar > Back-tap action, turn it on, choose Double tap > Open app > Haven.
   Newer RegiStar builds also offer "App shortcut" for the Open app action.
3. Samsung's Modes and Routines has no back-tap trigger of its own; since RegiStar
   1.0.39 it can only switch RegiStar's Back-tap action on or off. (SamMobile)
4. Known issue: users on One UI 7 report occasional misfires that open the chosen app
   while using another app (Samsung Community). Keep the Haven cover screen neutral.

Other Android, and power users on any Android:

- Tap, Tap (open source, Android 7+, needs accelerometer and gyroscope; latest release
  1.6.2, Oct 2024; sideloaded from GitHub, not on Play). Actions include Launch App,
  Launch Shortcut (can pick Haven's "Record audio"), and run a Tasker task. Sideloading
  and a permanent background service are a trust and battery cost for this user group.
- Tasker: Event > Sensor > Shake, or the Tap, Tap plugin event; Action > Net > Browse
  URL with `https://haven-app-ochre.vercel.app/capture?mode=audio&auto=1`. Android resolves
  the in-scope link to the Haven WebAPK. If it opens in Chrome instead: Settings > Apps >
  Haven > Open by default > allow supported links.
- MacroDroid: Trigger "Shake Device" (works with screen off if enabled in its settings)
  > Action "Open Website" or "Launch Shortcut" with the same URL. We could not verify a
  native back-tap trigger in MacroDroid; pair it with Tap, Tap if back tap is required.
- Icon shortcuts: long-press the Haven icon for Record audio / Take photo / New note;
  drag one onto the home screen for a one-tap "Record audio" icon. Chrome shows at most
  3 shortcuts. (web.dev app shortcuts)
- Permissions: Chrome offers "Allow while visiting the site", "Allow this time" or
  "Never allow"; "while visiting" is remembered per site. (Google Chrome Help)
- Background: Chrome on Android runs a media-capture notification service and reports
  going back to 2019 show mic capture continuing after the screen locks; OEM battery
  savers can still kill it. Treat background recording on Android as a bonus to test,
  not a promise. Keep the screen on with the Screen Wake Lock API while recording.

## In-app gestures

- Shake to record (opt-in): on iOS 13+ `DeviceMotionEvent.requestPermission()` must be
  called from a tap in a secure context and resolves "granted" or "denied"; Chrome on
  Android needs no prompt. Default off. Enable from Settings with a one-time explanation,
  re-request on each launch if `requestPermission` exists, use a threshold plus a 1.5 s
  debounce, vibrate and show a 2 s "Recording... tap to cancel" bar. Only works while
  Haven is on screen; a shake never wakes the app.
- Touch gestures: hold the Record button to record only while held; double-tap the Home
  screen background to start audio; swipe down on Capture to stop and save. All plain
  touch events, no permission.
- Volume buttons: not possible. Neither iOS Safari nor Chrome delivers hardware volume
  presses to a page.
- Lock Screen widgets, iOS Control Center controls, Android Quick Settings tiles and
  home-screen widgets: not available to web apps.
- Siri: runs a Shortcut by its name ("Hey Siri, Haven Record"). Google Assistant or
  Gemini "Open Haven" should launch the WebAPK by its app name (unverified).
- Screen Wake Lock: call `navigator.wakeLock.request('screen')` while recording; works
  in Chrome Android and in iOS Home Screen web apps from 18.4.

## Recommended defaults

- iPhone: Back Tap (Double Tap) -> Shortcut "Haven Record" -> Open App Haven (if the
  picker lists it) -> tap Record -> Allow. Fallback: Open URLs to the `auto=1` link, which
  runs in Safari. Add "Hey Siri, Haven Record". Shake to record while Haven is open.
- Pixel: Quick Tap -> Open app -> Haven -> tap Record. Pin the "Record audio" icon
  shortcut for a one-tap icon.
- Samsung: RegiStar Back-tap action -> Open app -> Haven (or App shortcut Record audio).
- Other Android: pinned "Record audio" shortcut; power users: Tap, Tap or MacroDroid
  shake -> `auto=1` URL.
- Everyone: big Record button on Home; shake to record is opt-in.

## Limitations of a PWA vs native

What Haven cannot do as a PWA:

- Record while the screen is locked or the app is in the background on iOS.
- Hook Back Tap or Quick Tap directly; both can only open the app (iOS: via a Shortcut,
  and even that is unverified for web apps).
- Deep-link from an iOS Shortcut into `/capture?...` inside the installed app.
- Remember camera/mic permission across launches on iOS.
- Offer a Lock Screen widget, Control Center control, Quick Settings tile, home-screen
  widget or volume-button trigger.
- Receive shares or show icon shortcuts on iOS.
- Hide its content from the recent-apps switcher or block screenshots (no FLAG_SECURE).

What a Capacitor (native shell) build would unlock:

- iOS audio background mode: recording continues with the screen locked.
- App Intents on iOS 16+: Back Tap -> "Start Haven recording" can run without showing
  the UI; Siri phrases; a Control Center control and Lock Screen widget on iOS 18+.
- Android foreground service with the microphone type (required on Android 14+), a
  Quick Settings tile, a home-screen widget, and FLAG_SECURE on sensitive screens.
- Persistent permissions, an iOS share extension, and true app shortcuts on both OSes.
- Costs: App Store and Play review for a sensitive app, developer accounts, a store
  listing that names the app publicly, and slower updates than a web deploy.

## Safety notes

- Name and icon: on iOS the user can rename the icon in the Add to Home Screen sheet
  (icon stays Haven's); on Android the WebAPK name and icon come from the manifest.
  Consider serving an alternate "neutral" manifest (name and icon) from a second install
  URL so the home screen shows nothing recognisable.
- Recent-apps preview: both OSes snapshot the last frame. On `visibilitychange` to
  hidden, swap to a blank neutral cover; this is best effort because the snapshot may be
  taken before the repaint.
- Quick exit: a persistent button that clears in-memory state and navigates to a bland
  page. On iOS out-of-scope links open in an in-app Safari View Controller, so the cover
  page appears inside Haven's window; on Android use `location.replace`.
- Deleting data: Settings > Delete everything wipes IndexedDB, Cache Storage and the
  service worker, then shows how to remove the icon. Removing the Home Screen icon on
  iOS is reported to drop that web app's storage; on Android uninstall Haven and also
  clear the site in Chrome (Settings > Site settings > All sites > haven-app-ochre).
- Recording laws vary by state and country. California Penal Code 632, for example,
  makes it an offense to intentionally record a confidential communication without the
  consent of all parties, and such recordings are generally inadmissible. Haven should
  show a one-line notice before the first recording and link to local resources. This is
  not legal advice.

## Sources

- Apple, Use Back Tap on your iPhone: https://support.apple.com/111772
- Apple, Use Siri to run shortcuts with your voice: https://support.apple.com/guide/shortcuts/apd07c25bb38/ios
- Apple WWDC23 10120, What's new in web apps (scope, links): https://developer.apple.com/videos/play/wwdc2023/10120/
- WebKit blog, Safari 26.0, every site can be a web app on iOS: https://webkit.org/blog/17333/webkit-features-in-safari-26-0/
- WebKit bug 327237, Home Screen web apps ask for camera/mic on every launch: https://bugs.webkit.org/show_bug.cgi?id=327237
- WebKit bug 215884, standalone mode loses capture permission on hash navigation: https://bugs.webkit.org/show_bug.cgi?id=215884
- WebKit bug 239602, installed web apps lose the microphone when backgrounded or locked: https://bugs.webkit.org/show_bug.cgi?id=239602
- WebKit bug 194593, Web Share Target not implemented: https://bugs.webkit.org/show_bug.cgi?id=194593
- WebKit bug 181849, Home Screen apps do not share storage with Safari: https://bugs.webkit.org/show_bug.cgi?id=181849
- MDN, DeviceMotionEvent.requestPermission(): https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent/requestPermission_static
- MDN compat data, WakeLock (iOS standalone from 18.4, WebKit bug 254545): https://github.com/mdn/browser-compat-data/blob/main/api/WakeLock.json
- one sec, using one sec with PWAs on iOS (Shortcuts cannot target web apps): https://feedback.one-sec.app/help/articles/9588274-using-one-sec-with-progressive-web-apps-pwas-ios
- Glide Community, iOS 26 beta webapp:// report and its 2026 failure: https://community.glideapps.com/t/ios-26-beta-opening-an-installed-web-app-with-an-open-url-action/82464
- MagicBell, PWA iOS limitations (no icon shortcuts or widgets on iOS): https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide
- Google Pixel Help, Use gestures (Quick Tap): https://support.google.com/pixelphone/answer/7443425
- 9to5Google, RegiStar back-tap module: https://9to5google.com/2022/11/07/good-lock-module-back-tap-samsung-galaxy/
- SamMobile, RegiStar 1.0.39 and Modes and Routines: https://www.sammobile.com/news/samsung-registar-updated-modes-routines-integration/
- Samsung Community, RegiStar misfires on One UI 7: https://eu.community.samsung.com/t5/galaxy-s25-series/registar-good-lock/m-p/12395106
- Tap, Tap (Kieron Quinn): https://github.com/KieronQuinn/TapTap
- Android Police, Tasker supports Tap, Tap events: https://www.androidpolice.com/2020/08/04/double-tapping-the-back-of-your-phone-can-now-trigger-an-event-in-tasker/
- MacroDroid wiki, Shake Device trigger: https://macrodroidforum.com/wiki/index.php/Trigger:_Shake_Device
- web.dev, WebAPKs on Android: https://web.dev/articles/webapks
- web.dev, App shortcuts (Chrome Android shows 3): https://web.dev/articles/app-shortcuts
- Chrome for Developers, Web Share Target (Chrome 76+, installed only): https://developer.chrome.com/docs/capabilities/web-apis/web-share-target
- Google Chrome Help, camera and microphone permissions on Android: https://support.google.com/chrome/answer/2693767?co=GENIE.Platform%3DAndroid
- Chromium source, MediaCaptureNotificationServiceImpl (Android): https://source.chromium.org/chromium/chromium/src/+/main:chrome/android/java/src/org/chromium/chrome/browser/media/MediaCaptureNotificationServiceImpl.java
- Mozilla bug 1564451 (comments report Chrome kept recording after lock): https://bugzilla.mozilla.org/show_bug.cgi?id=1564451
- VDO.Ninja, keep mic active in background on Android browsers: https://docs.vdo.ninja/guides/keep-mic-active-in-background-on-android-browser
- California Penal Code 632: https://california.public.law/codes/ca_penal_code_section_632
