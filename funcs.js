'use strict';

const url = require('url');
const request = require('request');
const lodash = require('lodash');
const async = require('async');

const apiCall = (uri, callback) => {
  const opts = {
    uri,
    json: true,
    headers: {
      Accept: 'application/vnd.twitchtv.v3+json'
    }
  };

  const cb = (err, response, body) => {
    if (err) {
      console.error('apiCall() failed', opts, err);
      return callback(err);
    }

    if (response.statusCode !== 200) {
      const error = new Error(`HTTP${response.statusCode}`);

      if (body)
        error.message = JSON.stringify(body, null, 2);

      console.error('apiCall() failed', opts, error, body);
      return callback(error);
    }

    callback(null, body);
  };

  try {
    request(opts, cb);
  }
  catch (e) {
    process.nextTick(cb, e);
  }
};

// callback(err, [followers], apiResult)
const followers = (channel, {cursor, direction = 'DESC', limit = 25} = {}, callback) => {
  const uri = url.format({
    protocol: 'https',
    hostname: 'api.twitch.tv',
    pathname: `/kraken/channels/${encodeURIComponent(channel)}/follows`,
    query: {cursor, direction, limit}
  });

  apiCall(uri, (err, json) => {
    if (err)
      return callback(err);

    callback(null, lodash.map(json.follows, 'user'), json);
  });
};

const latestFollower = (channel, callback) => {
  followers(channel, {direction: 'DESC', limit: 1}, (err, users, json) => {
    if (err)
      return callback(err);

    callback(null, users[0] || null);
  });
};

// callback(err, [newFollowers])
const followersSinceId = (channel, userId, callback) => {
  const users = [];
  const limit = 25;

  let hasMore = true;
  let cursor = undefined;

  const shouldContinue = () => hasMore && cursor && !users.find(user => user._id === userId);

  const parseNextPage = (cb) => {
    followers(channel, {cursor, limit, direction: 'DESC'}, (err, moreUsers, json) => {
      if (err)
        return cb(err);

      if (moreUsers.length < limit)
        hasMore = false;
      else
        cursor = json._cursor;

      Array.prototype.push.apply(users, moreUsers);
      cb();
    });
  };

  async.doWhilst(parseNextPage, shouldContinue, (err) => {
    if (err)
      return callback(err);

    const knowFollowerPosition = users.findIndex(user => user._id === userId);
    const result = knowFollowerPosition === -1
      ? users
      : users.slice(0, knowFollowerPosition);

    callback(null, result);
  });
};

module.exports = {
  followers,
  followersSinceId,
  latestFollower
};
