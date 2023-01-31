/* !
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

/**
 * The Generated Tag
 * @typedef {String} Tag
 */

/**
 * Generator a tag while keeping it unqiue from other tags
 * @param {(string|number)[]} [tags=[]]
 * @returns {Tag}
 */
const tagGenerator = (tags: (string | number)[]): string => {
    tags = tags.map(tag => Number(tag));

    const missing: number[] = [];

    for (let i = 1; i <= 9999; i++) {
        if (tags.indexOf(i) == -1) {
            missing.push(i);
        }
    }

    return String(missing[Math.floor(Math.random() * missing.length)]).padStart(4, '0000');
};

export default tagGenerator;

export { tagGenerator }