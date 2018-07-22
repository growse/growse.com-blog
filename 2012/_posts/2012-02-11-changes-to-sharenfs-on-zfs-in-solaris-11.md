---
layout: post
title: "Changes to sharenfs on ZFS in Solaris 11"
---
In the good old days, you could specify how you wanted to share a ZFS volume over nfs using the 'sharenfs' option. You could either set it to simple values, like 'on' or 'off', or if you wanted to do something more complex, you could do this:

    zfs set sharenfs=rw=192.168.100.0/24,anon=0 tank/whatever

This would merrily allow root access to anonymous clients on the 192.168.100.0/24 network to the 'tank/whatever' share. This is useful if you're trying to share an NFS volume between a bunch of VMware vSphere 5 hosts.

For reasons unknown, Oracle saw fit to change this in Solaris 11. If you try the above command, you'll receive something saying:

    cannot set property for 'tank/whatever': 'sharenfs' cannot be set: must be 'on' or 'off'

The network and access control is still there, it's now buried behind the 'share' property. So first you must set the sharenfs property to 'on', and then you must specify what you want in the 'share' property:

    zfs set sharenfs=on tank/whatever
    zfs set share=name=tank_whatever,path=/tank/whatever,prot=nfs,anon=0,sec=sys,rw=@192.168.100.0/24 tank/whatever

Not exactly sure why they changed this. Curiously, if you upgraded to Solaris 11 from 10, and had a ZFS filesystem which had 'sharenfs' previously defined as something weird, it keeps that property after the upgrade. You just can't change it to anything other than 'on' or 'off'.