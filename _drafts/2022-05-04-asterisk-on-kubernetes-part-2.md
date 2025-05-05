---
layout: post
title: "Running Asterisk on Kubernetes - Part 2"
description: "Modern, simple Asterisk on Kubernetes"
---

Previously (last year) on [this underfunded little series]({% post_url /2021/2021-09-17-asterisk-on-kubernetes-part-1 %}) I took a quick meander through the challenges of setting up a service on kubernetes that likes to have a firm handle on the IP addressing that the rest of the world sees it as. In this case, it was our friend Asterisk, which is (in many ways) a "proper" peer-to-peer application.

In this bit, I wanted to write down actually how to get Asterisk configured to do what I wanted it to do, as well as how that configuration is manifest across a load of Kubernetes manifests (ha!).

## What were we trying to do again?

To briefly recap. I was trying to set up:

- An Asterisk server
- running on my kubernetes cluster
- that I can connect various IPv6-based SIP telephony devices to
- that I can also connect my IPv4-only SIP doorbell to
- that also then peers with my upstream provider's VOIP trunk service (also SIP)

Last time, we spent a little bit of time looking at how you can get a pod running on a k8s cluster that gets its own, static(-ish) IP address that it can both send and receive data with (without resorting to awful NAT). Using some clever features from Calico and some single-address IP pools, we managed to get something up and running.

## The baseline container image

Ok, so now that we can get a pod up and running with the correct connectivity requirements, the next thing is to figure out what should be running on this container. There's a load of existing container images on [Docker Hub](https://hub.docker.com) that all claim to run Asterisk, but Asterisk is a pretty complicated piece of software with almost an infinite amount of configurability & options. So rather than guess at an image that may or may not do what's needed, I thought I'd be better off building it myself.

Let's start with a simple `Dockerfile`:

```docker
FROM debian:bullseye-20220418-slim

RUN apt-get update && apt-get install -y asterisk && rm -rf /var/lib/apt/lists/*

CMD [ "/usr/sbin/asterisk", "-fp" ]
```

This is just the basic, default installation of Asterisk on (current) stable Debian. If you build and run this, you'll get:

