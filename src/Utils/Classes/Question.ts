// ? Question is a simple class really
// ? Basically, the child (Worker) asks a question to the parent (Main Thread) and the parent answers it
// ? It does this via a nonce.

import { isMainThread } from "bun";
import App from "./App.ts";

declare const self: Worker;

const isQuestion = (data: unknown): data is { nonce: string; response: unknown } => {
	if (typeof data !== "object") return false;

	if (data === null) return false;

	if (!("nonce" in data)) return false;

	if (typeof data.nonce !== "string") return false;

	return "response" in data;
};

class Question {
	private questions: Map<string, { answer: unknown; answered: boolean; nonce: string }> = new Map();

	public constructor() {
		if (!isMainThread) return;

		self.onmessage = async (event: MessageEvent) => {
			if (!isQuestion(event.data)) return;

			if (!this.questions.has(event.data.nonce)) return;

			const question = this.questions.get(event.data.nonce)!; // ? We know it exists, so we can use the ! operator

			question.answer = event.data.response;

			question.answered = true;
		};
	}

	public async ask<T = unknown>(question: string): Promise<T> {
		if (!isMainThread) return null as unknown as T;

		const nonce = App.snowflake.generate();

		this.questions.set(nonce, { answer: null, answered: false, nonce });

		postMessage({ nonce, question });

		while (!this.questions.get(nonce)!.answered) {
			await Bun.sleep(50);
		}

		const answer = this.questions.get(nonce)!.answer;

		this.questions.delete(nonce);

		return answer as T;
	}
}

export default Question;
