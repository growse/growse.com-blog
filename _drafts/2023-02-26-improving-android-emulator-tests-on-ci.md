---
layout: post
title: "Improving Android Espresso Emulator Tests on CI"
description: "Why so slow?"
---

One of the things I like to do in my spare time (ha!) is work on a little open source Android application called [OwnTracks](https://owntracks.org).

Part of what makes developing and iterating on this hard is testing - not because testing is inherently difficult, but because for applications with a user interface, you need to actually test the flows on the user interface to make sure it behaves properly. Call it end-to-end testing, UX testing, whatever. Android uses a framework called [Espresso](https://developer.android.com/training/testing/espresso) to help with this.

One of the pre-requisites for running these types of tests is that you need a real runtime to test on, something that's as close as possible to an actual device a user's going to be running on. A lot of people use actual, real devices to carry out their tests on. These people have more money and shelf space than me. For the rest of us, there's an [Emulator](https://developer.android.com/studio/run/emulator) that essentially runs a [QEMU](https://www.qemu.org/) instance of an Android device, and can be configured with a range of different OS images, settings etc.

# Great! What's the problem?

So how long should an espresso test run take on an emulator?

Creating an avd (emulator image), booting it, waiting for it to boot, and then running the test suite (from a hot gradle cache) on my current machine (Intel i7-4790 with 32GB RAM on a fast SSD) shows the whole thing runs in 11 minutes or so:

```shell
$ avdmanager create avd -k "system-images;android-33;google_apis_playstore;x86_64" -n test -d pixel_4 && emulator -avd test -no-sim -use-host-vulkan -no-audio -no-boot-anim -memory 3000 -cores 2 & adb wait-for-device && while [[ -z $(adb shell getprop sys.boot_completed) ]]; do echo "not booted yet"; sleep 1; done && ./project/gradlew -p project createGmsDebugCoverageReport --scan
...
BUILD SUCCESSFUL in 11m 8s
```

So we should be able to run the full test suite on CI in about the same amount of time, right?

On CircleCI (with a "large" resource class, 4CPU, 15GB RAM)

```
$ ./project/gradlew -p project createGmsDebugCoverageReport --scan 
...
<============-> 94% EXECUTING [21m 18s]
context deadline exceeded

Build timed out.
```

Yikes. The job has a timeout of 60 minutes, and it's taking longer than that and then getting cancelled. 

# Why so slow?

There's a couple of things going on here. First, we can see from the `gradle` output that the tests have been running for 21 minutes at the point that it was cancelled. But we can also reason that if the gradle test command had been running for only 21 minutes, yet the whole job was cancelled after an hour, then *something* must have been happening for 39 minutes before it. 

What could that be?

```shell
#!/bin/bash -eo pipefail
circle-android wait-for-boot

Waiting for Device.* daemon not running; starting now at tcp:5037
* daemon started successfully
..........
Device is ready after 21 seconds
Waiting for Shell.
Shell is ready after 21 seconds
Waiting for Boot animation complete.
Boot animation complete is ready after 23 seconds
Waiting for System boot complete.............................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................
System boot complete is ready after 2230 seconds

CircleCI received exit code 0
```

Two thousand two hundred and thirty seconds is a long time to wait for the emulator to start. Presumably it had some issues there, since that's not normal.

Looking at the logcat, there's lots of fun errors and segfaults. This isn't an isolated case either - I picked somewhat of an outlier, but the emulator routinely spends 15-20 minutes just starting up.

# Does it have to be that slow?

On my desktop, an emulator that cold boots is up in about a minute. From a snapshot, it's alive in seconds. This raises the obvious question: why can't I build a snapshot and just boot my emulator from that on every CI run? It turns out that a snapshot is somehow tied very closely to the avd that created it. Delete the avd, and the snapshot can't be re-used.



https://github.com/google/android-emulator-container-scripts