# How to Check Your Ubuntu Version, and What the Answer Should Change

*By Kloudbean Engineering · The number is easy. Knowing what to do with it is the point.*

Whether you need your Ubuntu version specifically or just want to know which Linux you are on, you can get it in one command, and every guide will hand you `lsb_release -a`. Two problems with stopping there. That command is not installed on a lot of servers, particularly minimal and container images, so the most-recommended answer is also the one most likely to fail. And the version number on its own is rarely what anyone actually needs. People check their Ubuntu version because they are trying to install something that needs a codename, or because they want to know whether the machine is still receiving security patches. Those are different questions with different answers, and the second one is the one worth your attention.

> **How do I check my Ubuntu version?**
> Run `cat /etc/os-release`. It works on every modern Linux distribution, needs nothing installed, and shows the version number and the codename together. `lsb_release -a` gives friendlier output but depends on a package that minimal images often omit. Do not use `uname -r` for this, because that reports the kernel version, which is a different number entirely. If you only want the codename for an apt repository line, use `lsb_release -cs` or read the `VERSION_CODENAME` field.

## Which question are you actually asking?

Worth sorting first, because it changes which command is useful.

| What you need | What to run | What you get |
|---|---|---|
| The release number, reliably | `cat /etc/os-release` | 24.04, plus the codename |
| Just the codename for apt | `lsb_release -cs` | `noble` |
| Human-readable summary | `hostnamectl` | OS, kernel, architecture |
| The kernel version | `uname -r` | Kernel, not the release |
| Whether you still get patches | Compare against the LTS rules below | The answer that matters |

## The command that always works, on any Linux distribution

`/etc/os-release` is a plain file that systemd-based distributions are expected to provide, so it is present on Ubuntu, Debian, and essentially anything current, with no package to install and nothing to go wrong.

```
cat /etc/os-release
```

```
NAME="Ubuntu"
VERSION="24.04.1 LTS (Noble Numbat)"
ID=ubuntu
ID_LIKE=debian
PRETTY_NAME="Ubuntu 24.04.1 LTS"
VERSION_ID="24.04"
VERSION_CODENAME=noble
UBUNTU_CODENAME=noble
```

Everything you need is in there: the release number in `VERSION_ID`, the codename in `VERSION_CODENAME`, and whether it is an LTS in `VERSION`.

Because it is a shell-friendly key-value file, you can also source it in a script, which is the correct way to branch on distribution rather than parsing command output.

```
# In a provisioning script, read the values properly
. /etc/os-release
echo "$ID $VERSION_ID ($VERSION_CODENAME)"

# Or pull one field without sourcing
grep -oP '(?<=^VERSION_CODENAME=).*' /etc/os-release
```

<!-- ADD IMAGE: your own terminal showing cat /etc/os-release output on the server you are asking about. -->

## Why lsb_release is the popular answer and the fragile one

`lsb_release -a` gives the nicest output of any of these, and it is what almost every tutorial recommends.

```
lsb_release -a
```

```
Distributor ID: Ubuntu
Description:    Ubuntu 24.04.1 LTS
Release:        24.04
Codename:       noble
```

It is a Python script from the `lsb-release` package, and that package is frequently absent from minimal server installs, cloud images, and container base images, because it is not needed for anything to run. So you get this instead:

```
-bash: lsb_release: command not found
```

Which is a mildly ridiculous situation: the command most often recommended for identifying your distribution is one you may have to install using a package manager whose repository configuration needs the codename that command was going to tell you. You can install it, and on a server where you are only trying to read one value, reading the file is the better move.

`hostnamectl` is a good middle ground on any systemd system, and it gives you the kernel and architecture at the same time, which is often what you wanted next anyway.

```
hostnamectl
```

## uname answers a different question

This one causes real confusion, so it is worth being explicit. `uname -r` reports the Linux kernel version. It has nothing to do with your Ubuntu release number.

```
uname -r
# 6.8.0-45-generic     <- kernel, not Ubuntu 6.8
```

Two consequences. If someone asks which Ubuntu you are running, `uname` does not answer them. And your kernel changes independently of your release: routine updates move it, and a live-patched or vendor kernel can differ from what the release shipped. So a kernel number tells you nothing reliable about the distribution version, and vice versa.

`uname -a` does print the distribution name on Ubuntu, so it looks like it answers the question, and it will not give you the release number or the codename. Use it when you genuinely want kernel and architecture details.

## The codename is what apt actually wants

This is the practical reason most people are here, even when they think they want the number.

Third-party repositories are keyed on the codename, not the version. A repository line references `noble` or `jammy` or `bookworm`, never `24.04`. So when a vendor's install instructions tell you to substitute your release, the codename is the value they mean.

