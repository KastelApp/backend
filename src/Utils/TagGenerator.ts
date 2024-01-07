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

const tagGenerator = (tags: (number | string)[]): string => {
	const existingTags = new Set(tags.map(Number));

	let num = Math.floor(Math.random() * 10_000);

	while (existingTags.has(num)) {
		num = Math.floor(Math.random() * 10_000);
	}

	return num.toString().padStart(4, "0000");
};

const tagValidator = (originalTag: string, newTag: number | string): string => {
	const fixedTag = newTag.toString();

	if (fixedTag.length !== 4) return originalTag;

	if (fixedTag === "0000") return originalTag;

	return fixedTag;
};

export default tagGenerator;

export { tagGenerator, tagValidator };
