---
layout: post
title: "The Things that I broke"
---
I did a very stupid thing.

<geek>For some strange reason, my ability to ssh into my server is reliant on
the firewall setting the outgoing TOS to 0x0 (normal service). Stupidly, I
logged into the server and stopped the firewall, instantly shutting down ssh
leaving me no way to get back in and put the firewall back up.It took a long
time, but through some very strange and convoluted method, I managed to get
back in. This invovlved a hacked telnet daemon and client, some cunningness
with samba, and a hope that php wouldn't die. Oddly enough, it worked. It's
not broken any more. Other things still are though.</geek>

For the rest of everyone, I'm going to Wales! Tomorrow! Because it's cold
there and they have a beach!!!!!!!!!!!!!

