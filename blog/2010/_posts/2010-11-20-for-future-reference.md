---
layout: post
title: "For future reference..."
---
I did a stupid thing. I deleted my mailserver VM by mistake. My email is safe.
My ability to send and receive email isn't.

I'm still reconfiguring it (need a good way of backing up configurations) but
for future reference when I do this again, I thought I'd write a couple of
notes here so I know how to fix this again in the future.

Firstly, lets make this post searchable by myself when I do something silly.
Note to self: You're an Idiot.

  1. Exim: You'll be wondering why emails sent via the smarthost have weird
'From' headers. You'll be wanting "no_local_from_check" and
"untrusted_set_sender = *" in the main body of the config.

  2. Exim again: You need a separate smarthost router and transport. You need
"domains = ! +local_domains" and route_list = * smarthost.host.com in the
router and hosts_require_auth in the transport

  3. Exim once more: You need authenticators for both outbound and inbound.
Copy it from someone who's bothered to install Debian.

  4. Update the aliases. You fool.

  5. Don't forget about saslauthd.

  6. Get your pf/spamd guide from [https://calomel.org/spamd_config.html][1].
Then spend the next few months tweaking it.

  7. You need a script to push maildir to IMAP. Don't waste your time with
isync, offlineimap or any program that doesn't do what you want it to do. Grab
perl, figure out Mail::IMAPClient and Mail::Box::Maildir and figure it out
yourself.

  8. Don't forget to forward the syslogs.

  9. Or set the NTP hosts correctly.

  10. Name your VM disks properly so you don't go deleting the wrong ones in
future.

It would have been a lot easier to have been clever, and not stupid.

   [1]: https://calomel.org/spamd_config.html
