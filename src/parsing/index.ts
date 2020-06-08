import nlp from 'compromise'
import nlp_numbers from 'compromise-numbers'

import { Poster } from '../interfaces'

// reference: https://animalcrossing.fandom.com/wiki/White_turnip
const SELL_RANGE = [90, 110]
const BUY_RANGE = [15, 990]

const FRIEND_CODE_DIGITS = 12

/**
 * Helper functions.
 */

/**
 * How likely is it that this price is good?
 * @param price The price to gauge.
 */
const getLikelihood = (price: number) => {
	if (price < BUY_RANGE[0] || price > BUY_RANGE[1]) {
		return 0
	}
	if (getBuySell(price) === 'sell') {
		return SELL_RANGE[1] - price
	}
	return price - BUY_RANGE[0]
}

const isNum = (char: string) => !isNaN(char as any)
const countDigits = (str: string) => str.replace(/[^0-9]/g, '').length

const cleanNumbers = (text: string) => {
	if (text.length === 0) {
		return text
	}
    let newText = ''
    let i = 0
	for (; i < text.length; i++) {
		const char = text[i]
		newText += char
		if (isNum(char)) {
			while (i < text.length - 1 && (text[i + 1] === ' ' || text[i + 1] === '\n')) {
				i++
			}
		}
	}
	return newText
}

const trickyMap = (text: string) => {
	const trickyMapping = {
		'0': 'o',
		'!': '1',
		uno: '1',
		juan: '1',
		won: '1',
		wan: '1',
		dos: '2',
		too: '2',
		tres: '3',
		tree: '3',
		tri: '3',
		cuatro: '4',
		for: '4',
		cinco: '5',
		sinco: '5',
		'5ive': '5',
		seis: '6',
		sies: '6',
		sick: '6',
		sev: '7',
		siete: '7',
		ocho: '8',
		ate: '8',
		nein: '9',
		nueve: '9',
		twenny: '20',
	} as any
	text = text.replace(new RegExp(Object.keys(trickyMapping).join('|'), 'gi'), matched => {
		return trickyMapping[matched]
	})
	return text
}

// const autocorrect = (post: string) => {
// 	const autocorrected = require('autocorrect')()
// 	post = post
// 		.split(',')
// 		.join(' ')
// 		.split('-')
// 		.join(' ')
// 		.split('_')
// 		.join(' ')
// 	post = post
// 		.split(' ')
// 		.map(word => autocorrected(word))
// 		.join(' ')
// 	return post
// }

/**
 * Exported functions.
 */

export const getPriceFromString = (post: string) => {
	// Normalize
	const title = nlp(post)
	title.toLowerCase()
	title.normalize()

	// Pull numbers and clean
	nlp.extend(nlp_numbers)

	// @ts-ignore
	const unparsedNumbers: string[] = title.numbers().out('array')

	// @ts-ignore
	title.numbers().toNumber()

	// Undergo several text transformations
	unparsedNumbers.concat(
		nlp(cleanNumbers(title.out('text')))
			// @ts-ignore
			.numbers()
			.out('array'),
	)
	unparsedNumbers.concat(
		nlp(cleanNumbers(trickyMap(title.out('text'))))
			// @ts-ignore
			.numbers()
			.out('array'),
	)

	const parsedNumbers: number[] = unparsedNumbers.map((n: string) => parseInt(n.replace(/\D/g, '')))

	// Get the most likely number
	if (parsedNumbers.length === 0) {
		return null
	} else if (parsedNumbers.length > 1) {
		const priceMap: any = {}
		let maxLikelihoodPrice = parsedNumbers[0]
		let maxLikelihood = getLikelihood(parsedNumbers[0])
		for (const price of parsedNumbers) {
			const occurrences = priceMap[price] != null ? priceMap[price] + 1 : 1
			priceMap[price] = occurrences
			const likelihood = getLikelihood(price) * occurrences
			if (likelihood >= maxLikelihood) {
				maxLikelihood = likelihood
				maxLikelihoodPrice = price
			}
		}
		return maxLikelihoodPrice
	}

	// Otherwise, return the only number
	return parsedNumbers[0]
}

export const getBuySell = (price: number) => {
	if (price >= SELL_RANGE[0] && price <= SELL_RANGE[1]) {
		// Assume DM is selling
		return 'sell'
	}
	// Assume Nooklings are buying
	return 'buy'
}

export const getPosterInfoFromFlair = (redditFlair: string) => {
	const redditFlairSplit = redditFlair.trim().split(' ')
	const poster = {} as Poster
	for (let i = 0; i < redditFlairSplit.length; i++) {
		const component = redditFlairSplit[i].trim()

		if (countDigits(component) === FRIEND_CODE_DIGITS) {
			// We've found the friend code

			const friendCode = nlp(component)
			friendCode.toLowerCase()
			friendCode.normalize()

			// Pull numbers and clean
			nlp.extend(nlp_numbers)
			// @ts-ignore
			friendCode.numbers().toNumber()

			const friendCodeArr = cleanNumbers(friendCode.out('text').replace(/\D/g, '')).split('')

			// Add hyphens and switch prefix
			friendCodeArr.splice(4, 0, '-')
			friendCodeArr.splice(9, 0, '-')
			friendCodeArr.unshift('SW-')

			const friendCodeStr = friendCodeArr.join('')

			poster.friendCode = friendCodeStr
		} else if (component.length >= 2 && i !== redditFlairSplit.length - 1) {
			// We've found the name
			const name = nlp(component)
			name.normalize()
			name.toTitleCase()
			poster.acName = name.out('text')
		} else if (component.length >= 2 && i === redditFlairSplit.length - 1) {
			// We've found the island name
			const islandName = nlp(component)
			islandName.normalize()
			islandName.toTitleCase()
			poster.acIslandName = islandName.out('text')
		}
	}

	return poster
}
