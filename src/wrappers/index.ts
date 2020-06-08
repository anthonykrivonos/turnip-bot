import { Skedula } from 'skedula'

import { pullLatest } from '../reddit'
import { Post, Source } from '../interfaces'
import { Database } from '../database'

const MIN_POLLING_INTERVAL_S = 15

export const subscribeToNewPosts = (
	onNewPost: (_: Post) => void,
	pollingIntervalSec: number = 30,
	verbose: boolean = true,
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
	Skedula.secondInterval(() => {
		pullLatest()
			.then(latestPosts => {
				verbose && console.log(`Fetched at ${new Date().toLocaleTimeString()}`)
				let newPostCount = 0
				for (const post of latestPosts) {
					if (postIdsSeen.hasOwnProperty(post.id)) {
						// Seen post
						continue
					}
					if (post.createdAt && post.createdAt! < lastPollDate) {
						// Old post
						continue
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
				lastPollDate = new Date()
			})
			.catch(e => {
				verbose && console.error(e)
			})
	}, pollingIntervalSec)
}
