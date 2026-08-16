# Social posts: Server Out of Disk Space: Find What Filled It and Fix It Safely

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/fix-out-of-disk-space-server/

## X / Twitter
```
> Run `df -h` first to confirm which filesystem is full, then `df -i`, because inodes run out separately from bytes.

https://www.kloudbean.com/blog/fix-out-of-disk-space-server/
#Kloudbean #CloudHosting #DevOps #WebDev
```

## LinkedIn
```
> Run `df -h` first to confirm which filesystem is full, then `df -i`, because inodes run out separately from bytes.

Walk down with `du -xh --max-depth=1` to find the offender, and check `lsof +L1` for deleted files still held open. Identify before deleting, truncate active logs instead of removing them, then add rotation so it doesn't recur.

Read the full guide: https://www.kloudbean.com/blog/fix-out-of-disk-space-server/

#Kloudbean #CloudHosting #DevOps #WebDev
```

## X thread
```
1/5  Server Out of Disk Space: Find What Filled It and Fix It Safely

Quick thread 🧵
```
```
2/5  > Run `df -h` first to confirm which filesystem is full, then `df -i`, because inodes run out separately from bytes.
```
```
3/5  Walk down with `du -xh --max-depth=1` to find the offender, and check `lsof +L1` for deleted files still held open.
```
```
4/5  Identify before deleting, truncate active logs instead of removing them, then add rotation so it doesn't recur.
```
```
5/5  Full walkthrough:
https://www.kloudbean.com/blog/fix-out-of-disk-space-server/
#Kloudbean #CloudHosting #DevOps #WebDev
```
