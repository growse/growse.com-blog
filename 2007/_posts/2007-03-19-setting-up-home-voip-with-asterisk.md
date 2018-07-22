---
layout: post
title: "Setting up home VoIP with Asterisk"
---
Anyone who knows me even slightly is aware of the fact that I like to play
with new technologies even if I a) haven't found a use for it yet and b) don't
necessarily have time for it.

I can't remember what, but something, somewhere told me a while back that I
should look at VoIP. I'd heard about it before - most ADSL routers that are on
the market these days are sold as "VOIP enabled", but I never really paid too
much attention to what that actually meant. I'd played with skype a bit
(useful when I was in the US), but I'd become disillusioned with the bad
quality, delays and dropped calls. At that point I didn't really join the
dots, but _I needed something better_.

I'm hoping that my ramblings will serve as a useful resource to anyone who
happens to be playing around with this, like I am. If I can even shed a small
insight into someone else's problem, that'll make me happy. Actually, I lie,
I'll be happy anyway, but this way sounds like I'm a "community" person and
not someone who's just writing stuff down becuase he knows he'll forget it
later.

## What's all this then?

Right, so, it turns out that you can make phone calls over the internet. I'm
sure you knew that, otherwise your not really reading this seriously and
probably wouldn't have got this far. Now, it seems to me, that if you've got a
broadband connection and a box hooked up to it 24/7, there's no reason you
can't have a simple phone gateway that'll forward calls to your phone when
it's plugged in/turned on and take voicemail when it's not. The software that
does all the cleverness in the middle is called [Asterisk][1].

Asterisk is wonderful. It's open source (which means it's free, as in beer)
and it runs on most linux flavours out there. It'll probably run on windows
too, but you might have to compile it yourself for that. It's not really worth
the trouble. I'm still getting to grips with it, but I'm now over the crest of
learning and at the point where I can start doing dangerous things with it. It
is a bit of a steep learning curve if you've never played with this sort of
thing before, but most new technologies are.

## What do I need?

I think you need:

  * Internet connection

  * Computer, connected to above connection and left on all the time

  * Ability to configure your router/firewall

  * Time

  * A clue - this is important and often overlooked

Obviously, you can add more, but I'll add these to the "optional" list:

  * Email address - for receiving voicemail to

  * Money - for paying for outgoing calls with

  * Another computer - to run softphone software on to make/receive calls

  * SIP hardphone - for making/receiving calls

  * SIP/analog adapter - allows you to plug your trusty analog phone into your
SIP network

## Making it all go

Assuming you've got most of the above, you should probably start off by
installing asterisk. If you're lucky, it'll be in your distribution's package
manager somewhere. On Ubuntu, I just did

sudo apt-get install asterisk

and was done. If you're unlucky, you'll have to download it from their website
and compile it yourself. Not that painful - the install file included is
fairly verbose.

Once you've done that, you'll find in /etc/asterisk a whole bunch of config
files. Loads of them. Pretty scary. We'll come back and be scared by them in a
bit.

## Firewall/nat/complicatedness

There's a pretty good chance that you're trying to run this behind a NAT,
which can pose issues. SIP phone networks tend to work on [UDP][2] which the
geeks will know is stateless. This means that there isn't really a two-way
conversation between two clients, as would happen with TCP. The client just
makes a connection and fires out UDP packets and doesn't really care about
when they arrive, what order they arrive in or whether they arrive at all.
Good for broadcasting, and apparently phone networks as well.

The upshot of everything is that in order to make this all work behind NAT,
you need to do a few things.

  1. Forward UDP port 5060 on your router to the IP address of the box you're
running Asterisk on. This means Asterisk will be able to receive notifications
about incoming calls from the SIP provider

  2. Pick a range of ports in the high thousands, remember them and then
forward them as well. These are the ports that the voice traffic gets carried
over.

  3. Tell Asterisk you're using NAT. We'll cover this in a bit

For the large port range in (2), I used ports 15000-15015, which is only a
small range, but then again my Cisco router doesn't let me forward ranges of
ports, so I have to set them up individually. The default suggested range in
Asterisk is 10000-20000.

## Get a SIP provider

Assuming you actually want to connect Asterisk to the real world, you'll need
some sort of SIP gateway provider. These are the people who'll forward your
outgoing calls to the realworld network and also provide you with a phone
number on which people can phone you. There's a bunch out there providing a
large amount of free things - I went with [SipGate][3]. They charge for calls
to landlines, but then again they provided me with a free 0207 incoming number
without me having to put any credit on my account. Also, there's nothing
stopping you using one provider for incoming and another for outgoing.

## Configure Asterisk

This is where the fun begins. Thankfully, of the large number of configs that
exist, you only have to alter a few.

`sip.conf`:

~~~
[general]
qualify=no
context=default
bindport=5060
bindaddr=0.0.0.0
srvlookup=yes
register => 1234567:BIGPWWD@sipgate.co.uk/1234567
externip = 38.29.29.212
localnet=192.168.0.0/255.255.0.0
nat=yes