```
# Exactly the value a repository line needs
lsb_release -cs
# noble

# Same thing without depending on lsb_release
. /etc/os-release && echo "$VERSION_CODENAME"
```

Getting this wrong produces a confusing failure. Point apt at a codename that repository does not publish for and `apt update` returns 404s for that source, which reads as a broken repository rather than as a wrong codename. Worse, guessing a nearby release can install packages built against different library versions, which works until something segfaults for reasons that have nothing to do with your application.

The Ubuntu numbering scheme is worth knowing here because it makes the codename mapping easy to sanity check: the version is the year and month of release. 24.04 came out in April 2024, 22.04 in April 2022. LTS releases are always April of an even-numbered year, and each one gets a codename whose adjective and animal share an initial letter, advancing through the alphabet.

## Is your release still supported? The part that matters

Here is why any of this is worth a moment of your time. An operating system past end of life stops receiving security updates, which means a published vulnerability affecting your server stays unpatched permanently. Not slowly patched. Never patched.

The rules are simple enough to apply from the number you just read:

| Release type | When | Standard support |
|---|---|---|
| **LTS** | April of even years (20.04, 22.04, 24.04) | Five years |
| Interim | Every six months otherwise | Nine months |

So an interim release goes unsupported in well under a year, which is why interim releases have no business on a server you are not actively babysitting. Run LTS on anything that matters.

The signature of an end-of-life release is worth recognising, because it is usually how people find out. Once a release is retired, its packages move to an archive host, so the ordinary repository URLs stop serving it and `apt update` begins failing with 404s across the board.

```
sudo apt update
# Err:1 http://archive.ubuntu.com/ubuntu focal-security Release
#   404  Not Found
```

If that is what you are seeing, your problem is not a broken mirror or a network issue. Your release is retired. Pointing sources at the archive host will get apt working again, and it does not bring back security updates, because none are being produced. It buys you the ability to install old packages, nothing more.

## Upgrading: in place, or build a new server

Ubuntu supports an in-place major upgrade, and it works more often than its reputation suggests.

```
# Bring the current release fully up to date first
sudo apt update && sudo apt upgrade

# Then move to the next release
sudo do-release-upgrade
```

My position, and it is the one I would give any client: on a production server, do not upgrade in place. Build a new server on the new release, deploy your application to it, test it, then move traffic. It takes longer to describe and it is dramatically less stressful, for reasons that are structural rather than superstitious.

An in-place upgrade mutates the machine your site is running on, so if something goes wrong you are debugging a half-upgraded production server under time pressure. It also rewrites configuration files, prompting you to keep or replace each one, which is a poor time to be making decisions about nginx and PHP config. And an in-place upgrade carries forward every bit of accumulated drift, the manual edits and forgotten packages that nobody documented. A fresh server has none of that, and building one proves your deployment is reproducible, which is worth knowing independently.

Two upgrades in one hop is another trap: Ubuntu expects you to move LTS to LTS in sequence, so going from 20.04 to 24.04 means passing through 22.04. That is two chances to break the same server, and it is the point at which building fresh clearly wins.

## If your server is Debian rather than Ubuntu

Worth checking rather than assuming, because plenty of managed hosting runs Debian, and Ubuntu is built on Debian, which makes the two easy to confuse.

The giveaway is that `/etc/debian_version` exists on Ubuntu too, and it reports a Debian version, so reading that file on an Ubuntu machine gives you a number that looks like an answer and is not the one you wanted. `ID=ubuntu` with `ID_LIKE=debian` in `/etc/os-release` is the unambiguous distinction, which is another reason that file is the right place to look.

```
# Works correctly on both, and tells you which you are on
. /etc/os-release && echo "$ID $VERSION_ID $VERSION_CODENAME"
# debian 12 bookworm      or      ubuntu 24.04 noble
```

Debian releases carry a single major number with a codename, 12 being bookworm, and the support window is structured differently from Ubuntu's, with a full-support period followed by a longer-term maintenance phase. The practical advice is identical: know which release you are on, and know whether it is still receiving security updates.

## What the host has to get right

The reason this matters commercially is that somebody has to own OS patching, and it is a job that produces nothing visible when it is done properly.

On Kloudbean, servers are managed, so the operating system and stack are patched and maintained as part of the service rather than left to you to remember. Debian 12 is available as a server platform, and the practical benefit of managed servers here is precisely the boring one: you do not end up on an end-of-life release because a patching task quietly stopped happening two years ago.

