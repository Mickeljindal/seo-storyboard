# Social posts: fix javascript heap out of memory node

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/fix-javascript-heap-out-of-memory-node/

## X / Twitter
```
Short term, raise the ceiling to confirm it's memory and buy breathing room: `NODE_OPTIONS=--max-old-space-size=2048` (megabytes).

https://www.kloudbean.com/blog/fix-javascript-heap-out-of-memory-node/
#Kloudbean #CloudHosting #DevOps #WebDev
```

## LinkedIn
```
Short term, raise the ceiling to confirm it's memory and buy breathing room: `NODE_OPTIONS=--max-old-space-size=2048` (megabytes).

If the crash comes back no matter how high you set it, you have a leak, not a sizing problem: take a heap snapshot, find what keeps growing (usually an unbounded cache, uncleared timers, or listeners), and fix it. If memory is stable but simply larger than the server, give it more RAM. Bumping the flag forever just delays the same crash.

Read the full guide: https://www.kloudbean.com/blog/fix-javascript-heap-out-of-memory-node/

#Kloudbean #CloudHosting #DevOps #WebDev
```

## X thread
```
1/6  fix javascript heap out of memory node

Quick thread 🧵
```
```
2/6  Short term, raise the ceiling to confirm it's memory and buy breathing room: `NODE_OPTIONS=--max-old-space-size=2048` (megabytes).
```
```
3/6  If the crash comes back no matter how high you set it, you have a leak, not a sizing problem: take a heap snapshot, find what keeps growing (usually an unbounded cache, uncleared timers, or listeners), and fix it.
```
```
4/6  If memory is stable but simply larger than the server, give it more RAM.
```
```
5/6  Bumping the flag forever just delays the same crash.
```
```
6/6  Full walkthrough:
https://www.kloudbean.com/blog/fix-javascript-heap-out-of-memory-node/
#Kloudbean #CloudHosting #DevOps #WebDev
```
