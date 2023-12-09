/* eslint-disable sonarjs/no-identical-functions */
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

class FlagUtilsBInt<
	T extends {
		[key: string]: bigint;
	},
> {
	public bits: bigint;

	public Flags:
		| T
		| {
				[key: string]: bigint;
		  };

	public constructor(
		bits: bigint | number | string,
		flags:
			| T
			| {
					[key: string]: bigint;
			  },
	) {
		this.bits = BigInt(bits);

		this.Flags = flags;
	}

	public has(bit: bigint | number | keyof (typeof this)["Flags"]) {
		const Bits = typeof bit === "string" ? this.Flags[bit] ?? 0n : BigInt(bit as number);

		return (this.bits & Bits) === Bits;
	}

	public add(bit: bigint | number | keyof (typeof this)["Flags"]): this {
		const Bits = typeof bit === "string" ? this.Flags[bit] ?? 0n : BigInt(bit as number);

		if (this.has(Bits)) return this;

		this.bits |= Bits;

		return this;
	}

	public remove(bit: bigint | number | keyof (typeof this)["Flags"]): this {
		const Bits = typeof bit === "string" ? this.Flags[bit] ?? 0n : BigInt(bit as number);

		if (!this.has(Bits)) return this;

		this.bits ^= Bits;

		return this;
	}

	public serialize(): bigint {
		return this.bits;
	}

	public toArray(): (keyof (typeof this)["Flags"])[] {
		return Object.entries(this.Flags)
			.filter(([, value]) => this.has(value))
			.map(([key]) => key) as (keyof (typeof this)["Flags"])[];
	}

	public toJSON(): Record<keyof (typeof this)["Flags"], boolean> {
		return Object.fromEntries(Object.entries(this.Flags).map(([key, value]) => [key, this.has(value)])) as Record<
			keyof (typeof this)["Flags"],
			boolean
		>;
	}

	public hasArray(bits: (keyof (typeof this)["Flags"])[]) {
		return bits.every((bit) => this.has(bit));
	}

	public hasOneArray(bits: (keyof (typeof this)["Flags"])[]) {
		return bits.some((bit) => this.has(bit));
	}

	public clean(bits: (keyof (typeof this)["Flags"])[]) {
		let finishedBits = 0n;

		for (const bit of bits) {
			if (this.has(bit)) finishedBits |= this.Flags[bit as any] ?? 0n;
		}

		return finishedBits;
	}

	public get cleaned() {
		return Object.keys(this.Flags).reduce<bigint>((bits, key) => {
			let newBits = bits;

			if (this.has(this.Flags[key] ?? 0n)) newBits |= this.Flags[key] ?? 0n;

			return newBits;
		}, 0n);
	}

	public get count() {
		return this.toArray().length;
	}
}

class FlagUtils<
	T extends {
		[key: string]: number;
	},
> {
	public bits: number;

	public Flags:
		| T
		| {
				[key: string]: number;
		  };

	public constructor(
		bits: bigint | number | string,
		flags:
			| T
			| {
					[key: string]: number;
			  },
	) {
		this.bits = Number(bits);

		this.Flags = flags;
	}

	public has(bit: bigint | number | keyof (typeof this)["Flags"]) {
		const Bits = typeof bit === "string" ? this.Flags[bit] ?? 0 : Number(bit);

		return (this.bits & Bits) === Bits;
	}

	public add(bit: bigint | number | keyof (typeof this)["Flags"]): this {
		const Bits = typeof bit === "string" ? this.Flags[bit] ?? 0 : Number(bit);

		if (this.has(Bits)) return this;

		this.bits |= Bits;

		return this;
	}

	public remove(bit: bigint | number | keyof (typeof this)["Flags"]): this {
		const Bits = typeof bit === "string" ? this.Flags[bit] ?? 0 : Number(bit);

		if (!this.has(Bits)) return this;

		this.bits ^= Bits;

		return this;
	}

	public serialize(): number {
		return this.bits;
	}

	public toArray(): (keyof (typeof this)["Flags"])[] {
		return Object.entries(this.Flags)
			.filter(([, value]) => this.has(value))
			.map(([key]) => key) as (keyof (typeof this)["Flags"])[];
	}

	public toJSON(): Record<keyof (typeof this)["Flags"], boolean> {
		return Object.fromEntries(Object.entries(this.Flags).map(([key, value]) => [key, this.has(value)])) as Record<
			keyof (typeof this)["Flags"],
			boolean
		>;
	}

	public hasOneArray(bits: (keyof (typeof this)["Flags"])[]) {
		return bits.some((bit) => this.has(bit));
	}

	public hasArray(bits: (keyof (typeof this)["Flags"])[]) {
		return bits.every((bit) => this.has(bit));
	}

	public clean(bits: (keyof (typeof this)["Flags"])[]) {
		let finishedBits = 0;

		for (const bit of bits) {
			if (this.has(bit)) finishedBits |= this.Flags[bit as any] ?? 0;
		}

		return finishedBits;
	}

	public get cleaned() {
		return Object.keys(this.Flags).reduce<number>((bits, key) => {
			let newBits = bits;

			if (this.has(this.Flags[key] ?? 0)) newBits |= this.Flags[key] ?? 0;

			return newBits;
		}, 0);
	}

	public get count() {
		return this.toArray().length;
	}
}

export default FlagUtilsBInt;

export { FlagUtilsBInt, FlagUtils };