[sipgate.co.uk]
type=peer
secret=BIGPWWD
username=1234567
host=sipgate.co.uk
fromuser=1234567
outgoingproxy=sipgate.co.uk
canreinvite=no
dtmfmode=inband
nat=yes
insecure=very
context=default

[my-phone]
type=friend
username=andrew
secret=password
host=dynamic
context=default
~~~


This is the main file that specifies all of the SIP devices that connect to
Asterisk. It defines your SIP phone accounts as well as your sip provider. As
you can see, I've got a few general settings, sipgate.co.uk listed as a peer
and my-phone listed as an account.

Some stuff is important to point out. Firstly, the 'context' keyword. This
determines how a call coming into Asterisk from that particular SIP client is
handled. You can see that all of my contexts are 'default'. They could be
anything, but you've got to make sure you define your contexts - more on that
later.

Secondly, you'll see that I've told asterisk what my external IP address is,
and where the local subnet is. This is so that the packets it sends to the
provider contain the correct details of where to contact you back again.
Instead of Asterisk using it's own IP address to tell Sipgate (or whoever) to
contact it on, it'll rewrite it with whatever's in externip so that they get
routed properly. Nat=yes is fairly obvious.

Thirdly, the register command. This seems to cause a lot of issues for a lot
of people. I can guarantee that this format works with Asterisk 1.2, because I
have it working. When you sign up for Sipgate, you'll be issued a 7-digit ID
number and a corresponding password. These ***are not*** the same as the
username and password you use to log into the Sipgate website. To find them,
log into the website and click "My Settings" - they'll be listed there. The
SIP ID number is 7 digits long, and the password secret is normally 8 upper-
case characters.

The other sections are fairly simple - just use what I've got here for basics
and you'll be fine. There's no reason why you can't experiement with various
things - different accounts for different phones, different contexts etc. The
file is fairly well commented so it should be straightforward.

Moving onto `extensions.conf`:

~~~
[general]
static=yes
writeprotect=no
autofallthrough=yes
clearglobalvars=no
priorityjumping=no

[globals]
SpeakingClock=2

[default] 
exten => 1234567,1,Dial(SIP/my-phone)
exten => 1234567,2,VoiceMail(1234@default) 
exten => 1234567,3,HangUp()
exten => _9.,1,Dial(SIP/${EXTEN:1}@sipgate.co.uk,30,r)
exten => 1,1,VoicemailMain,s1234 exten => ${SpeakingClock},1,Wait(1)
exten => ${SpeakingClock},2,setvar(FutureTime=$[${EPOCH} + 10])
exten => ${SpeakingClock},3,playback(at-tone-time-exactly)
exten => ${SpeakingClock},4,SayUnixTime(${FutureTime},,R)
exten => ${SpeakingClock},5,playback(vm-and)
exten => ${SpeakingClock},6,SayUnixTime(${FutureTime},,S)
exten => ${SpeakingClock},7,playback(seconds)
exten => ${SpeakingClock},8,playback(beep)
exten => ${SpeakingClock},9,wait(2)
exten => ${SpeakingClock},10,goto(1)
~~~

This is where the magic starts to happen. In my `extensions.conf`, there's a
whole bunch of comments and other contexts that I've not shown. They're there
for example and prove useful if you actually want to do something complicated.
In this case, it seems that the more examples, the better. The `[general]`
section basically sets up a few variables - I'd recommend just setting them to
what I've got here and leave it be. The file comments tell you more about what
they do. `[globals]` is a place you can set up variables and the like. Here I've
set the var `SpeakingClock` to `2`.

Now, I've only got one call context, default, but you can have as many as you
like. I use one to keep it simple. Each command basically is of the format:

    exten => extension,priority,what_to_do

This basically tells asterisk what to do with a call. It looks up the
extension of the call, goes to the lowest numbered priority command, and
executes the command listed. In my file, I've got 4 commands a the top that
handle incoming calls from Sipgate. Asterisk sees these as incoming calls to
the SIP ID extension (7-digit ID, remember?). The first thing it tries to do
is call the SIP phone that's logged in as 'andrew'. If I've got my softphone
logged in, or a hardphone that's turned on and signed in with that username
(see `sip.conf` above), then it'll ring. In this case, indefinately. You can
add a bunch of arguments to tell it to only ring for 10 seconds, or something
similar. That's all in the asterisk documentation. In this case, if there
isn't any phone turned on and logged in, it fails that step and moves onto the
next one, which is a voicemail. We'll come to setting this up in a second, but
this command basically says "prompt the caller to leave a voicemail and then
dump that in voicemail box number 1234". Finally, it hangs up. Although the
caller will probably hang up after leaving the voicemail.

See? Simple.

