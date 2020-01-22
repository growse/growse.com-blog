---
layout: post
title: "SSH VPN in Ubuntu using NetworkManager"
---
Whenever I travel I usually end up on a lot of wifi networks which, for one reason or another, I might not necessarily trust. Hotel wireless is typically not great, with all sorts of [shenanigans](http://bits.blogs.nytimes.com/2012/04/06/courtyard-marriott-wifi/) going that isn't particularly desirable. Right now, I'm on a hotel wireless network (that I've explicitly paid for) and it's silently redirecting DNS traffic to its own servers. `dig @authoritativenameserver` is returning a  different result locally than everywhere else on the internet.

A VPN is the answer. There's very good solutions around, [OpenVPN](http://openvpn.net/) is very good, or you could go with something more IPsec-flavoured, perhaps based on Racoon. Now that you can get a VPS that's reasonably local for $5 per month from the likes of [DigitalOcean](https://www.digitalocean.com/), it's very easy to keep a VPN image tucked away, and spin it up when you need it. 

I had a particular issue trying to use OpenVPN on a particular network (I think they were interfering with HTTPS traffic) so I started to see if there was a simple way around it. Playing around with SSH, it's possible to configure an OpenSSH client to host a SOCKS proxy which directs traffic down the tunnel. This is useful, but requires explicit SOCKS proxy support from applications to make use of this. Then, reading around, I discovered that it's possible for SSH to do full-on tunnelling of traffic. Simply set `PermitTunnel yes` on the server side, and you should be able to connect on the client using the `-w` switch to set up a local and remote tunnel device. You can then set a default route on the client pointing at the `tun` device and all traffic gets routed down the tunnel. There's a few downsides: it's a bit of a faff, you need to use a user that can create/destroy tun devices (typically root), and you've got do add an iptables rule to do some MASQUERADE and NAT on the server side. 

Thankfully, some of this faff is taken away by some code to implement an [SSH VPN provider into NetworkManager](https://github.com/danfruehauf/NetworkManager-ssh) written by Dan Fruehauf. Thinking this is a useful thing the world should have, I gave it a [Launchpad](https://launchpad.net/networkmanager-ssh) with nightly builds, so if you're an Ubuntu user and want to add this, you can grab the packages from [my PPA](https://launchpad.net/~growse/+archive/ppa).

Once installed, setup instructions are in the README on the github repository. In short, on the server side, add the following to `/etc/ssh/sshd_config`

    PermitTunnel yes

Following that, you'll need to enable ipv4 forwarding and have some NAT rules:

    echo 1 > /proc/sys/net/ipv4/ip_forward
    iptables -I FORWARD -i tun+ -j ACCEPT
    iptables -I FORWARD -o tun+ -j ACCEPT
    iptables -I INPUT -i tun+ -j ACCEPT
    iptables -t nat -I POSTROUTING -o eth0 -j MASQUERADE

(I'm assuming that your server's main nic is `eth0`. If not, change the last line.)

I'm testing it at the moment, and although it's a bit sensitive to flaky connections, it works great.