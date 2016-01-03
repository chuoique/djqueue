# djQueue

Manage a music queue from anyone’s phone
and aggregate songs from YouTube, Spotify and SoundCloud.

## Queue management
![](/screenshots/search.png?raw=true "Searching")

## Casting device
![](/screenshots/cast.png?raw=true "Casting")

## First-time Setup

Fill in `api-keys.js` with keys for Spotify, SoundCloud and Google. Fill in `config.js`. Set the Spotify login redirect url to `http://yourdomain/spotify`. Install `/extension` in developer mode in Chrome on the device you want to cast from. Keep the extension disabled when you're not using it.

## Running

Start the app with `node app.js`. Use only a single node process.

`POST` to `http://yourdomain/create/queueName` to start a music queue named `queueName`.

On the casting device, enable the Chrome extension. Log into `play.spotify.com` and enable the "Play `open.spotify.com` URLs in desktop app" setting. Log into the Spotify desktop client. Make sure that pop-up windows are allowed for `http://yourdomain/` and load `http://yourdomain/queueName/cast`.

To manage your queue, load `http://yourdomain/queueName` on any other device.
