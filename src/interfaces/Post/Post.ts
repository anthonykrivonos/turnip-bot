import { Poster } from './Poster'

export interface Post {
    id: string
    type: 'buy'|'sell'
    price: number
    poster: Poster
    // TODO: createdAt: Date
    url: string
    title: string
}