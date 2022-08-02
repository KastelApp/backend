/**
 * Generator a tag while keeping it unqiue from other tags
 * @param {Array<String>} tags 
 */
const tagGenerator = (tags = []) => {
    tags = tags.map(tag => Number(tag))
    
    // push 0 and 10000 as they will be removed
    tags.push(0, 10000)

    // Source: https://stackoverflow.com/questions/37277897/javascript-find-missing-number-in-array
    const missing = Array.from(Array(Math.max(...tags)).keys()).map((n, i) => tags.indexOf(i) < 0 ? i : null).filter(f => f);

    return String(missing[Math.floor(Math.random() * missing.length) + 1]).padStart(4, "0000")
}

module.exports = tagGenerator