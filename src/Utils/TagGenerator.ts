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

const TagGenerator = (tags: (number | string)[]): string => {
	const existingTags = new Set(tags.map(Number));

	let num = Math.floor(Math.random() * 10_000);
	while (existingTags.has(num)) {
		num = Math.floor(Math.random() * 10_000);
	}

	return num.toString().padStart(4, "0000");
};

const TagValidator = (originalTag: string, newTag: number | string): string => {
	const fixTag = newTag.toString();

	if (fixTag.length !== 4) return originalTag;

	if (fixTag === "0000") return originalTag;

	return fixTag;
};

export default TagGenerator;

export { TagGenerator, TagValidator };