The next command is for outgoing calls. Any number that starts in a 9 will be
stripped of it's 9 and then sent through to the sipgate.co.uk sip user, which
I've defined in `sip.conf` to be my sipgate account (it's the section name,
not the host, dumbass).

I should point out the pattern matching for extensions. If you prefix an
extension with a "_", it tells asterisk that it's a pattern to match against.
Here's how to make a pattern:


* X matches any digit from 0-9
* Z matches any digit form 1-9
* N matches any digit from 2-9
* [1237-9] matches any digit or letter in the brackets - (in this example, 1,2,3,7,8,9)
* . wildcard, matches one or more characters
* ! wildcard, matches zero or more characters immediately (only Asterisk 1.2 and later)

Therefore, that explains why the extension "_9." matches any number longer
than 1 digit beginning with a 9.

I should make it abundantly clear at this point that I have configured my
outbound calls to use the same SIP provider as my incoming calls. There's
absolutely no reason why this needs to be the case. You could find a
completely different sip provider, register it and list it in `sip.conf` and
direct outbound calls to there. I've not done this yet, but I'll update this
if I ever decide to.

Onto my next extension - I match the extension "1" against my voicemail. I've
only got one voicemail box set up, id number 1234, and I can dial 1 from any
phone connected to asterisk and pick up my voicemail from there. If I didn't
hav the s1234 parameter there, it'd ask me for the mailbox number I wanted to
check. So in theory, you could have as many as you liked.

My final extension is a simple speaking clock. I defined the variable
"SpeakingClock" as "2", so that's the extension that's used. If anyone dials
"2" on a phone connected to asterisk, they get run around this neat 10 step
loop that reads the time out to them. This is the time of the local asterisk
server, so make sure you use ntp to keep it in sync.

Voicemail! It's a wonderful thing. It's also mostly defined in
`voicemail.conf`:

~~~
[general]
format=gsm|wav|wav49
serveremail=asterisk
attach=yes
skipms=3000
maxsilence=10
silencethreshold=128
maxlogins=3
emailbody=Dear ${VM_NAME}:\n\n\tjust wanted to let you know you were just left a ${VM_DUR} long message (number ${VM_MSGNUM})\nin mailbox ${VM_MAILBOX} from ${VM_CALLERID}, on ${VM_DATE}, so you might\nwant to check it when you get a chance. Thanks!\n\n\t\t\t\t--Asterisk\n emaildateformat=%A, %B %d, %Y at %r
mailcmd=/usr/sbin/sendmail -t
sendvoicemail=yes

[zonemessages]
eastern=America/New_York|'vm-received' Q 'digits/at' IMp
central=America/Chicago|'vm-received' Q 'digits/at' IMp
central24=America/Chicago|'vm-received' q 'digits/at' H N 'hours'
military=Zulu|'vm-received' q 'digits/at' H N 'hours' 'phonetic/z_p'

[default]
1234 => 1000,andrew,email@address.com
~~~

Right, so as usual, there's a bunch of well-commented settings up near the
top, a few bits and pieces to change about email sending, and the all
important lines at the bottom that define the voicemail context and mailbox.
I've only got one context, default, and one mailbox, which has the id of 1234,
my name and my email address next to it. This all relates back to the
`extensions.conf` file which told the voicemail to go off to 1234@default,
which means mailbox number 1234 in the context of default. Hope that makes
some sort of sense.

The only other file I changed was `rtp.conf`

~~~
[general]
rtpstart=15000
rtpend=15015
~~~

Remember how we forwarded a bunch of udp ports to our asterisk server before?
This is the file that tells asterisk what port range to advertise as being
able to receive voice traffic on. Simple!

All of the other configs I left as default.

## I need a phone for all this lot?

Now that asterisk is set up, you need to actually have a device to set up and
use as a phone. Otherwise it may be a little pointless. Unless of course you
just want to pick up voicemail and have it emailed to you.

Anyway, for softphones, I recommend [X-lite][4] - it seems fairly easy to set
up and use. You just need to put in the ip address of your asterisk server,
and your username / password that you set up for your account in `sip.conf` -
in my case that'd be "andrew" and "password".

For hardphones, I'm looking at getting something by [Cisco][5], probably a
7960 or something. We have these at the office and they're really rather good.
You can whack a SIP image on there and configure it to talk to asterisk,
there's load of guides out there. They're expensive, but you get a lot of
phone for your money.

## Useful links

Sites I found really useful in setting this all up:

  * [Voip Info][6]

  * [Asterisk Guru][7]

  * [Google][8] :)

   [1]: http://www.asterisk.org/

   [2]: http://en.wikipedia.org/wiki/User_Datagram_Protocol

   [3]: http://www.sipgate.co.uk

   [4]: http://www.xten.com/index.php?menu=Products&smenu=xlite

   [5]: http://www.cisco.com

   [6]: http://www.voip-info.org/wiki/

   [7]: http://www.asteriskguru.com/

   [8]: http://www.google.com