```bash
PBX UUID: 2ec93681-f8de-4fb5-8387-72b32e7ad095
[May  4 15:35:16] NOTICE[1]: loader.c:2377 load_modules: 334 modules will be loaded.
[May  4 15:35:16] NOTICE[1]: res_config_ldap.c:1830 parse_config: No directory user found, anonymous binding as default.
[May  4 15:35:16] ERROR[1]: res_config_ldap.c:1856 parse_config: No directory URL or host found.
[May  4 15:35:16] ERROR[1]: res_config_ldap.c:1718 load_module: Cannot load LDAP RealTime driver.
[May  4 15:35:16] NOTICE[1]: cdr.c:4522 cdr_toggle_runtime_options: CDR simple logging enabled.
[May  4 15:35:22] WARNING[1]: res_phoneprov.c:1232 get_defaults: Unable to find a valid server address or name.
[May  4 15:35:22] NOTICE[1]: res_smdi.c:1424 load_module: No SMDI interfaces are available to listen on, not starting SMDI listener.
SIP channel loading...
[May  4 15:35:22] NOTICE[1]: chan_skinny.c:8459 config_load: Configuring skinny from skinny.conf
[May  4 15:35:22] NOTICE[1]: chan_skinny.c:8469 config_load: Unable to load config skinny.conf, Skinny disabled.
[May  4 15:35:22] NOTICE[1]: chan_mgcp.c:4708 reload_config: Unable to load config mgcp.conf, MGCP disabled
[May  4 15:35:22] ERROR[1]: ari/config.c:312 process_config: No configured users for ARI
[May  4 15:35:22] NOTICE[1]: confbridge/conf_config_parser.c:2370 verify_default_profiles: Adding default_menu menu to app_confbridge
[May  4 15:35:22] NOTICE[1]: cel_tds.c:450 tds_load_module: cel_tds has no global category, nothing to configure.
[May  4 15:35:22] WARNING[1]: cel_tds.c:555 load_module: cel_tds module had config problems; declining load
[May  4 15:35:22] NOTICE[1]: cel_radius.c:236 load_module: Cannot load radiusclient-ng configuration file /etc/radiusclient-ng/radiusclient.conf.
[May  4 15:35:22] NOTICE[1]: cdr_radius.c:264 load_module: Cannot load radiusclient-ng configuration file /etc/radiusclient-ng/radiusclient.conf.
[May  4 15:35:22] NOTICE[1]: cel_custom.c:95 load_config: No mappings found in cel_custom.conf. Not logging CEL to custom CSVs.
[May  4 15:35:22] NOTICE[1]: cdr_pgsql.c:545 config_module: cdr_pgsql configuration contains no global section, skipping module load.
[May  4 15:35:22] WARNING[1]: cel_pgsql.c:467 process_my_load_module: CEL pgsql config file missing global section.
[May  4 15:35:22] ERROR[1]: pbx_dundi.c:4952 set_config: Unable to load config dundi.conf
[May  4 15:35:22] ERROR[1]: chan_unistim.c:6863 reload_config: Unable to load config unistim.conf
[May  4 15:35:22] WARNING[1]: res_hep_rtcp.c:161 load_module: res_hep is disabled; declining module load
[May  4 15:35:22] WARNING[1]: res_hep_pjsip.c:236 load_module: res_hep is disabled; declining module load
[May  4 15:35:22] WARNING[1]: loader.c:2381 load_modules: Some non-required modules failed to load.
[May  4 15:35:22] ERROR[1]: loader.c:2396 load_modules: chan_skinny declined to load.
[May  4 15:35:22] ERROR[1]: loader.c:2396 load_modules: res_pjsip_transport_websocket declined to load.
[May  4 15:35:22] ERROR[1]: loader.c:2396 load_modules: cel_tds declined to load.
[May  4 15:35:22] ERROR[1]: loader.c:2396 load_modules: cel_radius declined to load.
[May  4 15:35:22] ERROR[1]: loader.c:2396 load_modules: cdr_radius declined to load.
[May  4 15:35:22] ERROR[1]: loader.c:2396 load_modules: cdr_tds declined to load.
[May  4 15:35:22] ERROR[1]: loader.c:2396 load_modules: cdr_sqlite3_custom declined to load.
[May  4 15:35:22] ERROR[1]: loader.c:2396 load_modules: cdr_pgsql declined to load.
[May  4 15:35:22] ERROR[1]: loader.c:2396 load_modules: cel_sqlite3_custom declined to load.
[May  4 15:35:22] ERROR[1]: loader.c:2396 load_modules: pbx_dundi declined to load.
[May  4 15:35:22] ERROR[1]: loader.c:2396 load_modules: chan_unistim declined to load.
[May  4 15:35:22] ERROR[1]: loader.c:2396 load_modules: res_hep_rtcp declined to load.
[May  4 15:35:22] ERROR[1]: loader.c:2396 load_modules: res_hep_pjsip declined to load.
Asterisk Ready.
```

For a default configuration, that's.... a lot of complaining. And three hundred and thirty four modules feels like it's too many - I have no idea what they all do, but I'm sure I don't need them all.

## Trimming the modules

There's a configuration file in Asterisk called `modules.conf` that tells it which modules to load. A module is effectively an encapsulation of some piece of functionality, and enabling that module enables that funcionality. Asterisk is extremely capable and extensible, so there's a _lot_ of modules available in a default installation. Debian's default also ships with a `modules.conf` that enables `autoload=yes`, which is a fancy way of saying "Find all the modules on the filesystem you can, and try to load them!". Great for maximum funcionality, but you end up loading a bunch of stuff you don't need.

So how can we get to a minimum baseline? First is figuring out what "minimum" means. At a bare minimum, we need:

