---
layout: post
title: "Capturing a fullscreen video on a remote machine using PSExec and VLC"
---
[VLC][1] is awesome. So is [PSTools][2]. Combining their magic, you can do
cunning things like remotely capture a video of a display in an h264-encoded
mp4 file. Like this:
```shell
psexec -i -h -u DOMAIN\admin-user \\REMOTEHOST "c:\Program Files (x86)\VideoLAN\VLC\vlc.exe" -I dummy screen:/// :screen-fps=50.000000 :screen-caching=300 :sout=#transcode{venc=x264{bframes=0,nocabac,ref=1,nf,level=13,crf=24,partitions=none},vcodec=h264,fps=50,vb=3000,width=1920,height=1080,acodec=none}:duplicate{dst=std{mux=mp4,access=file,dst=c:\output.mp4}} --verbose=0 --dummy-quiet
```
   [1]: http://www.videolan.org/

   [2]: http://technet.microsoft.com/en-us/sysinternals/bb896649

