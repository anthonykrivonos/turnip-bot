import { Skedula } from 'skedula'

import { pullLatest, AC_TURNIP_EXCHANGE_URL } from '../reddit'
import { Post, Source } from '../interfaces'
import { Database } from '../database'

const MIN_POLLING_INTERVAL_S = 20

export const subscribeToNewPosts = (
	onNewPost: (_: Post) => void,
	pollingIntervalSec: number = 30,
	verbose: boolean = true,
	sourceUrls: string[] = [AC_TURNIP_EXCHANGE_URL],
	source: Source = 'reddit',
	saveToDB: string | null | undefined = null,
) => {
	if (source !== 'reddit') {
		verbose && console.error(`Source not supported, please use 'reddit' as source.`)
		return
	}
	if (pollingIntervalSec < MIN_POLLING_INTERVAL_S) {
		verbose &&
			console.error(`Polling interval too short. Please make it at least ${MIN_POLLING_INTERVAL_S} seconds.`)
		return
	}
	let database: Database | null = null
	if (saveToDB) {
		database = new Database(saveToDB)
	}
	const postIdsSeen = {} as any
	let lastPollDate = new Date()
	verbose && console.log(`Verbosely fetching latest posts...`)
	Skedula.secondInterval(async () => {
		const latestPosts = (await Promise.all(sourceUrls.map(url => pullLatest(url)))).reduce(
			(arr, row) => arr.concat(row),
			[],
		)
		try {
			verbose && console.log(`Fetched at ${new Date().toLocaleTimeString()}`)
			lastPollDate = new Date()
			let newPostCount = 0
			for (const post of latestPosts) {
				if (postIdsSeen.hasOwnProperty(post.id)) {
					// Seen post
					continue
				}
				if (post.createdAt) {
					const fiveMinutesAgo = lastPollDate
					fiveMinutesAgo.setTime(fiveMinutesAgo.getTime() - 5 * 60 * 1000)
					if (post.createdAt! < fiveMinutesAgo) {
						// Old post
						continue
					}
				}
				// Record post
				postIdsSeen[post.id] = post
				newPostCount++

				// Call callback
				verbose && console.log(`- Got a new post with id ${post.id}`)
				onNewPost(post)

				if (saveToDB) {
					// Save to database
					database!.addMultiple(latestPosts)
				}
			}
			verbose &&
				console.log(
					`- ${newPostCount === 0 ? 'No' : newPostCount} new post${newPostCount !== 1 ? 's' : ''} found`,
				)
		} catch (e) {
			verbose && console.error(e)
		}
	}, pollingIntervalSec)
}

export { AC_TURNIP_EXCHANGE_URL, ACNH_TURNIPS_HOSTING_NOOKS, ACNH_TURNIPS_HOSTING_DAISY } from '../reddit'