- SIP funcionality (PJSIP is the name of the implementation)
- Audio codecs
- Audio formats
- Basic generic telephony functions (dialling, callerid)
- Bridging for clients that can't or won't do direct media

Usefully, the Asterisk project publish some sample configs, including one called "basic-pbx": https://github.com/asterisk/asterisk/tree/b9e888418e307aacf73005d1e765f370eff21aee/configs/basic-pbx. The `modules.conf` in that config usefully sets out `autoload=no` and then lists a number of "required" modules to createa basic PJSIP-based PBX.

There's actually a bunch of these I also don't care about (e.g. voicemail), so we can create a new `modules.conf` based on this version:

```
[modules]
autoload=no

; Applications
load = app_dial.so
load = app_playback.so
load = app_stack.so
load = app_verbose.so
load = app_directory.so

; Bridging

load = bridge_builtin_features.so
load = bridge_builtin_interval_features.so
load = bridge_native_rtp.so
load = bridge_simple.so

; Call Detail Records

load = cdr_custom.so

; Channel Drivers

load = chan_bridge_media.so
load = chan_pjsip.so

; Codecs

load = codec_gsm.so
load = codec_resample.so
load = codec_ulaw.so
load = codec_g722.so

; Formats

load = format_gsm.so
load = format_pcm.so
load = format_wav_gsm.so
load = format_wav.so

; Functions

load = func_callerid.so
load = func_cdr.so
load = func_pjsip_endpoint.so
load = func_sorcery.so
load = func_devstate.so
load = func_strings.so

; Core/PBX

load = pbx_config.so

; Resources

load = res_pjproject.so
load = res_pjsip_acl.so
load = res_pjsip_authenticator_digest.so
load = res_pjsip_caller_id.so
load = res_pjsip_dialog_info_body_generator.so
load = res_pjsip_diversion.so
load = res_pjsip_dtmf_info.so
load = res_pjsip_endpoint_identifier_anonymous.so
load = res_pjsip_endpoint_identifier_ip.so
load = res_pjsip_endpoint_identifier_user.so
load = res_pjsip_exten_state.so
load = res_pjsip_header_funcs.so
load = res_pjsip_logger.so
load = res_pjsip_messaging.so
load = res_pjsip_mwi_body_generator.so
load = res_pjsip_mwi.so
load = res_pjsip_notify.so
load = res_pjsip_one_touch_record_info.so
load = res_pjsip_outbound_authenticator_digest.so
load = res_pjsip_outbound_publish.so
load = res_pjsip_outbound_registration.so
load = res_pjsip_path.so
load = res_pjsip_pidf_body_generator.so
load = res_pjsip_pidf_digium_body_supplement.so
load = res_pjsip_pidf_eyebeam_body_supplement.so
load = res_pjsip_publish_asterisk.so
load = res_pjsip_pubsub.so
load = res_pjsip_refer.so
load = res_pjsip_registrar.so
load = res_pjsip_rfc3326.so
load = res_pjsip_sdp_rtp.so
load = res_pjsip_send_to_voicemail.so
load = res_pjsip_session.so
load = res_pjsip.so
load = res_pjsip_t38.so
load = res_pjsip_xpidf_body_generator.so
load = res_rtp_asterisk.so
load = res_sorcery_astdb.so
load = res_sorcery_config.so
load = res_sorcery_memory.so
load = res_sorcery_realtime.so
load = res_timing_timerfd.so

noload = res_hep.so
noload = res_hep_pjsip.so
noload = res_hep_rtcp.so
```

So now we can start this up and get:

```shell
PBX UUID: 89904a36-858c-41ab-8962-08879871bb4b
[May  4 16:10:24] NOTICE[1]: loader.c:2377 load_modules: 85 modules will be loaded.
[May  4 16:10:24] NOTICE[1]: cdr.c:4522 cdr_toggle_runtime_options: CDR simple logging enabled.
[May  4 16:10:30] WARNING[1]: pbx.c:8763 ast_context_verify_includes: Context 'local' tries to include nonexistent context 'parkedcalls'
Asterisk Ready.
```

