'use strict';

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

  node ${path.basename(__filename)} channel [sinceId]

    - channel  required  channel to monitor for new followers
    - sinceId  optional  latest know folower id
    `);
  };

  const channel = process.argv[3];

  if (!channel)
    return usage('Missing argument `channel`.');

  const notifier = new Notifier(process.argv[3]);

  notifier.on(Notifier.FOLLOWER, follower => {
    console.log('%s just followed!', follower.display_name);
  });

  notifier.start();
}

module.exports = Notifier;
