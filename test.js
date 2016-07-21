'use strict';

const expect = require('expect.js');
const {followers, latestFollower, followersSinceId} = require('./funcs');

describe('funcs', () => {
  describe('.latestFollower()', (done) => {
    it('there is a follower', (done) => {
      latestFollower('test_user1', (err, user) => {
        expect(err).to.be(null);
        expect(user.name).to.be('l1ke_a_boss');
        done(err);
      });
    });

    it('there is no followers', (done) => {
      latestFollower('test_user2', (err, user) => {
        expect(err).to.be(null);
        expect(user).to.be(null);
        done(err);
      });
    });
  });

  describe('.followersSinceId()', () => {
    const channel = 'elmigranto';
    let sinceId;

    before(done => {
      followers(channel, {direction: 'ASC', limit: 1}, (err, users, apiResult) => {
        if (err)
          return done(err);

        const user = users[0];

        if (!user)
          return done(new Error('No followers on test channel'));

        sinceId = user._id;
        done();
      });
    });

    it('works?.. heh', (done) => {
      followersSinceId(channel, sinceId, (err, newFollowers) => {
        expect(err).to.be(null);
        expect(newFollowers.length).to.be.greaterThan(2);
        expect(newFollowers.findIndex(user => user._id === sinceId)).to.be(-1);
        done();
      });
    });
  });

  // it('.crawl()', (done) => {
  //   before
  // });
});
