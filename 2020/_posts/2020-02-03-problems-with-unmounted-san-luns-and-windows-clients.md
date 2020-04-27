---
layout: post
title: "Problems with unmounted SAN LUNs and Windows clients"
---

This is about a problem with computers and storage devices. There is no satisfying conclusion. I do think I fixed the issue, but I still don't really know what caused it. Grrr.

## Block storage on Kubernetes

I've got a couple of the HP Microserver G8s at home, one of which is running [FreeNAS](https://freenas.org). It's generally one of the few things I have that I don't tinker with and (as a result) doesn't really break that often. I've got 4 spinning rust discs in it, plus a couple of SSDs that are doing ZFS caching things.

The NAS is generally providing three things: a large NFS/CIFS-exported share to put stuff that I want available everywhere, a large block device that's exposed to my main desktop machine, and a series of smaller block devices and NFS shares that are provisioned by and exposed to my Kubernetes cluster.

Kubernetes has apparently been mostly engineered to run nicely in "other people's clouds", but it works very happily on metal that you already own. One problem that needs to be solved here is how to deal with persistent storage. On a cloud provider, Kubernetes would simply take a created [persistent volume claim](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) (PVC) and then invoke a magical API to provision a storage volume that meets the requirements and attach it to the node running whatever pod(s) it needs to be mounted on. In bare-metal land however, there is no magical storage API.

