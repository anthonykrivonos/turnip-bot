import 'chromedriver'
import { Builder, By } from 'selenium-webdriver'

import { Post, Poster } from '../interfaces'
import { getPriceFromString, getBuySell, getPosterInfoFromFlair } from '../parsing'

/**
 * Exchange URLS.
 */

/** AC Turnip Exchange Subreddit */
const AC_TURNIP_EXCHANGE_URL = 'https://reddit.com/r/acturnips/new/?f=flair_name%3A"Active"'

/** AC version */
const AC_NEW_HORIZONS = 'SW'
const isACNH = (title: string) => title.toUpperCase().includes(AC_NEW_HORIZONS)

export const scrapeLatest = async (url: string = AC_TURNIP_EXCHANGE_URL) => {
	const driver = await new Builder().forBrowser('chrome').build()
	const latestPosts = []
	try {
		// Open the required URL
		await driver.get(url)

		// Loop through the list of posts
		const posts = await driver.findElements(By.css(`[id*=t3_]`))
		for (const post of posts) {
			const titles = await post.findElements(By.tagName('h3'))
			for (const title of titles) {
				try {
					// Extract the title
					const titleText = await title.getAttribute('innerHTML')
					if (!isACNH(titleText)) {
						// Not AC New Horizons, continuing
						console.log(`${titleText} is not an AC New Horizons post. Skipping...`)
						continue
					}

					// Extract the price
					let price = getPriceFromString(titleText)

					if (price === null) {
						// Couldn't get a price from the title, we now search the body
						const bodyElements = await post.findElements(By.tagName('p'))
						for (const bodyElement of bodyElements) {
							const bodyText = await bodyElement.getAttribute('innerHTML')

							// Extract the price
							price = getPriceFromString(bodyText)

							if (price !== null) {
								break
							}
						}
					}

					if (price === null) {
						// After searching the body, we still haven't found a price
						continue
					}

					// First, let's get the user information
					const userLink = await post.findElement(By.tagName('a[href^="/user/"]'))
					const username = (await userLink.getAttribute('innerHTML')).split('u/')[1]
					const profileUrl = await userLink.getAttribute('href')

					let poster = {} as Poster

					// Find the user's Switch/Island info
					const postSpans = await post.findElements(By.tagName('span'))
					for (const span of postSpans) {
						let spanText = await span.getAttribute('innerHTML')
						spanText = spanText.trim().replace('SW-', '')
						if (spanText.match(/^\d\d\d\d-/)) {
							// Text starts with 4 numbers and a hyphen, so it's a friend code
							poster = getPosterInfoFromFlair(spanText)
							break
						}
					}
					poster.profileUrl = profileUrl
					poster.username = username

					// Get a url to the post
					const postLink = await post.findElement(By.tagName('a[href^="/r/acturnips/comments/"]'))
					const url = await postLink.getAttribute('href')

					// Get the Reddit comment ID from the URL
					let id = url
					if (url) {
						id = url.split('comments/')[1].split('/')[0]
					}

					const postObject = {
						id,
						type: getBuySell(price),
						price,
						poster,
						url,
						title: titleText,
					} as Post

					latestPosts.push(postObject)
				} catch {}
			}
		}
	} catch (e) {
		throw e
	} finally {
		await driver.quit()
	}
	return latestPosts
}
