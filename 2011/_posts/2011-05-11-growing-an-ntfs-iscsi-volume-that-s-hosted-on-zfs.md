---
layout: post
title: "Growing an NTFS iSCSI volume that's hosted on ZFS"
---
One of the many problems I face in my ridiculous mountain of 'stuff to care
about' at work is a rather write-heavy MSSQL database. By write-heavy, it's
only something like 60-70 thousand inserts per day, and so far there's over 6
million rows on on of the tables. When you're taking full daily backups and
transaction log backups every 15 minutes, disk space starts to run thin
quickly.

I recently migrated that particular MSSQL server onto a 2-node failover
cluster (takes a while to get right when both servers are VMs on VMware's
vSphere 4.1). This works rather well. The shared storage is provided over
iSCSI from a Solaris 11 Express box.

When I initially set up the cluster and was generating the LUNs, I just
assumed '100Gb' or so would be enough. It turns out, it's not enough. Thinking
this would be a major thing to resolve, I set aside a few hours to try and
figure it out. To my surprise, it was surprisingly easy and took about 10
minutes. Here's how.

Step 1: First you have to make the ZFS volume bigger. Falling into exactly the
same trap as before, I just said "Oh, 300Gb is surely going to be enough". I
did this:

    zfs set volsize=300G tank/comstar/sqldata

Step 2: Now, you need to tell SCSI block disk thingie that the LUN's changed.
Otherwise, it's got no clue what's going on.

    sbdadm modify-lu -s 300g

Step 3: Head over to Windows, open the disk storage manager where (hopefully)
it should have recognised that you've got a massively bigger disk with a tiny
partition, hit right-click and "Extend".

That's it. It seems to work. Best of all, no iSCSI disconnects, no MSSQL
burps, the data collector didn't notice and just ploughed on.

I love ZFS. Shame Oracle had to ruin everything.

