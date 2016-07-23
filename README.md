# twitch-notifications

Notifies you about new followers (and puts "thank you messages" for OBS to the file via command line utility).

### Javascript API

**Install**

``` bash
npm install --save twitch-followers
```

**In Node.js**

``` js
const Notifier = require('twitch-followers');
const notifier = new Notifier('channel');

notifier.on('follower', user => { /* … */ });
notifier.start();
```

**In browser**

It probably may be used from browser via `browserify` or similar tool. Let me know!

**Constructor Options**

`Notifier` accepts options object as its second argument. Supported props:

- `sinceId` (`Integer`, defaults to `-1`) — will notify you about follows after this User ID.
- `timeoutMillis` (`Interger`, defaults to `10000`) — how often to query Twitch for new follows.

### Command Line Tool

**Install**

``` bash
git clone https://github.com/elmigranto/twitch-followers.git
cd twitch-followers
npm install
```

**Run**

`node notifier <your channel>` (i.e. `node notifier elmigranto`) will parse all your followers and thank them on initial run. After that, it will only notify your about new ones.

Files it uses:

``` js
// Thank you message for plugging into streaming software (OBS and others):
`~/Desktop/${channel}.followers.txt`

// For saving IDs of users it notified about:
`~/Desktop/${channel}.last-follower.json`
```
