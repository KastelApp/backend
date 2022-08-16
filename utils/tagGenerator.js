/**
 * Generator a tag while keeping it unqiue from other tags
 * @param {Array<String>} tags 
 */
const tagGenerator = (tags = []) => {
    tags = tags.map(tag => Number(tag))

    const missing = [];

    for (let i = 1; i <= 9999; i++) {
        if (tags.indexOf(i) == -1) {
          missing.push(i);
        }
      }

    return String(missing[Math.floor(Math.random() * missing.length)]).padStart(4, "0000")
}

module.exports = tagGenerator