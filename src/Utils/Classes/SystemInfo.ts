import https from "node:https";
import os from "node:os";
import process from "node:process";
import { clearTimeout, setTimeout } from "node:timers";

type Platform = "AIX" | "Android" | "FreeBSD" | "Linux" | "macOS" | "OpenBSD" | "SunOS" | "Unknown" | "Windows";
type OperatingSystemRaw = "aix" | "android" | "darwin" | "freebsd" | "linux" | "openbsd" | "sunos" | "win32";
type CPUArchitectureRaw = "arm" | "arm64" | "ia32" | "mips" | "mipsel" | "ppc" | "ppc64" | "s390" | "s390x" | "x64";
type CpuArchitecture = "Arm" | "Arm64" | "IA32" | "Mips" | "Mipsel" | "PPC" | "PPC64" | "S390" | "S390X" | "X64";
interface SystemInfoOutput {
	Cpu: {
		Cores: number;
		Type: string;
		Usage: number;
	};
	InternetAccess: boolean;
	OperatingSystem: {
		Arch: CpuArchitecture;
		Platform: Platform;
		Release: string;
	};
	Process: {
		Uptime: string;
		Version: string;
	};
	Ram: {
		Available: string;
		Total: string;
		Usage: string;
	};
	_Raw: {
		Cpu: {
			CoreCount: number;
			CpuType: string;
			Usage: number;
		};
		InternetAccess: boolean;
		OperatingSystem: {
			Arch: CPUArchitectureRaw;
			Platform: OperatingSystemRaw;
			Release: string;
		};
		Ram: {
			Available: number;
			Total: number;
		};
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

	public CpuInfo() {
		const OsCpus = os.cpus();
		const SingleCpu = OsCpus[0];

		if (!SingleCpu) throw new Error("Whar? Unable to get CPU info");

		const Total = Object.values(SingleCpu.times).reduce((acc, tv) => acc + tv, 0);

		const Usage = process.cpuUsage();
		const CurrentCPUUsage = (Usage.user + Usage.system) * 1_000;

		return {
			CoreCount: OsCpus.length,
			CpuType: SingleCpu.model,
			Usage: (CurrentCPUUsage / Total) * 100,
		};
	}

	public MemoryInfo() {
		return {
			Total: os.totalmem(),
			Available: os.freemem(),
		};
	}

	public OperatingSystemInfo(): {
		Arch: CPUArchitectureRaw;
		Platform: OperatingSystemRaw;
		Release: string;
	} {
		return {
			Platform: os.platform() as OperatingSystemRaw,
			Release: os.release(),
			Arch: os.arch() as CPUArchitectureRaw,
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

	public async InternetAccess(): Promise<boolean> {
		return new Promise((resolve) => {
			const ResolveTimeout = setTimeout(() => {
				resolve(false);
			}, 5_000);

			https
				.get("https://1.1.1.1", (res) => {
					resolve(res.statusCode === 200);
					clearTimeout(ResolveTimeout);
				})
				.on("error", () => {
					resolve(false);
					clearTimeout(ResolveTimeout);
				});
		});
	}

	public ProcessInfo() {
		return {
			Uptime: this.FormatSeconds(process.uptime()),
			Version: process.version,
		};
	}

	public async Info(SkipOnlineCheck?: boolean): Promise<SystemInfoOutput> {
		const CpuInfo = this.CpuInfo();
		const MemoryInfo = this.MemoryInfo();
		const ProcessInfo = this.ProcessInfo();
		const OperatingSystemInfo = this.OperatingSystemInfo();
		const InternetAccess = SkipOnlineCheck ? await this.InternetAccess() : true;

		return {
			Cpu: {
				Cores: CpuInfo.CoreCount,
				Type: CpuInfo.CpuType.replaceAll(/\s+/g, " ").trim(),
				Usage: CpuInfo.Usage,
			},
			Ram: {
				Total: this.FormatBytes(MemoryInfo.Total),
				Usage: this.FormatBytes(MemoryInfo.Total - MemoryInfo.Available),
				Available: this.FormatBytes(MemoryInfo.Available),
			},
			Process: ProcessInfo,
			OperatingSystem: {
				Platform: (this.PlatformTypes[OperatingSystemInfo.Platform as keyof typeof this.PlatformTypes] ??
					"Unknown") as Platform,
				Release: OperatingSystemInfo.Release,
				Arch: (this.CPUArchitectureTypes[OperatingSystemInfo.Arch as keyof typeof this.CPUArchitectureTypes] ??
					"Unknown") as CpuArchitecture,
			},
			InternetAccess,
			_Raw: {
				Cpu: CpuInfo,
				Ram: MemoryInfo,
				OperatingSystem: OperatingSystemInfo,
				InternetAccess,
			},
		};
	}
}

export default SystemInfo;

export type { SystemInfoOutput, Platform, OperatingSystemRaw, CPUArchitectureRaw, CpuArchitecture };