There's a couple of different ways to solve this problem, but I was happily surprised to see that people have clubbed together to write their own storage provisioners for Kubernetes which can provision storage on a FreeNAS device. It turns out that lots of things on Kubernetes are pluggable - if you don't like an implementation of some part of it, write your own! Specifically [freenas-provisioner](https://github.com/nmaupu/freenas-provisioner) (for provisioning NFS shares) and [freenas-iscsi-provisioner](https://github.com/travisghansen/freenas-iscsi-provisioner) (for iSCSI). These work by deploying pods into the cluster that can watch for changes in PVCs and then configure FreeNAS via its API to deliver a volume. Some workloads / clients really don't like being on NFS and assume that they're operating on a 'proper' block device (I'm looking at you, SQLite), so I end up sleeping much better by just giving them a block device with a proper filesystem on it.

The NFS provisioner creates a new ZFS filesystem and then configures the NFS server to expose that volume so that Kubernetes nodes can mount it. The `kubelet` runtime on each node already knows how to mount NFS shares, so once the share exists and is available, it can be mounted wherever it's needed by Kubernetes automatically.

The iSCSI provisioner does a similar thing, except it creates a ZVOL instead and exposes that over iSCSI.

## Mixing iSCSI and FC

My desktop (running Windows 10) also uses a FreeNAS ZVOL over [fibre channel]({% post_url /2016/2016-03-19-more-fibre-channel-nonsense %}). This is mostly frivolous and slightly pointless, but does have the advantage of providing the benefits of ZFS (checksumming etc.) to a 'locally-attached' disk in Windows. It's a pretty simple setup, a single ZVOL is mounted by the Windows client and formatted with NTFS.

FreeBSD uses a single subsystem to manage the export of all block-level devices: [CAM Target Layer (CTL)](https://www.freebsdfoundation.org/blog/cam-target-layer/#!). This essentially means that FC & iSCSI ports and targets are managed by the same tooling and with the same set of configuration. This is handy, as it means a single block device can be exposed over different media to different clients - there's no sense that a particular device is "iSCSI only". The only difference between how the iSCSI and FC media operate is the way in which they're exposed. A FC 'port' can have multiple LUNS exposed on it, whereas for iSCSI the model is more to create a single port for each exported device. iSCSI clients can then address a specific device using its qualified name, whereas a FC client just sees everything that's exposed on its port.

Here's what this looks like from CTL's point of view:

```shell 
$ ctladm portlist -i -v
Port Online Frontend Name     pp vp
3    YES    camtgt   isp0     0  0  naa.21000024ff56f970
  Target: naa.20000024ff56f970
  All LUNs mapped
      port_type=1
4    YES    camtgt   isp1     0  0  naa.21000024ff56f971
  Target: naa.20000024ff56f971
  All LUNs mapped
      port_type=1
5    YES    iscsi    iscsi    1  1  iqn.2005-10.org.freenas.ctl:default-mosquitto-iscsi-claim,t,0x0001
  Target: iqn.2005-10.org.freenas.ctl:default-mosquitto-iscsi-claim
  Initiator 3: iqn.1993-08.org.debian:01:e38f5e7da7d,i,0x00023d000004
  LUN 0: 12
      port_type=16
      cfiscsi_state=1
      cfiscsi_target=iqn.2005-10.org.freenas.ctl:default-mosquitto-iscsi-claim
      cfiscsi_portal_group_tag=1
      cfiscsi_target_alias=default-mosquitto-iscsi-claim
      ctld_portal_group_name=pg1
      ha_shared=on
```

This output shows I have two FC ports (`isp0` and `isp1`) wihch are exposing all the available LUNs (`All LUNs mapped`), and I have a single iSCSI target called `iqn.2005-10.org.freenas.ctl:default-mosquitto-iscsi-claim`.

Because all of the LUNs are exposed over FC, this meant that the Windows client could 'see' all of the block devices in the disk manager, but they get shown as 'offline'. Because they've been provisioned by Kubernetes, they're mostly `ext4` formatted and Windows doesn't understand this.

## Suddenly error, remounting read-only

However, there was a problem. Occasionally I saw that some of the services on Kubernetes would stop working. Sometimes this would result in the pod going down, other times the pod was healthy but the software not working properly. Digging into the pod logs showed that the pods were having problems writing to volumes that were mounted over iSCSI. Connecting to one of the nodes directly and listing the mountpoints showed that a lot (all?) of the iSCSI mounts were mounted `ro`. 

There's usually two reasons why an `ext4` filesystem would be mounted `ro`. Either you explicitly ask for it to be, or it was previously mounted `rw`, ran into a data issue or corruption problem, and re-mounted itself `ro`. It's a good example of trying-to-be-helpful-while-failing which ends up being actually not that helpful. I understand that re-mounting read-only might be useful in certain circumstances, but if I mounted a filesystem `rw`, then the chances are that I need to write to it. If the mount is problematic, just unmount the whole thing.  

Anyhow, the next question is *why* is the system having difficulty with the mount?

```shell 
[35771.996877] sd 6:0:0:0: [sdb] tag#97 FAILED Result: hostbyte=DID_OK driverbyte=DRIVER_SENSE
[35771.996884] sd 6:0:0:0: [sdb] tag#97 Sense Key : Not Ready [current]
[35771.996889] sd 6:0:0:0: [sdb] tag#97 Add. Sense: Logical unit not ready, initializing command required
[35771.996895] sd 6:0:0:0: [sdb] tag#97 CDB: Write(10) 2a 08 00 00 00 00 00 00 08 00
[35771.996898] print_req_error: I/O error, dev sdb, sector 0
[35771.996911] Buffer I/O error on dev sdb, logical block 0, lost sync page write
[35771.996953] EXT4-fs (sdb): I/O error while writing superblock
[35771.996962] EXT4-fs error (device sdb): ext4_journal_check_start:61: Detected aborted journal
[35771.996970] EXT4-fs (sdb): Remounting filesystem read-only
```

Uh oh. Bad! Very bad! `Buffer I/O error` is not a fun error. If this were an actual physical disk, we'd be into "throw it away and buy a new one" territory. But it isn't - it's a block device backed by a zvol on a set of disks that are otherwise completely non-problematic. Also, all of the iSCSI devices are going offline at the same time. It doesn't feel like a disk problem.

The network is the next obvious cause - maybe something is happening on the network which is causing all the mounts to suddenly trip offline. This is a relatively new problem too, it's only started happening recently. What's changed?

## Windows bug?

As I said above, this story does not have a particularly satisfying conclusion. I eventually figured out that the mounts had started going offline ever since I enabled sleep/suspend on my desktop PC. I previously had just been turning it on / off as required, but after measuring how much power it drew if I forgot to turn it off, I decided that letting it sleep after some time of inactivity would be a good thing.

I then noticed that these offline events would mostly happen late at night, sometimes in the afternoon. The correlation seemed to be that they happened a short while after I stopped working on something. Then I noticed that the times lined up exactly with when the Windows desktop went to sleep.

So somehow, a Windows 10 machine (not using iSCSI) going to sleep is causing problems for other systems that have mounted block devices over iSCSI. The only interaction between the Windows client and these other block devices is that the client can 'see' the other block devices over the FC connection. Maybe it's interfering somehow with unmounted block devices when it goes to sleep?

To test this theory, I had a look to see if you could restrict which LUNs where available on FC ports on FreeBSD. Usefully, this is pretty straightforward. My Windows device is on LUN 1, so to expose LUN id 1 on port 3 (my connected FC port) as being available on LUN 1 to clients:

```shell 
$ ctladm lunmap -p 3 -l 1 -L 1
```

Now I can see:

```shell 
$ ctladm portlist -i -v
Port Online Frontend Name     pp vp
3    YES    camtgt   isp0     0  0  naa.21000024ff56f970
  Target: naa.20000024ff56f970
  LUN 1: 1
      port_type=1
```

And looking in Windows, it now does not see the other devices.

This appears to have solved the problem. The mounts no longer go into read-only mode when the Windows client goes to sleep. I'm well aware of the potential for corruption caused by mounting a block device on multiple hosts simultaneously (unless using a cluster-aware filesystem), but these devices are not being mounted by the Windows client, so it shouldn't be touching them. Is this a bug?