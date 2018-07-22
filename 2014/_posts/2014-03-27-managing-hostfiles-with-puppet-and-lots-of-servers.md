---
layout: post
title: "Managing hostfiles with Puppet and lots of servers"
---
Sometimes, DNS just doesn't work. Or doesn't work well enough. I discovered this building a Hadoop cluster on someone else's [Cloudstack](http://cloudstack.apache.org/) infrastructure because Hadoop requires every node to be able to reliably resolve and communicate with every other node. It turns out this particular Cloudstack deployment didn't have particularly reliable DNS, so I needed a better way.

Somewhere, in some piece of Hadoop documentation, there's a note that you can simply use the hosts file on each cluster server to provide reliable address resolution to every other host in the cluster. This is a great idea, until you actually realise that you have a Hadoop cluster containing 100 nodes and you now need to build and distribute a hosts file with 100 entries to each server. 

Because it's flavour of the month, enter Puppet. Yay!

This is really one of those short neat tricks, but it saved me some time. The simple answer is to get puppet to manage your hosts file for you. To do this, you really need two things:

1. You need [PuppetDB](https://docs.puppetlabs.com/puppetdb/latest/). PuppetDB is pretty useful, so you should have it anyway, but in this particular case it's a database containing every host and fact for that host that's in your puppet estate. Crucially, this gives you a list of hosts and their IP addresses.
2. You need the `future` parser in puppet. This is because we're going to use `each` in a puppet manifest, and that's currently only in the `future` parser. I guess this will make it into the main parser at some point, but now it's technically unstable.

Then, simply do this:

    each(query_facts('Class[Hadoop]', ['ipaddress'])) |$host, $fact| {
        host{$host: ip => $fact['ipaddress']}
    }

`query_facts` just queries puppetdb to get some data out. In this case, it's returning the fact `ipaddress` from all servers that have the `Hadoop` class as an object keyed off the hostname and containing the fact value. `each` then just iterates through this object and lets you call the puppet type `host`, which simply sets a hosts file entry.

This is probably a little heavy on the puppetdb, as it has to make this request for every catalog compilation. But it works great.

Alternatively, fix your DNS.