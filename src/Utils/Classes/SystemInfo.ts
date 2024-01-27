import https from "node:https";
import os from "node:os";
import process from "node:process";
import { clearTimeout, setTimeout } from "node:timers";

type Platform = "AIX" | "Android" | "FreeBSD" | "Linux" | "macOS" | "OpenBSD" | "SunOS" | "Unknown" | "Windows";
type OperatingSystemRaw = "aix" | "android" | "darwin" | "freebsd" | "linux" | "openbsd" | "sunos" | "win32";
type CPUArchitectureRaw = "arm" | "arm64" | "ia32" | "mips" | "mipsel" | "ppc" | "ppc64" | "s390" | "s390x" | "x64";
type CpuArchitecture = "Arm" | "Arm64" | "IA32" | "Mips" | "Mipsel" | "PPC" | "PPC64" | "S390" | "S390X" | "X64";
interface SystemInfoOutput {
	_raw: {
		cpu: {
			coreCount: number;
			cpuType: string;
		};
		internetAccess: boolean;
		operatingSystem: {
			arch: CPUArchitectureRaw;
			platform: OperatingSystemRaw;
			release: string;
		};
		ram: {
			available: number;
			total: number;
		};
	};
	cpu: {
		cores: number;
		type: string;
	};
	internetAccess: boolean;
	operatingSystem: {
		arch: CpuArchitecture;
		platform: Platform;
		release: string;
	};
	process: {
		uptime: string;
		version: string;
	};
	ram: {
		Available: string;
		Total: string;
		Usage: string;
	};
}

class SystemInfo {
	private PlatformTypes = {
		aix: "AIX",
		android: "Android",
		darwin: "macOS",
		freebsd: "FreeBSD",
		linux: "Linux",
		openbsd: "OpenBSD",
		sunos: "SunOS",
		win32: "Windows",
		Unknwon: "Unknown",
	};

	private CPUArchitectureTypes = {
		arm: "Arm",
		arm64: "Arm64",
		ia32: "IA32",
		mips: "Mips",
		mipsel: "Mipsel",
		ppc: "PPC",
		ppc64: "PPC64",
		s390: "S390",
		s390x: "S390X",
		x64: "X64",
		Unknown: "Unknown",
	};

	public cpuInfo() {
		const osCpus = os.cpus();
		const singleCpu = osCpus[0];

		if (!singleCpu) throw new Error("Whar? Unable to get CPU info");

		return {
			coreCount: osCpus.length,
			cpuType: singleCpu.model,
		};
	}

	public memoryInfo() {
		return {
			total: os.totalmem(),
			available: os.freemem(),
		};
	}

	public operatingSystemInfo(): {
		arch: CPUArchitectureRaw;
		platform: OperatingSystemRaw;
		release: string;
	} {
		return {
			platform: os.platform() as OperatingSystemRaw,
			release: os.release(),
			arch: os.arch() as CPUArchitectureRaw,
		};
	}

	public FormatBytes(bytes: number) {
		const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

		if (bytes <= 0) return "0 Byte";

		const byteCount = Math.floor(Math.log(bytes) / Math.log(1_024));

		return `${Math.round(bytes / 1_024 ** byteCount)} ${sizes[byteCount]}`;
	}

	public FormatSeconds(seconds: number) {
		const ms = seconds * 1_000;
		const day = Math.floor(ms / 86_400_000);
		const hour = Math.floor((ms % 86_400_000) / 3_600_000);
		const minute = Math.floor((ms % 3_600_000) / 60_000);
		const secs = Math.floor((ms % 60_000) / 1_000);
		const msRemainder = ms % 1_000;

		const parts = [];

		if (day > 0) parts.push(`${day}d`);
		if (hour > 0) parts.push(`${hour}h`);
		if (minute > 0) parts.push(`${minute}m`);
		if (secs > 0) parts.push(`${secs}s`);
		if (msRemainder > 0) parts.push(`${msRemainder}ms`);

		return parts.join(" ");
	}

	public async internetAccess(): Promise<boolean> {
		return new Promise((resolve) => {
			const resolveTimeout = setTimeout(() => {
				resolve(false);
			}, 5_000);

			https
				.get("https://1.1.1.1", (res) => {
					resolve(res.statusCode === 200);
					clearTimeout(resolveTimeout);
				})
				.on("error", () => {
					resolve(false);
					clearTimeout(resolveTimeout);
				});
		});
	}

	public processInfo() {
		return {
			uptime: this.FormatSeconds(process.uptime()),
			version: process.version,
		};
	}

	public async Info(SkipOnlineCheck?: boolean): Promise<SystemInfoOutput> {
		const cpuInfo = this.cpuInfo();
		const memoryInfo = this.memoryInfo();
		const processInfo = this.processInfo();
		const operatingSystemInfo = this.operatingSystemInfo();
		const internetAccess = SkipOnlineCheck ? await this.internetAccess() : true;

		return {
			cpu: {
				cores: cpuInfo.coreCount,
				type: cpuInfo.cpuType.replaceAll(/\s+/g, " ").trim(),
			},
			ram: {
				Total: this.FormatBytes(memoryInfo.total),
				Usage: this.FormatBytes(memoryInfo.total - memoryInfo.available),
				Available: this.FormatBytes(memoryInfo.available),
			},
			process: processInfo,
			operatingSystem: {
				platform: (this.PlatformTypes[operatingSystemInfo.platform as keyof typeof this.PlatformTypes] ??
					"Unknown") as Platform,
				release: operatingSystemInfo.release,
				arch: (this.CPUArchitectureTypes[operatingSystemInfo.arch as keyof typeof this.CPUArchitectureTypes] ??
					"Unknown") as CpuArchitecture,
			},
			internetAccess,
			_raw: {
				cpu: cpuInfo,
				ram: memoryInfo,
				operatingSystem: operatingSystemInfo,
				internetAccess,
			},
		};
	}
}

export default SystemInfo;

export type { SystemInfoOutput, Platform, OperatingSystemRaw, CPUArchitectureRaw, CpuArchitecture };
