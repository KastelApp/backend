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

const generateMissingNumbers = (existingNumbers: Set<number>): number[] => {
	const missingNumbers: number[] = [];

	for (let i = 0; i <= 9_999; i++) {
		if (!existingNumbers.has(i)) {
			missingNumbers.push(i);
		}
	}

	return missingNumbers;
};

const tagGenerator = (tags: (number | string)[]): string | null => {
	const existingTags = new Set(tags.map(Number));

	existingTags.add(0);

	if (existingTags.size >= 9_999) return null;

	const missingTags = generateMissingNumbers(existingTags);

	return missingTags[Math.floor(Math.random() * missingTags.length)]?.toString().padStart(4, "0") ?? "0001";
};

const tagValidator = (originalTag: string, newTag: number | string): string => {
	const fixedTag = newTag.toString();

	if (fixedTag.length !== 4) return originalTag;

	if (fixedTag === "0000") return originalTag;

	return fixedTag;
};

export default tagGenerator;

export { tagGenerator, tagValidator };
