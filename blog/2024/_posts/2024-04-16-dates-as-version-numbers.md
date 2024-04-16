---
layout: post
title: "Timestamps as software version numbers?"
description: "Number go up thing get better."
tags: [ "programming" ]
---

## A bit of history

The idea of a version number has existed for a while now: back in 1972
the [TENEX system running on a PDP-10](https://www.researchgate.net/publication/220421975_TENEX_a_paged_time_sharing_system_for_the_PDP_-_10)
had the concept of a "version number" field as part of the file name:

> The version number of a file enumerates successive versions of a file. Normally each time a file is written a new
> version is automatically created by making its version number be one greater than the highest existing version. This
> protects a user from loss if he accidentally writes on the wrong file. Excess versions may be deleted by the user, or
> automatically by the system, when they have been put on a backup storage medium.

Simple, right? Just use a number and add one when you get a new version.

This worked for a bit, but then people started to want to bake _meaning_ into the version number. How can we distinguish
between two versions that only differ very slightly and two versions which differ enormously?

This problem neatly precipitates out when you start having bits of software depend on other bits of software. The whole
idea behind shared libraries, or dynamic linking is that you can load (at run-time) an instance of your dependency and
rely on certain things about that library being true (e.g. the API / ABI is what you expect). So you need a way to
indicate to users that "this new thing can be used as if it were the old thing" versus "this thing needs to be used
differently, it breaks compatability with the old thing".

Enter [SemVer](https://semver.org/).

## Rigor!

Semver exists to try and lay down some rules about what the software version number should look like and when bits of it
should be changed. Essentially it's `MAJOR.MINOR.PATCH` (e.g. `1.5.3`), and you're only meant to increment `PATCH` if
you make a change that doesn't affect the functionality, `MINOR` if you introduce something new but don't break existing
users and `MAJOR` if you break compatability. Seems fine.

However, not all software has these sorts of constraints. Not all software is developed and built in mind of a towering
ecosystem of dependents that deeply care about dependency compatability. The problem is that people fling around SemVer
where it's not really appropriate, which is how you end up with software at version `0.153.0` or similar.

The SemVer site explicitly references this too:

> For this system to work, you first need to declare a public API.

No public API? No need to use SemVer.

There are large projects that do use simple, incrementing numbers (
e.g. [systemd](https://github.com/systemd/systemd/releases)) which you could argue _do_ have a public API, so this is
evidently a conscious choice to deliberately not provide any stability guarantees about that API. The format of the
version number provides a strong hint as to what you might expect from new versions of that software in the future.

## Dates and Times > simple numbers

I used to work at a place that ignored SemVer altogether. Instead, software versions numbers were effectively a date,
with a counter on the end. For example `v2024.04.16-01`. This threw me quite a bit initially (how does API stability
even work?!) but after a period of time I began to appreciate the benefits. There were two key things:

1. APIs are delivered _as part of software_ so should be versioned separately. So an API might get a `v1` label, and
   breaking changes to that API would cause a bump in that API version (good projects would overlap their support).
2. Figuring out how old a piece of deployed software is becomes trivial

There's a few other projects that actually take this approach in the
wild. [Home-Assistant](https://github.com/home-assistant/core/releases) uses a month-based-date-plus-counter approach,
which seems to work quite well. I think they also operate on a monthly cadence for features, so you end up with an
expectation that `2024.4.0` might be a slightly more risky upgrade than `2024.3.5`.

## RFC3339

A while back, I started following this model for docker containers that I run on my k8s cluster (and other places). A
lot of these projects tend to follow a pattern of short periods of intense feature / bugfix activity, followed by long
periods of simple dependency updates. Operationally, the value of looking at a k8s deployment and see when something is
unnervingly old gives me a hint that something might be awry (either with the automated dependency updater or with the
cluster configuration manager).

I also decided that I couldn't be bothered with combining a date and an auto-incrementing number, so decided instead to
just use an [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339)-formatted timestamp.

## Docker builds on GitHub Actions

Here's a handy GitHub action workflow that builds a `Dockerfile` and publishes it to `ghcr.io` with an RFC3339-formatted
tag.

{% raw %}

```yaml
---
name: Build, package and publish
"on":
  push:
    branches:
      - main
  pull_request:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    name: Build
    runs-on: ubuntu-latest
    permissions:
      packages: write
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@d70bba72b1f3fd22344832f00baa16ece964efeb # v3
      - name: Log in to the Container registry
        uses: docker/login-action@e92390c5fb421da1463c202d546fed0ec5c39f20 # v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata (tags, labels) for Docker
        id: meta
        uses: docker/metadata-action@8e5442c4ef9f78752691e2d8f8d19755c6f78e81 # v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=raw,value=latest,enable={{is_default_branch}}
            type=raw,enable={{is_default_branch}},value={{date 'YYYY-MM-DDTHH.mm.ss' tz='UTC'}}
      - name: Build Docker image
        uses: docker/build-push-action@2cdde995de11925a030ce8070c3d77a52ffcf1c0 # v5
        with:
          context: .
          push: ${{ format('refs/heads/{0}', github.event.repository.default_branch) == github.ref }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:build-cache
          cache-to: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:build-cache,mode=max
```

{% endraw %}
