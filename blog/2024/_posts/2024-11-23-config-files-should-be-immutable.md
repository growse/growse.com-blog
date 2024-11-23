---
layout: post
title: "Config files should be immutable"
description: "Stop treating them as data"
tags: [ "programming", "systems" ]
---

## Eurgh

I'll be brief, and opinionated.

There's typically two types of system configuration.

### Startup config

One is (usually) read at startup and contains a bunch of keys/values (or some other structure) that instructs the
software on how to behave. Things like "where's my database?"
and "what verbosity should I log as?" etc.

A bunch of conventions have arisen on how to supply this data - there's _environment variables_ (bad for secrets),
_process arguments_, and _configuration files_. If you've got a very small number of config options, you might find that
env vars and process arguments are the right thing to use. But once you get to a certain complexity, the value of a well
structured config file starts to tip the scales over the complexity of managing 100 different CLI options (I have no
opinion on format. Except maybe don't use M4. TOML and YAML are fine).

One of the objectives of this type of configuration is that it provides a bunch of data that the application needs to
use in order to function roughly correctly. Typically, this sort of data is bound to the lifetime of the application -
if you want to change on of these values, then bouncing the process lets you start from a known good state.

### User- or Operator-managed configuration

The other is more about tweaking the application once it's running. Changing its behaviour on the fly. This is usually
by some sort of user of the application changing some settings through some sort of interface (Web UI, JMX, whatever).

We've all seen these config screens - they're usually behind some sort of menu called "Settings" or "Configuration" on a
fancy UI, and many apps choose to persist these settings between restarts.

## The conflict

The problem here is that you want to both be able to allow an operator to declare a configuration state (probably
managed by some sort of configuration management / state system) that the application uses on startup, *and* allow a
user to be able to change some configuration at runtime (and then have that persist between restarts).

### The good

The path most travelled here is to store the non-user managed config in some sort of file, and persist user-managed
settings in some sort of data store.

This is great! I can manage my config file in my build / deployment / config management system, and I can look after the
user preferences in the database by _just treating it as data_ - meaning I can just back it up along with all the other
app data.

### The meh

An alternative is to do away with config files and just manage all the config in a database. It's a bit more painful, as
I can't declare what the config should be ahead of time and automate changes to it very easily. But still, fine. I do it
once on first start, backup the database. Easy.

### The "oh no"

Some applications invite you to create a configuration file, happily read it on startup, and then *mutate it as it
runs*. This is effectively treating the config file as a data store. So now I need to worry about backing up my config
files, _which I should be populating from a config management system anyway_.

Config files should be immutable. Application developers: Stop writing to them. They're not yours.

(Looking at you, Frigate, Zigbee2MQTT and others).