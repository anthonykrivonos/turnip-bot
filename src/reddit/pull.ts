import fetch from 'node-fetch'

import { Post } from '../interfaces'
import { getPriceFromString, getBuySell, getPosterInfoFromFlair } from '../parsing'

/**
 * Exchange URLS.
 */

/** AC Turnip Exchange Subreddit as JSON Response */
export const AC_TURNIP_EXCHANGE_URL = 'https://reddit.com/r/acturnips/new.json?f=flair_name%3A"Active"'
export const ACNH_TURNIPS_HOSTING_NOOKS =
	'https://www.reddit.com/r/ACNHTurnips/new.json?f=flair_name%3A%22Hosting%20Nooks%22'
export const ACNH_TURNIPS_HOSTING_DAISY =
	'https://www.reddit.com/r/ACNHTurnips/new.json?f=flair_name%3A%22Hosting%20Nooks%22'

/** AC version */
const AC_NEW_HORIZONS = 'SW'
const isACNH = (title: string) => title.toUpperCase().includes(AC_NEW_HORIZONS)

export const pullLatest = async (url: string = AC_TURNIP_EXCHANGE_URL) => {
	const latestPosts: Post[] = []
	try {
		const res = await (
			await fetch(url, {
				method: 'GET',
			})
		).json()

		if (!res) {
			console.error('Did not receive a response from Reddit')
		}

		if (!res.data || !res.data.children || res.data.children.length === 0) {
			console.error('Did not receive any posts from Reddit')
		}

		// Read through each post
		for (const redditPost of res.data.children) {
			const redditPostData = redditPost.data
			if (!redditPostData) {
				// Malformed post
				continue
			}
			if (url === AC_TURNIP_EXCHANGE_URL && !isACNH(redditPostData.title)) {
				// Wrong game, not ACNH
				continue
			}

			// Derive price
			let price = getPriceFromString(redditPostData.title)
			if (!price) {
				price = getPriceFromString(redditPostData.selftext)
			}
			if (!price) {
				price = 0
			}

			const poster = getPosterInfoFromFlair(redditPostData.author_flair_text)
			poster.profileUrl = `https://www.reddit.com/user/${redditPostData.author}`

			const post = {
				id: redditPostData.id,
				type:
					url === AC_TURNIP_EXCHANGE_URL
						? getBuySell(price)
						: url === ACNH_TURNIPS_HOSTING_NOOKS
						? 'buy'
						: 'sell',
				price,
				poster,
				url: redditPostData.url,
				body: redditPostData.selftext,
				title: redditPostData.title,
				createdAt: new Date(redditPostData.created_utc * 1000),
			} as Post

			latestPosts.push(post)
		}
	} catch (e) {
		console.error(e)
		throw e
	}
	return latestPosts
}
