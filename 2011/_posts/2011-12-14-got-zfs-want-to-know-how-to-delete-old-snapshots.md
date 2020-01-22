---
layout: post
title: "Got ZFS? Want to know how to delete old snapshots?"
---
[ZFS](http://en.wikipedia.org/wiki/ZFS) is brilliant. As is its ability to snapshot any filesystem. However, it raises an interesting problem: how do you manage and maintain your snapshots?

Anyone can write a script that runs on a cron to automatically snapshot a filesystem and give it a nice name. However, up until today, deleting old snapshots had always been a manual process. Then I learned something about both bash and [sed](http://en.wikipedia.org/wiki/Sed) which automated it for me. Simply, I wanted to be able to delete all but the last _n_ snapshots, all from a nice script which I can also whack in cron. I came up with this:

    FILESYSTEMS="tank@AutoD-=7 sastank@AutoD-=2"

    for filesystem in $FILESYSTEMS; do
        set -- `echo $filesystem | tr '=' ' '`
        echo $1 $2
        zfs list -t snapshot -o name -s name |grep ^$1 |sort -r| sed 1,$2d |sort  | xargs -n 1 zfs destroy -r
    done

This uses two tricks I didn't know about before. The first one is a hack to fake associative arrays in bash. Because you can't do this natively, you can set up a variable with a bunch of space-delineated key=value strings and then loop over each one and use the 'set' command to assign the key to `$1` and value to `$2`. In the above example, I can say "Keep the latest 2 of 'sastank' but the latest 7 of 'tank'", which is useful.

The second trick is the use of sed to give you a numbered range of lines from a multiline output. Before sed, it looked like this:

    zfs list -t snapshot -o name | grep ^$1 | sort -r | wc -l | xargs -n 1 expr -$2 + | tr -d '\n' | xargs -0 -i bash -c "zfs list -t snapshot -o name | grep ^$1 | sort -r | tail -n{} | sort |xargs -t -n 1 zfs destroy -r"

I was particularly proud of that until someone told me about sed.