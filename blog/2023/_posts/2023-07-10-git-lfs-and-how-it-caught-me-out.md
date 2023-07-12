---
layout: post
title: "Git LFS, and how it caught me out"
description: "Why won't my tools stop hitting me?"
tags: [ "programming", "git" ]
---

I was today years old when I got bitten by some minor assumptions on how git-lfs works.

# Git-what?

[Git Large File Storage (LFS)](https://git-lfs.com/) is a neat little add-on to git that allows you to store things that
aren't necessarily text based in a git repo. Git was designed for source code, which generally tends to exist as
plaintext.

There's nothing inherently wrong or bad about storing things that aren't small, plain-text files in git, it'll happily
do it. It's just that it's not very efficient based on the way that the innards of git work, and they tend to mess up
the diffs somewhat. LFS tries to solve that problem by storing some files (that you choose) in some sort of external
file storage, and then storing a reference to that within the git repo itself. This you don't have to spend bandwidth
pulling in every version of every large binary when you clone, they can be just fetched on-demand.

# The problem

I've been working on a feature for an Android project for a little while, trying to migrate away from
the [ObjectBox](https://objectbox.io/) storage library for a bunch of boring reasons (mostly around the extent to which
it's open-source). It turns out that ObjectBox is, essentially, [LMDB](http://www.lmdb.tech/doc/)
plus [FlatBuffers](https://flatbuffers.dev/). My specific problem was trying to migrate from an ObjectBox store without
using the ObjectBox library, on a mobile device.

After throwing together a little [pure-kotlin LMDB](https://github.com/growse/lmdb-kt) library, I got this feature
working how I expected. I had a bunch of tests that would run the migration on some LMDB database files and show that
under a bunch of different scenarios, the right data was read and parsed.

Some of these test cases involved some quite large databases, but I wanted to store the LMDB test fixtures in the git
repo. So, for the first time, I got out git LFS and told it to track those specific files. Simple!

Everything worked great. Except that the tests failed on CI.

# Works on my machine

This was confusing. The specific tests were failing at the same point every time, right at the point that the
LMDB `Environment` was being initialized.

```stacktrace
07-05 10:28:11.963  E java.lang.ArrayIndexOutOfBoundsException: length=9; index=12
07-05 10:28:11.963  E 	at com.growse.lmdb_kt.DbMappedBuffer.flags-i8woANY(DbMappedBuffer.kt:110)
07-05 10:28:11.963  E 	at com.growse.lmdb_kt.PageHeader.<init>(PageHeader.kt:28)
07-05 10:28:11.963  E 	at com.growse.lmdb_kt.DbMappedBuffer.getPage-WZ4Q5Ns$lmdb_kt(DbMappedBuffer.kt:27)
07-05 10:28:11.963  E 	at com.growse.lmdb_kt.Environment.getMetadataPagesWithPageSize-Qn1smSk(Environment.kt:169)
07-05 10:28:11.963  E 	at com.growse.lmdb_kt.Environment.getMetadataPage(Environment.kt:149)
07-05 10:28:11.963  E 	at com.growse.lmdb_kt.Environment.getMetadataPage$default(Environment.kt:143)
07-05 10:28:11.963  E 	at com.growse.lmdb_kt.Environment.<init>(Environment.kt:78)
07-05 10:28:11.963  E 	at com.growse.lmdb_kt.Environment.<init>(Unknown Source:6)
07-05 10:28:11.963  E 	at com.growse.lmdb_kt.Environment.<init>(Environment.kt:26)
07-05 10:28:11.963  E 	at org.owntracks.android.data.waypoints.RoomWaypointsRepo$migrateFromLegacyStorage$1.invokeSuspend(RoomWaypointsRepo.kt:112)
07-05 10:28:11.963  E 	at kotlin.coroutines.jvm.internal.BaseContinuationImpl.resumeWith(ContinuationImpl.kt:33)
07-05 10:28:11.963  E 	at kotlinx.coroutines.DispatchedTask.run(DispatchedTask.kt:106)
07-05 10:28:11.963  E 	at org.owntracks.android.testutils.idlingresources.EspressoTrackedDispatcher.delegateDispatchWithCounting$lambda$0(EspressoTrackedDispatcher.kt:37)
07-05 10:28:11.963  E 	at org.owntracks.android.testutils.idlingresources.EspressoTrackedDispatcher.$r8$lambda$im9-z3xxgDDV52szIGJhZ5tniMs(Unknown Source:0)
07-05 10:28:11.963  E 	at org.owntracks.android.testutils.idlingresources.EspressoTrackedDispatcher$$ExternalSyntheticLambda0.run(Unknown Source:4)
07-05 10:28:11.963  E 	at kotlinx.coroutines.internal.LimitedDispatcher.run(LimitedDispatcher.kt:42)
07-05 10:28:11.963  E 	at kotlinx.coroutines.scheduling.TaskImpl.run(Tasks.kt:95)
07-05 10:28:11.963  E 	at kotlinx.coroutines.scheduling.CoroutineScheduler.runSafely(CoroutineScheduler.kt:570)
07-05 10:28:11.963  E 	at kotlinx.coroutines.scheduling.CoroutineScheduler$Worker.executeTask(CoroutineScheduler.kt:750)
07-05 10:28:11.963  E 	at kotlinx.coroutines.scheduling.CoroutineScheduler$Worker.runWorker(CoroutineScheduler.kt:677)
07-05 10:28:11.963  E 	at kotlinx.coroutines.scheduling.CoroutineScheduler$Worker.run(CoroutineScheduler.kt:664)
```

I'd done a whole bunch of testing on different, weird LMDB databases to make sure my little `lmdb-kt` implementation
could successfully read data out from it. So to see it fail on CI was pretty deflating.

So, what's going on here?

We're in `org.owntracks.android.data.waypoints.RoomWaypointsRepo$migrateFromLegacyStorage`, which is basically a
function that migrates a data store from ObjectBox to using
an [Android Room](https://developer.android.com/training/data-storage/room) store instead. This, essentially checks to
see if an LMDB database exists on the device in a place the old system used, and then tries to open it, pull out all the
data, convert it a little bit, then write it to the new store.

We're specifically at `Environment.<init>`, which is a little bit of setup to try and work out the page size of the
database is. LMDB's C implementation uses database pages that align with the system's page size (which makes sense). On
a lot (most?) systems, this is about 4KB, but I've seen 16KB on OSX-arm. Feeling that it might be bad to just blindly
assume that pages are always 4KB, I put in a little bit of probing to see what the page size might be.

All LMDB databases first two pages are "Meta" pages. So you should be able to parse the page header at `offset=0`,
and `offset=<pagesize>`, and if you get metadata pages, you've probably got the right page size.

Back to the stacktrace. We're pulling the first meta page and then trying to parse the flags of the page which tell us
the type of page this is. It looks like it's getting an `ArrayIndexOutOfBoundsException` by trying to read byte 12 of
something that's only 9 bytes long. It makes sense that this would fail at reading the page header flags - these are
found at bytes 10 and 11 in a page.

Here's how we read the page header:

```kotlin
pageNumber = buffer.readLong()
padding = buffer.readUShort()
flags = buffer.flags(Page.Flags::class.java, 2u)
```

The `flags` function takes the given number of bytes, assumes it's a bitmap and then extracts an `EnumSet` from it with
the given `Enum` class. Or:

```kotlin
fun <T : Enum<T>> flags(clazz: Class<T>, byteCount: UShort): EnumSet<T> =
    BitSet.valueOf(buffer.slice().apply { limit(byteCount.toInt()) }).let { bitset ->
        buffer.seek(byteCount.toInt())
        val constants = clazz.enumConstants
        EnumSet.noneOf(clazz).apply {
            addAll(
                IntRange(0, bitset.size()).flatMap { bitnum ->
                    if (bitset[bitnum]) listOf(constants[bitnum]) else emptyList()
                },
            )
        }
    }
```

The bit it's blowing up on is the part where it's looking up the value in `constants` for the value of the bit
index `bitnum`. There are only 9 different database flags, and somehow bit 12 is set.

Bit 12 should not be set!

# But it doesn't work on my other machine

It seems obvious now that the CI and the local instance might be looking at different test fixtures. As much as it might
be possible to attach a debugger to my CI instance somehow, I reverted the good old-fashioned
throw-lots-of-print-statements debugging technique.

First, let's just dump the file size of `data.mdb` as we open it.

Locally:

```
Mapping file /data/user/0/org.owntracks.android.debug/files/objectbox/objectbox/data.mdb. Size is 12288, md5 is c5d30a30601833eee4807981c3d425f0
```

Looks good - 3* 4,096-byte pages. 12KB.

On CI:

```
Mapping file /data/user/0/org.owntracks.android.debug/files/objectbox/objectbox/data.mdb. Size is 130, md5 is 54e64601eec41e70e41e2de47e36dc0d
```

130 bytes is ... not a multiple of 4,096. Ok, it's seeing a different file. Let's just dump the hex contents on the file
to the log!

```
76657273696f6e2068747470733a2f2f6769742d6c66732e6769746875622e636f6d2f737065632f76310a6f6964207368613235363a633035336261633963623562343339313463343138343837393332353262363634376637393061393937303865376561623132643532373830343237386565640a73697a652033323736380a
```

That's.... ASCII?

```
version https://git-lfs.github.com/spec/v1
oid sha256:c053bac9cb5b43914c41848793252b6647f790a99708e7eab12d527804278eed
size 32768
```

Oh look, it's the stub you get in a git repo when you use git LFS.

# Lessons learned

Very specifically, the lesson is:

> The Github `actions/checkout` doesn't enable LFS by default. Set `lfs: true`

More generally, the lesson might be:

> Write better code

Or possibly

> Put the computer down and go outside

I'm not really sure.