85 modules! This is fewer than 334. Somehow this feels better. There's still some weird log messages about... CDR? Nonexistent contexts?

## The Default Configuration

The default Asterisk install comes with a whole load of configuration files, some of which have useful defaults, some of which have a load of example and "helper" stuff that's not always necessary. Let's see if we can trim it down to the bare minimum.

First, what if we completely empty out our `/etc/asterisk` folder (except for `modules.conf`)?

```shell
$ docker run --rm -v $(pwd)/conf:/etc/asterisk/ my-asterisk
Unable to open specified master config file '/etc/asterisk/asterisk.conf', using built-in defaults
PBX UUID: cc180918-da2c-4819-abb8-6832d7ed27f3
Unable to load config file 'stasis.conf'
Could not load Stasis configuration; using defaults
[May  5 10:45:29] ERROR[1]: logger.c:1874 init_logger: Errors detected in logger.conf.  Default console logging is being used.
[May  5 10:45:29] NOTICE[1]: loader.c:2377 load_modules: 85 modules will be loaded.
[May  5 10:45:29] WARNING[1]: ccss.c:4386 initialize_cc_max_requests: Could not find valid ccss.conf file. Using cc_max_requests default
[May  5 10:45:29] WARNING[1]: ccss.c:4443 initialize_cc_devstate_map: Could not find valid ccss.conf file. Using cc_[state]_devstate defaults
[May  5 10:45:29] ERROR[1]: config_options.c:710 aco_process_config: Unable to load config file 'cdr.conf'
[May  5 10:45:29] NOTICE[1]: cdr.c:4394 process_config: Failed to process CDR configuration; using defaults
[May  5 10:45:29] NOTICE[1]: cdr.c:4522 cdr_toggle_runtime_options: CDR simple logging enabled.
[May  5 10:45:29] ERROR[1]: config_options.c:710 aco_process_config: Unable to load config file 'cel.conf'
[May  5 10:45:29] NOTICE[1]: cel.c:1636 load_module: Failed to process CEL configuration; using defaults
[May  5 10:45:29] ERROR[1]: config_options.c:710 aco_process_config: Unable to load config file 'features.conf'
[May  5 10:45:29] NOTICE[1]: features_config.c:1874 load_config: Could not load features config; using defaults
[May  5 10:45:29] WARNING[1]: indications.c:1056 load_indications: Can't find indications config file indications.conf.
[May  5 10:45:29] ERROR[1]: config_options.c:710 aco_process_config: Unable to load config file 'acl.conf'
[May  5 10:45:29] NOTICE[1]: manager.c:9259 __init_manager: Unable to open AMI configuration manager.conf, or configuration is invalid.
[May  5 10:45:29] ERROR[1]: config_options.c:710 aco_process_config: Unable to load config file 'udptl.conf'
[May  5 10:45:29] NOTICE[1]: udptl.c:1338 __ast_udptl_reload: Could not load udptl config; using defaults
[May  5 10:45:29] ERROR[1]: res_sorcery_config.c:324 sorcery_config_internal_load: Unable to load config file 'pjproject.conf'
[May  5 10:45:29] ERROR[1]: res_sorcery_config.c:324 sorcery_config_internal_load: Unable to load config file 'pjsip.conf'
[May  5 10:45:34] ERROR[1]: res_sorcery_config.c:324 sorcery_config_internal_load: Unable to load config file 'pjsip.conf'
[May  5 10:45:34] ERROR[1]: res_sorcery_config.c:324 sorcery_config_internal_load: Unable to load config file 'pjsip.conf'
[May  5 10:45:34] ERROR[1]: res_sorcery_config.c:324 sorcery_config_internal_load: Unable to load config file 'pjsip.conf'
[May  5 10:45:34] ERROR[1]: res_sorcery_config.c:324 sorcery_config_internal_load: Unable to load config file 'pjsip.conf'
[May  5 10:45:34] ERROR[1]: res_sorcery_config.c:324 sorcery_config_internal_load: Unable to load config file 'pjsip.conf'
[May  5 10:45:34] ERROR[1]: res_sorcery_config.c:324 sorcery_config_internal_load: Unable to load config file 'pjsip.conf'
[May  5 10:45:34] ERROR[1]: res_sorcery_config.c:324 sorcery_config_internal_load: Unable to load config file 'pjsip.conf'
[May  5 10:45:34] ERROR[1]: res_sorcery_config.c:324 sorcery_config_internal_load: Unable to load config file 'pjsip.conf'
[May  5 10:45:34] ERROR[1]: res_sorcery_config.c:324 sorcery_config_internal_load: Unable to load config file 'pjsip.conf'
[May  5 10:45:34] ERROR[1]: res_sorcery_config.c:324 sorcery_config_internal_load: Unable to load config file 'pjsip.conf'
[May  5 10:45:34] ERROR[1]: res_sorcery_config.c:324 sorcery_config_internal_load: Unable to load config file 'pjsip.conf'
[May  5 10:45:34] ERROR[1]: res_sorcery_config.c:324 sorcery_config_internal_load: Unable to load config file 'pjsip.conf'
[May  5 10:45:34] ERROR[1]: res_sorcery_config.c:324 sorcery_config_internal_load: Unable to load config file 'pjsip.conf'
[May  5 10:45:34] ERROR[1]: res_sorcery_config.c:324 sorcery_config_internal_load: Unable to load config file 'pjsip.conf'
[May  5 10:45:34] ERROR[1]: res_sorcery_config.c:324 sorcery_config_internal_load: Unable to load config file 'pjsip.conf'
[May  5 10:45:34] ERROR[1]: res_sorcery_config.c:324 sorcery_config_internal_load: Unable to load config file 'pjsip.conf'
[May  5 10:45:34] ERROR[1]: res_sorcery_config.c:324 sorcery_config_internal_load: Unable to load config file 'pjsip.conf'
[May  5 10:45:34] ERROR[1]: res_sorcery_config.c:324 sorcery_config_internal_load: Unable to load config file 'pjsip.conf'
[May  5 10:45:34] ERROR[1]: config_options.c:710 aco_process_config: Unable to load config file 'pjsip_notify.conf'
[May  5 10:45:34] ERROR[1]: res_sorcery_config.c:324 sorcery_config_internal_load: Unable to load config file 'pjsip.conf'
[May  5 10:45:34] ERROR[1]: cdr_custom.c:99 load_config: Unable to load cdr_custom.conf. Not logging custom CSV CDRs.
[May  5 10:45:34] WARNING[1]: loader.c:2381 load_modules: Some non-required modules failed to load.
[May  5 10:45:34] ERROR[1]: loader.c:2396 load_modules: res_pjsip_notify declined to load.
[May  5 10:45:34] ERROR[1]: loader.c:2396 load_modules: pbx_config declined to load.
Asterisk Ready.
```

