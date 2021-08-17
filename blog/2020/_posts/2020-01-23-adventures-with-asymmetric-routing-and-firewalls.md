---
layout: post
title: "Adventures with Asymmetric Routing and Firewalls"
---

## New Router!

I've had some free time on my hands lately, so have gone on a bit of an upgrade-rampage. The first casualty was my pretty old (and, thanks to the dog, pretty broken) HP ProCurve 1810-24G switch, which I replaced with a Unifi 24-port PoE switch (the 250W version). I'm generally a fan of the Unifi product, although not necessarily of their [attitudes towards the GPL](https://sfconservancy.org/blog/2019/oct/02/cambium-ubiquiti-gpl-violations/) (I live in hope that they'll become less shady). Having used their APs and cameras for a while, and having also bought a small 8-port PoE switch before, it made sense to get something that fitted in with the existing software platform and made configuration relatively straightforward. It's noisier than I expected, but replacing the 2 existing fans with Noctua NF-A4x20 FLX fans has quietened it a lot, without really making much of a difference to its temperature. 

With a new switch in place, I wanted to also replace the router. For about 8 years now my router has been a crappy-yet-awesome Jetway Atom 330-based Linux box running Debian with a 2-port Intel NIC shoved inside. But, it's noisy (can't run passively cooled), surprisingly power-hungry and pretty slow, so it was time to replace. The obvious thing to do was to replace it with one of the fancy Ubiquiti EdgeRouter (or similar) thingies, but there's something nice about having the router be an actual linux machine. Not only can I choose what to run on it (I happen to like Debian) but I can also configure it in the same way as the k8s cluster, the raspberry pis etc. - I use [DebOps](https://docs.debops.org/en/master/) for this.

