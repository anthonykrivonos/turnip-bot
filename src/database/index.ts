import fs from 'fs'
import path from 'path'

import { Post } from '../interfaces'

const DB_FOLDER = path.join(__dirname, '../../data')

export class Database {

    public readonly path:string

    constructor(databaseName: string, overwrite = false) {
        // Create the database folder if it doesn't already exist
        if (!fs.existsSync(DB_FOLDER)) {
            fs.mkdirSync(DB_FOLDER)
        }
        const databaseFilename = databaseName.includes('.json') ? databaseName : `${databaseName}.json`
        const databasePath = path.join(DB_FOLDER, databaseFilename)
        this.path = databasePath
        if (overwrite || !fs.existsSync(databasePath)) {
            this.write([])
        }
    }

    public read = () => {
        return JSON.parse(fs.readFileSync(this.path, { encoding: 'utf-8' })) as Post[]
    }

    private write = (databaseContent: Post[]) => {
        fs.writeFileSync(this.path, JSON.stringify(databaseContent, null, 4), { encoding: 'utf-8' })
    }
    
    public add = (post: Post, unique = true) => {
        const databaseContent:Post[] = this.read()
        if (!unique) {
            databaseContent.push(post)
            return true
        }
        let hasId = false
        for (const postInDb of databaseContent) {
            if (postInDb.id === post.id) {
                hasId = true
                break
            }
        }
        if (!hasId) {
            databaseContent.push(post)
            this.write(databaseContent)
            return true
        }
        return false
    }

    public addMultiple = (posts: Post[], unique = true) => {
        let postsAdded = 0
        for (const post of posts) {
            postsAdded += Number(this.add(post, unique))
        }
        return postsAdded
    }
    
    public remove = (postId: string) => {
        const databaseContent:Post[] = this.read()
        let index = -1
        for (let i = 0; i < databaseContent.length; i++) {
            const postInDb = databaseContent[i]
            if (postInDb.id === postId) {
                index = i
                break
            }
        }
        if (index >= 0) {
            databaseContent.splice(index, 1)
        }
        this.write(databaseContent)
    }
    
    public contains = (postId: string) => {
        const databaseContent:Post[] = this.read()
        let index = -1
        for (let i = 0; i < databaseContent.length; i++) {
            const postInDb = databaseContent[i]
            if (postInDb.id === postId) {
                index = i
                break
            }
        }
        if (index >= 0) {
            return true
        }
        return false
    }

}