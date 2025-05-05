---
layout: post
title: "Dependabot, Github and Travis CI"
---

## Dependabot

The application ecosystem on [Github](https://github.com/marketplace) has really exploded recently. I'm quite late to this particular party, but the ease with which you can hook magic things up to one or more repositories is really powerful.

I recently discovered [Dependabot](https://github.com/marketplace/dependabot). Dependency update management has historically been awful, with loads of projects just pulling in whatever they need to "work" and then never bothering to update. Or, worse, updating but not noticing that something is now broken.

Google had an [interesting solution](https://cacm.acm.org/magazines/2016/7/204032-why-google-stores-billions-of-lines-of-code-in-a-single-repository/fulltext) to this problem, which essentially boils down to "Don't have multiple versions of a software library". The idea here being that if you make a change to the library, you should ensure that you don't break anyone else's code and be able to prove this by running all dependent unit tests against your proposed change. If the tests pass but the dependant stops working, then better tests are needed in that project. However, this sort of requires a bunch of tooling and practise that's difficult to achieve both in large organisations and also out on the internet.

The day job came up with an interesting implementation of an idea that's been kicking around for a while - automated dependency updates. A periodic process parses your project dependencies and has a look to see if there are any new versions. If there are, it makes the change on a git branch and sends a pull request, kicking off any builds/tests that may be required. This is surprisingly effective at reducing the overhead for the developer, as they only now need to review and approve the PRs as they come in. If you're feeling especially lucky you can auto-accept PRs where the tests pass, reducing the overhead to 0.

Having gotten used to this, I was then pleased to find that Dependabot is a real-world implementation of the same idea. It's a paid service, but free for personal or open source projects. In my experience, where this becomes invaluable is for those dormant projects that might not have been worked on for a while and have perhaps gone a little bit stale. Automated dependency upgrades means that you don't have to worry about how out of date things are when you pick the project back up.

## Travis CI

I enabled Dependabot for a few different repositories that I dip in and out of. One thing I noticed was that it was quite hard to get job triggering on [CircleCI](http://circleci.com) working properly. I've got some repos which have a two-stage build/deploy workflow and I couldn't figure out how to trigger just the build whenever a PR was open. Builds off commits published worked fine, but builds off open PRs did not. Consensus on the discussion forums was this "wasn't possible at the moment".

The [OwnTracks Android repo](https://github.com/owntracks/android) uses [Travis CI](https://travis-ci.org/) for builds, so I thought I'd have a play. Turns out that building off open PRs is a first-class feature, and the configuration is much simpler than with CircleCI. I'm sure it can "do less", but for my purposes it seems to fit much better.

Also, Comic Sans on the interface is a joy.

## Standing up

I also bought a standing desk. Bits of me ache, but in a good way.
