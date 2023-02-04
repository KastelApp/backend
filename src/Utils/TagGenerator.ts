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

const TagGenerator = (tags: (string | number)[]): string => {
    tags = tags.map(tag => Number(tag));

    const Missing: number[] = [];

    for (let i = 1; i <= 9999; i++) {
        if (tags.indexOf(i) == -1) {
            Missing.push(i);
        }
    }

    return String(Missing[Math.floor(Math.random() * Missing.length)]).padStart(4, '0000');
};

export default TagGenerator;

export { TagGenerator }