For hardware, my requirements are pretty simple. Passively cooled, Intel NICs and a serial console connection. I came across [PCEngines](https://www.pcengines.ch/) a while back - they're a small company making small, low-power hardware which seems ideal for this type of thing. I ended up getting an [APU2E4](https://www.pcengines.ch/apu2e4.htm) and after putting Debian 10 on it and configuring it with ansible, it seems to work really well. It's small, compact, and draws no more than a handful of watts and plays nicely with Linux, even to the point where I can update the firmware using open-source tooling (thanks to [coreboot](https://www.coreboot.org/)).

However, one thing remained broken.

## How does IP Routing work again?

Previously, I wrote about [using MetalLB on Kubernetes to advertise services over BGP]({% post_url 2019/2019-04-13-at-home-with-kubernetes-metallb-and-bgp %}). The general idea is that if you have a Kubernetes cluster and want to expose services on IP addresses that are routable by other machines, there's a number of different options. I went for the [MetalLB](https://metallb.universe.tf/) option which provides for the ability to advertise K8s service `loadBalancerIP` addresses over BGP.

In combination with a friendly router, this should result in the situation where traffic from clients goes via its default route (the router) which then forwards it on according to the routing table. If it's traffic destined for a K8s service, the router then forwards it onto the relevent K8s node that's advertising that address, which then handles the traffic.

This seemed to work great on the old router. However, when I replaced it with the *new* router, it stopped working. What's worse is that it didn't stop working reliably - it intermittently worked on some clients, and didn't work at all on others. And it always worked on the router itself.

## Broken

I had a client on `192.168.2.109`, a router at `192.168.2.1` and a k8s service at `http://192.168.254.1:3142` that was hosted by a k8s node living on `192.168.2.20`. The `192.168.254.1/32 via 192.168.2.20` route is published over BGP to `192.168.2.1`.

So what does 'broken' actually look like? Running `telnet` or `curl` against my service endpoint showed that a connection was maybe established, but no traffic was flowing. Browsers would hang at `Perfoming TLS Handshake`. Interestingly, on clients that temperamentally worked, there was often a small delay before it connected that first time, after which it connected much more quickly. Leave it a few minutes, and the first-connection delay came back.

First thing is to figure out what's causing that delay - it smells like a caching issue.

My assumption was that traffic should flow from the client, through the router and onto the K8s cluster. So I used `tcpdump` on the router to filter for TCP traffic destined for port 3142. Curling the endpoint showed a flurry of TCP packets, but no HTTP traffic. Also, the `SYN-ACK` appears to be missing - more on that later:
 
```shell
$ tcpdump 'port 3142'
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on enp1s0, link-type EN10MB (Ethernet), capture size 262144 bytes
14:20:25.100403 IP 192.168.2.109.54124 > 192.168.254.1.3142: Flags [S], seq 98298647, win 64240, options [mss 1460,sackOK,TS val 2883894131 ecr 0,nop,wscale 7], length 0
14:20:25.100767 IP 192.168.2.109.54124 > 192.168.254.1.3142: Flags [S], seq 98298647, win 64240, options [mss 1460,sackOK,TS val 2883894131 ecr 0,nop,wscale 7], length 0
14:20:25.102908 IP 192.168.2.109.54124 > 192.168.254.1.3142: Flags [.], ack 2878004465, win 502, options [nop,nop,TS val 2883894135 ecr 3323781338], length 0
14:20:25.103104 IP 192.168.2.109.54124 > 192.168.254.1.3142: Flags [P.], seq 0:82, ack 1, win 502, options [nop,nop,TS val 2883894135 ecr 3323781338], length 82
14:20:25.319062 IP 192.168.2.109.54124 > 192.168.254.1.3142: Flags [P.], seq 0:82, ack 1, win 502, options [nop,nop,TS val 2883894350 ecr 3323781338], length 82
```
 
And yet I got an HTTP response from the service back to the client. More interestingly is that subsequent `curl` requests generated no more traffic on the router. Somehow, the client was no longer talking to the service via the router, it had... found another path?

## Behold, the ICMP Redirect

Taking `tcpdump` to the client, it became more obvious what was happening.

```shell
$ tcpdump -n 'port 3142 or icmp'
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on wlp3s0, link-type EN10MB (Ethernet), capture size 262144 bytes
14:25:33.675342 IP 192.168.2.109.54206 > 192.168.254.1.3142: Flags [S], seq 4149506080, win 64240, options [mss 1460,sackOK,TS val 2884202706 ecr 0,nop,wscale 7], length 0
14:25:33.678642 IP 192.168.254.1.3142 > 192.168.2.109.54206: Flags [S.], seq 2257641846, ack 4149506081, win 27760, options [mss 1400,sackOK,TS val 3324089920 ecr 2884202706,nop,wscale 7], length 0
14:25:33.678695 IP 192.168.2.109.54206 > 192.168.254.1.3142: Flags [.], ack 1, win 502, options [nop,nop,TS val 2884202709 ecr 3324089920], length 0
14:25:33.678753 IP 192.168.2.109.54206 > 192.168.254.1.3142: Flags [P.], seq 1:83, ack 1, win 502, options [nop,nop,TS val 2884202709 ecr 3324089920], length 82
14:25:34.639697 IP 192.168.2.1 > 192.168.2.109: ICMP redirect 192.168.254.1 to host 192.168.2.20, length 142
14:25:34.830586 IP 192.168.254.1.3142 > 192.168.2.109.54206: Flags [S.], seq 2257641846, ack 4149506081, win 27760, options [mss 1400,sackOK,TS val 3324090946 ecr 2884202706,nop,wscale 7], length 0
14:25:34.830610 IP 192.168.2.109.54206 > 192.168.254.1.3142: Flags [.], ack 1, win 502, options [nop,nop,TS val 2884203861 ecr 3324089920], length 0
14:25:35.637676 IP 192.168.2.109.54206 > 192.168.254.1.3142: Flags [P.], seq 1:83, ack 1, win 502, options [nop,nop,TS val 2884204668 ecr 3324089920], length 82
14:25:35.659708 IP 192.168.254.1.3142 > 192.168.2.109.54206: Flags [.], ack 83, win 217, options [nop,nop,TS val 3324091901 ecr 2884204668], length 0
14:25:35.659730 IP 192.168.254.1.3142 > 192.168.2.109.54206: Flags [P.], seq 1:1819, ack 83, win 217, options [nop,nop,TS val 3324091901 ecr 2884204668], length 1818
14:25:35.659740 IP 192.168.2.109.54206 > 192.168.254.1.3142: Flags [.], ack 1819, win 501, options [nop,nop,TS val 2884204690 ecr 3324091901], length 0
14:25:35.661253 IP 192.168.254.1.3142 > 192.168.2.109.54206: Flags [FP.], seq 1819:4789, ack 83, win 217, options [nop,nop,TS val 3324091901 ecr 2884204668], length 2970
14:25:35.661305 IP 192.168.2.109.54206 > 192.168.254.1.3142: Flags [.], ack 4790, win 501, options [nop,nop,TS val 2884204692 ecr 3324091901], length 0
14:25:35.661412 IP 192.168.2.109.54206 > 192.168.254.1.3142: Flags [F.], seq 83, ack 4790, win 501, options [nop,nop,TS val 2884204692 ecr 3324091901], length 0
14:25:35.665077 IP 192.168.254.1.3142 > 192.168.2.109.54206: Flags [.], ack 84, win 217, options [nop,nop,TS val 3324091906 ecr 2884204692], length 0
```

The initial TCP connection went from the client to the router, because it's the default route. However, the router had figured out that the next-hop for the service address was *local to the client* - the service `192.168.254.1` being hosted on `192.168.2.20`, which is in the same subnet as the client `192.168.2.109`. The router then tries to be helpful, and sends an [*ICMP Redirect*](https://en.wikipedia.org/wiki/Internet_Control_Message_Protocol#Redirect) (`ICMP redirect 192.168.254.1 to host 192.168.2.20`) to the client indicating that there's a more efficient route available and that the client should just use that instead. 

ICMP is basically magic. There's all sorts of weird and wonderful capabilities present in that protocol, and if (like me) you just bumble around learning things as you stumble across them, it's entirely posible to be blissfully unaware of everything it can do. Reading around, it seems that this capability was invented in a simpler time (specifically, the early 80s when [RFCs only had 3 digits](http://www.networksorcery.com/enp/rfc/rfc792.txt)), when everyone trusted everyone else on the internet and people just wanted to get along. Nowadays, its use is [generally](https://askubuntu.com/questions/118273/what-are-icmp-redirects-and-should-they-be-blocked) [discouraged](https://www.cymru.com/gillsr/documents/icmp-redirects-are-bad.htm) because ICMP isn't a secure protocol and being able to remotely instruct clients where to start sending their traffic isn't a great idea.

When a client receives an ICMP redirect, it generates a 'temporary' static route and adds it to the routing table. However, on Linux, you won't see this if you just ask `ip route` - it goes in a super-secret magical hidden routing table: the *Routing Cache*. Here, entries get a TTL which by default is 5 minutes. Getting the specific route for a destination shows that it's come from cache:

```shell
$ ip route get 192.168.254.1
192.168.254.1 via 192.168.2.20 dev wlp3s0 src 192.168.2.109 uid 0 
    cache <redirected> expires 56sec 
```

So this explains why there's a small delay on first connect, and then packets don't seem to subsequently go via the default route.

ICMP redirects are problematic though. There's many an article on the internet about why they're bad, and these generally take two arguments.

1. They only happen if you've not designed your network properly
2. They're a security risk

The thinking behind (1) is that if you're being directed to another router on the local network, then your routing topology isn't very efficient. In a sense, this is true. Why force traffic via an extra hop (the default router) when it can go direct to the local router that knows how to handle the destination. However, this only really makes sense where you have a static routing environment. If you've got routes that are constantly changing, then you either have to make all clients aware of those changes (effectively run BGP on every client) or centralise that job inside the default router. A better approach here would be to carve the Kubernetes cluster onto its own subnet, so that the nodes are no longer local to the clients, and maybe one day I'll do that.

(2) is a more compelling argument. It's also in effect in the sense that some OS don't accept ICMP redirects by default - this explains why my setup wasn't working on any Android or Windows 10 client. Also, this worked fine before I changed the router, so the old router can't possibly have worked using ICMP redirects.

Thankfully, you can tell a Linux system not to send out icmp redirects:

```shell
$ sysctl net.ipv4.conf.enp1s0/2.send_redirects=0
net.ipv4.conf.enp1s0/2.send_redirects = 0
```

Now it's broken consistently for everyone! Progress!

## Why you no route?

So the problem now is that the router doesn't seem to be forwarding packets to the destination, something that's surprising given that it's the main reason for its existence. What's interesting here is that it seems to be forwarding some packets between two hosts, but not others.

Comparing the tcpdump output on the router to that on the K8s node and the client:

The client:

```shell 
$ tcpdump -n 'port 3142 or icmp'
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on wlp3s0, link-type EN10MB (Ethernet), capture size 262144 bytes
15:19:16.956614 IP 192.168.2.109.54638 > 192.168.254.1.3142: Flags [S], seq 1746195192, win 64240, options [mss 1460,sackOK,TS val 2887425963 ecr 0,nop,wscale 7], length 0
15:19:16.959599 IP 192.168.254.1.3142 > 192.168.2.109.54638: Flags [S.], seq 2310816704, ack 1746195193, win 27760, options [mss 1400,sackOK,TS val 3327313248 ecr 2887425963,nop,wscale 7], length 0
15:19:16.959660 IP 192.168.2.109.54638 > 192.168.254.1.3142: Flags [.], ack 1, win 502, options [nop,nop,TS val 2887425966 ecr 3327313248], length 0
15:19:16.959717 IP 192.168.2.109.54638 > 192.168.254.1.3142: Flags [P.], seq 1:83, ack 1, win 502, options [nop,nop,TS val 2887425966 ecr 3327313248], length 82
15:19:17.177672 IP 192.168.2.109.54638 > 192.168.254.1.3142: Flags [P.], seq 1:83, ack 1, win 502, options [nop,nop,TS val 2887426184 ecr 3327313248], length 82
15:19:17.427659 IP 192.168.2.109.54638 > 192.168.254.1.3142: Flags [P.], seq 1:83, ack 1, win 502, options [nop,nop,TS val 2887426434 ecr 3327313248], length 82
15:19:17.897631 IP 192.168.2.109.54638 > 192.168.254.1.3142: Flags [P.], seq 1:83, ack 1, win 502, options [nop,nop,TS val 2887426904 ecr 3327313248], length 82
15:19:17.968519 IP 192.168.254.1.3142 > 192.168.2.109.54638: Flags [S.], seq 2310816704, ack 1746195193, win 27760, options [mss 1400,sackOK,TS val 3327314257 ecr 2887425963,nop,wscale 7], length 0
15:19:17.968560 IP 192.168.2.109.54638 > 192.168.254.1.3142: Flags [.], ack 1, win 502, options [nop,nop,TS val 2887426975 ecr 3327313248], length 0
15:19:18.837657 IP 192.168.2.109.54638 > 192.168.254.1.3142: Flags [P.], seq 1:83, ack 1, win 502, options [nop,nop,TS val 2887427844 ecr 3327313248], length 82
15:19:20.032888 IP 192.168.254.1.3142 > 192.168.2.109.54638: Flags [S.], seq 2310816704, ack 1746195193, win 27760, options [mss 1400,sackOK,TS val 3327316273 ecr 2887425963,nop,wscale 7], length 0
15:19:20.032934 IP 192.168.2.109.54638 > 192.168.254.1.3142: Flags [.], ack 1, win 502, options [nop,nop,TS val 2887429039 ecr 3327313248], length 0
15:19:20.767658 IP 192.168.2.109.54638 > 192.168.254.1.3142: Flags [P.], seq 1:83, ack 1, win 502, options [nop,nop,TS val 2887429774 ecr 3327313248], length 82
15:19:23.378998 IP 192.168.2.109.54638 > 192.168.254.1.3142: Flags [F.], seq 83, ack 1, win 502, options [nop,nop,TS val 2887432385 ecr 3327313248], length 0
15:19:24.139968 IP 192.168.254.1.3142 > 192.168.2.109.54638: Flags [S.], seq 2310816704, ack 1746195193, win 27760, options [mss 1400,sackOK,TS val 3327320405 ecr 2887425963,nop,wscale 7], length 0
15:19:24.139977 IP 192.168.2.109.54638 > 192.168.254.1.3142: Flags [.], ack 1, win 502, options [nop,nop,TS val 2887433146 ecr 3327313248], length 0
15:19:24.517632 IP 192.168.2.109.54638 > 192.168.254.1.3142: Flags [FP.], seq 1:83, ack 1, win 502, options [nop,nop,TS val 2887433524 ecr 3327313248], length 82
```

The router:

```shell 
$ tcpdump 'port 3142'
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on enp1s0, link-type EN10MB (Ethernet), capture size 262144 bytes
15:19:16.958614 IP 192.168.2.109.54638 > 192.168.254.1.3142: Flags [S], seq 1746195192, win 64240, options [mss 1460,sackOK,TS val 2887425963 ecr 0,nop,wscale 7], length 0
15:19:16.958891 IP 192.168.2.109.54638 > 192.168.254.1.3142: Flags [S], seq 1746195192, win 64240, options [mss 1460,sackOK,TS val 2887425963 ecr 0,nop,wscale 7], length 0
15:19:16.960967 IP 192.168.2.109.54638 > 192.168.254.1.3142: Flags [.], ack 2310816705, win 502, options [nop,nop,TS val 2887425966 ecr 3327313248], length 0
15:19:16.963447 IP 192.168.2.109.54638 > 192.168.254.1.3142: Flags [P.], seq 0:82, ack 1, win 502, options [nop,nop,TS val 2887425966 ecr 3327313248], length 82
15:19:17.179862 IP 192.168.2.109.54638 > 192.168.254.1.3142: Flags [P.], seq 0:82, ack 1, win 502, options [nop,nop,TS val 2887426184 ecr 3327313248], length 82
15:19:17.429099 IP 192.168.2.109.54638 > 192.168.254.1.3142: Flags [P.], seq 0:82, ack 1, win 502, options [nop,nop,TS val 2887426434 ecr 3327313248], length 82
15:19:17.899591 IP 192.168.2.109.54638 > 192.168.254.1.3142: Flags [P.], seq 0:82, ack 1, win 502, options [nop,nop,TS val 2887426904 ecr 3327313248], length 82
15:19:17.969824 IP 192.168.2.109.54638 > 192.168.254.1.3142: Flags [.], ack 1, win 502, options [nop,nop,TS val 2887426975 ecr 3327313248], length 0
15:19:18.839780 IP 192.168.2.109.54638 > 192.168.254.1.3142: Flags [P.], seq 0:82, ack 1, win 502, options [nop,nop,TS val 2887427844 ecr 3327313248], length 82
15:19:20.034325 IP 192.168.2.109.54638 > 192.168.254.1.3142: Flags [.], ack 1, win 502, options [nop,nop,TS val 2887429039 ecr 3327313248], length 0
15:19:20.769836 IP 192.168.2.109.54638 > 192.168.254.1.3142: Flags [P.], seq 0:82, ack 1, win 502, options [nop,nop,TS val 2887429774 ecr 3327313248], length 82
15:19:23.381104 IP 192.168.2.109.54638 > 192.168.254.1.3142: Flags [F.], seq 82, ack 1, win 502, options [nop,nop,TS val 2887432385 ecr 3327313248], length 0
```

The K8s node:
```shell 
$ tcpdump  'port 3142 or icmp'
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on enp2s0f0, link-type EN10MB (Ethernet), capture size 262144 bytes
15:19:16.958993 IP 192.168.2.109.54638 > 192.168.254.1.3142: Flags [S], seq 1746195192, win 64240, options [mss 1460,sackOK,TS val 2887425963 ecr 0,nop,wscale 7], length 0
15:19:16.959120 IP 192.168.254.1.3142 > 192.168.2.109.54638: Flags [S.], seq 2310816704, ack 1746195193, win 27760, options [mss 1400,sackOK,TS val 3327313248 ecr 2887425963,nop,wscale 7], length 0
15:19:17.967780 IP 192.168.254.1.3142 > 192.168.2.109.54638: Flags [S.], seq 2310816704, ack 1746195193, win 27760, options [mss 1400,sackOK,TS val 3327314257 ecr 2887425963,nop,wscale 7], length 0
15:19:19.983849 IP 192.168.254.1.3142 > 192.168.2.109.54638: Flags [S.], seq 2310816704, ack 1746195193, win 27760, options [mss 1400,sackOK,TS val 3327316273 ecr 2887425963,nop,wscale 7], length 0
15:19:24.115825 IP 192.168.254.1.3142 > 192.168.2.109.54638: Flags [S.], seq 2310816704, ack 1746195193, win 27760, options [mss 1400,sackOK,TS val 3327320405 ecr 2887425963,nop,wscale 7], length 0
```

It might not be initially obvious what's going on here, but what we appear to have is an asymmetric route. The client sends the initial TCP `SYN` packet to the service IP via the router (`seq 1746195192`) which the K8s node receives. The K8s node then sends a `SYN-ACK` response back which the client then receives (`seq 2310816704`), but the router never sees this packet. It looks like the K8s node (remember, it's at `192.168.2.20` which is local to the client) has decided to send the response packet directly back to the client because that's what its routing table says.

This, in itself, isn't a problem. The client receives the `SYN-ACK` and responds with an `ACK`, hoping to complete the TCP three-way handshake. But this `ACK` never makes it to the K8s node. The router sees it (`ack 2310816705`) but... drops it? Why would it do that?

## Connection tracking, and firewalls

There's a number of reasons why a router might drop a packet. Maybe it doesn't know what to do with it, or maybe the kernel has been configured to drop it either via something in the IP stack (maybe forwarding is disabled on that interface) or via some sort of firewall. 

Using DebOps to configure the router, I was making use of the handy [ferm](https://docs.debops.org/en/master/ansible/roles/ferm/index.html) role to automatically configure and set up the firewall for me. Out of the box, you get some sensible defaults including some rules that set it up as a stateful firewall. What this means is that the kernel will track the *state* of all the TCP connections it's currently forwarding and accept packets that are part of an existing TCP connection and reject those that don't appear to be valid. It's a pretty common setup and is mostly enabled using two `iptables` rules:

```shell 
$ iptables -A FORWARD -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
$ iptables -A FORWARD -m conntrack --ctstate INVALID -j DROP
```  

(I think we know where this is going).

Framing the problem question in a different way leads us to the answer.

"Q: Why is the router dropping an `ACK` packet on a connection where it's seen the `SYN` but not seen the `SYN-ACK`?"

"A: Because it thinks the packet is invalid and the firewall is configured to drop those."

To confirm, I added an `iptables` rule to direct packets that matched `--ctstate INVALID` to the `LOG` target, which prints out a handy message in the kernel log. Oh look:

```
Jan 21 15:40:53 talktoobot kernel: [  580.489507] IN=enp1s0.2 OUT=enp1s0.2 MAC=00:0d:b9:54:2d:18:00:15:17:bf:db:6a:08:00 SRC=192.168.2.109 DST=192.168.254.1 LEN=40 TOS=0x00 PREC=0x00 TTL=127 ID=14446 DF PROTO=TCP SPT=55110 DPT=3142 WINDOW=1028 RES=0x00 ACK URGP=0
``` 

It dropped the `ACK`.

The simple solution here is to add in a new firewall rule that explicitly permits `INVALID` packets from my LAN interface through to the service subnet, recognizing that this traffic path is asymmetrical and therefore the router doesn't see the full packet flow:

```shell 
$ iptables -A FORWARD -d 192.168.254.0/24 -i enp1s0.2 -m state --state INVALID -j ACCEPT
```

Problem solved!