'use strict';

const fs = require('fs');
const path = require('path');
const events = require('events');
const {followersSinceId} = require('./funcs');

class Notifier extends events.EventEmitter {
  constructor (channel, {sinceId = -1, timeoutMillis = 10e3} = {}) {
    super();
    // Configuration.
    this.channel = channel;
    this.sinceId = sinceId;
    this.timeoutMillis = timeoutMillis;
    // Tick info.
    this.stopped = true;
    this.timeoutId = 0;

    if (!this.channel)
      throw new Error('channel is required');
  }

  tick () {
    if (this.stopped)
      return;

    followersSinceId(this.channel, this.sinceId, (err, followers) => {
      if (err)
        return this.emit(Notifier.ERROR, err);

      // Do not emit, if we were stopped.
      if (this.stopped)
        return;

      // TODO:
      // emit() can return false if there are no listener.
      // So we should probably stop early.
      followers.slice().reverse().forEach(follower => {
        this.sinceId = follower._id;
        this.emit(Notifier.FOLLOWER, follower);
      });

      // Do not emit, if event handler stopped us.
      if (!this.stopped)
        this.timeoutId = setTimeout(this.tick.bind(this), this.timeoutMillis);
    });
  }

  start () {
    if (this.stopped)
      process.nextTick(this.tick.bind(this));

    this.stopped = false;
  }

  stop () {
    this.stopped = true;
    clearTimeout(this.timeoutId);
  }
}

Notifier.ERROR = 'error';
Notifier.FOLLOWER = 'follower';

if (!module.parent) {
  const usage = (error) => {
    console.log(`${error ? `ERROR: ${error}\n` : ''}
Usage:

  node ${path.basename(__filename)} channel

    - channel  required  channel to monitor for new followers
    `);
  };

  const desktopPath = (filename) => {
    const home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    return path.resolve(home, 'Desktop', filename);
  };

  const channel = process.argv[2];

  if (!channel)
    return usage('Missing argument `channel`.');

  // Save/Load last id.
  const db = {
    default: -100,
    path: desktopPath(`${channel}.last-follower.json`),

    load () {
      try {
        return require(this.path).lastId || this.default;
      }
      catch (e) {
        return this.default;
      }
    },

    save (lastId) {
      const json = JSON.stringify({lastId}, null, 2);
      fs.writeFileSync(this.path, json, 'utf8');
    }
  };

  // Update `~/Desktop/followers-{channel}.txt`.
  const thanks = {
    queue: [],
    intervalId: 0,
    path: desktopPath(`${channel}.followers.txt`),

    say () {
      const username = thanks.queue.shift();
      const message = username
        ? `Thanks for the follow,\n${username} <3`
        : '';

      fs.writeFileSync(this.path, message, 'utf8');
    }
  };

  const notifier = new Notifier(channel, {sinceId: db.load()});

  notifier.on(Notifier.FOLLOWER, user => {
    db.save(user._id);
    thanks.queue.push(user.display_name);
    console.log(`${user.display_name} just followed`);
  });

  notifier.start();
  setInterval(thanks.say.bind(thanks), 10000);
}

module.exports = Notifier;
