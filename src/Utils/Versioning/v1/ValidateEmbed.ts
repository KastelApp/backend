import type { MainObject } from "../../Cql/Types/Message";
import { T } from "../../TypeCheck.ts";

export const ValidateEmbed = (
	Embed: MainObject,
): {
	Error: {
		Code: string;
		Field: string;
		Message: string;
	}[];
	Valid: boolean;
} => {
	const Finished: {
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
	if (!T(Embed, "object")) {
		Finished.Error.push({
			Field: "Embed",
			Message: "Embed is not an object",
			Code: "InvalidEmbed",
		});
	}

	if (Embed.Title && !T(Embed.Title, "string")) {
		Finished.Error.push({
			Field: "Title",
			Message: "Title is not a string",
			Code: "InvalidTitle",
		});
	}

	if (Embed.Description && !T(Embed.Description, "string")) {
		Finished.Error.push({
			Field: "Description",
			Message: "Description is not a string",
			Code: "InvalidDescription",
		});
	}

	if (Embed.Color && !T(Embed.Color, "number")) {
		Finished.Error.push({
			Field: "Color",
			Message: "Color is not a number",
			Code: "InvalidColor",
		});
	}

	if (Embed.Url && !T(Embed.Url, "string")) {
		Finished.Error.push({
			Field: "Url",
			Message: "Url is not a string",
			Code: "InvalidUrl",
		});
	}

	if (Embed.Author && !T(Embed.Author, "object")) {
		Finished.Error.push({
			Field: "Author",
			Message: "Author is not an object",
			Code: "InvalidAuthor",
		});
	}

	if (Embed.Author?.Name && !T(Embed.Author.Name, "string")) {
		Finished.Error.push({
			Field: "Author.Name",
			Message: "Author.Name is not a string",
			Code: "InvalidAuthorName",
		});
	}

	if (Embed.Author?.IconUrl && !T(Embed.Author.IconUrl, "string")) {
		Finished.Error.push({
			Field: "Author.IconUrl",
			Message: "Author.IconUrl is not a string",
			Code: "InvalidAuthorIconUrl",
		});
	}

	if (Embed.ThumbnailUrl && !T(Embed.ThumbnailUrl, "string")) {
		Finished.Error.push({
			Field: "ThumbnailUrl",
			Message: "ThumbnailUrl is not a string",
			Code: "InvalidThumbnailUrl",
		});
	}

	if (Embed.ImageUrl && !T(Embed.ImageUrl, "string")) {
		Finished.Error.push({
			Field: "ImageUrl",
			Message: "ImageUrl is not a string",
			Code: "InvalidImageUrl",
		});
	}

	if (Embed.Footer && !T(Embed.Footer, "object")) {
		Finished.Error.push({
			Field: "Footer",
			Message: "Footer is not an object",
			Code: "InvalidFooter",
		});
	}

	if (Embed.Footer?.Text && !T(Embed.Footer.Text, "string")) {
		Finished.Error.push({
			Field: "Footer.Text",
			Message: "Footer.Text is not a string",
			Code: "InvalidFooterText",
		});
	}

	if (Embed.Footer?.Timestamp && !T(Embed.Footer.Timestamp, "date")) {
		Finished.Error.push({
			Field: "Footer.Timestamp",
			Message: "Footer.Timestamp is not an object",
			Code: "InvalidFooterTimestamp",
		});
	}

	if (Embed.Fields && !T(Embed.Fields, "array")) {
		Finished.Error.push({
			Field: "Fields",
			Message: "Fields is not an array",
			Code: "InvalidFields",
		});
	}

	if (Embed.Fields) {
		for (const Field of Embed.Fields) {
			if (!T(Field, "object")) {
				Finished.Error.push({
					Field: "Fields",
					Message: "Fields is not an array of objects",
					Code: "InvalidFields",
				});
			}

			if (Field.Title && !T(Field.Title, "string")) {
				Finished.Error.push({
					Field: "Field.Title",
					Message: "Field.Title is not a string",
					Code: "InvalidFieldTitle",
				});
			}

			if (Field.Description && !T(Field.Description, "string")) {
				Finished.Error.push({
					Field: "Field.Description",
					Message: "Field.Description is not a string",
					Code: "InvalidFieldDescription",
				});
			}

			if (!Field.Title && !Field.Description) {
				Finished.Error.push({
					Field: "Field",
					Message: "Field is missing a Title or Description",
					Code: "InvalidField",
				});
			}
		}
	}

	// if theres no title, description. author etc return false since there has to be *something* in the embed
	if (
		!Embed.Title &&
		!Embed.Description &&
		!Embed.Author &&
		!Embed.ThumbnailUrl &&
		!Embed.ImageUrl &&
		!Embed.Footer &&
		!Embed.Fields
	) {
		Finished.Error.push({
			Field: "Embed",
			Message: "Embed is missing a Title, Description, Author, ThumbnailUrl, ImageUrl, Footer, or Fields",
			Code: "InvalidEmbed",
		});
	}

	if (Finished.Error.length > 0) {
		Finished.Valid = false;
	}

	return Finished;
};
