---
layout: blog-post
title: "create your own virtual photography website with just 1$"
date: 2026-02-05
author: nairdah
categories: [blog]
tags: [virtual-photography, website, portfolio]
image: /assets/images/blog/vp-website.png
excerpt: "how to build a personal website and use it as your virtual photography portfolio, all for just one dollar, using Vippy."
---

> ### note before you start:
> this template is still very much a work in progress and an "early access" version that was based on my personal website, so you might find some leftovers from my personal site or unnecessary bits here and there. it's not perfect yet, so let me know if you find anything that needs fixing or feel free to contribute yourself and create a pull request on Github

## why i built this

hey there. if you're into **virtual photography**, you've probably wondered where to showcase your work without spending a fortune on hosting or dealing with complicated setups. i created **Vippy** (name inspiration from VP "virtual photography") because i wanted a simple, affordable way for virtual photographers to have their own corner of the internet—a place that's truly theirs.

most portfolio platforms either charge monthly fees or lock you into their ecosystem. with **Vippy**, you own everything. your site, your photos, your rules. and the best part? it costs just **1$** to get started with full cloud storage for your images.

this guide and template is inspired by the **[original guide from originalnicodr](https://originalnicodr.github.io/blog/how-to-create-and-host-your-own-portfolio-for-free)**, but i wanted to take it a level further and make it simpler for people who want a faster process with fewer code/technical configurations and i included a much simpler system for uploading photos. lots of thanks to him for the inspiration and resources!

## what you're getting

**Vippy** is a static website template built with **Jekyll** that doubles as your **virtual photography portfolio**. it comes with a **built-in admin panel** where you can manage your content without touching code. you can enable **blog posts**, create **project showcases**, build **photo albums**, and upload images directly to cloud storage, all from a simple interface.

think of it as your personal photography website that you can customize however you want, with the added bonus of not needing to be a developer to use it.

## what you'll need before starting

- about **30 minutes** of your time
- a **Github account** (free)
- a **Backblaze account** (free to sign up, 1$ minimum to use storage)
- basic computer skills (if you can install an app, you can do this)

don't worry if you've never used Github before. i'll walk you through everything step by step and **feel free to reach out if you have any questions or need help along the way** (you can find my socials in the footer of the website).

## step 1: create a Github account and fork the repo

first things first, head over to [github.com](https://github.com) and create a free account if you don't have one already. Github is where your website's files will live, and it's what makes your site work.

once you're logged in, go to the Vippy repository: [github.com/nairdahh/Vippy](https://github.com/nairdahh/Vippy)

look for the "Fork" button in the top right corner and click it. this creates your own copy of Vippy that you can modify however you want. it's like making a photocopy of a template that's now yours to customize.

## step 2: follow the setup guide

now that you have your own copy of **Vippy**, it's time to get it running on your computer. in your forked repository, you'll find a detailed README file that walks you through:

- installing the necessary tools (Ruby, Jekyll, Node.js)
- downloading your fork to your computer
- running the website locally
- starting the Vippy admin panel

the **README** has everything spelled out clearly, so just follow along at your own pace. if something doesn't work, double-check that you've installed everything correctly.

## step 3: your website is now running locally

congratulations! at this point, you should be able to open your browser and see your website running on your computer. you can navigate around, check out the different pages, and get a feel for how everything works.

the admin panel should also be accessible, which is where the magic happens for managing your content.

## step 4: set up your Backblaze account

here's where that **1$** comes in. [Backblaze](https://www.backblaze.com) is a cloud storage service that's incredibly affordable. sign up for a free account – you won't be charged anything yet.

once you're in:

- navigate to the *B2 Cloud Storage* section
- create a *new bucket* (this is basically a folder in the cloud for your photos)
- make sure the bucket is set to **public**
- note down your bucket name and the folder path

the *1$* is the minimum charge to make the bucket **public** and use the storage. after that, you only pay for what you actually use, which is pennies for most personal portfolios only if you exceed the daily limits, so keep an eye for that.

## step 5: connect Vippy to your Backblaze bucket

now let's link your website to your cloud storage. open the *Vippy admin panel* (remember, it's running on your computer from step 2).

go to the *virtual photography module* settings and look for the storage configuration section. here's where you'll enter:

- your Backblaze bucket name
- the folder path within that bucket
- your API credentials (you'll find these in your Backblaze account settings)

save everything, and you're connected. your website can now upload and retrieve images directly from your Backblaze storage.

## step 6: start creating albums and uploading photos

this is the fun part. through the Vippy admin panel, you can now:

- create photo albums for different games or themes
- upload your virtual photography shots directly
- organize everything however you want
- preview how it looks on your site

all your images are stored safely in Backblaze, and they'll load beautifully on your website.

## step 7: keep exploring and customizing

you've got the core setup done, but Vippy has so much more to offer:

- enable the blog module to write about your photography process or anything you want
- use the projects section to showcase specific game photography projects or other projects you are working on
- customize the about page to tell your story
- tweak colors, layouts, and styles to make it truly yours
- add your socials so they appear in the footer of your website

everything is designed to be user-friendly. if you want to dive into the code and customize things further, you can. but if you're happy just using the admin panel, that works perfectly too.

## step 8: make your website live for everyone

now that you've got everything set up and running on your computer, it's time to put it **online** so anyone can visit your portfolio. this is where Github really shines – it'll host your website **for** **free**.

### push your changes to Github

first, you need to upload all the changes you've made to your Github repository. you have two options:

**option 1: using git (command line)**

if you're comfortable with the terminal and have git installed, open it in your vippy folder and run:
```
git add .
git commit -m "initial setup"
git push origin main
```

**option 2: using Github Desktop (easier)**

if you prefer a visual interface:
- download and install **[Github Desktop](https://desktop.github.com)**
- open **Github Desktop** and add your *Vippy folder* (btw, you can **rename the folder** and everything else to whatever you want, but i recommned you to name it **your-github-username.github.io**)
- you'll see all your changes listed
- write a summary like "initial setup" in the commit message box
- click "commit to main"
- click "push origin" to upload everything to Github

### enable Github Actions

github actions will automatically build your website every time you make changes. to enable it:

- go to your repository on github.com
- click on the "actions" tab
- if prompted, click "i understand my workflows, go ahead and enable them"

your site will now build automatically whenever you push changes.

### set up Github pages

this is the final step to get your public link:

- in your Github repository, click on "settings"
- scroll down to "pages" in the left sidebar
- under "source," select "github actions"
- wait a few minutes for the build to complete

once it's done, Github will give you a public URL (usually something like `yourusername.github.io/vippy`). click on it, and boom – **your website is live!**

### you're done!

once you have the link and can access your website from anywhere, everything is done! share that link with friends or add it to your social media bios. every time you make changes locally and push them to Github, your live site will automatically update.

**welcome to the web, virtual photographer!**

## you did it

and that's it. for just **1$**, you now have a fully functional personal website that showcases your virtual photography, stores your images in the cloud, and gives you complete control over your online presence.

no monthly subscriptions. no locked platforms. just your work, displayed your way.

if you run into any issues or have questions, feel free to open an issue on the **[Github repo](https://github.com/nairdahh/Vippy)**. i'm always happy to help fellow virtual photographers get their portfolios up and running.

now go out there and share your virtual photography with the world.


<div class="post-footer" markdown="1">

**INSPIRATION**

this guide and template is inspired by the original guide from **[originalnicodr](https://originalnicodr.github.io/blog/how-to-create-and-host-your-own-portfolio-for-free)**. i wanted to take it a level further and make it simpler for people who want a faster process with fewer code/technical configurations, and i included a much simpler system for uploading photos. lots of thanks to Nico for the inspiration and resources that made this possible.

also, this themes is based on the portfolYOU theme by [Youssef Raafat](https://github.com/YoussefRaafatNasry). i customized it to fit my needs and preferences.

**LINKS**

my personal website: [nairdah.me](https://nairdah.me)

framed community: [framedsc.com](https://framedsc.com/) - a community dedicated to virtual photography

**TAKE YOUR WEBSITE TO THE NEXT LEVEL**

once you're comfortable with the basics, here are some Jekyll plugins and tools to enhance your site:
- [awesome jekyll plugins](https://github.com/planetjekyll/awesome-jekyll-plugins) - a curated list of Jekyll plugins to add all kinds of functionality to your site
- [jekyll-sitemap](https://github.com/jekyll/jekyll-sitemap) - generates a sitemap for your site so search engines can crawl and index all your pages more easily
- [google search console verification](https://github.com/erikw/jekyll-google_search_console_verification_file) - verify your site with google search console to monitor how your site appears in google search results
- [google analytics for jekyll](https://michaelsoolee.com/google-analytics-jekyll/) - track your visitors and see which photos and pages are getting the most attention


</div>
