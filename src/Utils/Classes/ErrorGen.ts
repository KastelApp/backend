import { HTTPErrors } from "@kastelll/util";

const ErrorGen = {
    InvalidContentType: () => {
        return new HTTPErrors(4_000)
    },
    MissingAuthField: () => {
        return new HTTPErrors(4_001)
    },
    FailedToRegister: () => {
        return new HTTPErrors(4_002)
    },
    AccountNotAvailable: () => {
        return new HTTPErrors(4_003)
    },
    NotFound: () => {
        return new HTTPErrors(4_004)
    },
    InvalidCredentials: () => {
        return new HTTPErrors(4_005)
    },
    UnAuthorized: () => {
        return new HTTPErrors(4_006)
    }
}


export default ErrorGen;

export { ErrorGen };
