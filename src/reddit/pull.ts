import fetch from 'node-fetch'

import { Post } from '../interfaces'
import { getPriceFromString, getBuySell, getPosterInfoFromFlair } from '../parsing'

/**
 * Exchange URLS.
 */

/** AC Turnip Exchange Subreddit as JSON Response */
const AC_TURNIP_EXCHANGE_URL = 'https://reddit.com/r/acturnips/new.json?f=flair_name%3A"Active"'

/** AC version */
const AC_NEW_HORIZONS = 'SW'
const isACNH = (title: string) => title.toUpperCase().includes(AC_NEW_HORIZONS)

export const pullLatest = async (url: string = AC_TURNIP_EXCHANGE_URL) => {
	const latestPosts: Post[] = []
	try {
		const res = await (
			await fetch(AC_TURNIP_EXCHANGE_URL, {
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
			if (!isACNH(redditPostData.title)) {
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

			const post = {
				id: redditPostData.id,
				type: getBuySell(price),
				price,
				poster: getPosterInfoFromFlair(redditPostData.author_flair_text),
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
