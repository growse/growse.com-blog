---
layout: post
title: "Screenshotting websites in .NET, behind a proxy"
---
I managed to get to the bottom of a particular thorny problem this week, the solution to which wasn't obvious. It started with a simple enough problem: Is it possible to regularly capture a fully rendered image of a webpage?

I cranked out what I had to hand, which happened to be C# .NET. At first, I thought there would be some way I could use the System.Windows.Forms.WebBrowser control, and then do some funky magic in capturing the output. Unfortunately, there didn't seem to be an obvious way of doing that, so I moved onto more exotic stuff.

By 'exotic', I mean 'using a separate third-party executable and pass it some arguments'. Specifically, I discovered [IECapt](http://iecapt.sourceforge.net/) - a nice little executable that takes a url, some other arguments and spits out an image after rendering the page with the IE engine.

In the context of a little console application, this worked brilliantly. However, while running it as a service, it claimed to work, but failed to output any images. There wasn't a lot to go on trying to figure out what was happening, other than the fact that if I ran the service as my user account, it worked. Any other account, it didn't work. Unfortunately, this lead me on a wild goose chase trying to figure out what permissions could be causing it to silently fail. It turns out it had nothing to do with permissions.

The fault actually lay with proxy settings, or more specifically, the rather strange way in which Windows handles proxy settings. I grabbed the source of the 'experimental' c# version of IECapt, and after hammering into place and tracing everything, everywhere, I discovered that while running under the context of a different user the process was firing a 'NavigateError' event with the code 0x800c0005. This basically means "I can't connect".

This system connects to the internet via an HTTP proxy. Internet Explorer stores proxy information on a per-user basis, which means if you run an IE process, it tries to connect to resources using the proxy settings stored under that user. This is fine if you're running as an actual user account, but if you run an IE process under a service or system account, there isn't an obvious way of altering the proxy data to something meaningful. There's a bunch of hacks around using [PSExec](http://technet.microsoft.com/en-us/sysinternals/bb896649) to start up an IE process under a different user and set the proxy manually. But I wanted a more reliable way of doing it. 

I stumbled on [this post](http://social.msdn.microsoft.com/Forums/en-US/winforms/thread/f4dc3550-f213-41ff-a17d-95c917bed027/) on the MSDN forums which helpfully described how to set the proxy programatically for the current user. In case that URL breaks, here's how:

<div class="code">Public struct Struct_INTERNET_PROXY_INFO 
{ 
    public int dwAccessType; 
    public IntPtr proxy; 
    public IntPtr proxyBypass; 
}; 

[DllImport("wininet.dll", SetLastError = true)] 
private static extern bool InternetSetOption(IntPtr hInternet, int dwOption, IntPtr lpBuffer, int lpdwBufferLength);

private void RefreshIESettings(string strProxy) 
{ 
    const int INTERNET_OPTION_PROXY = 38; 
    const int INTERNET_OPEN_TYPE_PROXY = 3; 
    
    Struct_INTERNET_PROXY_INFO struct_IPI; 
    
    // Filling in structure 
    struct_IPI.dwAccessType = INTERNET_OPEN_TYPE_PROXY; 
    struct_IPI.proxy = Marshal.StringToHGlobalAnsi(strProxy); 
    struct_IPI.proxyBypass = Marshal.StringToHGlobalAnsi("local"); 
    
    // Allocating memory 
    IntPtr intptrStruct = Marshal.AllocCoTaskMem(Marshal.SizeOf(struct_IPI)); 
    
    // Converting structure to IntPtr 
    Marshal.StructureToPtr(struct_IPI, intptrStruct, true); 
    
    bool iReturn = InternetSetOption(IntPtr.Zero, INTERNET_OPTION_PROXY, intptrStruct, Marshal.SizeOf(struct_IPI)); 
} 

private void SomeFunc() 
{ 
    RefreshIESettings("192.168.1.200:1010");     
}</div>

And this works rather well :)