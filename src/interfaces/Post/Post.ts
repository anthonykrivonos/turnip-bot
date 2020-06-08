import { Poster } from './Poster'

export interface Post {
	id: string
	type: 'buy' | 'sell'
	price: number
	poster: Poster
	url: string
	title: string
	body?: string
	createdAt?: Date
}