Ouch - it looks like certain modules need specific config files to exist and possibly even have a minimum config in. Software!

After much poking around, it turns out for the modules that we're loading, we need the following blank config files to squash all the startup warnings:

- `pjproject.conf` Common options for all pjproject modules
- `ccss.conf` Call Completion Supplementary Service configuration
- `cel.conf` Channel Event Logging configuration)
- `features.conf` Call features configuration
- `acl.conf` Access Control Lists configuration
- `cdr_custom.conf` Custom format for the Call Detail Record engine. You need this even if you turn CDR off
- `pjsip_notify.conf` pjproject notification configuration
- `udptl.conf` T.38 transport configuration
- `statis.conf` Asterisk Messagebus (stasis) configuration, threadpool sizes etc.
- `pjsip.conf` pjproject SIP configuration - we'll come back to this one

We can make sure these exist by creating them in the `Dockerfile` image:

```
FROM debian:bullseye-20220418-slim

RUN apt-get update && apt-get install -y asterisk && rm -rf /var/lib/apt/lists/*

RUN rm -rf /etc/asterisk/*
RUN touch /etc/asterisk/pjproject.conf /etc/asterisk/ccss.conf /etc/asterisk/cel.conf /etc/asterisk/features.conf /etc/asterisk/acl.conf /etc/asterisk/cdr_custom.conf /etc/asterisk/pjsip_notify.conf /etc/asterisk/udptl.conf /etc/asterisk/stasis.conf /etc/asterisk/pjsip.conf

CMD [ "/usr/sbin/asterisk", "-fp" ]
```

