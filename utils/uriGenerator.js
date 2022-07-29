const uriGenerator = () => {

    if (process.env.mongoURI) return process.env.mongoURI;

    const user = process.env.muser;
    const host = process.env.mhost;
    const port = process.env.mport;
    const password = process.env.mpassword;
    const authSource = process.env.authSource;

    return `mongodb://${user}${password ? `:${encodeURIComponent(password)}` : ""}@${host}${port ? `:${port}` : ""}${authSource ? `/?authSource=${authSource}` : ""}`
};

module.exports = uriGenerator;