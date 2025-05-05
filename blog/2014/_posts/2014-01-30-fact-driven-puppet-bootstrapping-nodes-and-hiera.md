---
layout: post
title: "Fact-driven puppet, bootstrapping nodes and Hiera"
---
I've been working on a problem for a while around configuration management of many hosts in a cloud-like environment. The nature of the problem boils down to this:

"How do I configure a base OS VM / instance to be what I want it to be in a single puppet run?"

To flesh this out a bit, I was after a way so that I could deploy a new VM with a base OS installed, and in a single puppet run, have that instance determine what its role should be, and configure itself accordingly. I've seen this done using a two-step puppet process - an initial bootstrap to set a bunch of puppet facts followed by the main puppet run where the configuration got applied. I wanted to see if this could be done in a single step. I also wanted to do something like [Jorden Sissel's Fact based nodeless puppet configuration](http://www.semicomplete.com/blog/geekery/puppet-nodeless-configuration), because I think that's quite clever.

I think I figured it out.

The solution presupposes a couple of things, which are things you may or may not want to also presuppose. Firstly, you need to have some way of mapping a fresh VM to its role and environment (in this case, I'm using the term 'deployment', because 'environment' means a specific thing to puppet). Typically, you could do this with a hostname, which assumes that you can set the VM hostname when you create it. In theory, you could use any fact about the box, but hostname seemed easiest in my case. Secondly, I'm building an infastructure in which the configuration applied will depend on the role of the server (webserver, database, MQ etc), the 'environment' it lives in (production, pre-prod, dev) and also the datacenter location.

[Hiera](http://projects.puppetlabs.com/projects/hiera) is how you achieve a lot of this in the real world. This lets you define a set of configurations that affects class variables based on facts about the hostname. So you could apply a different set of NTP servers if your host's "datacenter" fact is "UK" as opposed to "US". This is all clever stuff.

However, you can also use Hiera as your data source for mapping hosts to roles. So you might have a Hiera config that looks like this:

	:hierarchy:
		- "node/%{::fqdn}"
		- "deployment/%{myapp::deployment}"
		- "role/%{myapp::role}"
		- common
	:backends:
		- json
	:json:
		:datadir: /var/local/myapp/hieradata

If you're not familiar with Hiera, this is basically a configuration that instructs puppet variables to be populated from files stored in the `datadir`. The `hierarchy` determines where Hiera looks first. In this case, it matches a file based in the `node` directory according to the host's FQDN. This can simply set the specific role / deployment / whatever for that specific host. Hiera then moves down the hierarchy matching the node's facts and parsing the relevent configuration files.

The cunning part is that Hiera will populate variables _as it goes along_. In the above case, if `node/wibble.example.com.json` sets `myapp::role` to `database`, Hiera will in the same run look for `role/database.json` as it works down the hierarchy.

So, as an example, if I know I need another production database server, I decide that I want it to be called `myrandomhost37.example.com`. I can create `node/myrandomhost37.example.com` in the Hiera data dir, and put the following in it:

	{
	    "myapp::role" : "database",
	    "myapp::deployment" : "production"
	}

I then ping my cloud API and deploy an instance with that name, wait for it to complete and kick off a puppet run. As puppet runs, it first sets the `myapp::role` and `myapp::deployment` variables from the first Hiera hierarchy part, evaluates the other parts to set other role- or deployment-specific facts, and then compiles the manifest.

This next bit is where I borrow from the nodeless puppet configuration linked above - I have a single `manifests/site.pp` which looks like this:

    node default {
        include myapp
    }

This simply includes `manifests/init.pp` inside the `myapp` modules. This manifest has a simple switch statement that decides based on the role what the node should be:

	class myapp($role='', $deployment='') {
		case $role {
			'database': { include myapp::database }
			'webserver': { include myapp::webserver }
		}
	}

As should be fairly obvious, this simply includes the relevent class, based on the node. The great thing about this is that if you forgot to define your endpoint Hiera config, it effectively will have nothing set in the `role` and `deployment`, so nothing will get deployed. It won't error out, it'll sit and wait. You could, in theory, have a whole bunch of unconfigured VMs ready to be 'things', and when you need them, you simply add them into Hiera, and they get magically configured the next time they do a puppet run.

I'm going to test this out a little further, but I think it's a reasonable approach that should scale quite well.
