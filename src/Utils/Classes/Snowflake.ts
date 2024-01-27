// ? https://developer.twitter.com/en/docs/twitter-ids
const maxWorkerId = 31n;
const maxProcessId = 31n;
const maxIncrement = 4_095n;

class Snowflake {
    private incerement = 0n;

    private readonly workerId: bigint;

    private readonly processId: bigint;
    
    private readonly timeShift: bigint;
    
    private readonly workerIdBytes: bigint;
    
    private readonly processIdBytes: bigint;
    
    public readonly epoch: bigint;
    
    public constructor(
        epoch: bigint | number,
        workerId: bigint | number,
        processId: bigint | number,
        timeShift = 22n,
        workerIdBytes = 17n,
        processIdBytes = 12n
    ) {
        if (epoch < 0n) throw new Error("Epoch must be a positive integer");
        
        this.epoch = BigInt(epoch);
        this.workerId = BigInt(workerId);
        this.processId = BigInt(processId);
        this.timeShift = timeShift;
        this.workerIdBytes = workerIdBytes;
        this.processIdBytes = processIdBytes;
        
        if (this.workerId > maxWorkerId) throw new Error("Worker ID must be less than or equal to 31");
        if (this.processId > maxProcessId) throw new Error("Process ID must be less than or equal to 31");
    }
    
    public generate(): string {
        const timestamp = BigInt(Date.now()) - this.epoch;
        const increment = this.incerement++;
        
        if (this.incerement > maxIncrement) this.incerement = 0n;
        
        const snowflake = (timestamp << this.timeShift) | (this.workerId << this.workerIdBytes) | (this.processId << this.processIdBytes) | increment;
        
        return snowflake.toString();
    }
    
    public massGenerate(amount = 1): string[] {
        const snowflakes = [];
        
        for (let int = 0; int < amount; int++) {
            snowflakes.push(this.generate());
        }
        
        return snowflakes;
    }
    
    public timeStamp(snowflake: string): number {
        return Number((BigInt(snowflake) >> this.timeShift) + this.epoch);
    }
    
    public json(snowflake: string): {
        increment: number;
        processId: number;
        timestamp: number;
        workerId: number;
    } {
        const snowflakeBigInt = BigInt(snowflake);
        
        return {
            timestamp: Number((snowflakeBigInt >> this.timeShift) + this.epoch),
            workerId: Number((snowflakeBigInt >> this.workerIdBytes) & maxWorkerId),
            processId: Number((snowflakeBigInt >> this.processIdBytes) & maxProcessId),
            increment: Number(snowflakeBigInt & maxIncrement),
        };
    }
    
    public validate(snowflake: string): boolean {
        const snowflakeBigInt = BigInt(snowflake);
        
        if (snowflakeBigInt < 0n) return false;
        
        const snowflakeJson = this.json(snowflake);
                
        if (snowflakeJson.workerId > maxWorkerId) return false;
        if (snowflakeJson.processId > maxProcessId) return false;
        
        return snowflakeJson.increment <= maxIncrement
    }
}

export default Snowflake;
