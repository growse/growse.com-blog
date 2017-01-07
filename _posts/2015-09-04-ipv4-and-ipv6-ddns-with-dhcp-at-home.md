---
layout: post
title: "IPv4 and IPv6 DDNS with DHCP at home"
---
This is going to be one of those posts that is a reminder for me in the future for how I did something that works. Specifically, this is about how I got local LAN DNS with dynamic updates on DCHP for both IPv4 and IPv6 working. So: hi future me. Bet you forgot to puppetize this like you told yourself you would. You're an idiot.

The requirements are straightforward: hand out both IPv4 and IPv6 address on the local LAN, and update a local DNS server with both forward and reverse records for those DHCP clients. Also, get DNS resolution working properly and as a bonus, use  dnscrypt to provide DNS privacy from the ISP.

## DNS

First things first. DNS is important and can be surprisingly difficult to get right. I ended up with a configuration involving no less than 3 different types of DNS process, each doing a separate thing:

### DNScrypt-proxy

I wanted to make use of some of the new security features being developed on top of DNS. [DNSSEC](https://en.wikipedia.org/wiki/Domain_Name_System_Security_Extensions) is fabulous for trying to prevent DNS response tampering from, but doesn't actually provide privacy. [DNSCrypt](https://dnscrypt.org/) is a system developed by OpenDNS to provide encryption of requests between a local resolver and the next nearest recursive resolver. There's not much support for it in the whild, but OpenDNS support it themselves and that's probably good enough for the moment.

I used the debian [dnscrypt-autoinstaller](https://github.com/simonclausen/dnscrypt-autoinstall) which takes care of downloading the source, building it and selecting an upstream to work with, as well as installing init scripts to take care of startup. I adjusted the `/etc/init.d/dnscrypt-proxy` to make sure the two processes it spun up listened on `127.0.0.3` and `127.0.0.4`:

    ...
    case "$1" in
      start)
        echo "Starting $NAME"
        $DAEMON --daemonize --user=dnscrypt --local-address=127.0.0.3 --resolver-address=$ADDRESS1 --provider-name=$PNAME1 --provider-key=$PKEY1
            $DAEMON --daemonize --user=dnscrypt --local-address=127.0.0.4 --resolver-address=$ADDRESS2 --provider-name=$PNAME2 --provider-key=$PKEY2
        ;;
    ...

## Bind 

Next was building a DNS server that could handle the local network zone for both forward and reverse lookups. BIND is best supported for dynamic DNS, so I used that.

To configure BIND properly as a strictly local zone resolver, you simply need to disable the root zone and add in the local forward and reverse zones. Assuming that my local network is `192.168.0.1` and `2001:111:1234::` and my local dns name is `local.example.com`, some basic zone definitions are needed.

In `named.conf` I just added an `include named.conf.default-zones` and then made sure that the root zone was replaced with a 'fake' one:

`named.conf.default-zones`:

    zone "." {
        type master;
        file "/etc/bind/fake.root";
    };

`fake.root`:

    $TTL    3600
    .               IN      SOA ns. hostmaster.example.com. (
                            20120101 1800 900 604800 86400
                    )
    .               IN      NS      ns
    ns              IN      A       127.0.0.1

Further down in `named.conf.default-zones`, add the local zone definitions:

    zone "local.example.com" {
        type master;
        file "/etc/bind/local.example.com.db";
        allow-update {key DHCP_UPDATER; };
    };

    zone "0.168.192.in-addr.arpa" {
        type master;
        file "/etc/bind/192.168.0.db";
        allow-update { key DHCP_UPDATER; };
    };

    zone "4.3.2.1.1.1.1.0.1.0.0.2.ip6.arpa" {
        type master;
        file "/etc/bind/2001:111:1234.db";
        allow-update { key DHCP_UPDATER; };
    };

One thing that's important is the `allow-update` parameter. This lets other processes alter the zone dynamically. This refers to a key section, so we need to generate it using:

    dnssec-keygen -a hmac-md5 -b 128 -n USER DHCP_UPDATER

Inside `Kdhcp_updater.(somenumbers).key`, you'll see something like this:

    DHCP_UPDATER. IN KEY 0 3 157 HxUhKWVJcuyL9ZsG5HGF7A==

The last Base64 encoded piece is the key - take this and add it into the `named.conf.default-zones` as a `key` definition

    key DHCP_UPDATER {
       algorithm hmac-md5;
       secret "HxUhKWVJcuyL9ZsG5HGF7A==";
    };

Finally, on debian jessie, I had to make sure that `/etc/bind` was owned by the `bind` user. This is because bind tries to create a journal file for ddns updates alongside the zone files, which in my case were in `/etc/bind`. 

Finally, we're not going to query this directly, but from another process locally, so we want to restrict what bind listens to. In `named.conf.options`:

    listen-on { 127.0.0.1; };
    allow-query     { localhost; };

### Unbound

The last piece of DNS is our caching resolver that our local network clients are going to use. Unbound has the job of listening on the local network for requests, and then deciding whether they should be sent upstream (via dnscrypt-proxy) or to the local bind instance. We can achieve this using unbounds local-zone and stub-zone configurations.

Firstly, we need to tell unbound that our RFC1918 reverse zones are locally handled:

    local-zone: "0.168.192.in-addr.arpa." nodefault
    local-zone: "168.192.in-addr.arpa." nodefault

Both of these seem to be necessary - just including the first one still causes failures. Weird.

Then, web can simply set up stub zones for our locally-resolved zones, and then a general forward zone for everything else:


    stub-zone: 
        name: "4.3.2.1.1.1.1.0.1.0.0.2.ip6.arpa."
        stub-addr: 127.0.0.1
    stub-zone:
        name: "0.168.192.in-addr.arpa."
        stub-addr: 127.0.0.1
    stub-zone:
        name: "local.example.com."
        stub-addr: 127.0.0.1
    forward-zone:
        name: "."
        forward-addr: 127.0.0.3
        forward-addr: 127.0.0.4

By default, unbound is a great little DNSSEC-validating caching resolver - there's loads of little tweaks that can be done, but the default configuration is pretty good.

## DHCPv4

So, DHCPv4 is the easy bit. I use ISC's canonical `dhcpd` server to dish out ip addresses to clients. Configuration is simple:

    # Season for flavour
    default-lease-time 3600;
    max-lease-time 7200;
    # We own this
    authoritative;
    # Syslogging
    log-facility local7;
    # A simple subnet. TFTP needed for voip devices
    subnet 192.168.0.0 netmask 255.255.255.0 {
      range 192.168.0.20 192.168.0.255;
      option subnet-mask 255.255.255.0;
      option broadcast-address 192.168.0.255;
      option routers 192.168.0.1;
      option ntp-servers 192.168.0.1;
      option domain-name "local.example.com";
      option domain-name-servers 192.168.0.1;
      option domain-search "local.example.com", "example.com";
      option tftp-server-name "192.168.0.15";
      ddns-domainname "local.example.com.";
      ddns-rev-domainname "in-addr.arpa.";
    }
    # An example static host - set jumbo only on this one
    host somesortofhost {
        hardware ethernet 00:aa:bb:cc:dd:ee;
        fixed-address 192.168.0.2;
        option interface-mtu 9000;
    }

This is a fairly basic `dhcpd.conf` that defines a simple local ipv4 subnet and a single static host. To add the magic source to tell it to update bind with ddns updates, we need to add this:

    ddns-update-style interim;
    ddns-updates    on;
    # Add static hosts into dns as well
    update-static-leases    on;

    key DHCP_UPDATER {
       algorithm hmac-md5;
       secret "HxUhKWVJcuyL9ZsG5HGF7A==";
    };

    zone local.example.com. {
        primary 127.0.0.1;
        key DHCP_UPDATER;
    }

    zone 0.168.192.in-addr.arpa. {
        primary 127.0.0.1;
        key DHCP_UPDATER;
    }

Sadly, ISC's dhcpd doesn't let you specify a port on which the primary dns server listens, and BIND doesn't like listening to anything other than `127.0.0.1`. There's probably a sensible way around this using an iptables rule, and by pointing dhcpd at `127.0.0.10` and forwarding that to `127.0.0.1@5353` (or similar).

Sometimes DHCP hosts won't use a particularly friendly name in their lease request - Sonos and Android devices along with Cisco VOIP phone are some examples I've seen this on. To override this, you can specify a host and override the `ddns-hostname`:

    host sonoslivingroom {
        hardware ethernet b8:e9:37:11:22:33;
        ddns-hostname "sonoslivingroom";
        ddns-domainname "local.example.com";
    }

## DHCPv6

And finally onto IPv6. ISC's dhcpd works fine as a DHCPv6 server, but curiously not at the same time as being a DHCPv4 server - you have to run two instances. Firstly, if you're running IPv6, you probably have `radvd` alive somewhere. First thing is to add a parameter to that configuration to signal that DHCPv6 is available:

radvd.conf:

    interface eth0
    {
        AdvManagedFlag on;
        AdvOtherConfigFlag on;
        AdvSendAdvert on;
        prefix ::/64
        {
            AdvAutonomous off;  
        };
    };

`AdvManagedFlag` and `AdvOtherConfigFlag` are the important settings here.

For dhcpd, just create a new dhcpd config file (I used `dhcpd6.conf`). The options are quite similar to the `dhcpd.conf` version:

    default-lease-time 3600;
    max-lease-time 7200;

    ddns-update-style interim;
    ddns-updates    on;
    update-conflict-detection         false;
    update-optimization               false;
    allow leasequery;
    allow unknown-clients;
    update-static-leases    on;
    authoritative;
    log-facility local7;

    key DHCP_UPDATER {
       algorithm hmac-md5;
       secret "HxUhKWVJcuyL9ZsG5HGF7A==";
    };

    zone local.example.com. {
      primary 127.0.0.1;
      key DHCP_UPDATER;
    }

    zone 4.3.2.1.1.1.1.0.1.0.0.2.ip6.arpa. {
      primary 127.0.0.1;
      key DHCP_UPDATER;
    }

    subnet6 2001:111:1234::/64 {
      range6 2001:8b0:1234:0::1 2001:111:1234:0::254;
      option dhcp6.name-servers 2001:111:1234::1;
      option dhcp6.domain-search "local.example.com";
      ddns-domainname "local.example.com.";
      ddns-rev-domainname "ip6.arpa.";
    }

It just needs a new init script to spin up the new dhcp process (passing in the `-6` flag) and it should all work.

There's a few issues here and there, but this works well enough for me.