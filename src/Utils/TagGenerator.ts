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
	const ExistingTags = new Set(tags.map(Number));

	let Num = Math.floor(Math.random() * 10_000);

	while (ExistingTags.has(Num)) {
		Num = Math.floor(Math.random() * 10_000);
	}

	return Num.toString().padStart(4, "0000");
};

const TagValidator = (originalTag: string, newTag: number | string): string => {
	const FixedTag = newTag.toString();

	if (FixedTag.length !== 4) return originalTag;

	if (FixedTag === "0000") return originalTag;

	return FixedTag;
};

export default TagGenerator;

export { TagGenerator, TagValidator };