The surrounding pieces that matter for the same reason: a Shorewall firewall and Fail2ban configured by default, free SSL issued and renewed, automatic backups so an upgrade or a change is reversible, and managed MySQL, MariaDB, PostgreSQL, Redis, Elasticsearch, or MongoDB kept up to date alongside the application. Seven clouds to choose a provider and region from, and servers, applications, and databases in one dashboard.

The honest boundary: managed means the server, stack, SSL, backups, and patching are handled, and your application code and its dependencies remain yours. Checking your own Ubuntu version is still a reasonable thing to want to do, which is why this article exists.

<!-- ADD IMAGE: the server health screen, or your own apt output after a clean upgrade. -->

## Follow the thread

Once you know which distribution you are on, [extracting archives and the case against installing from a tarball](https://www.kloudbean.com/blog/extract-zip-and-tar-gz-on-linux/) depends on that answer, since the package manager differs. On keeping a server defensible, the [server hardening checklist](https://www.kloudbean.com/blog/server-hardening-checklist/) and [Fail2ban and Shorewall](https://www.kloudbean.com/blog/fail2ban-shorewall-hardening/). On who owns patching, [managed versus unmanaged hosting](https://www.kloudbean.com/blog/managed-vs-unmanaged-hosting/). Before any upgrade, [server backups](https://www.kloudbean.com/blog/server-backups-guide/). On moving to a new server rather than upgrading in place, [zero downtime deployments](https://www.kloudbean.com/blog/zero-downtime-deployments/). And for connecting to the machine in the first place, [FTP versus SFTP](https://www.kloudbean.com/blog/ftp-vs-sftp/).

<!-- cta:start -->
**Own the server. Skip the server admin.**

Pick from seven clouds, run your app on a managed server you control, and keep databases, storage, and deploys in the same dashboard instead of four separate vendors.

- Seven cloud providers
- Managed databases
- Object storage
- Automatic backups
- Free SSL
- Git deploy
- Free migration assistance

[Start free](https://console.kloudbean.com/register) · [See plans](https://www.kloudbean.com/pricing/)
<!-- cta:end -->

## FAQ

**How do I check my Ubuntu version?**

Run `cat /etc/os-release`, which works on every modern distribution with nothing installed and shows both the release number and the codename. `lsb_release -a` produces tidier output but relies on a package that minimal server and container images often leave out, so it may not be available.

**What is the difference between uname -r and the Ubuntu version?**

`uname -r` reports the Linux kernel version, which is a separate number that changes with routine updates and can differ from what your release originally shipped. It does not tell you which Ubuntu release you are on. Read `/etc/os-release` for that.

**Why does lsb_release say command not found?**

Because the `lsb-release` package is not installed, which is common on minimal server installs, cloud images, and containers where nothing requires it. You can install it, though on a server where you just want to read one value, `cat /etc/os-release` avoids the problem entirely.

**How do I find my Ubuntu codename?**

Run `lsb_release -cs` for just the codename, or `. /etc/os-release && echo "$VERSION_CODENAME"` if that package is missing. The codename is what apt repository lines use, so it is the value third-party install instructions mean when they say to substitute your release.

**How do I know if my Ubuntu version is still supported?**

LTS releases arrive in April of even-numbered years and get five years of standard support, while interim releases get nine months. Compare your release against that. The unmistakable sign that a release has retired is `apt update` failing with 404 errors, because retired packages move to an archive host and the normal repository URLs stop serving them.

**Is it safe to run an unsupported Ubuntu version?**

No, and the reason is specific: no security updates are produced for it, so any newly published vulnerability affecting that release stays unpatched permanently. Repointing apt at the archive host restores your ability to install old packages, and it does not restore security updates because none exist.

**Should I upgrade Ubuntu in place or build a new server?**

On production, build a new server on the new release, deploy to it, test, then move traffic. An in-place `do-release-upgrade` mutates the machine currently serving your site, rewrites configuration files while asking you to arbitrate each one, and carries forward years of undocumented drift. It also has to be done LTS to LTS in sequence, so 20.04 to 24.04 means two upgrades on the same server.

**How can I tell whether I am on Ubuntu or Debian?**

Check the `ID` field in `/etc/os-release`: it reads `ubuntu` or `debian`. Do not rely on `/etc/debian_version`, because that file exists on Ubuntu as well and reports a Debian version number, which looks like an answer while telling you something else.

**Does my hosting provider handle OS updates?**

It depends on whether the hosting is managed. On managed hosting the operating system and stack patching is part of the service, which is the main protection against quietly ending up on an end-of-life release. On unmanaged infrastructure it is yours, including tracking support windows and planning upgrades before they expire.

*Kloudbean Engineering · Read the file, not the folklore.*
