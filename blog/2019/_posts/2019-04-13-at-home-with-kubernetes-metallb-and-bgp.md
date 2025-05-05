---
layout: post
title: "At home with Kubernetes, MetalLB and BGP"
---

## A Home Lab

Ever since I had my first house and ran a server on top of the fridge, I've always found some sort of excuse to operate a home lab, much like a lot of people. This started out life as the aforementioned "single box sitting on the fridge" but has, over the years, evolved into a more complex environment which primarily serves the purpose of having somewhere to mess around with. There are other benefits as well though - the most important part of the "playground to learn in" is the "learning" bit. As someone who learns by doing, my home lab has taught me more about hardware, software, distributed infrastructures and failure conditions more than many real-world jobs.

## Kubernetes

This brings me to [Kubernetes](https://kubernetes.io/) (k8s), a framework for coordinating and distributing containerized tasks across a heterogenous infrastructure that has a famously steep learning curve.

A while back, I decided to look at Kubernetes, partly because it was generating a lot of chatter and it seemed like it would be important, and partly because I wanted to try and find a solution to a somewhat undefined problem caused by the use of [Docker Swarm](https://docs.docker.com/engine/swarm/). When I jumped on the containerization bandwagon, I saw it as an exciting opportunity to better answer the question of "how do I decide what should run where and remember that?". Having previously scattered various random bits of old computer around the house and had to keep manual track of "oh, the DNS server runs on that old laptop by the sink", containerizing the DNS server helped me to not care where it was running.

Docker was the initial winner of the container runtime race, and Swarm was their solution to bandying together many computers (all running docker) and sharing a workload across them. Couple it together with [Docker Compose](https://docs.docker.com/compose/) and in theory you have a simple way of declaring what you want, and having the system magically make it so.

In practice, it didn't work very well.

The fragility was hilarious. Containers would just stop for no published reason, and then attempts to get them going again would result in a raft of `context deadline exceeded` errors (what kind of shitty error nonsense is that?). The proxy solution for forwarding traffic to the correct container instance worked great, unless you sent traffic to the node's IPv6 address in which case the packets would just disappear. There wasn't a particularly good story on persistent volumes, I ended up just mounting everything as NFS on every host and hoping that nothing got corrupted. Deleting everything and re-creating it all from scratch was a common occurrence.

Kubernetes, while more complex, doesn't seem to have the same reliability problems. Sure, if you try and run it on your own etcd cluster and have anything other than a rock-solid network, you're going to run into problems. I just threw caution to the wind and set up a non-resilient cluster with `kubeadm`, it works well enough for my needs.

After playing around with various capabilities and other bits of software that are part of the wonderfully diverse k8s ecosystem, I learned that the vast majority of people run it in the context of a cloud provider (think AWS, Azure, Digital Ocean etc.) where there's a lot of existing hooks into that infrastructure. Deploy a Persistent Volume Claim (PVC) on AWS? Well an EBS volume will be automatically created and lifecycle-managed to meet that requirement. Want a Service with an external load-balanced IP? Here comes an automatically provisioned cloud-managed load balancer to deliver what you need. The problem here is that I'm running this at home, on "bare metal". Apparently the only people who run k8s on bare metal are people playing around at home and Google.

However, it did force me to learn some stuff about some things. Let's talk about load balancing.

## MetalLB

The idea behind load balancing is simple. A client sends some TCP (usually) traffic to a port on an IP address, and expects a response. That IP address is some sort of magic thing that automatically figures out how to send that traffic to one of a pool of real clients, and then relays the response traffic back to the client. There's a bunch of different ways of achieving this, but most often you buy a physical device (or provision a cloudy version) that can be configured to provide services on IP addresses and then relay traffic to pools of server IP addresses.

I had previously been using [HAProxy](https://www.haproxy.org/) to do this at home. I ran this on a machine outside the docker swarm cluster, configured the docker nodes as a backend pool and then used virtual host-based routing to get traffic to the right backend port depending on what the HTTP host header said. This is great, except for the fact the service was outside the cluster and was a single point of failure. For k8s, I wanted a neater solution that was a bit more manageable.

Kubernetes has a general design model of separating out capabilities from implementations - a Service will simply ask for a load balanced IP address from K8s, and it's then up to the K8s API to select an available implementation and call that to actually provide and configure that. If you're running K8s on AWS, Amazon will provide an implementation that manages ELB resources in response to the demand by the cluster. If you spin up K8s on bare metal (e.g. via `kubeadm`), then you don't get any implementations by default. However, [MetalLB](https://metallb.universe.tf/) is an open source implementation of a k8s load-balancer, so getting set up is a simple case of "download and install" (I used [helm](https://helm.sh) for this).

MetalLB presents a couple of different ways of solving the load balancer problem. The easiest approach to get set up with is "Level 2 mode", where MetalLB configures each node to announce load-balanced IPs via ARP. So a Service that configures a load-balanced IP of `192.168.2.100` will cause each of the nodes that are running pods that map to that service to send ARP announcements for `192.168.2.100` on their MAC address. Local clients (on the same subnet) who want to route traffic to `192.168.2.100` simply make an ARP request, get the first response and send packets to that ethernet address. If the node goes down, the ARP announcement is withdrawn and other clients should remove that from their cache.

There's a couple of downsides to this approach. First, your service IP needs to be in the same network as your node IPs (this may or may not be an actual problem). Secondly, it depends on ARP actually working properly. If your clients are just modern OSs, then it's probably fine. However, I found that I've got at least a couple of older switches that don't implement ARP caching properly, and therefore ended up with outages when a k8s node went down, but clients were still trying to send ethernet traffic to that node's MAC address.

## BGP

MetalLB provides an alternative, which is to use [BGP](https://metallb.universe.tf/configuration/#bgp-configuration) to announce IPs. BGP is the common protocol widely used for routers to announce available routes to other routers, and thus coordinate available routes for IP traffic. A typical BGP announcement is (simplistically) of the form "Hi, Subnet `x` can be routed via IP `y` with a metric of `z`", so in the context of load-balancing, MetaLB just announces that a subnet of a single IPv4 address (a `/32`) is to be routed via the node IPv4 address that is hosting the correct pod.

This is somewhat more complex to set up, as now the service IP addresses should be in a different subnet from the nodes and clients, requiring clients to go to their local router in order to route traffic. In my case, I used `192.168.254.0/24` as the subnet from which I'd choose service IP addresses. Giving MetalLB the configuration below:
```yaml
address-pools:
- addresses:
  - 192.168.254.0/24
  name: bgptest
  protocol: bgp
peers:
- my-asn: 64512
  peer-address: 192.168.2.1
  peer-asn: 64512
```
 This config file declares that MetalLB will manage service IPs in the `192.168.254.0/24` subnet, and then announce BGP routes for those IPs to my local router `192.168.2.1`. BGP also requires that routes are announced with an Autonomous System Number (ASN), so I used 64512, the first reserved for private use.

 The additional complexity here comes because we need something on the router side to be able to accept these announcements and create routes from them. A client on `192.168.2.50` will want to send traffic to a service on `192.168.254.1`, see that it's not local and therefore send it to the router (`192.168.2.1`). The router needs to know how to turn BGP announcements into routing table entries. My router runs debian, so there's a number of software options available. I was most interested in [GoBGP](https://osrg.github.io/gobgp/) as it claimed to be a modern re-write of a BGP daemon (BGP is *old* so a lot of software that manages it is also *old*). `gobgpd` is available both in Debian stable and unstable, so I threw caution to the wind and installed `1.33` from the unstable repo.

 While GoBGP will happily receive and send whatever BGP messages you like, it doesn't necessarily know what to do with them itself. In my case, I wanted BGP messages received just installed on the local routing table. For this, I needed a routing manager, so installed [FRR](http://docs.frrouting.org/en/latest/overview.html), a linux-based routing packages that includes [Zebra](http://docs.frrouting.org/en/latest/zebra.html), a local routing manager. After much time and many errors, I learned that the GoBGP maintainers only supported Zebra compatibility up to v3 (v6 of FRR is available), so I ended up install `v3.0.4`. I should mention that FRR comes with its own BGP daemon `bgpd`, so this may work better. Zebra itself needs no real configuration in this case, other than to just enable it by setting `zebra=yes` in `/etc/frr/daemons.conf`.

 So, all that remains is to configure GoBGP. It just needs to know its local details, the permitted peers (in my case my two K8s nodes) and how to talk to zebra:
```
[global.config]
  as = 64512
  router-id = "192.168.2.1"
  local-address-list = ["192.168.2.1"]


[[neighbors]]
  [neighbors.config]
    neighbor-address = "192.168.2.13"
    peer-as = 64512

[[neighbors]]
  [neighbors.config]
    neighbor-address = "192.168.2.20"
    peer-as = 64512

[zebra]
  [zebra.config]
    enabled = true
    url = "unix:/run/frr/zserv.api"
    redistribute-route-type-list = []
    version = 4
```
Once everything is up and running, I can see that GoBGP is happily talking to my k8s nodes:
```shell
$ gobgp neighbor
Peer            AS     Up/Down State       |#Received  Accepted
192.168.2.13 64512 1d 15:34:04 Establ      |        0         0
192.168.2.20 64512 1d 15:34:05 Establ      |        0         0
```

So let's create a simple service on k8s (to run [Pi-hole](https://pi-hole.net/)):
```yaml
---
kind: Service
apiVersion: v1
metadata:
  labels:
    k8s-app: pi-hole
  name: pi-hole-tcp
  annotations:
    metallb.universe.tf/allow-shared-ip: pihole
spec:
  selector:
    k8s-app: pi-hole
  type: LoadBalancer
  loadBalancerIP: 192.168.254.6
  externalTrafficPolicy: Local
  ports:
  - name: dns
    protocol: TCP
    port: 53
    targetPort: 53
```
I've asked for `192.168.254.6`, and also asked for a "Local" external traffic policy, so the route should only be published for the local node on which the pi-hole pod is running. The default setting would publish a route for every node in the cluster and rely on `kube-proxy` to get the traffic to the right pod.

Checking the GoBGP RIB table:
```shell
$ gobgp global rib
   Network              Next Hop             AS_PATH              Age        Attrs
*> 192.168.254.6/32     192.168.2.13         64512                1d 15:31:25 [{Origin: ?} {Med: 0}]
```

Success! MetalLB has sent an announcement that `192.168.254.6/32` should be routed via `192.168.2.13`. `*` means the route is valid and `>` means it's the best route. Checking the routing table on the router:
```shell
$ ip route list root 192.168.254.6
192.168.254.6 via 192.168.2.13 dev eth0.2 proto zebra metric 20
```
And if I traceroute from my local client to `192.168.254.6`:
```shell
$ traceroute 192.168.254.6
traceroute to 192.168.254.6 (192.168.254.6), 30 hops max, 60 byte packets
 1  _gateway (192.168.2.1)  1.153 ms  1.147 ms  1.119 ms
 2  192.168.2.13 (192.168.2.13)  60.861 ms  60.931 ms  60.911 ms
 3  * * *
```
The traffic has gone to the router, which has then forwarded it onto `192.168.2.13`. Finally, lets see if I can send TCP traffic to that IP and get an answer. This is pihole, so I should be able to `dig`:
```shell
$ dig @192.168.254.6

; <<>> DiG 9.14.0 <<>> @192.168.254.6
; (1 server found)
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 3057
;; flags: qr rd ra; QUERY: 1, ANSWER: 13, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 1452
;; QUESTION SECTION:
;.                              IN      NS

;; ANSWER SECTION:
.                       9186    IN      NS      b.root-servers.net.
.                       9186    IN      NS      c.root-servers.net.
.                       9186    IN      NS      d.root-servers.net.
.                       9186    IN      NS      e.root-servers.net.
.                       9186    IN      NS      f.root-servers.net.
.                       9186    IN      NS      g.root-servers.net.
.                       9186    IN      NS      h.root-servers.net.
.                       9186    IN      NS      i.root-servers.net.
.                       9186    IN      NS      j.root-servers.net.
.                       9186    IN      NS      k.root-servers.net.
.                       9186    IN      NS      l.root-servers.net.
.                       9186    IN      NS      m.root-servers.net.
.                       9186    IN      NS      a.root-servers.net.

;; Query time: 24 msec
;; SERVER: 192.168.254.6#53(192.168.254.6)
;; WHEN: Sat Apr 13 20:31:52 BST 2019
;; MSG SIZE  rcvd: 431
```
If I were to reboot `192.168.2.13` or move the pod to the other node, the route is re-announced and traffic is re-directed by the router.

## Conclusion

So after running this for a few months now, I've had no issues with restarting services / nodes / pods and losing service. It's been very reliable to the point that I can just forget about it working. Knowing I can just create a new k8s service when I like and know that the load-balanced IP will just be automatically advertised and reachable is very pleasing.

At some point in the future, I'll get a second router configured with a backup 4G connection. In theory, I should be able to use the same method to add the k8s service routes into its routing table as well, so that when my main router's connection fails, the backup router can still route internal traffic properly. Once I actually get that working, I'll write it up then.
