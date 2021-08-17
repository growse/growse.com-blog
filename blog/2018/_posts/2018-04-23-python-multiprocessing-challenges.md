---
layout: post
title: "Python Multiprocessing Challenges"
---
Computers are hard.

I was recently trying to do (what I thought was) a simple thing: write a program in Python. I really like Python, it's pretty good at getting out of the way of the process of me thinking about how I want a program to behave, and then expressing that as a piece of code. It's got good supporting libraries, and it's pretty easy to parse.

I've written Python before. What was different this time is that I was trying to use concurrency. Computers are hard.

The specific problem was this: I needed a program that could be started (either manually or via some sort of supervisor), proceed to do a number of different independent subtasks simultaneously, and then quit either when given a signal from the OS (or user, whatever) *or* when a specific condition was met by one of the subtasks. The nature of these independent things wasn't very complicated - mostly just of the format "Check a thing, sleep, repeat" or similar. Also, it needed to be Python 2, and run on a Linux thing.

This sounds straightforward. However, it turns out, it's not.

## Signals and Events

First problem: There are two events that should cause my program to stop. Either a subtask encounters a stop condition, or the program receives a signal (`SIGTERM` etc.). How do you handle this? There are two broad ways of doing concurrency in Python. You can either use the [`multiprocessing`](https://docs.python.org/2/library/multiprocessing.html) module, where you can essentially `fork()` to a separate process to do your evil sub-bidding, or you can use [`threading`](https://docs.python.org/2/library/threading.html) which uses a more shared thready-thing. There's pros and cons to each - shared/unshared heap, shared/unshared GIL etc. I chose `multiprocessing` as I had long-running subtasks and didn't care about sharing memory or startup overhead.

My plan was to use a shared [`multiprocessing.Event`](https://docs.python.org/2/library/multiprocessing.html#multiprocessing.Event) to block the execution of the "master" process. This (in theory) has the nice property in that you can share it across multiple `Process` objects, and coordinate activity between them. One process that's blocked on `Event.wait()` is released when another calls `Event.set()`. Coupled with a signal handler, you might expect the following to be sane:
```python
#!/usr/bin/env python

import multiprocessing
import signal

my_event = multiprocessing.Event()


def signal_handler(received_signal, _):
    my_event.set()


for signame in (signal.SIGINT, signal.SIGTERM, signal.SIGQUIT):
    signal.signal(signame, signal_handler)

my_event.wait()
```

This should block until `my_event` is set, right? What happens when it receives `SIGINT`? The signal handler should fire on `MainThread`, and try to call `my_event.set()`. In fact, it does exactly this, but `my_event.set()` deadlocks, presumably because there's an active `wait()` call. Hurray!

Fun fact, if you use `threading.Event()` instead, it doesn't deadlock! Hurray!

But wait! Is this true of all `multiprocessing` classes that provide some sort of `wait()`/`set()` type functionality? What about a queue?
```python
#!/usr/bin/env python

import multiprocessing
import signal

my_queue = multiprocessing.Queue()


def signal_handler(received_signal, _):
    my_queue.put("HI I'M A MESSAGE")


for signame in (signal.SIGINT, signal.SIGTERM, signal.SIGQUIT):
    signal.signal(signame, signal_handler)

my_queue.get() # Block until we get a message
```
*This works just fine*. WTF python?

## `multiprocessing.Event` is useless

This is a problem, because events provide a way of _broadcasting_ intent to whoever cares. Multiple processes can `wait()` on a shared `Event` and they all get notified when something calls `set()`. This is not true of a queue - the whole point of a queue is to deliver a message, and typically it's useful if that message is delivered once. So if you have 5 things blocking on `Queue.get()`, only one of those things will unblock if you send it a message. Sure, you can keep track of how many listeners there are and try and send exactly that many messages, but this isn't amateur-hour.

In our case, we have a number of subtasks that can reach a state where they want to indicate that the program should stop. An event would be an ideal mechanism to use to:

1. Flag to the other subtasks that one of their siblings would like everyone to stop, and could they please clean up after themselves and also stop
2. Flag to the master process that things are going to be stopping soon, and join on all the subtasks to wait for them to go away, so that it can then gracefully exit

In addition, the master process can also reach a state where it decides that it wants to quit: receiving `SIGTERM` or similar.

We can use the above program as a starting point. We know we can use a `multiprocessing.Queue` to interrupt the master process in the event that it receives a signal, and thus trigger a shut down. 

## Signals all the way down

The next question is: how can we also get a message from any of the subtasks to the master process (and each other) that the time has come to stop? 

How do processes normally send control state messages to each other?

What if we use..... signals?

### Fork

When you `fork()` a process, it inherits whatever signal handler you had on the master process. Also, signals that are sent to the master process are received by the child processes. Often, this is what you want, but not always. In this case, I'm after a slightly more simplified behaviour from the subprocess signal handler: If you receive `SIGTERM` etc. stop gracefully. Don't do anything else.

In reality, what this looks like is something like this:

```python
def my_subprocess_1():
    my_event = threading.Event()

    def my_signal_handler(signal, _):
        my_event.set()

    for signame in signals:
        signal.signal(signame, my_signal_handler)
    while not my_event.is_set():
        do_boring_thing()
        my_event.wait(5)
```

This will happily `do_boring_thing()` repeatedly, waiting 5 seconds between each invocation. If the process receives a signal that's in `signals`, it will set `my_event`. If the subprocess is blocked on `my_event.wait(5)`, it will just unblock and exit the loop. If it's in the middle of `do_boring_thing()`, it will finish that, then exit the loop. Nice and straightforward. (Notice use of `threading.Event` here - it's a useful thing to use even if you're not doing anything explicitly concurrently, because signal handlers are asynchronous - they fire whenever the VM feels like).

If the master process receives a `SIGTERM`, so do all the subprocesses - they all go down gracefully, along with the master process which uses the queueing mechanism above. 

What if the OS sends `SIGTERM` just to the subprocess? Or, worse, `SIGKILL`?

### Think of the children!

It turns out POSIX defines a special signal: `SIGCHLD` ([Details here](http://man7.org/linux/man-pages/man7/signal.7.html)). Every process has a parent process (except PID 1), and when a process receives any kind of signal (including `SIGKILL`), the parent receives `SIGCHLD`. So! This gives us a way for the master process to be notified that one of the subprocesses has been given a signal and may be terminating. it just needs to handle `SIGCHLD`:

```python
def signal_handler(received_signal, _):
    if received_signal == signal.SIGCHLD:
        pid, status = os.waitpid(-1, os.WNOHANG | os.WUNTRACED | os.WCONTINUED)
        if os.WIFCONTINUED(status) or os.WIFSTOPPED(status):
            return
        if os.WIFSIGNALED(status) or os.WIFEXITED(status):
            my_queue.put(True)
    else:
        my_queue.put(True)
 
signals = (signal.SIGINT, signal.SIGTERM, signal.SIGCHLD, signal.SIGQUIT)
for signame in signals:
    signal.signal(signame, my_signal_handler) 
```

This is a somewhat simplified version, but should be clear. The downside of handling SIGCHLD is you get notified of pretty much every event, even the ones you don't care about. So you have to tell the difference between a subprocess being told to exit, or just being told to stop/resume. There's a bunch of stuff in `os` that can let you determine things from the value of `status`.

Interestingly, we also get to decide here what happens if a subprocess has quit. In my case, I just want to bring everything down - the process supervisor can decide to bring it back up again. That said, in a different case you may choose to restart that particular subprocess (assuming you tracked the PID of each subprocess so you know which one stopped).

### Subprocesses that actually want to die

The subprocess I have above is pretty simple. Do a thing, wait 5 seconds, repeat. But what if you want a subprocess that can also decide it wants to stop the whole program? 

```python
def my_subprocess_2():
    my_event = threading.Event()

    def my_signal_handler(signal, _):
        my_event.set()

    for signame in signals:
        signal.signal(signame, my_signal_handler)
    while not my_event.is_set():
        should_i_quit = do_other_boring_thing()
        if should_i_quit:
            my_event.set()                
        my_event.wait(5)
```

This basically does the same thing as the first subprocess. However, this time, the boring work it does returns a result, indicating whether or not the program should stop. If the value is `True`, it sets `my_event`, exits the loop, and the subprocess stops.

But what then?

We've got a `SIGCHLD` handler on the master process, so that dutifully gets executed (the subprocess stopping will fire `SIGCHLD` and indicate that the processes called `exit()`). Alternatively, we can actually pass `my_queue` to the subprocess and get it to send a message to the master explicitly. Either way, the master process is unblocked on `my_queue.get()` and quits. Great! 

No.

The other subprocesses are still running. They don't know their faithful colleague has decided they should stop. They have no idea their parent has decided to also pack up and leave. They're still sitting there, idly running `do_boring_thing()` forever.

There's a number of different ways of solving this. I chose to use the master process as the coordination point. Specifically, when it gets unblocked from `my_queue.get()`, it should attemp to terminate all the subprocesses by sending them `SIGTERM`:

```python
joinables = []

subprocess1 = multiprocessing.Process(target=my_subprocess_1)
joinables.append(subprocess1)
subprocess1.start()

subprocess2 = multiprocessing.Process(target=my_subprocess_2)
joinables.append(subprocess2)
subprocess2.start()

my_queue.get()
signal.signal(signal.SIGCHLD, signal.SIG_DFL)  # We don't care for SIGCHLDs any more.

for joinable in joinables:
    try:
        joinable.terminate()
    except OSError:
        # Turns out the subprocess might not exist any more, even if the master thinks it does
        pass

## Wait for stuff to stop
for joinable in joinables:
    logging.info("joining on {}".format(joinable))
    joinable.join()
```

There's a few things here. Firstly, we keep track of our subprocesses in a list called `joinables`.

Secondly, when we get a message on `my_queue`, the master process stops caring about `SIGCHLD`. It's going to be taking the subprocesses down anyway, so it doesn't care about any signals they receive in the meantime.

Thirdly, it loops through each `Process` in `joinables` and sends it `SIGTERM` - sometimes this fails if the process has already gone away. This may have happened if the subprocess was sent `SIGKILL` and we're tidying everything up.

Finally, we wait for everything to exit by calling `join()` on each `Process`.

### Last bits and bobs

Surely this must be complete now. Almost!

What happens if the master process receives `SIGKILL`? 

`SIGKILL` is a way for the OS to kill a process without that process having a say in what happens. It's brutal, and there's no way to handle it. The process just stops. Parents get notified, but not children. (Not by default anyway, a child can `prctl` and `PR_SET_DEATHSIG`, but for boring reasons I chose not to do it this way).

In our case, if the master receives `SIGKIL`, the subprocesses are essentially unaware. The only thing they will notice is that they have a new parent PID. 

So! We need a little more work to just check the parent PID on each loop in the subprocess to make sure it's not changed:

```python
def my_subprocess_1():
    ppid = os.getppid()
    my_event = threading.Event()

    def my_signal_handler(signal, _):
        my_event.set()

    for signame in signals:
        signal.signal(signame, my_signal_handler)
    while not my_event.is_set():
        do_boring_thing()
        my_event.wait(5)
        if ppid != os.getppid():
            my_event.set()
```

It's a bit crude, but it's essentially "Write down which parent started you, and if that changes, something's wrong."

## Wrapping up

So, that pretty much covers most cases. It seems like a lot of work just to achieve something relatively simple, but what you end up with is a *very* mild degree of confidence that either all your tasks are up, or none of them are.

There are better ways of doing this, I'm sure. But it took me a few bits of thinking to try and work out the ways around this and boil the problem down to an example program.

I made a [gist of the final program](https://gist.github.com/growse/f37ca9da772d9b43b97d819e2d08eac1) - this has two simple subprocesses. One just logs every 5 seconds, and the other waits for a local file to appear, quitting if it does.

## Appendix

The gist works great on Python 2.7.14 on my laptop (Arch Linux), but failed on Python 2.7.11 on RHEL6. The issue was that `my_queue` never received the message, it seemed to be the same deadlock as before. 

A simple change from `my_queue.get()` to this sorted it:

```python 
result = None
while not result:
    try:
        result = my_queue.get(timeout=1):
    except Queue.Empty:
        pass    
```        
    
I have no idea why this works.