interface VerificationLink {
    Code: string;
    CreatedDate: Date;
    ExpireDate: Date;
    Flags: number;
    Ip: string;
    UserId: string;
}

export default VerificationLink;
