# 🧄 turnip-bot

Scrape Reddit for the best Turnip prices in **Animal Crossings: New Horizons**!

> Disclaimer: Use at your own discretion. This code is licensed under the MIT license (see [LICENSE.md](LICENSE.md)) and is free for anyone to use or modify. All authors of this package are removed of any liabilities concerning usage of turnip-bot.

## 🐗 Usage (NPM)

`npm install turnip-bot --save`

```
import { subscribeToNewPosts, Post } from 'turnip-bot`

// Should the bot log its progress? It's helpful to do so.
const verbose = true

// Polling interval in seconds (min 15)
const pollingInterval = 30

// Called whenever a new post is scraped
const onNewPost = (post:Post) => {
    console.log('Got new post')
    console.log(post)
}

subscribeToNewPosts(onNewPost, pollingInterval, verbose)
```

## 🦝 Usage (Local)

1. Clone the repo.
```
git clone https://github.com/anthonykrivonos/turnip-bot.git
```

2. Install dependencies.
```
cd turnip-bot && npm install
```

3. Run `turnip-bot`! The following will save the scraper result to `./dist/data/my_database.json` every 30 seconds.
```
npm run reddit my_database 30
```
You can also simply call the following, which will save the scraper result to `./dist/data/reddit_database.json` every 15 seconds.
```
npm run reddit
```

## 🔷 Output Shape

The result is always returned as a `Post` object.

#### Post

- **`id`** (`string`): *The unique ID of the post.*
- **`type`** (`'buy'|'sell'`): *`buy` denotes that the Nooklings are buying turnips, while `sell` denotes that Daisy Mae is selling turnips.*
- **`price`** (`number`): *The price of the turnips, in bells.*
- **`url`** (`string`): *A direct link to the post.*
- **`title`** (`string`): *The original title of the post.*
- **`body`** (`string?`): *The unformatted body of the post.*
- **`poster`** (`Poster`): *The original poster (OP).*

Within a `Post` object is an object called `Poster`, which contains information on the user who made the post.

#### Poster

- **`username`** (`string?`): *The OP's username on the platform the information was scraped from.*
- **`friendCode`** (`string?`): *The OP's Nintendo Switch friend code*
- **`profileUrl`** (`string?`): *The link to the OP's profile on the platform the information was scraped from.*
- **`acName`** (`string?`): *The OP's name in Animal Crossing: New Horizons.*
- **`acIslandName`** (`string?`): *The OP's island name in Animal Crossing: New Horizons.*

## Author

Anthony Krivonos ([Portfolio](https://anthonykrivonos.com/) | [LinkedIn](https://linkedin.com/in/anthonykrivonos))