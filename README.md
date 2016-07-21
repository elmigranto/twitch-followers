# twitch-notifications

Notifies you about new followers, and dumps thanks to the file.

### Installation

``` bash
git clone https://github.com/elmigranto/twitch-followers.git
cd twitch-followers
npm install
```

### Usage

`node notifier <your channel>` (i.e. `node notifier elmigranto`) will parse all your followers and thank them on initial run. After that, it will only notify your about new ones.

Files it uses:

``` js
// Thank you message for plugging into streaming software (OBS and others):
`~/Desktop/${channel}.followers.txt`

// For saving IDs of users it notified about:
`~/Desktop/${channel}.last-follower.json`
```