We also need some config files with actual config in it. Let's turn off the CDR.

`cdr.conf`:

```
; We don't want local CDR
[general]
enable=no
```

Also, we need to tell Asterisk how to generate tones for my local region (UK).

`indications.conf`:

```
[general]
country=uk


[uk]
description = United Kingdom
ringcadence = 400,200,400,2000

; These are the official tones taken from BT SIN350. The actual tones

; used by BT include some volume differences so sound slightly different

; from Asterisk-generated ones.
dial = 350+440

; Special dial is the intermittent dial tone heard when, for example,

; you have a divert active on the line
specialdial = 350+440/750,440/750

; Busy is also called "Engaged"
busy = 400/375,0/375

; "Congestion" is the Beep-bip engaged tone
congestion = 400/400,0/350,400/225,0/525
; "Special Congestion" is not used by BT very often if at all
specialcongestion = 400/200,1004/300
unobtainable = 400
ring = 400+450/400,0/200,400+450/400,0/2000
callwaiting = 400/100,0/4000

; BT seem to use "Special Call Waiting" rather than just "Call Waiting" tones
specialcallwaiting = 400/250,0/250,400/250,0/250,400/250,0/5000
; "Pips" used by BT on payphones. (Sounds wrong, but this is what BT claim it
; is and I've not used a payphone for years)
creditexpired = 400/125,0/125
; These two are used to confirm/reject service requests on exchanges that
; don't do voice announcements.
confirm = 1400
switching = 400/200,0/400,400/2000,0/400
; This is the three rising tones Doo-dah-dee "Special Information Tone",
; usually followed by the BT woman saying an appropriate message.
info = 950/330,0/15,1400/330,0/15,1800/330,0/1000
; Not listed in SIN350

record = 1400/500,0/60000

stutter = 350+440/750,440/750
```

And we want to enable the manager interface for debugging and things.

`manager.conf`:

```
[general]
enabled = yes
```

Once we've created these, we can add them into the image.

`Dockerfile`:

```
FROM debian:bullseye-20220418-slim

RUN apt-get update && apt-get install -y asterisk && rm -rf /var/lib/apt/lists/*

RUN rm -rf /etc/asterisk/*
RUN touch /etc/asterisk/pjproject.conf /etc/asterisk/ccss.conf /etc/asterisk/cel.conf /etc/asterisk/features.conf /etc/asterisk/acl.conf /etc/asterisk/cdr_custom.conf /etc/asterisk/pjsip_notify.conf /etc/asterisk/udptl.conf /etc/asterisk/stasis.conf /etc/asterisk/pjsip.conf

COPY asterisk.conf /etc/asterisk/asterisk.conf
COPY logger.conf /etc/asterisk/logger.conf
COPY modules.conf /etc/asterisk/modules.conf
COPY cdr.conf /etc/asterisk/cdr.conf
COPY manager.conf /etc/asterisk/manager.conf
COPY indications.conf /etc/asterisk/indications.conf


CMD [ "/usr/sbin/asterisk", "-fp" ]
```

## SIP configuration, extensions, etc.

So now that we have a baseline to start with, we can actually start configuring what we want.

For our needs, we'll need two things:

1. A way to configure all the different SIP pieces, (endpoints, transports, aors etc.)
2. A configuration for what to actually do when things happen (incoming calls received, outgoing numbers dialled etc.)

`pjsip.conf` is the starting point for doing the SIP configuration.
