import type { MainObject } from "../../Cql/Types/Message";
import { t } from "../../TypeCheck.ts";

export const validateEmbed = (
	embed: MainObject,
): {
	Error: {
		Code: string;
		Field: string;
		Message: string;
	}[];
	Valid: boolean;
} => {
	const finished: {
		Error: {
			Code: string;
			Field: string;
			Message: string;
		}[];
		Valid: boolean;
	} = {
		Error: [],
		Valid: true,
	};
	if (!t(embed, "object")) {
		finished.Error.push({
			Field: "Embed",
			Message: "Embed is not an object",
			Code: "InvalidEmbed",
		});
	}

	if (embed.title && !t(embed.title, "string")) {
		finished.Error.push({
			Field: "Title",
			Message: "Title is not a string",
			Code: "InvalidTitle",
		});
	}

	if (embed.description && !t(embed.description, "string")) {
		finished.Error.push({
			Field: "Description",
			Message: "Description is not a string",
			Code: "InvalidDescription",
		});
	}

	if (embed.color && !t(embed.color, "number")) {
		finished.Error.push({
			Field: "Color",
			Message: "Color is not a number",
			Code: "InvalidColor",
		});
	}

	if (embed.url && !t(embed.url, "string")) {
		finished.Error.push({
			Field: "Url",
			Message: "Url is not a string",
			Code: "InvalidUrl",
		});
	}

	if (embed.author && !t(embed.author, "object")) {
		finished.Error.push({
			Field: "Author",
			Message: "Author is not an object",
			Code: "InvalidAuthor",
		});
	}

	if (embed.author?.name && !t(embed.author.name, "string")) {
		finished.Error.push({
			Field: "Author.Name",
			Message: "Author.Name is not a string",
			Code: "InvalidAuthorName",
		});
	}

	if (embed.author?.iconUrl && !t(embed.author.iconUrl, "string")) {
		finished.Error.push({
			Field: "Author.IconUrl",
			Message: "Author.IconUrl is not a string",
			Code: "InvalidAuthorIconUrl",
		});
	}

	if (embed.thumbnailUrl && !t(embed.thumbnailUrl, "string")) {
		finished.Error.push({
			Field: "ThumbnailUrl",
			Message: "ThumbnailUrl is not a string",
			Code: "InvalidThumbnailUrl",
		});
	}

	if (embed.imageUrl && !t(embed.imageUrl, "string")) {
		finished.Error.push({
			Field: "ImageUrl",
			Message: "ImageUrl is not a string",
			Code: "InvalidImageUrl",
		});
	}

	if (embed.footer && !t(embed.footer, "object")) {
		finished.Error.push({
			Field: "Footer",
			Message: "Footer is not an object",
			Code: "InvalidFooter",
		});
	}

	if (embed.footer?.text && !t(embed.footer.text, "string")) {
		finished.Error.push({
			Field: "Footer.Text",
			Message: "Footer.Text is not a string",
			Code: "InvalidFooterText",
		});
	}

	if (embed.footer?.timestamp && !t(embed.footer.timestamp, "date")) {
		finished.Error.push({
			Field: "Footer.Timestamp",
			Message: "Footer.Timestamp is not an object",
			Code: "InvalidFooterTimestamp",
		});
	}

	if (embed.fields && !t(embed.fields, "array")) {
		finished.Error.push({
			Field: "Fields",
			Message: "Fields is not an array",
			Code: "InvalidFields",
		});
	}

	if (embed.fields) {
		for (const field of embed.fields) {
			if (!t(field, "object")) {
				finished.Error.push({
					Field: "Fields",
					Message: "Fields is not an array of objects",
					Code: "InvalidFields",
				});
			}

			if (field.title && !t(field.title, "string")) {
				finished.Error.push({
					Field: "Field.Title",
					Message: "Field.Title is not a string",
					Code: "InvalidFieldTitle",
				});
			}

			if (field.description && !t(field.description, "string")) {
				finished.Error.push({
					Field: "Field.Description",
					Message: "Field.Description is not a string",
					Code: "InvalidFieldDescription",
				});
			}

			if (!field.title && !field.description) {
				finished.Error.push({
					Field: "Field",
					Message: "Field is missing a Title or Description",
					Code: "InvalidField",
				});
			}
		}
	}

	// if theres no title, description. author etc return false since there has to be *something* in the embed
	if (
		!embed.title &&
		!embed.description &&
		!embed.author &&
		!embed.thumbnailUrl &&
		!embed.imageUrl &&
		!embed.footer &&
		!embed.fields
	) {
		finished.Error.push({
			Field: "Embed",
			Message: "Embed is missing a Title, Description, Author, ThumbnailUrl, ImageUrl, Footer, or Fields",
			Code: "InvalidEmbed",
		});
	}

	if (finished.Error.length > 0) {
		finished.Valid = false;
	}

	return finished;
};
