import { Database } from '../database'
import { Skedula } from 'skedula'

import { getLatest } from '../reddit'

/** The source to scrape data from. */
type Source = 'reddit'|'discord'

const argv = process.argv
const argc = process.argv.length

// Get the source for scraping
const source:Source = argc > 2 ? argv[2] as Source : 'reddit'

// Get the database name to save history to
const dbName:string = argc > 3 ? argv[3] : `${source}_database`

// Get the scrape frequency, in seconds
const freq:number = argc > 4 ? parseInt(argv[4]) : 15

// Create a database to save to
const database = new Database(dbName)

console.log(`Running turnip-bot with source '${source}'; saving to ${database.path} every ${freq}s.`)

/**
 * Reddit scraping
 */

if (source === 'reddit') {
    Skedula.secondInterval(() => {
        console.log(`Fetching latest posts...`)
        getLatest().then((latestPosts) => {
            const numPosts = database.addMultiple(latestPosts)
            if (numPosts > 0) {
                console.log(`Saved ${numPosts} new posts to ${database.path}`)
                const dbJSON = database.read()
                console.log(dbJSON.slice(dbJSON.length - numPosts))
            } else {
                console.log(`No new posts...`)
            }
        }).catch(e => {
            console.error(e)
        })
    }, freq)
}