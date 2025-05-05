---
layout: post
title: "Want to remove McAfee VirusScan Enterprise? Here's how."
---
For several reasons, some good, some bad, I needed to replace a preinstalled version of McAfee Virusscan Enterprise 8.7.0i with the new [Microsoft Endpoint Protection 2012](http://www.microsoft.com/en-us/server-cloud/system-center/configuration-manager-2012.aspx). In the past, I've done this by digging through [lots of registry entries and deleting them](https://kc.mcafee.com/corporate/index?page=content&id=KB59996), in the vain hope that it might actually do something.

But then! I found [this page detailing how to uninstall using msiexec](https://kc.mcafee.com/corporate/index?page=content&id=KB52648). Thinking this couldn't possibly be that simple, imagine my surprise when a single command got rid of it.

In case that page goes away, you want these commands:

VirusScan Enterprise 8.8

    msiexec /x {CE15D1B6-19B6-4D4D-8F43-CF5D2C3356FF} REMOVE=ALL REBOOT=R /q

VirusScan Enterprise 8.7i

    msiexec /x {147BCE03-C0F1-4C9F-8157-6A89B6D2D973} REMOVE=ALL REBOOT=R /q

VirusScan Enterprise 8.5i

    msiexec.exe /x {35C03C04-3F1F-42C2-A989-A757EE691F65} REMOVE=ALL REBOOT=R /q

VirusScan Enterprise 8.0i

    msiexec.exe /x {5DF3D1BB-894E-4DCD-8275-159AC9829B43} REMOVE=ALL REBOOT=R /q

Yay!
