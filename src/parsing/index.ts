import nlp from 'compromise'
import nlp_numbers from 'compromise-numbers'

import { Poster } from '../interfaces'

// reference: https://animalcrossing.fandom.com/wiki/White_turnip
const SELL_RANGE = [ 90, 110 ]
const BUY_RANGE = [ 15, 990 ]

const FRIEND_CODE_DIGITS = 12

/**
 * Helper functions.
 */

/**
 * How likely is it that this price is good?
 * @param price The price to gauge.
 */
const getLikelihood = (price:number) => {
    if (getBuySell(price) === 'sell') {
        return SELL_RANGE[1] - price
    }
    return price - BUY_RANGE[0]
}

const isNum = (char: string) => !isNaN(char as any)
const countDigits = (str: string) => str.replace(/[^0-9]/g,"").length

const cleanNumbers = (text: string) => {
    if (text.length === 0) { return text }
    let newText = '', i = 0
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

/**
 * Exported functions.
 */

export const getPriceFromString = (post: string) => {
    
    // Normalize
    let title = nlp(post)
    title.toLowerCase()
    title.normalize()

    // Pull numbers and clean
    nlp.extend(nlp_numbers)
    // @ts-ignore
    title.numbers().toNumber()
    title = nlp(cleanNumbers(title.out('text')))

    // @ts-ignore
    const unparsedNumbers:string[] = title.numbers().out('array')
    const parsedNumbers:number[] = unparsedNumbers.map((n:string) => parseInt(n.replace(/\D/g,'')))

    // Get the most likely number
    if (parsedNumbers.length === 0) {
        return null
    } else if (parsedNumbers.length > 1) {
        const priceMap:any = {}
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
    let redditFlairSplit = redditFlair.trim().split(' ')
    let poster = {} as Poster
    for (let i = 0; i < redditFlairSplit.length; i++) {
        const component = redditFlairSplit[i].trim()

        if (countDigits(component) === FRIEND_CODE_DIGITS) {
            // We've found the friend code

            let friendCode = nlp(component)
            friendCode.toLowerCase()
            friendCode.normalize()

            // Pull numbers and clean
            nlp.extend(nlp_numbers)
            // @ts-ignore
            friendCode.numbers().toNumber()
            
            const friendCodeArr = cleanNumbers(friendCode.out('text').replace(/\D/g,'')).split('')

            // Add hyphens and switch prefix
            friendCodeArr.splice(4, 0, '-')
            friendCodeArr.splice(9, 0, '-')
            friendCodeArr.unshift('SW-')
            
            const friendCodeStr = friendCodeArr.join('')

            poster.friendCode = friendCodeStr
        } else if (component.length >= 2 && i !== redditFlairSplit.length - 1) {
            // We've found the name
            let name = nlp(component)
            name.normalize()
            name.toTitleCase()
            poster.acName = name.out('text')
        } else if (component.length >= 2 && i === redditFlairSplit.length - 1) {
            // We've found the island name
            let islandName = nlp(component)
            islandName.normalize()
            islandName.toTitleCase()
            poster.acIslandName = islandName.out('text')
        }
    }

    return poster
}