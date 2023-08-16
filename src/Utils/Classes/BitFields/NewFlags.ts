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

	public has(bit: bigint) {
		return (this.bits & bit) === bit;
	}

	public add(bit: bigint): this {
		if (this.has(bit)) return this;
		this.bits |= bit;
		return this;
	}

	public remove(bit: bigint): this {
		if (!this.has(bit)) return this;
		this.bits ^= bit;
		return this;
	}

	public serialize(): bigint {
		return this.bits;
	}

	public toJSON() {
		return Object.keys(this.Flags).reduce<Record<keyof (typeof this)['Flags'], boolean>>(
			(obj, key: keyof (typeof this)['Flags']) => {
				obj[key] = this.has(this.Flags[key] ?? 0n);
				return obj;
			},
			// eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter
			{} as Record<keyof (typeof this)['Flags'], boolean>
		);
	}

	public toArray(): string[] {
		return Object.keys(this.Flags).reduce<string[]>((arr, key) => {
			if (this.has(this.Flags[key as keyof (typeof this)['Flags']] ?? 0n)) arr.push(key);
			return arr;
		}, []);
	}

	public hasString(bit: keyof (typeof this)['Flags']) {
		return this.has(this.Flags[bit] ?? 0n);
	}

	public removeString(bit: keyof (typeof this)['Flags']) {
		return this.remove(this.Flags[bit] ?? 0n);
	}
	
	
	public get count() {
		return this.toArray().length;
	}
	
	public hasStringArray(bits: (keyof (typeof this)['Flags'])[]) {
		return bits.every((bit) => this.hasString(bit));
	}

	public addString(bit: keyof (typeof this)['Flags']) {
		return this.add(this.Flags[bit] ?? 0n);
	}
	
	public get cleaned() {
		return Object.keys(this.Flags).reduce<bigint>((bits: bigint, key) => {
			let newBits = bits;
			
			if (this.has(this.Flags[key] ?? 0n)) newBits |= this.Flags[key] ?? 0n
			
			return newBits;
		}, 0n);
	}
	
	public hasOneArrayString(bits: (keyof (typeof this)['Flags'])[]) {
		return bits.some((bit) => this.hasString(bit));
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

	public has(bit: number) {
		return (this.bits & bit) === bit;
	}

	public add(bit: number): this {
		if (this.has(bit)) return this;
		this.bits |= bit;
		return this;
	}

	public remove(bit: number): this {
		if (!this.has(bit)) return this;
		this.bits ^= bit;
		return this;
	}

	public serialize(): number {
		return this.bits;
	}

	public toJSON() {
		return Object.keys(this.Flags).reduce<Record<keyof (typeof this)['Flags'], boolean>>(
			(obj, key: keyof (typeof this)['Flags']) => {
				obj[key] = this.has(this.Flags[key] ?? 0);

				return obj;
				// eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter
			}, {} as Record<keyof (typeof this)['Flags'], boolean>);
	}

	public toArray(): string[] {
		return Object.keys(this.Flags).reduce<string[]>((arr, key) => {
			if (this.has(this.Flags[key as keyof (typeof this)['Flags']] ?? 0)) arr.push(key);
			return arr;
		}, []);
	}

	public hasString(bit: keyof (typeof this)['Flags']) {
		return this.has(this.Flags[bit] ?? 0);
	}

	public removeString(bit: keyof (typeof this)['Flags']) {
		return this.remove(this.Flags[bit] ?? 0);
	}
	
	public get count() {
		return this.toArray().length;
	}
	
	public hasStringArray(bits: (keyof (typeof this)['Flags'])[]) {
		return bits.every((bit) => this.hasString(bit));
	}

	public addString(bit: keyof (typeof this)['Flags']) {
		return this.add(this.Flags[bit] ?? 0);
	}
	
	public get cleaned() {
		return Object.keys(this.Flags).reduce<number>((bits: number, key) => {
			let newBits = bits;
			
			if (this.has(this.Flags[key] ?? 0)) newBits |= this.Flags[key] ?? 0
			
			return newBits;
		}, 0);
	}
	
	public hasOneArrayString(bits: (keyof (typeof this)['Flags'])[]) {
		return bits.some((bit) => this.hasString(bit));
	}
}

export default FlagUtilsBInt;

export { FlagUtilsBInt, FlagUtils };
